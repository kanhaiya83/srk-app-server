import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateUser } from '../middlewares/authenticateUser';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /vendors/login:
 *   post:
 *     summary: Authenticate a vendor using a Firebase token.
 *     tags: [Vendors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firebaseToken:
 *                 type: string
 *                 description: The Firebase ID token.
 *     responses:
 *       200:
 *         description: Successfully authenticated. Returns a JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The JWT token for the authenticated vendor.
 *       400:
 *         description: Bad request. Missing or invalid Firebase token.
 *       404:
 *         description: Vendor not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/login', userController.login);
router.delete('/', userController.deleteAll);
router.get('/fake', userController.createFakes);

/**
 * @swagger
 * /vendors/create:
 *   post:
 *     summary: Create a new unverified vendor.
 *     tags: [Vendors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Unverified vendor created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error.
 */
router.post('/create', userController.create);

/**
 * @swagger
 * /vendors/me:
 *   get:
 *     summary: Get the currently authenticated vendor's profile.
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Vendor not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/me', authenticateUser, userController.me);

/**
 * @swagger
 * /vendors/{id}:
 *   get:
 *     summary: Get a vendor by ID.
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the vendor to retrieve.
 *     responses:
 *       200:
 *         description: Vendor found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Vendor not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id', authenticateUser, userController.findOne);

/**
 * @swagger
 * /vendors:
 *   get:
 *     summary: Get all vendors.
 *     tags: [Vendors]
 *     responses:
 *       200:
 *         description: List of vendors.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error.
 */
router.get('/', userController.findAll);

/**
 * @swagger
 * /vendors:
 *   put:
 *     summary: Update the currently authenticated vendor's profile.
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Vendor updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.put('/', userController.update);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           readOnly: true
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         mobile_number:
 *           type: string
 *       required:
 *         - first_name
 *         - last_name
 *         - mobile_number
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;