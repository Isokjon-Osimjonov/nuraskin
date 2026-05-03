import { Router } from 'express';
import * as ctrl from './storefront.controller';
import * as addressCtrl from './addresses.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';
import * as service from './storefront.service';
import { db, customers } from '@nuraskin/database';
import { eq } from 'drizzle-orm';

const router = Router();

// Middleware to resolve customer from authenticated user
const resolveCustomer = asyncHandler(async (req, res, next) => {
  if (!req.user) return next();
  
  const sub = req.user.sub;
  const telegramId = BigInt(sub);
  
  let customer = await service.findCustomerByTelegramId(telegramId);
  
  if (!customer) {
    // Auto-create from Telegram JWT claims
    const firstName = req.user.firstName || '';
    const lastName = req.user.lastName || '';
    const username = req.user.username || '';
    
    customer = await service.createCustomerFromTelegram({
      telegramId,
      fullName: `${firstName} ${lastName}`.trim() || username || 'Mijoz',
      regionCode: 'UZB', // Default region
    });
  }
  
  (req as any).customer = customer;
  next();
});

// Public routes
router.get('/products', asyncHandler(ctrl.listProducts));
router.get('/products/:slug', asyncHandler(ctrl.getProduct));
router.get('/settings', asyncHandler(ctrl.getSettings));
router.get('/rates/latest', asyncHandler(ctrl.getLatestRates));
router.get('/shipping-tiers', asyncHandler(ctrl.listShippingTiers));

// Customer protected routes (Telegram Login)
router.use(requireAuth);
router.use(resolveCustomer);

router.patch('/profile/region', asyncHandler(async (req, res) => {
  const { region } = req.body;
  if (!['UZB', 'KOR'].includes(region)) {
    res.status(400).json({ error: "Noto'g'ri mintaqa" });
    return;
  }
  await db.update(customers)
    .set({ regionCode: region })
    .where(eq(customers.id, (req as any).customer.id));
  res.json({ success: true });
}));

router.post('/coupons/validate', asyncHandler(ctrl.validateCoupon));
router.post('/orders', asyncHandler(ctrl.createOrder));
router.post('/orders/:id/cancel', asyncHandler(ctrl.cancelOrder));
router.patch('/orders/:id/receipt', asyncHandler(ctrl.uploadReceipt));
router.get('/orders/:id/receipt', asyncHandler(ctrl.getReceipt));
router.get('/orders/my', asyncHandler(ctrl.getMyOrders));
router.get('/orders/:id', asyncHandler(ctrl.getOrder));

// Addresses
router.get('/addresses', asyncHandler(addressCtrl.list));
router.post('/addresses', asyncHandler(addressCtrl.create));
router.patch('/addresses/:id', asyncHandler(addressCtrl.update));
router.delete('/addresses/:id', asyncHandler(addressCtrl.remove));
router.patch('/addresses/:id/set-default', asyncHandler(addressCtrl.setDefault));
router.get('/addresses/juso-search', asyncHandler(ctrl.searchJuso));

// Waitlist
router.get('/waitlist', asyncHandler(ctrl.getMyWaitlist));
router.post('/waitlist', asyncHandler(ctrl.addToWaitlist));
router.delete('/waitlist/:productId', asyncHandler(ctrl.removeFromWaitlist));

export default router;
