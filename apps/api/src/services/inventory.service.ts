import pool from '../config/database';
import { redisClient, redisPublisher } from '../config/redis';
import { io } from '../server';

const ACQUIRE_TIMEOUT = 2000; // ms
const LOCK_EXPIRE = 5; // seconds

const acquireLock = async (key: string): Promise<boolean> => {
    // Simple SETNX implementation
    const result = await redisClient.set(key, 'locked', { NX: true, EX: LOCK_EXPIRE });
    return result === 'OK';
};

const releaseLock = async (key: string) => {
    await redisClient.del(key);
};

export const processOrder = async (orderId: string, type: 'SALE' | 'PURCHASE', items: { variantId: string, quantity: number }[]) => {
    // 1. Validate Items
    if (!items || items.length === 0) {
        throw new Error('No items to process');
    }
    // Acquire locks for all products involved to prevent deadlocks (sort keys first)
    const lockKeys = items.map(i => `lock:variant:${i.variantId}`).sort();

    const client = await pool.connect();

    try {
        // Try to acquire all locks
        for (const key of lockKeys) {
            let acquired = false;
            const start = Date.now();
            while (Date.now() - start < ACQUIRE_TIMEOUT) {
                if (await acquireLock(key)) {
                    acquired = true;
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 50)); // retry delay
            }
            if (!acquired) {
                throw new Error(`Could not acquire lock for variant ${key.split(':')[2]}`);
            }
        }

        await client.query('BEGIN');

        for (const item of items) {
            // Check current stock
            const res = await client.query(
                `SELECT quantity FROM inventory WHERE variant_id = $1 FOR UPDATE`,
                [item.variantId]
            );

            let currentQty = 0;
            if (res.rows.length > 0) {
                currentQty = res.rows[0].quantity;
            } else {
                // If purchase, maybe insert? If sale, error if not exists.
                if (type === 'SALE') throw new Error(`Variant ${item.variantId} not found`);
                // Insert 0 if not exists for purchase logic update later
                await client.query(
                    `INSERT INTO inventory (variant_id, quantity) VALUES ($1, 0)`,
                    [item.variantId]
                );
            }

            let newQty = currentQty;
            if (type === 'SALE') {
                if (currentQty < item.quantity) {
                    throw new Error(`Insufficient stock for variant ${item.variantId}. Available: ${currentQty}, Requested: ${item.quantity}`);
                }
                newQty -= item.quantity;
            } else {
                newQty += item.quantity;
            }

            // Update DB
            await client.query(
                `UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE variant_id = $2`,
                [newQty, item.variantId]
            );

            // Log stock movement
            const logAction = type === 'PURCHASE' ? 'INWARD' : type;
            await client.query(
                `INSERT INTO inventory_logs (variant_id, action, quantity_change, reason, user_id) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [item.variantId, logAction, item.quantity, `Order ${orderId}`, null] // TODO: Pass user ID
            );
        }

        await client.query('COMMIT');

        // Broadcast Updates
        for (const item of items) {
            // Retrieve updated qty for broadcast
            const res = await client.query(
                `SELECT quantity FROM inventory WHERE variant_id = $1`,
                [item.variantId]
            );
            const qty = res.rows[0]?.quantity || 0;

            const updatePayload = {
                variantId: item.variantId,
                quantity: qty,
                type: 'stock_update'
            };

            // Redis Pub/Sub
            await redisPublisher.publish('inventory_updates', JSON.stringify(updatePayload));
            // WebSocket Broadcast
            io.emit('stock_update', updatePayload);
        }

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
        // Release locks in reverse order
        for (const key of lockKeys.reverse()) {
            await releaseLock(key);
        }
    }
};
