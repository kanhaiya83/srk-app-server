import { Router } from 'express';
import { APMCController } from '../controllers/APMCController';
import { authenticateApmcAdmin } from '../middlewares/authenticateApmcAdmin';

const router = Router();
const apmcController = new APMCController();

// Public routes
router.post('/login', apmcController.login);

// Protected routes - using type assertion for authenticateApmcAdmin middleware compatibility
router.get('/me', authenticateApmcAdmin, apmcController.getMe as any);

// Slot management
router.post('/slots', authenticateApmcAdmin, apmcController.addSlot);
router.delete('/slots/:id', authenticateApmcAdmin, apmcController.deleteSlot);
router.put('/slots/:id', authenticateApmcAdmin, apmcController.updateSlot);

// Shop management
router.post('/shops', authenticateApmcAdmin, apmcController.createShop);
router.put('/shops/:id', authenticateApmcAdmin, apmcController.updateShop);
router.delete('/shops/:id', authenticateApmcAdmin, apmcController.deleteShop);

// User management - using type assertion for controller methods that return Response
router.post('/users/apmc', authenticateApmcAdmin, apmcController.getAPMCUsers as any);
router.post('/users/verification', authenticateApmcAdmin, apmcController.updateUserVerification as any);
router.post('/users/ban', authenticateApmcAdmin, apmcController.updateUserBanStatus as any);

// APMC data routes
router.get('/slots/:apmc_id', apmcController.getAPMCSlots as any);
router.get('/shops/:apmc_id', apmcController.getAPMCShops as any);

router.get('/apmc', apmcController.getApmcs as any);
// Commodity routes
router.get('/commodities', apmcController.getCommodities as any);
router.get('/commodities/:apmc_id', apmcController.getAPMCCommodities as any);
router.post('/commodities', authenticateApmcAdmin, apmcController.updateAPMCCommodity as any);

export default router;