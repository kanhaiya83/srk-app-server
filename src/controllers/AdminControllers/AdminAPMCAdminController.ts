import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AdminAPMCAdminController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, mobile_number } = req.body;

      const apmcAdmin = await prisma.aPMCAdmin.create({
        data: { name, mobile_number }
      });

      return res.status(201).json(apmcAdmin);

    } catch (error) {
      console.error('Create APMC Admin error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, mobile_number } = req.body;

      const apmcAdmin = await prisma.aPMCAdmin.update({
        where: { id },
        data: { name, mobile_number }
      });

      return res.json(apmcAdmin);

    } catch (error) {
      console.error('Update APMC Admin error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.aPMCAdmin.delete({
        where: { id }
      });

      return res.status(204).send();

    } catch (error) {
      console.error('Delete APMC Admin error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const apmcAdmins = await prisma.aPMCAdmin.findMany();
      return res.json(apmcAdmins);

    } catch (error) {
      console.error('Get all APMC Admins error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 