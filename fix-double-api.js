const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'apps/admin/src');

function replaceAll(filePath, search, replacement) {
  let p = path.join(adminDir, filePath);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(search, replacement);
  fs.writeFileSync(p, c);
}

function fixFiles() {
  // Fix accounting.api.ts
  replaceAll('app/accounting/api/accounting.api.ts', /\/api\/admin\/accounting\/summary/g, '/admin/accounting/summary');
  replaceAll('app/accounting/api/accounting.api.ts', /\/api\/admin\/accounting\/coupon-summary/g, '/admin/accounting/coupon-summary');
  replaceAll('app/accounting/api/accounting.api.ts', /\/api\/admin\/expenses/g, '/admin/expenses');
  replaceAll('app/accounting/api/accounting.api.ts', /\/api\/admin\/orders/g, '/admin/orders');
  replaceAll('app/accounting/api/accounting.api.ts', /\/api\/categories\/upload-url/g, '/categories/upload-url');
  
  // Fix sales.tsx
  replaceAll('routes/_app/sales.tsx', /\/api\/admin\/sales\/live/g, '/admin/sales/live');
  replaceAll('routes/_app/sales.tsx', /\/api\/admin\/sales\/summary/g, '/admin/sales/summary');
  replaceAll('routes/_app/sales.tsx', /\/api\/admin\/sales\?from=/g, '/admin/sales?from=');
}

fixFiles();
