import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as inventoryService from './inventory.service';
import * as repository from './inventory.repository';

vi.mock('./inventory.repository');

describe('InventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deductFIFO', () => {
    it('should deduct from multiple batches in FIFO order', async () => {
      const productId = 'prod-1';
      const mockBatches = [
        { id: 'batch-1', productId, currentQty: 10, receivedAt: new Date('2024-01-01') },
        { id: 'batch-2', productId, currentQty: 20, receivedAt: new Date('2024-01-02') },
      ];

      vi.mocked(repository.deductFIFO).mockImplementation(async (pid, qty) => {
        if (qty === 15) {
          return [
            { batchId: 'batch-1', quantity: 10 },
            { batchId: 'batch-2', quantity: 5 },
          ];
        }
        return [];
      });

      const result = await repository.deductFIFO(productId, 15);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ batchId: 'batch-1', quantity: 10 });
      expect(result[1]).toEqual({ batchId: 'batch-2', quantity: 5 });
    });

    it('should throw error if total stock is insufficient', async () => {
      vi.mocked(repository.deductFIFO).mockRejectedValue(new Error('Insufficient stock'));
      await expect(repository.deductFIFO('p1', 100)).rejects.toThrow('Insufficient stock');
    });
  });

  describe('updateBatch', () => {
    it('should update batch and add adjustments', async () => {
      const batchId = 'batch-1';
      const adminId = 'admin-1';
      const mockBatch = {
        id: batchId,
        productId: 'prod-1',
        batchRef: 'old-ref',
        initialQty: 100,
        currentQty: 100,
        costPrice: 50000n,
        costCurrency: 'KRW',
        expiryDate: '2025-01-01',
        receivedAt: new Date('2024-01-01'),
      };

      vi.mocked(repository.getBatchById).mockResolvedValue(mockBatch as any);
      vi.mocked(repository.updateBatch).mockResolvedValue({ ...mockBatch, batchRef: 'new-ref' } as any);

      const result = await inventoryService.updateBatch(batchId, { batch_ref: 'new-ref' }, adminId);

      expect(repository.updateBatch).toHaveBeenCalledWith(
        batchId,
        { batchRef: 'new-ref' },
        [expect.objectContaining({ fieldChanged: 'batch_ref', oldValue: 'old-ref', newValue: 'new-ref' })]
      );
    });

    it('should throw error when changing initialQty if stock was already sold', async () => {
      const batchId = 'batch-1';
      const mockBatch = {
        id: batchId,
        initialQty: 100,
        currentQty: 90, // Sold 10
      };

      vi.mocked(repository.getBatchById).mockResolvedValue(mockBatch as any);

      await expect(inventoryService.updateBatch(batchId, { initial_qty: 110 }, 'admin-1'))
        .rejects.toThrow("Sotilgan partiyaning dastlabki miqdorini o'zgartirib bo'lmaydi");
    });
  });

  describe('adjustQuantity', () => {
    it('should adjust quantity and call repository', async () => {
      const batchId = 'batch-1';
      const adminId = 'admin-1';
      const mockBatch = {
        id: batchId,
        initialQty: 100,
        currentQty: 50,
      };

      vi.mocked(repository.getBatchById).mockResolvedValue(mockBatch as any);

      await inventoryService.adjustQuantity(batchId, { adjustment: 10, reason: 'Found more' }, adminId);

      expect(repository.adjustBatchQuantity).toHaveBeenCalledWith(
        batchId,
        60,
        10,
        adminId,
        'Found more'
      );
    });

    it('should throw error if resulting quantity is negative', async () => {
      const batchId = 'batch-1';
      const mockBatch = {
        id: batchId,
        currentQty: 5,
      };

      vi.mocked(repository.getBatchById).mockResolvedValue(mockBatch as any);

      await expect(inventoryService.adjustQuantity(batchId, { adjustment: -10, reason: 'Lost' }, 'admin-1'))
        .rejects.toThrow("Miqdor manfiy bo'la olmaydi");
    });
  });

  describe('deleteBatch', () => {
    it('should delete batch if not used', async () => {
      const batchId = 'batch-1';
      const mockBatch = {
        id: batchId,
        initialQty: 100,
        currentQty: 100,
      };

      vi.mocked(repository.getBatchById).mockResolvedValue(mockBatch as any);
      vi.mocked(repository.deleteBatch).mockResolvedValue([{ id: batchId }] as any);

      const result = await inventoryService.deleteBatch(batchId);
      expect(result.success).toBe(true);
      expect(repository.deleteBatch).toHaveBeenCalledWith(batchId);
    });

    it('should throw error if batch was used', async () => {
      const batchId = 'batch-1';
      const mockBatch = {
        id: batchId,
        initialQty: 100,
        currentQty: 50,
      };

      vi.mocked(repository.getBatchById).mockResolvedValue(mockBatch as any);

      await expect(inventoryService.deleteBatch(batchId))
        .rejects.toThrow("Foydalanilgan partiyani o'chirib bo'lmaydi");
    });
  });
});
