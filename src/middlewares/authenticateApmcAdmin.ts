import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticateApmcAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken.phone_number) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}; 