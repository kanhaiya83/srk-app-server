import { Router, RequestHandler } from 'express';
import { AdminController } from '../controllers/AdminControllers/AdminController';
import { AdminAPMCAdminController } from '../controllers/AdminControllers/AdminAPMCAdminController';
import { AdminCommodityController } from '../controllers/AdminControllers/AdminCommodityController';
import { AdminAPMCController } from '../controllers/AdminControllers/AdminAPMCController';
import { AdminLocationController } from '../controllers/AdminControllers/AdminLocationController';
import { AdminShopController } from '../controllers/AdminControllers/AdminShopController';
import { AdminUserController } from '../controllers/AdminControllers/AdminUserController';
import { authenticateAdmin } from '../middlewares/authenticateAdmin';

const router = Router();

router.post('/login', AdminController.login as unknown as RequestHandler);

router.use(authenticateAdmin as unknown as RequestHandler);

router.get('/me', AdminController.me as unknown as RequestHandler);

router.post('/apmc-admins', AdminAPMCAdminController.create as unknown as RequestHandler);
router.put('/apmc-admins/:id', AdminAPMCAdminController.update as unknown as RequestHandler);
router.delete('/apmc-admins/:id', AdminAPMCAdminController.delete as unknown as RequestHandler);
router.get('/apmc-admins', AdminAPMCAdminController.getAll as unknown as RequestHandler);

router.post('/commodities', AdminCommodityController.create as unknown as RequestHandler);
router.put('/commodities/:id', AdminCommodityController.update as unknown as RequestHandler);
router.delete('/commodities/:id', AdminCommodityController.delete as unknown as RequestHandler);
router.get('/commodities', AdminCommodityController.getAll as unknown as RequestHandler);

router.post('/apmcs', AdminAPMCController.create as unknown as RequestHandler);
router.put('/apmcs/:id', AdminAPMCController.update as unknown as RequestHandler);
router.delete('/apmcs/:id', AdminAPMCController.delete as unknown as RequestHandler);
router.get('/apmcs', AdminAPMCController.getAll as unknown as RequestHandler);

router.post('/locations', AdminLocationController.create as unknown as RequestHandler);
router.put('/locations/:id', AdminLocationController.update as unknown as RequestHandler);
router.delete('/locations/:id', AdminLocationController.delete as unknown as RequestHandler);
router.get('/locations', AdminLocationController.getAll as unknown as RequestHandler);

router.post('/shops', AdminShopController.create as unknown as RequestHandler);
router.put('/shops/:id', AdminShopController.update as unknown as RequestHandler);
router.delete('/shops/:id', AdminShopController.delete as unknown as RequestHandler);
router.get('/shops', AdminShopController.getAll as unknown as RequestHandler);

router.post('/users', AdminUserController.create as unknown as RequestHandler);
router.put('/users/:id', AdminUserController.update as unknown as RequestHandler);
router.delete('/users/:id', AdminUserController.delete as unknown as RequestHandler);
router.get('/users', AdminUserController.getAll as unknown as RequestHandler);
router.put('/users/business/:businessId', AdminUserController.updateBusinessVerification as unknown as RequestHandler);
router.put('/users/role/:roleId', AdminUserController.updateRoleApproval as unknown as RequestHandler);

export default router; 