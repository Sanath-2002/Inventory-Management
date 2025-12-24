import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticateToken, getProducts);
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), createProduct);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), updateProduct);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), deleteProduct);

export default router;
