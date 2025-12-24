import { Request, Response } from 'express';
import pool from '../config/database';

export const getInventory = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                i.id as inventory_id,
                i.quantity,
                i.location,
                i.updated_at,
                pv.id as variant_id,
                pv.sku,
                pv.size,
                pv.color,
                pv.selling_price,
                p.name as product_name,
                p.gst_rate,
                b.name as brand_name,
                c.name as category_name
            FROM inventory i
            JOIN product_variants pv ON i.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.name, pv.size
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching inventory' });
    }
};

export const updateInventory = async (req: Request, res: Response) => {
    const { variantId, quantity, reason } = req.body;
    const userId = (req as any).user?.id;

    try {
        // Simple adjustment (Reset to value or Add/Subtract? Let's say Add/Subtract for now)
        // Actually for "Update Stock" it forces a Set usually or an Adjustment.
        // Let's implement ADD/REMOVE logic.

        await pool.query('BEGIN');

        const currentRes = await pool.query('SELECT quantity FROM inventory WHERE variant_id = $1', [variantId]);
        if (currentRes.rows.length === 0) throw new Error('Variant not found in inventory');

        const newQuantity = currentRes.rows[0].quantity + Number(quantity);
        if (newQuantity < 0) throw new Error('Insufficient stock');

        await pool.query('UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE variant_id = $2', [newQuantity, variantId]);

        await pool.query(
            `INSERT INTO inventory_logs (variant_id, action, quantity_change, reason, user_id) 
             VALUES ($1, 'ADJUSTMENT', $2, $3, $4)`,
            [variantId, quantity, reason || 'Manual Adjustment', userId]
        );

        await pool.query('COMMIT');
        res.json({ message: 'Inventory Updated', newQuantity });
    } catch (err: any) {
        await pool.query('ROLLBACK');
        res.status(400).json({ message: err.message });
    }
};
