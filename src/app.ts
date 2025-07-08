import express from 'express';
import userRouter from './routes/userRoutes';
import auctionRouter from './routes/auctionRoutes';
import adminRouter from './routes/adminRoutes';
import "./config/firebase"
import cors from "cors"
import APMCRoutes from './routes/APMCRoutes';
import logger from './config/logger';
import { requestLogger, errorLogger } from './middleware/loggerMiddleware';

const app = express();

// Middleware
app.use(cors())
app.use(express.json())
app.use(requestLogger);  // Add request logging middleware


// const swaggerSpec = swaggerJsDoc(options);
// const setupSwagger = () => {
//   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//   logger.info('Swagger docs available at /api-docs');
// };
// setupSwagger()

// Routes
app.use("/users",userRouter)
app.use("/auctions",auctionRouter)
app.use("/apmcadmin",APMCRoutes)
app.use("/admin",adminRouter)

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Error handling middleware should be last
app.use(errorLogger);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});