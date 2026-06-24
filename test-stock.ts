import { inventoryRepository } from './apps/server/src/modules/inventory/inventory.repository';
async function run() {
  const stock = await inventoryRepository.getAvailableStock('some-id');
  console.log('Stock:', stock);
}
run();
