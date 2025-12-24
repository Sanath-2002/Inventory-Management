import { Request, Response } from 'express';
import pool from '../config/database';

// Get Products with Variants (Hierarchical JSON)
export const getProducts = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                p.id, p.name, p.description, p.gst_rate,
                b.name as brand_name, c.name as category_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', pv.id,
                            'sku', pv.sku,
                            'barcode', pv.barcode,
                            'size', pv.size,
                            'color', pv.color,
                            'price', pv.selling_price,
                            'mrp', pv.mrp,
                            'stock', COALESCE(i.quantity, 0),
                            'low_stock_threshold', pv.low_stock_threshold
                        )
                    ) FILTER (WHERE pv.id IS NOT NULL), '[]'
                ) as variants
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            LEFT JOIN inventory i ON pv.id = i.variant_id
            GROUP BY p.id, b.name, c.name
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// Search for POS
export const searchProducts = async (req: Request, res: Response) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const query = `
            SELECT 
                pv.id as variant_id, pv.sku, pv.barcode, pv.size, pv.color, pv.selling_price,
                p.name as product_name, p.gst_rate,
                COALESCE(i.quantity, 0) as stock
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN inventory i ON pv.id = i.variant_id
            WHERE 
                pv.sku ILIKE $1 OR 
                pv.barcode = $2 OR 
                p.name ILIKE $1
            LIMIT 20
        `;
        const searchPattern = `%${q}%`;
        const result = await pool.query(query, [searchPattern, q]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Search failed' });
    }
};

// Create Product with Variants
export const createProduct = async (req: Request, res: Response) => {
    const { name, brandId, categoryId, description, gstRate, variants } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert Product
        const prodRes = await client.query(
            `INSERT INTO products (name, brand_id, category_id, description, gst_rate)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [name, brandId, categoryId, description, gstRate]
        );
        const productId = prodRes.rows[0].id;

        // 2. Insert Variants
        if (variants && Array.isArray(variants)) {
            for (const v of variants) {
                const variantRes = await client.query(
                    `INSERT INTO product_variants (product_id, sku, barcode, size, color, cost_price, mrp, selling_price, low_stock_threshold)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                    [productId, v.sku, v.barcode, v.size, v.color, v.costPrice, v.mrp, v.sellingPrice, v.lowStockThreshold || 5]
                );
                const variantId = variantRes.rows[0].id;

                // 3. Initial Inventory (Optional)
                if (v.initialStock > 0) {
                    await client.query(
                        `INSERT INTO inventory (variant_id, quantity) VALUES ($1, $2)`,
                        [variantId, v.initialStock]
                    );
                    // Log it
                    await client.query(
                        `INSERT INTO inventory_logs (variant_id, action, quantity_change, reason, user_id)
                         VALUES ($1, 'INWARD', $2, 'Initial Stock', $3)`,
                        [variantId, v.initialStock, (req as any).user?.id]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Product Created Successfully', productId });

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ message: err.message || 'Failed to create product' });
    } finally {
        client.release();
    }
};

// Update Product
export const updateProduct = async (req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented yet" });
};

// Delete Product
export const deleteProduct = async (req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented yet" });
};
