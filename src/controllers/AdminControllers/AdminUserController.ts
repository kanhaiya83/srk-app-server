import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AdminUserController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { first_name, last_name, mobile_number, notional_amount } = req.body;

      const user = await prisma.user.create({
        data: { 
          first_name, 
          last_name, 
          mobile_number, 
          notional_amount,
          is_verified: false,
          is_banned: false
        }
      });

      return res.status(201).json(user);

    } catch (error) {
      console.error('Create User error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { first_name, last_name, mobile_number, notional_amount, is_verified, is_banned } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { 
          first_name, 
          last_name, 
          mobile_number, 
          notional_amount,
          is_verified,
          is_banned
        }
      });

      return res.json(user);

    } catch (error) {
      console.error('Update User error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id }
      });

      return res.status(204).send();

    } catch (error) {
      console.error('Delete User error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        include: {
          roles: {
            include: {
              apmc: true
            }
          }
        }
      });
      return res.json(users);

    } catch (error) {
      console.error('Get all Users error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 