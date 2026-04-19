import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './common/utils/logger';
import { errorMiddleware } from './common/middleware/error.middleware';
import { router as healthRouter } from './modules/health/health.routes';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api/health', healthRouter);

app.use(errorMiddleware);
