const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

async function main() {
  const pool = new Pool({ connectionString: 'postgresql://nura:nura@localhost:5432/nura_dev' });
  const res = await pool.query("SELECT id, telegram_id FROM customers WHERE full_name ILIKE '%Isokjon%' LIMIT 1");
  const customerId = res.rows[0].id;
  const telegramId = res.rows[0].telegram_id;
  
  const token = jwt.sign({ sub: telegramId, role: 'customer' }, 'change-me-access-32-chars-min-xxxxx', { expiresIn: '7d' });
  
  const fetch = (await import('node-fetch')).default;
  const apiRes = await fetch('http://localhost:4000/api/storefront/promotions/active?region=KOR', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const data = await apiRes.json();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

main().catch(console.error);
