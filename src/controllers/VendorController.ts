import { Request, Response } from 'express';
import { Prisma, PrismaClient, User } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use environment variable for security


// import { faker } from '@faker-js/faker';
async function createVendors() {
  // const vendorPromises = [];

  // for (let i = 51; i <= 60; i++) {
  //   const vendorData = {
  //     first_name: faker.name.firstName(),
  //     last_name: faker.name.lastName(),
  //     mobile_number: faker.phone.number(),
  //   };
  //   vendorPromises.push(prisma.user.create({ data: vendorData }));
  // }

  // try {
  //   await Promise.all(vendorPromises);
  //   console.log('Users created successfully!');
  // } catch (error) {
  //   console.error('Error creating users:', error);
  // } finally {
  //   await prisma.$disconnect();
  // }
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

      // There is no firebase_uid field in User, so we can't look up by it.
      // You may want to look up by mobile_number or email if you add it to the model.
      // For now, just return empty.
      res.status(200).json({});
      return
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }

  async create(req: Request, res: Response) {
    try {
      const vendorData: Prisma.UserCreateInput = req.body.data;
      // Only allow fields that exist in User model
      const { first_name, last_name, mobile_number } = vendorData;
      const newUser = await prisma.user.create({ data: { first_name, last_name, mobile_number,notional_amount:100000 } });
      const token = jwt.sign({ vendorId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ data: newUser, token });
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
          // No auction relations to clear in User model as per current schema, so skip this step.
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
      const vendorId = req.params.id;
      const vendor = await prisma.user.findUnique({ where: { id: vendorId } });

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
      const vendors = await prisma.user.findMany();
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
      const vendor = await prisma.user.findUnique({ where: { id: vendorId.toString() } });

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
      const vendorId = req.body.id;
      const vendorData: Partial<User> = req.body;

      if (!vendorId) {
        res.status(401).json({ error: 'Unauthorized' });
        return
      }

      // Only allow updating fields that exist in User model
      const { first_name, last_name, mobile_number } = vendorData;
      const updatedUser = await prisma.user.update({
        where: { id: vendorId },
        data: { first_name, last_name, mobile_number },
      });
      res.status(200).json(updatedUser);
      return
    } catch (error) {
      console.error('Error updating vendor:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }
}