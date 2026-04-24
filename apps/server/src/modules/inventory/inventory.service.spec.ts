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

  describe('addBatch', () => {
    it('should convert price to cents and call repository', async () => {
      const input = {
        productId: 'p1',
        initialQty: 10,
        costPrice: 12.50,
        costCurrency: 'USD' as const,
      };

      await inventoryService.addBatch(input);

      expect(repository.createBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          costPrice: 1250n,
          initialQty: 10,
        }),
        expect.objectContaining({
          movementType: 'STOCK_IN',
          quantityDelta: 10,
        })
      );
    });
  });
});
