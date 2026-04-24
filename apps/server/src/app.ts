import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './common/utils/logger';
import { errorMiddleware } from './common/middleware/error.middleware';
import { router as healthRouter } from './modules/health/health.routes';
import { router as authRouter } from './modules/auth/auth.routes';
import { router as categoriesRouter } from './modules/categories/categories.routes';
import { router as productsRouter } from './modules/products/products.routes';
import inventoryRouter from './modules/inventory/inventory.routes';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);

app.use(errorMiddleware);
