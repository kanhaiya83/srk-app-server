import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  console.log({authHeader})
  if (!authHeader || typeof authHeader != "string" || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { vendorId: number };
    // @ts-expect-error vendor
    req.userId = decoded.userId; 
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return
  }
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}