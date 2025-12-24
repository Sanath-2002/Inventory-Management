export interface User {
    id: string;
    username: string;
    role: 'ADMIN' | 'STAFF';
    full_name: string;
}

export interface Brand {
    id: number;
    name: string;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
}

export interface Product {
    id: string;
    name: string;
    brand_id: number;
    category_id: number;
    description?: string;
    gst_rate: number;
    is_active: boolean;
    // Joined fields
    brand_name?: string;
    category_name?: string;
    variants?: ProductVariant[];
}

export interface ProductVariant {
    id: string;
    product_id: string;
    sku: string;
    barcode?: string;
    size?: string;
    color?: string;
    cost_price: number;
    mrp: number;
    selling_price: number;
    stock?: number; // From inventory join
}

export interface SaleItem {
    variant_id: string;
    quantity: number;
    unit_price: number;
}

export interface CreateSaleRequest {
    items: SaleItem[];
    paymentMode: 'CASH' | 'CARD' | 'UPI';
    customerName?: string;
    customerPhone?: string;
}
