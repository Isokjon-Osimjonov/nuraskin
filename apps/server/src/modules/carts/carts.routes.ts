import { Router } from 'express';
import * as ctrl from './carts.controller';
import { asyncHandler } from '../../common/utils/async-handler';
import { requireAuth } from '../../common/middleware/auth.middleware';
import * as storefrontService from '../storefront/storefront.service';

const router = Router();

// Middleware to resolve customer from authenticated user
const resolveCustomer = asyncHandler(async (req, res, next) => {
  if (!req.user) return next();
  
  const sub = req.user.sub;
  const telegramId = BigInt(sub);
  
  let customer = await storefrontService.findCustomerByTelegramId(telegramId);
  
  if (!customer) {
    const firstName = req.user.firstName || '';
    const lastName = req.user.lastName || '';
    const username = req.user.username || '';
    
    customer = await storefrontService.createCustomerFromTelegram({
      telegramId,
      fullName: `${firstName} ${lastName}`.trim() || username || 'Mijoz',
      regionCode: 'UZB',
    });
  }
  
  (req as any).customer = customer;
  next();
});

router.use(requireAuth);
router.use(resolveCustomer);

router.get('/', asyncHandler(ctrl.getCart));
router.post('/items', asyncHandler(ctrl.addToCart));
router.patch('/items/:itemId', asyncHandler(ctrl.updateItemQuantity));
router.delete('/items/:itemId', asyncHandler(ctrl.removeItem));
router.delete('/', asyncHandler(ctrl.clearCart));

export default router;
