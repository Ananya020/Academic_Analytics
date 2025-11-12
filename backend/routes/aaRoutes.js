
import express from 'express';
import { authenticate, checkRole } from '../middleware/authMiddleware.js';
import { getAaSections, getAaAnalytics } from '../controllers/aaController.js';

const router = express.Router();

// All AA routes are protected and require AA role
router.use(authenticate, checkRole(['AA']));

router.get('/sections', getAaSections);
router.get('/analytics', getAaAnalytics);

export default router;
