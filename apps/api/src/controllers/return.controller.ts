
import { Request, Response } from 'express';
import pool from '../config/database';

export const createReturn = async (req: Request, res: Response) => {
    const { saleId, items } = req.body;
    const userId = (req as any).user?.id;

    if (!items || items.length === 0) return res.status(400).json({ message: "No items to return" });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Calculate Total Refund
        let totalRefund = 0;
        for (const item of items) {
            totalRefund += item.refundAmount;
        }

        // 2. Create Return Record
        const returnRes = await client.query(
            `INSERT INTO returns (sale_id, total_refund, reason, processed_by) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [saleId, totalRefund, "Customer Return", userId]
        );
        const returnId = returnRes.rows[0].id;

        // 3. Process Items & Update Inventory
        for (const item of items) {
            // Add to return_items
            await client.query(
                `INSERT INTO return_items (return_id, variant_id, quantity, condition, refund_amount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [returnId, item.variantId, item.quantity, item.condition, item.refundAmount]
            );

            // Update Inventory (Only if Resellable)
            if (item.condition === 'RESELLABLE') {
                await client.query(
                    `UPDATE inventory SET quantity = quantity + $1 WHERE variant_id = $2`,
                    [item.quantity, item.variantId]
                );
                // Log Inventory Change
                await client.query(
                    `INSERT INTO inventory_logs (variant_id, action, quantity_change, reason, user_id)
                     VALUES ($1, 'RETURN', $2, 'Customer Return (Resellable)', $3)`,
                    [item.variantId, item.quantity, userId]
                );
            } else {
                // Determine what to do with defective? For now just log it.
                // Could have a separate 'damaged_inventory' table but out of scope for now.
                await client.query(
                    `INSERT INTO inventory_logs (variant_id, action, quantity_change, reason, user_id)
                     VALUES ($1, 'RETURN', $2, 'Customer Return (Defective - Scrapped)', $3)`,
                    [item.variantId, 0, userId] // No stock increase
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Return processed successfully', returnId, totalRefund });

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Failed to process return' });
    } finally {
        client.release();
    }
};

export const getReturns = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT r.*, s.invoice_number 
            FROM returns r
            JOIN sales s ON r.sale_id = s.id
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching returns' });
    }
};
