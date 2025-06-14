import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  logger.info(`Incoming ${req.method} request to ${req.url}`);

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error processing request', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  next(err);
}; 