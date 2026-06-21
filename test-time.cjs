const { Pool } = require('pg');
async function main() {
  const pool = new Pool({ connectionString: 'postgresql://nura:nura@localhost:5432/nura_dev' });
  const res = await pool.query("SELECT expires_at FROM stock_reservations ORDER BY created_at DESC LIMIT 1;");
  console.log(res.rows[0].expires_at);
  console.log(res.rows[0].expires_at.toISOString());
  process.exit(0);
}
main();
