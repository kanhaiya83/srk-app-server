import { Router } from 'express';
import { APMCController } from '../controllers/APMCController';
import { authenticateApmcAdmin } from '../middlewares/authenticateApmcAdmin';

const router = Router();
const apmcController = new APMCController();

// Public routes
router.post('/login', apmcController.login);

// Protected routes
router.get('/me', authenticateApmcAdmin, apmcController.getMe);

// Slot management
router.post('/slots', authenticateApmcAdmin, apmcController.addSlot);
router.delete('/slots/:id', authenticateApmcAdmin, apmcController.deleteSlot);
router.put('/slots/:id', authenticateApmcAdmin, apmcController.updateSlot);

// Shop management
router.post('/shops', authenticateApmcAdmin, apmcController.createShop);
router.put('/shops/:id', authenticateApmcAdmin, apmcController.updateShop);
router.delete('/shops/:id', authenticateApmcAdmin, apmcController.deleteShop);

export default router; 