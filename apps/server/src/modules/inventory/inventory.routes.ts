import { Router } from 'express';
import * as controller from './inventory.controller';
import { requireAuth } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/utils/async-handler';

const router = Router();

router.use(requireAuth);

router.get('/scan/:barcode', asyncHandler(controller.scanProduct));
router.post('/batches', asyncHandler(controller.addBatch));
router.patch('/batches/:batchId', asyncHandler(controller.updateBatch));
router.post('/batches/:batchId/adjust-quantity', asyncHandler(controller.adjustQuantity));
router.delete('/batches/:batchId', asyncHandler(controller.deleteBatch));
router.get('/overview', asyncHandler(controller.getInventoryOverview));
router.get('/batches/:productId', asyncHandler(controller.getProductBatches));

export default router;
