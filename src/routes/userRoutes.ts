import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateUser } from '../middlewares/authenticateUser';

const router = Router();
const userController = new UserController();
router.post('/login', userController.login);
router.delete('/', userController.deleteAll);
router.get('/fake', userController.createFakes);

router.post('/create', userController.create);
router.get('/me', authenticateUser, userController.me);
router.get('/by-phone', userController.findByPhone);
router.get('/:id', authenticateUser, userController.findOne);

router.get('/', userController.findAll);

router.put('/', userController.update);

export default router;