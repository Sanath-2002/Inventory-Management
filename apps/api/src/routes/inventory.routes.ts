import express from 'express';
import { getInventory } from '../controllers/inventory.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticateToken, getInventory);

export default router;
