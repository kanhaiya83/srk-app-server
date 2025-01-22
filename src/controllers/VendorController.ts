import { Request, Response } from 'express';
import { PrismaClient, UnverifiedVendorUser, VendorUser } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use environment variable for security

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
        where: { contact_number: phoneNumber },
      });

      if (!vendor) {
         res.status(404).json({ error: 'Vendor not found' });
         return
      }

      const token = jwt.sign({ vendorId: vendor.id }, JWT_SECRET, { expiresIn: '1d' }); // Adjust expiration as needed

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
      const vendorData: UnverifiedVendorUser = req.body;
      const newVendor = await prisma.unverifiedVendorUser.create({ data: vendorData });
       res.status(201).json(newVendor);
       return
    } catch (error) {
      console.error('Error creating vendor:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
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

  async me(req: Request, res: Response) {
    try {
      const vendorId = req.vendorId; // Attached by authenticateVendor middleware

      if (!vendorId) {
         res.status(401).json({ error: 'Unauthorized' });
         return
      }

      const vendor = await prisma.vendorUser.findUnique({ where: { id: vendorId } });

      if (!vendor) {
         res.status(404).json({ error: 'Vendor not found' });
         return
      }

       res.status(200).json(vendor);
       return
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
       res.status(500).json({ error: 'Internal server error' });
       return
    }
  }

  async update(req: Request, res: Response) {
    try {
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