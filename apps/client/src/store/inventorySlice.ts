import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Product {
    inventory_id: string;
    quantity: number;
    location: string;
    variant_id: string;
    sku: string;
    size: string;
    color: string;
    selling_price: number;
    product_name: string;
    brand_name: string;
    category_name: string;
    low_stock_threshold?: number;
}

interface InventoryState {
    products: Product[];
    loading: boolean;
    error: string | null;
}

const initialState: InventoryState = {
    products: [],
    loading: false,
    error: null,
};

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        setProducts: (state, action: PayloadAction<Product[]>) => {
            state.products = action.payload;
            state.loading = false;
        },
        updateProductStock: (state, action: PayloadAction<{ variantId: string; quantity: number }>) => {
            const product = state.products.find(p => p.variant_id === action.payload.variantId);
            if (product) {
                product.quantity = action.payload.quantity; // Direct set or adjustment? API returns new quantity usually.
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.loading = false;
        }
    },
});

export const { setProducts, updateProductStock, setLoading, setError } = inventorySlice.actions;
export default inventorySlice.reducer;
