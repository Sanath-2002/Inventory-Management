import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'inventory_db',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;
