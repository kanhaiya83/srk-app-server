import express from 'express';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express'
import swaggerJsDoc from 'swagger-jsdoc'
import vendorRouter from './routes/vendorRoutes';
import cors from "cors"
const app = express();
app.use(cors())
app.use(express.json())
const prisma = new PrismaClient();
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SRK Auction App Docs',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Replace with your server URL
      },
    ],
  },
  apis: ['./src/routes/*.js','./src/routes/*.ts','./src/controllers/*.js','./src/controllers/*.ts'], // Path to the API docs
};
const swaggerSpec = swaggerJsDoc(options);
const setupSwagger = () => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger docs available at /api-docs');
};
setupSwagger()
app.use(express.json());
app.use("/vendors",vendorRouter)
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});