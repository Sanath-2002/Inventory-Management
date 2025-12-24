import express from 'express';
import { createOrder, getOrder } from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Public for demo ease, or authenticated
router.post('/', authenticateToken, createOrder);
router.get('/:id', authenticateToken, getOrder);

export default router;
