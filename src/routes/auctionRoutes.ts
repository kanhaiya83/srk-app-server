import { Router } from 'express';
import { AuctionController } from '../controllers/AuctionController';
import { authenticateVendor } from '../middlewares/authenticateVendor';

const router = Router();
const auctionController = new AuctionController();

/**
 * @swagger
 * /auctions/create:
 *   post:
 *     summary: Create a new auction (Vendor Only).
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuctionCreateInput'
 *     responses:
 *       201:
 *         description: Auction created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Auction'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.post('/create', authenticateVendor, auctionController.create);

/**
 * @swagger
 * /auctions/{id}:
 *   get:
 *     summary: Get an auction by ID.
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the auction to retrieve.
 *     responses:
 *       200:
 *         description: Auction found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Auction'
 *       404:
 *         description: Auction not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id', auctionController.findOne);

/**
 * @swagger
 * /auctions:
 *   get:
 *     summary: Get all auctions.
 *     tags: [Auctions]
 *     responses:
 *       200:
 *         description: List of auctions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Auction'
 *       500:
 *         description: Internal server error.
 */
router.get('/', auctionController.findAll);

/**
 * @swagger
 * /auctions/me:
 *   get:
 *     summary: Get all auctions created by the authenticated vendor.
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the vendor's auctions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Auction'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get('/me', authenticateVendor, auctionController.me);

/**
 * @swagger
 * /auctions/participated:
 *   get:
 *     summary: Get auctions the authenticated vendor has participated in.
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [upcoming, gone]
 *         description: Filter auctions by upcoming or past (gone).
 *     responses:
 *       200:
 *         description: List of participated auctions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Auction'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get('/participated', authenticateVendor, auctionController.participated);

/**
 * @swagger
 * /auctions/search:
 *   get:
 *     summary: Search for auctions based on various criteria.
 *     tags: [Auctions]
 *     parameters:
 *       - in: query
 *         name: commodity
 *         schema:
 *           type: string
 *         description: Search by commodity name (case-insensitive).
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *         description: Search by grade (case-insensitive).
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Search by location (case-insensitive).
 *       - in: query
 *         name: start_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Search by start time (greater than or equal to).
 *       - in: query
 *         name: auction_type
 *         schema:
 *           type: string
 *         description: Search by auction type (case-insensitive).
 *     responses:
 *       200:
 *         description: List of auctions matching the search criteria.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Auction'
 *       500:
 *         description: Internal server error.
 */
router.get('/search', auctionController.search);

/**
 * @swagger
 * /auctions/{id}:
 *   put:
 *     summary: Update an auction (only the creator can update).
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the auction to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuctionUpdateInput'
 *     responses:
 *       200:
 *         description: Auction updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Auction'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (not the creator).
 *       404:
 *         description: Auction not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/:id', authenticateVendor, auctionController.update);

/**
 * @swagger
 * components:
 *   schemas:
 *     Auction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           readOnly: true
 *         commodity:
 *           type: string
 *         grade:
 *           type: string
 *         start_time:
 *           type: string
 *           format: date-time
 *         tick_size:
 *           type: number
 *         bid_challenge_time:
 *           type: integer
 *         location:
 *           type: string
 *         is_private:
 *           type: boolean
 *         auction_type:
 *           type: string
 *         lot_count_quantity:
 *           type: integer
 *         initial_bid:
 *           type: number
 *         min_selling_price:
 *           type: number
 *         emd_amount:
 *           type: number
 *         warehouse:
 *           type: string
 *         sample_request:
 *           type: boolean
 *         phase1_count:
 *           type: integer
 *         creatorId:
 *           type: integer
 *         creator:
 *           $ref: '#/components/schemas/VendorUser'
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VendorUser'
 *       required:
 *         - commodity
 *         - grade
 *         - start_time
 *         - tick_size
 *         - bid_challenge_time
 *         - location
 *         - is_private
 *         - auction_type
 *         - lot_count_quantity
 *         - initial_bid
 *         - min_selling_price
 *         - emd_amount
 *         - warehouse
 *         - sample_request
 *         - phase1_count
 *         - creatorId
 *
 *     AuctionCreateInput:
 *       type: object
 *       properties:
 *         commodity:
 *           type: string
 *         grade:
 *           type: string
 *         start_time:
 *           type: string
 *           format: date-time
 *         tick_size:
 *           type: number
 *         bid_challenge_time:
 *           type: integer
 *         location:
 *           type: string
 *         is_private:
 *           type: boolean
 *         auction_type:
 *           type: string
 *         lot_count_quantity:
 *           type: integer
 *         initial_bid:
 *           type: number
 *         min_selling_price:
 *           type: number
 *         emd_amount:
 *           type: number
 *         warehouse:
 *           type: string
 *         sample_request:
 *           type: boolean
 *         phase1_count:
 *           type: integer
 *       required:
 *         - commodity
 *         - grade
 *         - start_time
 *         - tick_size
 *         - bid_challenge_time
 *         - location
 *         - is_private
 *         - auction_type
 *         - lot_count_quantity
 *         - initial_bid
 *         - min_selling_price
 *         - emd_amount
 *         - warehouse
 *         - sample_request
 *         - phase1_count
 *
 *     AuctionUpdateInput:
 *       type: object
 *       properties:
 *         commodity:
 *           type: string
 *         grade:
 *           type: string
 *         start_time:
 *           type: string
 *           format: date-time
 *         tick_size:
 *           type: number
 *         bid_challenge_time:
 *           type: integer
 *         location:
 *           type: string
 *         is_private:
 *           type: boolean
 *         auction_type:
 *           type: string
 *         lot_count_quantity:
 *           type: integer
 *         initial_bid:
 *           type: number
 *         min_selling_price:
 *           type: number
 *         emd_amount:
 *           type: number
 *         warehouse:
 *           type: string
 *         sample_request:
 *           type: boolean
 *         phase1_count:
 *           type: integer
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
/**
 * @swagger
 * /auctions/{id}/participate:
 *   post:
 *     summary: Participate in an auction.
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the auction to participate in.
 *     responses:
 *       200:
 *         description: Successfully participated in the auction.
 *       400:
 *         description: Bad request (e.g., already participating, insufficient funds).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Auction or vendor not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/:id/participate', authenticateVendor, auctionController.participateInAuction);

/**
 * @swagger
 * /auctions/{id}/leave:
 *   post:
 *     summary: Leave an auction.
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the auction to leave.
 *     responses:
 *       200:
 *         description: Successfully left the auction.
 *       400:
 *         description: Bad request (e.g., not participating).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Auction not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/:id/leave', authenticateVendor, auctionController.leaveAuction);

/**
 * @swagger
 * /auctions/{id}/bid:
 *   post:
 *     summary: Bid on an auction.
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the auction to bid on.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: The amount to bid.
 *             required:
 *               - amount
 *     responses:
 *       201:
 *         description: Bid created successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Auction not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/:id/bid', authenticateVendor, auctionController.bidOnAuction);
router.post('/:id/bid/test', auctionController.bidOnAuctionTest);
export default router;