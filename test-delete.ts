import { deleteShippingBox } from './apps/server/src/modules/storefront/storefront.service.ts';
import { db, shippingBoxes } from './libs/database/src/index.ts';

async function run() {
  try {
    await deleteShippingBox('1968c266-63aa-4740-9bf7-4714ae252089');
    console.log('S Box deleted! (FAIL)');
  } catch (e: any) {
    console.log('Graceful failure for S box:', e.message);
  }

  try {
    const [b] = await db.insert(shippingBoxes).values({
      name: 'Test Box', label: 'Test Label', maxWeightGrams: 1000, tareWeightGrams: 100
    }).returning();
    console.log('Created dummy box:', b.id);
    await deleteShippingBox(b.id);
    console.log('Dummy box deleted successfully! (PASS)');
  } catch (e: any) {
    console.log('Failed to delete dummy box:', e.message);
  }
  process.exit(0);
}
run();
