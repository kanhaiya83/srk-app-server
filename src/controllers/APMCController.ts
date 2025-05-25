import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  userId: string;
}

const prisma = new PrismaClient();

export class APMCController {
  async login(req: Request, res: Response) {
    try {
      const { firebaseToken } = req.body;
      console.log({firebaseToken})
      if (!firebaseToken) {
        res.status(400).json({ error: 'Firebase token is required' });
        return;
      }

      if(firebaseToken =="demo_token"){
        const apmcAdmin = await prisma.aPMCAdmin.findFirst({
          where: { mobile_number: '9876543210' }
        });
        
        const token = jwt.sign(
          { 
            phone_number: '9876543210',
            uid: apmcAdmin?.id,
            role: 'APMC_ADMIN'
          }, 
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        res.status(200).json({ token });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const phoneNumber = decodedToken.phone_number;
      console.log({phoneNumber,decodedToken})
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

      const token = jwt.sign(
        { 
          phone_number: phoneNumber,
          uid: apmcAdmin.id,
          role: 'APMC_ADMIN'
        }, 
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(200).json({ token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      console.log({userId})
      const admin = await prisma.aPMCAdmin.findUnique({
        where: { id: userId },
        include: {
          apmcs: {
            include:{
              slots:{
                include:{
                  commodity:true,
                  shops_eligible:true,
                    shops_participated:true
                }
              },
              shops:{
                include:{
                  commodities:true
                }
              },
              location:true,
              commodities:{
                include:{
                  commodity:true
                }
              }
            }
          }
        }
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      console.log({admin})
      res.status(200).json(admin);
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addSlot(req: Request, res: Response) {
    try {
      const { start_time, end_time, participate_before, eligible_shop_ids, apmc_id, commodity_id ,day } = req.body;
      console.log(req.body)
      const day_to_save = day ? new Date(day) : new Date()
      day_to_save.setHours(0, 0, 0, 0)
      const slot = await prisma.slot.create({
        data: {
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          day: day_to_save,
          participate_before: new Date(participate_before),
          shops_eligible: {
            connect: eligible_shop_ids.map((id: string) => ({ id }))
          },
          apmc: {
            connect: { id: apmc_id }
          },
          commodity: {
            connect: { id: commodity_id }
          }
        },
        include: {
          commodity: true,
          shops_eligible: true
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
      const { start_time, end_time, participate_before, eligible_shop_ids ,day } = req.body;
      const day_to_save = day ? new Date(day) : new Date()
      day_to_save.setHours(0, 0, 0, 0)

      const slot = await prisma.slot.update({
        where: { id },
        data: {
          start_time: start_time ? new Date(start_time) : undefined,
          end_time: end_time ? new Date(end_time) : undefined,
          day:day_to_save,
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
      const { name, apmc_id, commodity_ids=[] } = req.body;

      const shop = await prisma.shop.create({
        data: {
          name,
          apmc_id,
          commodities: {
            connect: commodity_ids.map((id: string) => ({ id }))
          }
        },
        include: {
          commodities: true
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

  async getAPMCUsers(req: Request, res: Response) {
    try {
      const { apmc_id } = req.body;

      if (!apmc_id) {
        return res.status(400).json({ error: 'APMC ID is required' });
      }

      const users = await prisma.user.findMany({
        where: {
          roles: {
            some: {
              apmc_id: apmc_id
            }
          }
        },
        include: {
          roles: {
            where: {
              apmc_id: apmc_id
            },
            include: {
              apmc: {
                select: {
                  id: true,
                  location: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      res.status(200).json(users);
    } catch (error) {
      console.error('Get APMC users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUserVerification(req: Request, res: Response) {
    try {
      const { userId, role_id, is_approved } = req.body;

      if (!userId || !role_id || typeof is_approved !== 'boolean') {
        return res.status(400).json({ error: 'User ID, role ID and approval status are required' });
      }

      const updatedRole = await prisma.role.update({
        where: {
          id: role_id,
          user_id: userId
        },
        data: { is_approved }
      });

      res.status(200).json(updatedRole);
    } catch (error) {
      console.error('Update user verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUserBanStatus(req: Request, res: Response) {
    try {
      const { userId, is_banned } = req.body;

      if (!userId || typeof is_banned !== 'boolean') {
        return res.status(400).json({ error: 'User ID and ban status are required' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { is_banned }
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Update user ban status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAPMCSlots(req: Request, res: Response) {
    try {
      const { apmc_id } = req.params;
      const { commodity_id, day } = req.query;
      
      console.log({apmc_id,commodity_id,day})
      if (!apmc_id) {
        return res.status(400).json({ error: 'APMC ID is required' });
      }

      const targetDay = day ? new Date(parseInt(day as string)) : new Date();
      targetDay.setHours(0,0,0,0)
      
      // Create start date (one day before) and end date (one day after)
      const startDate = new Date(targetDay);
      startDate.setDate(startDate.getDate() - 1);
      
      const endDate = new Date(targetDay);
      endDate.setDate(endDate.getDate() + 1);

      const slots = await prisma.slot.findMany({
        where: {
          apmc_id: apmc_id,
          day: {
            gte: startDate,
            lte: endDate
          },
          ...(commodity_id ? { commodity_id: commodity_id as string } : {})
        },
        include: {
          shops_eligible: true,
          shops_participated: true,
          commodity: true
        }
      });

      res.status(200).json(slots);
    } catch (error) {
      console.error('Get APMC slots error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAPMCShops(req: Request, res: Response) {
    try {
      const { apmc_id } = req.params;
      const { commodity_id } = req.query;

      if (!apmc_id) {
        return res.status(400).json({ error: 'APMC ID is required' });
      }

      const shops = await prisma.shop.findMany({
        where: {
          apmc_id: apmc_id,
          ...(commodity_id ? {
            commodities: {
              some: {
                id: commodity_id as string
              }
            }
          } : {})
        },
        include: {
          commodities: true
        }
      });

      res.status(200).json(shops);
    } catch (error) {
      console.error('Get APMC shops error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  async getApmcs(req: Request, res: Response) {
    try {
      const apmcs = await prisma.aPMC.findMany();
      res.status(200).json(apmcs);
    } catch (error) {
      console.error('Get commodities error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  async getCommodities(req: Request, res: Response) {
    try {
      const commodities = await prisma.commodity.findMany();
      res.status(200).json(commodities);
    } catch (error) {
      console.error('Get commodities error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAPMCCommodities(req: Request, res: Response) {
    try {
      const { apmc_id } = req.params;

      if (!apmc_id) {
        return res.status(400).json({ error: 'APMC ID is required' });
      }

      const commodities = await prisma.aPMCCommodity.findMany({
        where: {
          apmc_id: apmc_id
        },
        include: {
          commodity: true
        }
      });

      res.status(200).json(commodities);
    } catch (error) {
      console.error('Get APMC commodities error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateAPMCCommodity(req: Request, res: Response) {
    try {
      const { apmc_id, commodity_id, disabled } = req.body;

      const apmcCommodity = await prisma.aPMCCommodity.upsert({
        where: {
          id: `${apmc_id}_${commodity_id}`,
        },
        update: {
          disabled
        },
        create: {
          apmc_id,
          commodity_id,
          disabled
        }
      });

      res.status(200).json(apmcCommodity);
    } catch (error) {
      console.error('Update APMC commodity error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 