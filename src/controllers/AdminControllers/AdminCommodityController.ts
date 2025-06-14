import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AdminCommodityController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, image } = req.body;

      const commodity = await prisma.commodity.create({
        data: { title, image }
      });

      return res.status(201).json(commodity);

    } catch (error) {
      console.error('Create Commodity error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, image } = req.body;

      const commodity = await prisma.commodity.update({
        where: { id },
        data: { title, image }
      });

      return res.json(commodity);

    } catch (error) {
      console.error('Update Commodity error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.commodity.delete({
        where: { id }
      });

      return res.status(204).send();

    } catch (error) {
      console.error('Delete Commodity error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const commodities = await prisma.commodity.findMany();
      return res.json(commodities);

    } catch (error) {
      console.error('Get all Commodities error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 