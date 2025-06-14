import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AdminAPMCController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, location_id } = req.body;

      const apmc = await prisma.aPMC.create({
        data: { name, location_id }
      });

      return res.status(201).json(apmc);

    } catch (error) {
      console.error('Create APMC error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, location_id } = req.body;

      const apmc = await prisma.aPMC.update({
        where: { id },
        data: { name, location_id }
      });

      return res.json(apmc);

    } catch (error) {
      console.error('Update APMC error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.aPMC.delete({
        where: { id }
      });

      return res.status(204).send();

    } catch (error) {
      console.error('Delete APMC error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const apmcs = await prisma.aPMC.findMany({
        include: {
          location: true,
          admins: true,
          commodities: {
            include: {
              commodity: true
            }
          }
        }
      });
      return res.json(apmcs);

    } catch (error) {
      console.error('Get all APMCs error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 