import { Request, Response } from 'express';
import { Prisma, PrismaClient, VendorUser } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use environment variable for security


import { faker } from '@faker-js/faker';
async function createVendors() {
  const vendorPromises = [];

  for (let i = 51; i <= 60; i++) {
    const vendorData = {
      id: i,
      firebase_uid: faker.database.mongodbObjectId(),
      company_name: faker.company.name(),
      cin_number: faker.string.numeric(),
      company_nature: faker.helpers.arrayElement(['Private', 'LLC', 'Partnership', 'Proprietorship']),
      role: faker.helpers.arrayElement(['Buyer', 'Seller', 'Both']),
      contact_number: faker.phone.number(),
      contact_person_name: faker.name.fullName(),
      email: faker.internet.email(),
      notional_amount: 1000000,
      website_link: faker.internet.url(),
      communication_address: faker.address.streetAddress(),
      city: faker.address.city(),
      pin_code: faker.address.zipCode(),
      state: faker.address.state(),
      gst_number: faker.string.alphanumeric(15).toUpperCase(),
      mandi_license: faker.string.alphanumeric(8).toUpperCase(),
      apmc_license: faker.string.alphanumeric(8).toUpperCase(),
      commodity: faker.helpers.arrayElement(['JEERA', 'DHANIYA']),
      business_type: faker.helpers.arrayElement(['Trading', 'Retailer', 'Miller', 'Processor', 'Importer', 'Exporter']),
      referral_code: faker.string.alphanumeric(10).toUpperCase(),
    };
    vendorPromises.push(prisma.vendorUser.create({ data: vendorData }));
  }

  try {
    await Promise.all(vendorPromises);
    console.log('Vendors created successfully!');
  } catch (error) {
    console.error('Error creating vendors:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Call the function to create vendors
export class VendorController {
  async login(req: Request, res: Response) {
    try {
      const { firebaseToken } = req.body;

      if (!firebaseToken) {
        res.status(400).json({ error: 'Firebase token is required' });
        return
      }

      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        res.status(400).json({ error: 'Phone number not found in Firebase token' });
        return
      }

      const vendor = await prisma.vendorUser.findFirst({
        where: { firebase_uid: decodedToken.uid },
      });

      if (!vendor) {
        res.status(200).json({});
        return
      }

      const token = jwt.sign({ vendorId: vendor.id }, JWT_SECRET, { expiresIn: '7d' }); // Adjust expiration as needed

      res.status(200).json({ token });
      return
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }

  async create(req: Request, res: Response) {
    try {
      const vendorData: Prisma.VendorUserCreateInput = req.body.data;
      console.log({ createVendorForm: vendorData })
      //   const firebaseToken  = req.body.firebase_token;
      //   if (!firebaseToken) {
      //     res.status(400).json({ error: 'Firebase token is required' });
      //     return
      //  }

      //  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      //  const uid = decodedToken.uid
      const uid = req.body.firebase_uid

      const newVendor = await prisma.vendorUser.create({ data: { ...vendorData, firebase_uid: uid } });
      const token = jwt.sign({ vendorId: newVendor.id }, JWT_SECRET, { expiresIn: '7d' }); // Adjust expiration as needed

      res.status(201).json({ data: newVendor, token });
      return
    } catch (error) {
      console.error('Error creating vendor:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }

  async deleteAll(req: Request, res: Response) {

    async function deleteAllAuctions() {
      try {
        // Start a transaction
        await prisma.$transaction(async (prisma) => {
          // Step 1: Delete all bids first because they are related to auctions
          await prisma.bid.deleteMany({});

          // Step 2: Update VendorUser records to remove auction associations
          // Since we are deleting auctions, we need to clear the relations
          await prisma.vendorUser.updateMany({
            data: {
              // @ts-expect-error some
              auctions_created: {
                set: []
              },
              auctions_participated: {
                set: []
              },
              auctions_won: {
                set: []
              }
            }
          });

          // Step 3: Delete all auctions
          await prisma.auction.deleteMany({});
        });

        console.log('All auctions and related foreign keys have been removed successfully.');
      } catch (error) {
        console.error('Error deleting auctions:', error);
      } finally {
        await prisma.$disconnect();
      }
    }
    deleteAllAuctions()
    res.send({ success: true })
  }

  async findOne(req: Request, res: Response) {
    try {
      const vendorId = parseInt(req.params.id, 10);
      const vendor = await prisma.vendorUser.findUnique({ where: { id: vendorId } });

      if (!vendor) {
        res.status(404).json({ error: 'Vendor not found' });
        return
      }

      res.status(200).json(vendor);
      return
    } catch (error) {
      console.error('Error finding vendor:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const vendors = await prisma.vendorUser.findMany();
      res.status(200).json(vendors);
      return
    } catch (error) {
      console.error('Error finding all vendors:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }
  async createFakes(req: Request, res: Response) {
    try {
      await createVendors()
      res.status(200).json({success:true});
      return
    } catch (error) {
      console.error('Error finding all vendors:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }

  async me(req: Request, res: Response) {
    try {
      // @ts-expect-error eewf
      const vendorId = req.vendorId; // Attached by authenticateVendor middleware

      if (!vendorId) {
        res.status(401).json({ error: 'Unauthorized' });
        return
      }
      console.log({ vendorId })
      const vendor = await prisma.vendorUser.findUnique({ where: { id: vendorId } });

      if (!vendor) {
        res.status(401).json({ error: 'Vendor not found' });
        return
      }

      res.status(200).json(vendor);
      return
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      res.status(401).json({ error: 'Internal server error' });
      return
    }
  }

  async update(req: Request, res: Response) {
    try {
      // @ts-expect-error eewf
      const vendorId = req.vendorId;
      const vendorData: Partial<VendorUser> = req.body;

      if (!vendorId) {
        res.status(401).json({ error: 'Unauthorized' });
        return
      }

      const updatedVendor = await prisma.vendorUser.update({
        where: { id: vendorId },
        data: vendorData,
      });

      res.status(200).json(updatedVendor);
      return
    } catch (error) {
      console.error('Error updating vendor:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }
}