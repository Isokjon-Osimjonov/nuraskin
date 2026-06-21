import { db } from './libs/database/src/index.ts';
import { customers } from './libs/database/src/schema/customers.ts';
import { eq, ilike } from 'drizzle-orm';
import { generateCustomerToken } from './apps/server/src/utils/jwt.ts';

async function main() {
  const customer = await db.query.customers.findFirst({
    where: ilike(customers.fullName, '%Isokjon%')
  });
  if (!customer) throw new Error('Customer not found');
  
  const token = generateCustomerToken(customer.id);
  
  const res = await fetch('http://localhost:4000/api/storefront/promotions/active?region=KOR', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

main().catch(console.error);
