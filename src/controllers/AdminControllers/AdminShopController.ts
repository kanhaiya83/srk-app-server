import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AdminShopController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, apmc_id } = req.body;

      const shop = await prisma.shop.create({
        data: { name, apmc_id }
      });

      return res.status(201).json(shop);

    } catch (error) {
      console.error('Create Shop error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, apmc_id } = req.body;

      const shop = await prisma.shop.update({
        where: { id },
        data: { name, apmc_id }
      });

      return res.json(shop);

    } catch (error) {
      console.error('Update Shop error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.shop.delete({
        where: { id }
      });

      return res.status(204).send();

    } catch (error) {
      console.error('Delete Shop error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const shops = await prisma.shop.findMany({
        include: {
          apmc: true,
          commodities: true
        }
      });
      return res.json(shops);

    } catch (error) {
      console.error('Get all Shops error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 