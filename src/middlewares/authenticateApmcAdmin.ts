import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
interface AuthenticatedRequest extends Request {
  userId?: string;
  phone_number?: string;
  role?: string;
}
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const authenticateApmcAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       res.status(401).json({ error: 'No token provided' });
       return
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { phone_number: string, uid: string, role: string };
    
    

    req.userId = decoded.uid;
    req.phone_number = decoded.phone_number;
    req.role = decoded.role;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
     res.status(401).json({ error: 'Invalid token' });
     return
  }
}; 