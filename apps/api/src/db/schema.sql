CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE; -- Cleanup old tables
DROP TABLE IF EXISTS order_items CASCADE; -- Cleanup old tables
DROP TABLE IF EXISTS orders CASCADE; -- Cleanup old tables

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'STAFF')) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. MASTER DATA (Brands, Categories, Suppliers)
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    gst_number VARCHAR(20),
    address TEXT
);

-- 3. PRODUCTS & VARIANTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    brand_id INTEGER REFERENCES brands(id),
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    gst_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE, -- Scannable code
    size VARCHAR(20), -- e.g., '10', 'XL', '42mm'
    color VARCHAR(30), -- e.g., 'Red', 'Black'
    cost_price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    low_stock_threshold INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. INVENTORY
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id) UNIQUE,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    location VARCHAR(50) DEFAULT 'Store',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id),
    action VARCHAR(20) CHECK (action IN ('INWARD', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER')),
    quantity_change INTEGER NOT NULL,
    reason TEXT,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SALES (POS)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Invoice ID
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- Human readable (e.g., INV-001)
    user_id UUID REFERENCES users(id), -- Staff who billed
    customer_name VARCHAR(100), -- Optional
    customer_phone VARCHAR(20), -- Optional
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    payment_mode VARCHAR(20) CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'SPLIT')),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL, -- Price at time of sale
    tax_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);

-- 6. PURCHASES (Stock In)
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id INTEGER REFERENCES suppliers(id),
    invoice_number VARCHAR(50), -- Supplier Invoice
    total_amount DECIMAL(12,2),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by UUID REFERENCES users(id)
);

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL
);

-- 7. RETURNS & EXCHANGES
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id),
    total_refund DECIMAL(12,2) DEFAULT 0.00,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    condition VARCHAR(20) CHECK (condition IN ('RESELLABLE', 'DEFECTIVE')),
    refund_amount DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) CHECK (type IN ('SALE', 'PURCHASE', 'TRANSFER', 'ADJUSTMENT')),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL
);
