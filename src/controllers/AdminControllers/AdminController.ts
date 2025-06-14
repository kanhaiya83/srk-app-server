import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AdminController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      const admin = await prisma.admin.findFirst({
        where: { username }
      });

      if (!admin) {
        console.log("admin not found")
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        console.log("admin password not valid")
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ uid: admin.id }, JWT_SECRET);
      return res.json({ token });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: req.userId }
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const {  ...adminData } = admin;
      return res.json(adminData);

    } catch (error) {
      console.error('Me endpoint error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 