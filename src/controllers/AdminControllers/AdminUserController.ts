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
              apmc: {
                include: {
                  location: true
                }
              }
            }
          },
          organizationUsers: {
            include: {
              organization: {
                include: {
                  businesses: true
                }
              }
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

  static async updateBusinessVerification(req: AuthenticatedRequest, res: Response) {
    try {
      const { businessId } = req.params;
      const { is_verified } = req.body;
      console.log("In updateBusinessVerification",{businessId, is_verified});
      if (typeof is_verified !== 'boolean') {
        return res.status(400).json({ error: 'is_verified must be a boolean' });
      }

      const business = await prisma.business.update({
        where: { id: businessId },
        data: { 
          is_verified
        },
        include: {
          organization: {
            include: {
              users: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      // Return the updated business with its related data
      return res.json(business);

    } catch (error) {
      console.error('Update Business Verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateRoleApproval(req: AuthenticatedRequest, res: Response) {
    try {
      const { roleId } = req.params;
      const { is_approved } = req.body;

      if (typeof is_approved !== 'boolean') {
        return res.status(400).json({ error: 'is_approved must be a boolean' });
      }

      const role = await prisma.role.update({
        where: { id: roleId },
        data: { 
          is_approved
        },
        include: {
          apmc: {
            include: {
              location: true
            }
          },
          user: true
        }
      });

      return res.json(role);

    } catch (error) {
      console.error('Update Role Approval error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 