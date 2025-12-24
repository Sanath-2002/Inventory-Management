
import { Request, Response } from 'express';
import pool from '../config/database';

export const getDailySales = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                SUM(tax_amount) as total_tax
            FROM sales
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching daily sales' });
    }
};

export const getStockValue = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                SUM(i.quantity * pv.cost_price) as total_cost_value,
                SUM(i.quantity * pv.selling_price) as total_retail_value,
                SUM(i.quantity) as total_items
            FROM inventory i
            JOIN product_variants pv ON i.variant_id = pv.id
        `);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stock value' });
    }
};
