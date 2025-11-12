
import express from 'express';
import { authenticate, checkRole } from '../middleware/authMiddleware.js';
import { getHodAnalytics, exportHodAnalytics } from '../controllers/hodController.js';

const router = express.Router();

// All HOD routes are protected and require HOD role
router.use(authenticate, checkRole(['HOD']));

router.get('/analytics', getHodAnalytics);
router.get('/export', exportHodAnalytics);

export default router;
