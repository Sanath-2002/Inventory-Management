import { Request, Response } from 'express';
import pool from '../config/database';
import { processOrder } from '../services/inventory.service';

export const createOrder = async (req: Request, res: Response) => {
    const { type, items } = req.body; // items: [{ productId, warehouseId, quantity }]
    const userId = (req as any).user?.id || 1; // Default to 1 if no user for demo

    try {
        // 1. Create Order in DB (INITIAL status)
        const orderRes = await pool.query(
            'INSERT INTO orders (type, status) VALUES ($1, $2) RETURNING *',
            [type, 'CREATED']
        );
        const order = orderRes.rows[0];

        // 2. Resolve Items (Check if ID is UUID or SKU)
        const resolvedItems = [];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        for (const item of items) {
            let variantId = item.variantId;
            if (!uuidRegex.test(variantId)) {
                // Try finding by SKU
                const skuRes = await pool.query('SELECT id FROM product_variants WHERE sku = $1', [variantId]);
                if (skuRes.rows.length > 0) {
                    variantId = skuRes.rows[0].id;
                } else {
                    throw new Error(`Variant not found for ID/SKU: ${item.variantId}`);
                }
            }
            resolvedItems.push({ ...item, variantId });

            await pool.query(
                'INSERT INTO order_items (order_id, variant_id, quantity) VALUES ($1, $2, $3)',
                [order.id, variantId, item.quantity]
            );
        }

        // 3. Process Inventory (Atomic Transaction)
        // This will update stock, ensuring consistency. If it fails, order status should be updated to FAILED or we handle it.
        // In our inventory service, we throw if fails.
        try {
            await processOrder(order.id, type, resolvedItems);

            // 4. Update Order Status to COMPLETED
            await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['COMPLETED', order.id]);

            res.status(201).json({ order, status: 'COMPLETED' });
        } catch (invError) {
            console.error('Inventory processing failed:', invError);
            // Mark order as FAILED or CANCELLED
            await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['FAILED', order.id]);
            res.status(400).json({ message: 'Order failed due to inventory issues', error: (invError as Error).message });
        }

    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ message: 'Internal server error processing order' });
    }
};

export const getOrder = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) return res.sendStatus(404);

        const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);

        res.json({ ...orderRes.rows[0], items: itemsRes.rows });
    } catch (err: any) {
        console.error('Order Processing Error:', err);
        res.status(500).json({ message: 'Error processing order', error: err.message });
    }
};
