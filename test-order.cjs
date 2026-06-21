const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
  const pool = new Pool({ connectionString: 'postgresql://nura:nura@localhost:5432/nura_dev' });
  const res = await pool.query("SELECT id, telegram_id FROM customers WHERE full_name ILIKE '%Isokjon%' LIMIT 1");
  const customerId = res.rows[0].id;
  const telegramId = res.rows[0].telegram_id;
  
  const token = jwt.sign({ sub: telegramId, role: 'customer' }, 'change-me-access-32-chars-min-xxxxx', { expiresIn: '7d' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const productId = 'c9a876d4-db63-480b-beef-5c8ff303108b';
  
  const cartRes = await fetch('http://localhost:4000/api/storefront/cart', {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId, quantity: 1, regionCode: 'UZB' })
  });
  console.log("Cart result:", await cartRes.text());
  
  const orderRes = await fetch('http://localhost:4000/api/storefront/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      regionCode: 'UZB',
      deliveryAddress: {
        fullName: 'Isokjon',
        phone: '+998901234567',
        line1: 'Test',
        city: 'Tashkent',
        regionCode: 'UZB'
      }
    })
  });
  
  const data = await orderRes.text();
  console.log("Order result:", data);
  
  process.exit(0);
}

main().catch(console.error);
