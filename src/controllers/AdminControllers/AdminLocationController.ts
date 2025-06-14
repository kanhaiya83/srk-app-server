import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AdminLocationController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { title } = req.body;

      const location = await prisma.location.create({
        data: { title }
      });

      return res.status(201).json(location);

    } catch (error) {
      console.error('Create Location error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title } = req.body;

      const location = await prisma.location.update({
        where: { id },
        data: { title }
      });

      return res.json(location);

    } catch (error) {
      console.error('Update Location error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.location.delete({
        where: { id }
      });

      return res.status(204).send();

    } catch (error) {
      console.error('Delete Location error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const locations = await prisma.location.findMany({
        include: {
          apmcs: true
        }
      });
      return res.json(locations);

    } catch (error) {
      console.error('Get all Locations error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 