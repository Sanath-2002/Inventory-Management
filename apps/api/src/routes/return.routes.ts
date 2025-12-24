
import { Router } from 'express';
import { createReturn, getReturns } from '../controllers/return.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createReturn);
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), getReturns);

export default router;
