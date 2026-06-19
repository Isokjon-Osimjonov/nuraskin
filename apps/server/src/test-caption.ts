import 'dotenv/config';
import { generateCaption } from './modules/telegram-posts/telegram-posts.service';
import { db, products } from '@nuraskin/database';
import { ilike } from 'drizzle-orm';

async function main() {
  const [product] = await db.select().from(products).where(ilike(products.name, '%RoseGlo%')).limit(1);
  if (!product) {
    console.error('Product not found');
    process.exit(1);
  }
  
  const postTypes = ['PRODUCT_SHOWCASE', 'FLASH_SALE', 'NEW_ARRIVAL', 'RESTOCK'];

  for (const postType of postTypes) {
    console.log(`\nTesting ${postType}...`);
    const res = await generateCaption(product.id, postType, 'UZB');
    console.log(`--- ${postType} ---`);
    console.log(res.caption);
    console.log(`Hashtags: ${res.hashtags?.join(' ')}`);
  }
  
  process.exit(0);
}

main().catch(console.error);
