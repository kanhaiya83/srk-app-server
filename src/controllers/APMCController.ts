import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';

interface AuthenticatedRequest extends Request {
  userId: string;
}

const prisma = new PrismaClient();

export class APMCController {
  async login(req: Request, res: Response) {
    try {
      const { firebaseToken } = req.body;

      if (!firebaseToken) {
        res.status(400).json({ error: 'Firebase token is required' });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        res.status(400).json({ error: 'Phone number not found in Firebase token' });
        return;
      }

      const apmcAdmin = await prisma.aPMCAdmin.findFirst({
        where: { mobile_number: phoneNumber }
      });

      if (!apmcAdmin) {
        res.status(404).json({ error: 'APMC Admin not found' });
        return;
      }

      res.status(200).json(apmcAdmin);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      const admin = await prisma.aPMCAdmin.findUnique({
        where: { id: userId },
        include: {
          apmcs: true
        }
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.status(200).json(admin);
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addSlot(req: Request, res: Response) {
    try {
      const { start_time, end_time, participate_before, eligible_shop_ids } = req.body;

      const slot = await prisma.slot.create({
        data: {
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          participate_before: new Date(participate_before),
          shops_eligible: {
            connect: eligible_shop_ids.map((id: string) => ({ id }))
          }
        }
      });

      res.status(201).json(slot);
    } catch (error) {
      console.error('Add slot error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteSlot(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.slot.delete({
        where: { id }
      });

      res.status(200).json({ message: 'Slot deleted successfully' });
    } catch (error) {
      console.error('Delete slot error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateSlot(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { start_time, end_time, participate_before, eligible_shop_ids } = req.body;

      const slot = await prisma.slot.update({
        where: { id },
        data: {
          start_time: start_time ? new Date(start_time) : undefined,
          end_time: end_time ? new Date(end_time) : undefined,
          participate_before: participate_before ? new Date(participate_before) : undefined,
          shops_eligible: eligible_shop_ids ? {
            set: eligible_shop_ids.map((id: string) => ({ id }))
          } : undefined
        }
      });

      res.status(200).json(slot);
    } catch (error) {
      console.error('Update slot error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createShop(req: Request, res: Response) {
    try {
      const { name, apmc_id } = req.body;

      const shop = await prisma.shop.create({
        data: {
          name,
          apmc_id
        }
      });

      res.status(201).json(shop);
    } catch (error) {
      console.error('Create shop error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateShop(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, apmc_id } = req.body;

      const shop = await prisma.shop.update({
        where: { id },
        data: {
          name,
          apmc_id
        }
      });

      res.status(200).json(shop);
    } catch (error) {
      console.error('Update shop error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteShop(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.shop.delete({
        where: { id }
      });

      res.status(200).json({ message: 'Shop deleted successfully' });
    } catch (error) {
      console.error('Delete shop error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 