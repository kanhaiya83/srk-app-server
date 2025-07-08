import { Request, Response } from 'express';
import {  PrismaClient, User, BusinessType } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import multer from 'multer';
import { uploadImageBufferToCloudinary } from '../config/cloudinaryUploader';

// Add multer types

// Extend Express Request type to include files
// declare global {
//   // eslint-disable-next-line @typescript-eslint/no-namespace
//   namespace Express {
//     interface Request {
//       files: FileArray;
//     }
//     interface Multer {
//       File: File;
//     }
//   }
// }

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use environment variable for security

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Export multer middleware for route configuration
export const uploadMiddleware = upload.fields([
  { name: 'mandi_license_certificate', maxCount: 1 },
  { name: 'gst_certificate', maxCount: 1 }
]);

// import { faker } from '@faker-js/faker';
async function createusers() {
  // const userPromises = [];

  // for (let i = 51; i <= 60; i++) {
  //   const userData = {
  //     first_name: faker.name.firstName(),
  //     last_name: faker.name.lastName(),
  //     mobile_number: faker.phone.number(),
  //   };
  //   userPromises.push(prisma.user.create({ data: userData }));
  // }

  // try {
  //   await Promise.all(userPromises);
  //   console.log('Users created successfully!');
  // } catch (error) {
  //   console.error('Error creating users:', error);
  // } finally {
  //   await prisma.$disconnect();
  // }
}

// Call the function to create users
export class UserController {
  async login(req: Request, res: Response) {
    try {
      const { firebaseToken } = req.body;

      if (!firebaseToken) {
        res.status(400).json({ error: 'Firebase token is required' });
        return
      }

      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        res.status(400).json({ error: 'Phone number not found in Firebase token' });
        return
      }

      // There is no firebase_uid field in User, so we can't look up by it.
      // You may want to look up by mobile_number or email if you add it to the model.
      // For now, just return empty.
      res.status(200).json({});
      return
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        user,
        organization,
        business
      } = req.body;

      // Type the request files
      const files = req.files as {
        mandi_license_certificate?: Express.Multer.File[];
        gst_certificate?: Express.Multer.File[];
      };

      // Create transaction to ensure all operations succeed or fail together
      const result = await prisma.$transaction(async (prisma) => {
        // 1. Create the user
        const newUser = await prisma.user.create({
          data: {
            first_name: user.first_name,
            last_name: user.last_name,
            mobile_number: user.mobile_number,
            notional_amount: 100000,
          }
        });

        // 2. Create or find the organization
        const newOrganization = await prisma.organization.create({
          data: {
            name: organization.name,
            users: {
              create: {
                userId: newUser.id
              }
            }
          }
        });

        // Upload certificates to cloudinary if provided
        let mandiLicenseCertificateUrl = '';
        let gstCertificateUrl = '';

        if (files?.mandi_license_certificate?.[0]) {
          const mandiResult = await uploadImageBufferToCloudinary(
            files.mandi_license_certificate[0].buffer,
            `mandi_license_${newUser.id}`,
            'mandi_licenses'
          );
          mandiLicenseCertificateUrl = mandiResult.secure_url;
        }

        if (files?.gst_certificate?.[0]) {
          const gstResult = await uploadImageBufferToCloudinary(
            files.gst_certificate[0].buffer,
            `gst_certificate_${newUser.id}`,
            'gst_certificates'
          );
          gstCertificateUrl = gstResult.secure_url;
        }

        // 3. Create the business
        if (business) {
          await prisma.business.create({
            data: {
              mandi_license_number: business.mandi_license_number,
              gst_number: business.gst_number,
              mandi_license_certificate: mandiLicenseCertificateUrl,
              gst_certificate: gstCertificateUrl,
              business_type: business.business_type as BusinessType,
              organization: {
                connect: { id: newOrganization.id }
              }
            }
          });
        }

        return { user: newUser, organizationId: newOrganization.id };
      });

      // Generate JWT token
      const token = jwt.sign({ userId: result.user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Return the complete user data
      const completeUser = await prisma.user.findUnique({
        where: { id: result.user.id },
        include: {
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

      res.status(201).json({ 
        data: completeUser, 
        token 
      });
      return;
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  }

  async deleteAll(req: Request, res: Response) {

    async function deleteAllAuctions() {
      try {
        // Start a transaction
        await prisma.$transaction(async (prisma) => {
          // Step 1: Delete all bids first because they are related to auctions
          await prisma.bid.deleteMany({});

          // Step 2: Update userUser records to remove auction associations
          // Since we are deleting auctions, we need to clear the relations
          // No auction relations to clear in User model as per current schema, so skip this step.
        });

        console.log('All auctions and related foreign keys have been removed successfully.');
      } catch (error) {
        console.error('Error deleting auctions:', error);
      } finally {
        await prisma.$disconnect();
      }
    }
    deleteAllAuctions()
    res.send({ success: true })
  }

  async findOne(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: {
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

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
      return;
    } catch (error) {
      console.error('Error finding user:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany();
      res.status(200).json(users);
      return
    } catch (error) {
      console.error('Error finding all users:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }
  async createFakes(req: Request, res: Response) {
    try {
      await createusers()
      res.status(200).json({success:true});
      return
    } catch (error) {
      console.error('Error finding all users:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }

  async me(req: Request, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({ 
        where: { id: userId.toString() },
        include: {
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

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
      return;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(401).json({ error: 'Internal server error' });
      return;
    }
  }

  async update(req: Request, res: Response) {
    try {
      const userId = req.body.id;
      const userData: Partial<User> = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return
      }

      // Only allow updating fields that exist in User model
      const { first_name, last_name, mobile_number } = userData;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { first_name, last_name, mobile_number },
      });
      res.status(200).json(updatedUser);
      return
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Internal server error' });
      return
    }
  }

  async findByPhone(req: Request, res: Response) {
    try {
      const { phone } = req.query;

      if (!phone || typeof phone !== 'string') {
        res.status(400).json({ error: 'Phone number is required' });
        return;
      }

      // Find user with their roles
      const user = await prisma.user.findMany({
        where: { mobile_number: phone },
        include: {
          roles: {
            include: {
              apmc: true
            }
          }
        }
      });

      // Find APMC admin
      const apmcAdmin = await prisma.aPMCAdmin.findMany({
        where: { mobile_number: phone },
        include: {
          apmcs: true
        }
      });

      res.status(200).json({
        users: user || [],
        apmcAdmins: apmcAdmin || []
      });
      return;
    } catch (error) {
      console.error('Error finding by phone:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  }
}