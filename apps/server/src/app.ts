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
import ordersRouter from './modules/orders/orders.routes';
import customersRouter from './modules/customers/customers.routes';
import exchangeRatesRouter from './modules/exchange-rates/exchange-rates.routes';
import settingsRouter from './modules/settings/settings.routes';
import storefrontRouter from './modules/storefront/storefront.routes';
import cartRouter from './modules/carts/carts.routes';
import adminUsersRouter from './modules/users/users.routes';
import adminCouponsRouter from './modules/coupons/coupons.routes';
import adminTelegramChannelsRouter from './modules/telegram-channels/telegram-channels.routes';
import adminTelegramPostsRouter from './modules/telegram-posts/telegram-posts.routes';
import { router as adminExpensesRouter } from './modules/expenses/expenses.routes';
import { router as adminAccountingRouter } from './modules/expenses/accounting.routes';
import { router as adminSalesRouter } from './modules/sales/sales.routes';
import { router as dashboardRouter } from './modules/dashboard/dashboard.routes';
import { triggerManualRollup } from './modules/sales/sales.controller';
import { requireAuth } from './common/middleware/auth.middleware';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(pinoHttp({ logger }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/exchange-rates', exchangeRatesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/storefront', storefrontRouter);
app.use('/api/storefront/cart', cartRouter);

// Admin Specific
app.use('/api/admin/team', adminUsersRouter);
app.use('/api/admin/coupons', adminCouponsRouter);
app.use('/api/admin/telegram/channels', adminTelegramChannelsRouter);
app.use('/api/admin/telegram/posts', adminTelegramPostsRouter);
app.use('/api/admin/expenses', adminExpensesRouter);
app.use('/api/admin/accounting', adminAccountingRouter);
app.use('/api/admin/sales', adminSalesRouter);
app.use('/api/admin/dashboard', dashboardRouter);
app.post('/api/admin/jobs/sales-rollup', requireAuth, triggerManualRollup);

app.use(errorMiddleware);
