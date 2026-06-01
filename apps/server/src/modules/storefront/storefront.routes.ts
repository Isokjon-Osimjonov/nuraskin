import { Router } from 'express';
import * as ctrl from './storefront.controller';
import * as addressCtrl from './addresses.controller';
import * as promoCtrl from './promotions/storefront-promotions.controller';
import * as contactCtrl from './contact/storefront-contact.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';
import * as service from './storefront.service';
import { db, customers } from '@nuraskin/database';
import { eq } from 'drizzle-orm';
import { env } from '../../common/config/env';

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
router.get('/categories', asyncHandler(ctrl.listCategories));
router.get('/products/:slug', asyncHandler(ctrl.getProduct));
router.get('/settings', asyncHandler(ctrl.getSettings));
router.get('/payment-info', asyncHandler(ctrl.getPaymentInfo));
router.get('/rates/latest', asyncHandler(ctrl.getLatestRates));
router.get('/shipping-tiers', asyncHandler(ctrl.listShippingTiers));
router.get(
  '/juso-search',
  asyncHandler(async (req, res) => {
    const keyword = req.query.q as string;
    const apiKey = env.JUSO_API_KEY;

    if (!apiKey || !keyword || keyword.length < 2) {
      res.json({ results: [], fallback: true });
      return;
    }

    try {
      const params = new URLSearchParams({
        confmKey: apiKey ?? '',
        currentPage: '1',
        countPerPage: '10',
        keyword: String(keyword || ''),
        resultType: 'json',
      });

      const response = await fetch(
        `https://business.juso.go.kr/addrlink/addrLinkApi.do?${params}`,
        {
          headers: {
            Referer: 'https://nuraskin.uz',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          },
        }
      );

      const data: any = await response.json();

      if (data.results?.common?.errorCode !== '0') {
        res.json({ results: [], fallback: true });
        return;
      }

      const juso = data.results.juso || [];

      res.json({
        results: juso.map((j: any) => ({
          roadAddr: j.roadAddr,
          jibunAddr: j.jibunAddr,
          zipNo: j.zipNo,
          bdNm: j.bdNm,
          siNm: j.siNm,
          sggNm: j.sggNm,
          emdNm: j.emdNm,
        })),
        fallback: false,
      });
    } catch (error) {
      console.error('Juso search error:', error);
      res.json({ results: [], fallback: true });
    }
  })
);
router.get('/promotions/active', asyncHandler(promoCtrl.getActivePromotions));
router.post('/contact', asyncHandler(contactCtrl.send));

// Customer protected routes (Telegram Login)
router.use(requireAuth);
router.use(resolveCustomer);

router.patch(
  '/profile/region',
  asyncHandler(async (req, res) => {
    const { region } = req.body;
    if (!['UZB', 'KOR'].includes(region)) {
      res.status(400).json({ error: "Noto'g'ri mintaqa" });
      return;
    }
    await db
      .update(customers)
      .set({ regionCode: region })
      .where(eq(customers.id, (req as any).customer.id));
    res.json({ success: true });
  })
);

router.get('/coupons', asyncHandler(ctrl.listCoupons));
router.post('/coupons/validate', asyncHandler(ctrl.validateCoupon));
router.post('/orders', asyncHandler(ctrl.createOrder));
router.delete('/orders/:id', asyncHandler(ctrl.cancelOrder));
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

// Waitlist
router.get('/waitlist', asyncHandler(ctrl.getMyWaitlist));
router.post('/waitlist', asyncHandler(ctrl.addToWaitlist));
router.delete('/waitlist/:productId', asyncHandler(ctrl.removeFromWaitlist));

export default router;
