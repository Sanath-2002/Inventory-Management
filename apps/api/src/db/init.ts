import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const initDb = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Database Initialization...');

        // Read and Execute Schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('Schema Applied Successfully.');

        // Seed Brands & Categories
        const brandCheck = await client.query('SELECT * FROM brands');
        if (brandCheck.rows.length === 0) {
            console.log('Seeding Master Data...');
            await client.query(`INSERT INTO brands (name) VALUES ('Nike'), ('Adidas'), ('Puma'), ('Wilson'), ('Yonex')`);
            await client.query(`INSERT INTO categories (name, description) VALUES 
                ('Footwear', 'Running, Football, Cricket Shoes'),
                ('Apparel', 'Jerseys, Shorts, Tracksuits'),
                ('Equipment', 'Bats, Balls, Rackets'),
                ('Accessories', 'Socks, Caps, Wristbands')
            `);
        }

        // Seed Suppliers
        const supCheck = await client.query('SELECT * FROM suppliers');
        if (supCheck.rows.length === 0) {
            await client.query(`INSERT INTO suppliers (name, contact_person, phone, email) VALUES 
                ('Global Sports Distributors', 'John Doe', '9876543210', 'supply@gloabalsports.com'),
                ('Official Nike India', 'Support', '1800-NIKE', 'b2b@nike.com')
            `);
        }

        // Seed Users
        const userCheck = await client.query('SELECT * FROM users');
        if (userCheck.rows.length === 0) {
            console.log('Seeding Users...');
            const hash = await bcrypt.hash('admin123', 10);
            await client.query(
                `INSERT INTO users (username, full_name, password_hash, role) VALUES ($1, $2, $3, $4)`,
                ['admin', 'Store Manager', hash, 'ADMIN']
            );
            const staffHash = await bcrypt.hash('staff123', 10);
            await client.query(
                `INSERT INTO users (username, full_name, password_hash, role) VALUES ($1, $2, $3, $4)`,
                ['staff01', 'Counter Staff 1', staffHash, 'STAFF']
            );
        }

        // Seed Products & Variants
        const prodCheck = await client.query('SELECT * FROM products');
        if (prodCheck.rows.length === 0) {
            console.log('Seeding Inventory...');

            // 1. Nike Running Shoe
            const brandRes = await client.query("SELECT id FROM brands WHERE name='Nike'");
            const catRes = await client.query("SELECT id FROM categories WHERE name='Footwear'");

            const p1 = await client.query(`INSERT INTO products (name, brand_id, category_id, description, gst_rate) 
                VALUES ('Air Zoom Pegasus 39', $1, $2, 'Daily running shoes', 18.00) RETURNING id`,
                [brandRes.rows[0].id, catRes.rows[0].id]
            );

            // Variants (Size 8, 9, 10)
            const sizes = ['UK-7', 'UK-8', 'UK-9', 'UK-10'];
            for (const size of sizes) {
                const sku = `NIKE-PEG39-BLK-${size}`;
                const barcode = `8833${Math.floor(Math.random() * 10000)}`;
                const v = await client.query(`INSERT INTO product_variants (product_id, sku, barcode, size, color, cost_price, mrp, selling_price)
                    VALUES ($1, $2, $3, $4, 'Black/White', 6000.00, 10495.00, 9999.00) RETURNING id`,
                    [p1.rows[0].id, sku, barcode, size]
                );
                // Initial Stock
                await client.query(`INSERT INTO inventory (variant_id, quantity) VALUES ($1, 25)`, [v.rows[0].id]);
            }

            // 2. Wilson Tennis Racket
            const brandRes2 = await client.query("SELECT id FROM brands WHERE name='Wilson'");
            const catRes2 = await client.query("SELECT id FROM categories WHERE name='Equipment'");

            const p2 = await client.query(`INSERT INTO products (name, brand_id, category_id, description, gst_rate) 
                VALUES ('Blade 98 v8', $1, $2, 'Pro Staff Tennis Racket', 12.00) RETURNING id`,
                [brandRes2.rows[0].id, catRes2.rows[0].id]
            );

            const v2 = await client.query(`INSERT INTO product_variants (product_id, sku, barcode, size, color, cost_price, mrp, selling_price)
                    VALUES ($1, $2, $3, $4, $5, 14000.00, 22000.00, 19500.00) RETURNING id`,
                [p2.rows[0].id, 'WIL-BLADE98-G4', '99221100', 'G4', 'Green']
            );
            await client.query(`INSERT INTO inventory (variant_id, quantity) VALUES ($1, 5)`, [v2.rows[0].id]);

        }

        console.log('Database Initialization & Seeding Completed!');

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        client.release();
        process.exit();
    }
};

initDb();
