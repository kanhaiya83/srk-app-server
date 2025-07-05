import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AdminAPMCController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, location_id, admin_ids, commodity_ids } = req.body;
      console.log("Request body in AdminAPMCController.create:", req.body);
      const apmc = await prisma.aPMC.create({
        data: { 
          name, 
          location_id,
          admins: {
            connect: admin_ids.map((id: string) => ({ id }))
          },
          commodities: {
            create: commodity_ids.map((commodity_id: string) => ({
              commodity: {
                connect: { id: commodity_id }
              },
              disabled: false
            }))
          }
        },
        include: {
          location: true,
          users: true,
          shops: {
            include: {
              commodities: true
            }
          },
          admins: true,
          slots: {
            include: {
              commodity: true,
              shops_eligible: true,
              shops_participated: true
            }
          },
          commodities: {
            include: {
              commodity: true
            }
          }
        }
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
      const { name, location_id, admin_ids, commodity_ids } = req.body;

      // First, disconnect all existing relationships
      await prisma.aPMC.update({
        where: { id },
        data: {
          admins: {
            set: []
          },
          commodities: {
            deleteMany: {}
          }
        }
      });

      // Then update with new relationships
      const apmc = await prisma.aPMC.update({
        where: { id },
        data: { 
          name, 
          location_id,
          admins: {
            connect: admin_ids.map((id: string) => ({ id }))
          },
          commodities: {
            create: commodity_ids.map((commodity_id: string) => ({
              commodity: {
                connect: { id: commodity_id }
              },
              disabled: false
            }))
          }
        },
        include: {
          location: true,
          users: true,
          shops: {
            include: {
              commodities: true
            }
          },
          admins: true,
          slots: {
            include: {
              commodity: true,
              shops_eligible: true,
              shops_participated: true
            }
          },
          commodities: {
            include: {
              commodity: true
            }
          }
        }
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

      // Delete all roles associated with this APMC first
      await prisma.role.deleteMany({
        where: { apmc_id: id }
      });

      // Then clear other relationships
      await prisma.aPMC.update({
        where: { id },
        data: {
          admins: {
            set: []
          },
          commodities: {
            deleteMany: {}
          },
          slots: {
            deleteMany: {}
          },
          shops: {
            deleteMany: {}
          }
        }
      });

      // Finally delete the APMC
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
          users: true,
          shops: {
            include: {
              commodities: true
            }
          },
          admins: true,
          slots: {
            include: {
              commodity: true,
              shops_eligible: true,
              shops_participated: true
            }
          },
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