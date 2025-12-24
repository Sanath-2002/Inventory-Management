import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
    variantId: string;
    productName: string;
    sku: string;
    size: string;
    color: string;
    price: number; // Selling Price
    gstRate: number;
    quantity: number;
    subtotal: number; // price * quantity
    taxInfo: number; // calculated tax amount
}

interface ROSState {
    cart: CartItem[];
    customer: {
        name: string;
        phone: string;
    };
    totals: {
        subtotal: number;
        tax: number;
        total: number;
    };
    isCheckoutModalOpen: boolean;
}

const initialState: ROSState = {
    cart: [],
    customer: { name: '', phone: '' },
    totals: { subtotal: 0, tax: 0, total: 0 },
    isCheckoutModalOpen: false,
};

const calculateTotals = (cart: CartItem[]) => {
    let subtotal = 0;
    let tax = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        // Tax is usually exclusive in retail or inclusive. Assuming Exclusive for calculation clarity here, 
        // or derived if MRP is inclusive. Let's assume Price is Base Price for now based on schema (Selling Price).
        // Actually schema has Selling Price. Let's assume Tax is EXTRA for this POS logic unless specified otherwise.
        // Re-reading logic in controller: `subtotal + tax`. So Tax is extra.
        tax += (item.price * item.quantity * item.gstRate) / 100;
    });
    return {
        subtotal,
        tax,
        total: subtotal + tax
    };
};

const posSlice = createSlice({
    name: 'pos',
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<Omit<CartItem, 'subtotal' | 'taxInfo'>>) => {
            const existing = state.cart.find(item => item.variantId === action.payload.variantId);
            if (existing) {
                existing.quantity += action.payload.quantity;
                existing.subtotal = existing.price * existing.quantity;
                existing.taxInfo = (existing.subtotal * existing.gstRate) / 100;
            } else {
                state.cart.push({
                    ...action.payload,
                    subtotal: action.payload.price * action.payload.quantity,
                    taxInfo: ((action.payload.price * action.payload.quantity) * action.payload.gstRate) / 100
                });
            }
            state.totals = calculateTotals(state.cart);
        },
        removeFromCart: (state, action: PayloadAction<string>) => {
            state.cart = state.cart.filter(item => item.variantId !== action.payload);
            state.totals = calculateTotals(state.cart);
        },
        updateQuantity: (state, action: PayloadAction<{ variantId: string; quantity: number }>) => {
            const item = state.cart.find(i => i.variantId === action.payload.variantId);
            if (item) {
                item.quantity = Math.max(1, action.payload.quantity);
                item.subtotal = item.price * item.quantity;
                item.taxInfo = (item.subtotal * item.gstRate) / 100;
                state.totals = calculateTotals(state.cart);
            }
        },
        setCustomer: (state, action: PayloadAction<{ name: string; phone: string }>) => {
            state.customer = action.payload;
        },
        clearCart: (state) => {
            state.cart = [];
            state.customer = { name: '', phone: '' };
            state.totals = { subtotal: 0, tax: 0, total: 0 };
        },
        toggleCheckoutModal: (state, action: PayloadAction<boolean>) => {
            state.isCheckoutModalOpen = action.payload;
        }
    }
});

export const { addToCart, removeFromCart, updateQuantity, setCustomer, clearCart, toggleCheckoutModal } = posSlice.actions;
export default posSlice.reducer;
