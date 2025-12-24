
import { Router } from 'express';
import { getDailySales, getStockValue } from '../controllers/analytics.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/daily-sales', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), getDailySales);
router.get('/stock-value', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), getStockValue);

export default router;
