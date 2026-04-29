import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { db, customers, exchangeRateSnapshots, settings, products, productRegionalConfigs } from '@nuraskin/database';
import { sql } from 'drizzle-orm';

async function prepare() {
  try {
    // 1. Check/Create Customer
    let [customer] = await db.select().from(customers).limit(1);
    if (!customer) {
      console.log('Creating test customer...');
      [customer] = await db.insert(customers).values({
        fullName: 'Test Mijoz',
        phone: '+998901234567',
        regionCode: 'UZB',
      }).returning();
    }
    console.log('Customer ID:', customer.id);

    // 2. Check/Create Rate Snapshot
    let [rate] = await db.select().from(exchangeRateSnapshots).limit(1);
    if (!rate) {
      console.log('Creating rate snapshot...');
      [rate] = await db.insert(exchangeRateSnapshots).values({
        usdToUzs: 12600n,
        usdToKrw: 1340n,
        cargoRateUsdPerKg: 1000,
      }).returning();
    }
    console.log('Rate Snapshot ID:', rate.id);

    // 3. Check/Create Settings
    let [setting] = await db.select().from(settings).limit(1);
    if (!setting) {
      console.log('Creating settings...');
      [setting] = await db.insert(settings).values({
        debtLimitDefault: 50000000n,
        lowStockThreshold: 10,
      }).returning();
    }
    console.log('Settings ID:', setting.id);

    // 4. Check Product
    const [product] = await db
      .select({ 
        id: products.id, 
        name: products.name,
        region: productRegionalConfigs.regionCode,
        price: productRegionalConfigs.retailPrice
      })
      .from(products)
      .innerJoin(productRegionalConfigs, sql`${products.id} = ${productRegionalConfigs.productId}`)
      .where(sql`${productRegionalConfigs.regionCode} = 'UZB'`)
      .limit(1);

    if (!product) {
      console.error('No products with UZB config found. Please create a product first.');
      process.exit(1);
    }
    console.log('Test Product:', product);

  } catch (error) {
    console.error('Preparation error:', error);
  }
}

prepare().then(() => process.exit(0)).catch(console.error);
