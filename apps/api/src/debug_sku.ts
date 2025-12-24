import pool from './config/database';

async function checkSku() {
    try {
        const res = await pool.query("SELECT * FROM product_variants WHERE sku = 'SAN-ujj-479'");
        console.log('Result:', res.rows);
    } catch (e) {
        console.error(e);
    }
}
checkSku();
