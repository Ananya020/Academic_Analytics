
import express from 'express';
import multer from 'multer';
import { authenticate, checkRole } from '../middleware/authMiddleware.js';
import { uploadStudents, uploadPerformance, uploadAttendance, getFaAnalytics } from '../controllers/faController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All FA routes are protected and require FA role
router.use(authenticate, checkRole(['FA']));

router.post('/upload/students', upload.single('file'), uploadStudents);
router.post('/upload/performance', upload.single('file'), uploadPerformance);
router.post('/upload/attendance', upload.single('file'), uploadAttendance);
router.get('/analytics', getFaAnalytics);

export default router;
