import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './inventorySlice';
import posReducer from './posSlice';

export const store = configureStore({
    reducer: {
        inventory: inventoryReducer,
        pos: posReducer
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
