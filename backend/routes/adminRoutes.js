
import express from 'express';
import { authenticate, checkRole } from '../middleware/authMiddleware.js';
import {
    createUser,
    getUsers,
    updateUser,
    deleteUser,
    mapUserToSection,
    getSections,
    createDefaultSections,
    getMappings,
    getAuditLogs
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes are protected and require ADMIN role
router.use(authenticate, checkRole(['ADMIN']));

router.post('/users', createUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/map', mapUserToSection);
router.get('/sections', getSections);
router.post('/sections/create-default', createDefaultSections);
router.get('/mappings', getMappings);
router.get('/audit', getAuditLogs);

export default router;
