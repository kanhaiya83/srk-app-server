import { Router } from 'express';
import { VendorController } from '../controllers/VendorController';
import { authenticateVendor } from '../middlewares/authenticateVendor';

const router = Router();
const vendorController = new VendorController();

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
router.post('/login', vendorController.login);
router.delete('/', vendorController.deleteAll);

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
 *             $ref: '#/components/schemas/UnverifiedVendorUser'
 *     responses:
 *       201:
 *         description: Unverified vendor created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnverifiedVendorUser'
 *       500:
 *         description: Internal server error.
 */
router.post('/create', vendorController.create);

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
 *               $ref: '#/components/schemas/VendorUser'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Vendor not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/me', authenticateVendor, vendorController.me);

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
 *               $ref: '#/components/schemas/VendorUser'
 *       404:
 *         description: Vendor not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id', authenticateVendor, vendorController.findOne);

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
 *                 $ref: '#/components/schemas/VendorUser'
 *       500:
 *         description: Internal server error.
 */
router.get('/', vendorController.findAll);

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
 *             $ref: '#/components/schemas/VendorUser'
 *     responses:
 *       200:
 *         description: Vendor updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorUser'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.put('/', authenticateVendor, vendorController.update);

/**
 * @swagger
 * components:
 *   schemas:
 *     UnverifiedVendorUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           readOnly: true
 *         company_name:
 *           type: string
 *         cin_number:
 *           type: string
 *         company_nature:
 *           $ref: '#/components/schemas/CompanyNature'
 *         role:
 *           $ref: '#/components/schemas/VendorRole'
 *         contact_number:
 *           type: string
 *         contact_person_name:
 *           type: string
 *         email:
 *           type: string
 *           unique: true
 *         notional_amount:
 *           type: number
 *         website_link:
 *           type: string
 *           nullable: true
 *         communication_address:
 *           type: string
 *         city:
 *           type: string
 *         pin_code:
 *           type: string
 *         state:
 *           type: string
 *         gst_number:
 *           type: string
 *           nullable: true
 *         mandi_license:
 *           type: string
 *           nullable: true
 *         apmc_license:
 *           type: string
 *           nullable: true
 *         commodity:
 *           type: string
 *           nullable: true
 *         business_type:
 *           $ref: '#/components/schemas/BusinessType'
 *         referral_code:
 *           type: string
 *           nullable: true
 *       required:
 *         - company_name
 *         - cin_number
 *         - company_nature
 *         - role
 *         - contact_number
 *         - contact_person_name
 *         - email
 *         - notional_amount
 *         - communication_address
 *         - city
 *         - pin_code
 *         - state
 *         - business_type
 * 
 *     VendorUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           readOnly: true
 *         company_name:
 *           type: string
 *         cin_number:
 *           type: string
 *         company_nature:
 *           $ref: '#/components/schemas/CompanyNature'
 *         role:
 *           $ref: '#/components/schemas/VendorRole'
 *         contact_number:
 *           type: string
 *         contact_person_name:
 *           type: string
 *         email:
 *           type: string
 *           unique: true
 *         notional_amount:
 *           type: number
 *         website_link:
 *           type: string
 *           nullable: true
 *         communication_address:
 *           type: string
 *         city:
 *           type: string
 *         pin_code:
 *           type: string
 *         state:
 *           type: string
 *         gst_number:
 *           type: string
 *           nullable: true
 *         mandi_license:
 *           type: string
 *           nullable: true
 *         apmc_license:
 *           type: string
 *           nullable: true
 *         commodity:
 *           type: string
 *           nullable: true
 *         business_type:
 *           $ref: '#/components/schemas/BusinessType'
 *         referral_code:
 *           type: string
 *           nullable: true
 *       required:
 *         - company_name
 *         - cin_number
 *         - company_nature
 *         - role
 *         - contact_number
 *         - contact_person_name
 *         - email
 *         - notional_amount
 *         - communication_address
 *         - city
 *         - pin_code
 *         - state
 *         - business_type
 *
 *     CompanyNature:
 *       type: string
 *       enum: [Private, LLC, Partnership, Proprietorship]
 *
 *     VendorRole:
 *       type: string
 *       enum: [Buyer, Seller, Both]
 *
 *     BusinessType:
 *       type: string
 *       enum: [Trading, Retailer, Miller, Processor, Importer, Exporter]
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;