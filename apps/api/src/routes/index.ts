import { Router } from 'express';
import { login, refreshToken } from '../controllers/auth.controller';
import { getProducts, searchProducts, createProduct } from '../controllers/product.controller';
import { createSale, getSales, getSaleByInvoice } from '../controllers/pos.controller';
import { getInventory, updateInventory } from '../controllers/inventory.controller';
import { createOrder } from '../controllers/order.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Auth
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Products & POS Search
router.get('/products', authenticateToken, getProducts);
router.post('/products', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), createProduct);
router.get('/products/search', authenticateToken, searchProducts);

// Inventory Operations
router.get('/inventory', authenticateToken, getInventory);
router.post('/inventory/update', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), updateInventory);

// POS Operations
router.post('/pos/sale', authenticateToken, createSale); // Staff can create sales
router.get('/sales', authenticateToken, authorizeRole(['ADMIN']), getSales); // Admin read-only
router.get('/sales/:invoiceNumber', authenticateToken, getSaleByInvoice);

// Orders (Purchases)
router.post('/orders', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), createOrder);

// Analytics
import analyticsRoutes from './analytics.routes';
router.use('/analytics', authenticateToken, authorizeRole(['ADMIN']), analyticsRoutes);

// Returns
import returnRoutes from './return.routes';
router.use('/returns', authenticateToken, returnRoutes); // Staff can process returns? Yes.

export default router;
