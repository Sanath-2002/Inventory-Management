import { Request, Response } from 'express';
import pool from '../config/database';

// Process New Sale (POS)
export const createSale = async (req: Request, res: Response) => {
    const { items, paymentMode, customerName } = req.body;
    const userId = (req as any).user?.id || req.body.userId; // Middleware should attach user

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let totalAmount = 0;
        let totalTax = 0;

        // 1. Calculate Totals & Verify Stock
        const processedItems = [];
        for (const item of items) {
            // Get Variant & Price (Always fetch fresh price)
            const vRes = await client.query(
                `SELECT pv.*, p.gst_rate 
                 FROM product_variants pv 
                 JOIN products p ON pv.product_id = p.id
                 WHERE pv.id = $1`,
                [item.variant_id]
            );

            if (vRes.rows.length === 0) throw new Error(`Invalid Item: ${item.variant_id}`);
            const variant = vRes.rows[0];

            // Lock Inventory & Check Stock
            const iRes = await client.query(
                `SELECT quantity FROM inventory WHERE variant_id = $1 FOR UPDATE`,
                [item.variant_id]
            );

            const currentStock = iRes.rows.length > 0 ? iRes.rows[0].quantity : 0;

            if (currentStock < item.quantity) {
                throw new Error(`Out of Stock: ${variant.sku} (Available: ${currentStock})`);
            }

            const unitPrice = parseFloat(variant.selling_price);
            const subtotal = unitPrice * item.quantity;
            const tax = (subtotal * variant.gst_rate) / 100;

            totalAmount += subtotal + tax;
            totalTax += tax;

            processedItems.push({
                ...item,
                unitPrice,
                tax,
                subtotal
            });
        }

        // 2. Create Sale Record
        const invoiceNumber = `INV-${Date.now()}`; // Simplistic generator
        const saleRes = await client.query(
            `INSERT INTO sales (invoice_number, user_id, customer_name, total_amount, tax_amount, payment_mode)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [invoiceNumber, userId, customerName, totalAmount, totalTax, paymentMode]
        );
        const saleId = saleRes.rows[0].id;

        // 3. Insert Items & Update Inventory
        for (const pItem of processedItems) {
            // Recalculate item-specific values using pItem's unitPrice and gst_rate if needed,
            // or use the pre-calculated ones from pItem directly.
            // The instruction implies using variant.selling_price directly for unit_price in sale_items.
            // Since pItem.unitPrice already holds parseFloat(variant.selling_price), we can use that.
            // The instruction's snippet calculates itemSubtotal and itemTax based on variant.selling_price,
            // which is consistent with pItem.unitPrice and pItem.tax/subtotal.

            // Using pItem's pre-calculated values for consistency and efficiency
            await client.query(
                `INSERT INTO sale_items (sale_id, variant_id, quantity, unit_price, tax_amount, subtotal)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [saleId, pItem.variant_id, pItem.quantity, pItem.unitPrice, pItem.tax, pItem.subtotal]
            );

            // Deduct Stock
            await client.query(
                `UPDATE inventory SET quantity = quantity - $1 WHERE variant_id = $2`,
                [pItem.quantity, pItem.variant_id]
            );

            // Log Movement
            await client.query(
                `INSERT INTO inventory_logs (variant_id, action, quantity_change, reason, user_id)
                 VALUES ($1, 'SALE', $2, $3, $4)`,
                [pItem.variant_id, -pItem.quantity, `Sale: ${invoiceNumber}`, userId]
            );
        }

        await client.query('COMMIT');

        // Notify Socket
        const { getIO } = require('../socket');
        getIO().emit('stock_update', { type: 'SALE', invoiceNumber });

        res.status(201).json({
            message: 'Sale Completed',
            invoiceNumber,
            totalAmount,
            saleId
        });

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ message: err.message || 'Transaction Failed' });
    } finally {
        client.release();
    }
};

export const getSales = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM sales ORDER BY created_at DESC LIMIT 50');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sales' });
    }
};

export const getSaleByInvoice = async (req: Request, res: Response) => {
    const { invoiceNumber } = req.params;
    try {
        const saleRes = await pool.query(`SELECT * FROM sales WHERE invoice_number = $1`, [invoiceNumber]);
        if (saleRes.rows.length === 0) return res.status(404).json({ message: 'Invoice not found' });

        const itemsRes = await pool.query(`
            SELECT si.*, p.name as product_name, pv.size, pv.color 
            FROM sale_items si
            JOIN product_variants pv ON si.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE si.sale_id = $1
        `, [saleRes.rows[0].id]);

        res.json({ sale: saleRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching sale details' });
    }
};
