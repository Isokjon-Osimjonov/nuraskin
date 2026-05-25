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

function ensureApiImport(filePath) {
  let p = path.join(adminDir, filePath);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes("import { api } from '@/lib/api'")) {
    c = `import { api } from '@/lib/api';\n` + c;
    fs.writeFileSync(p, c);
  }
}

function processFiles() {
  // ProductEditPage.tsx
  ensureApiImport('app/products/ProductEditPage.tsx');
  replaceAll('app/products/ProductEditPage.tsx', /fetch\(`\$\{import\.meta\.env\.VITE_API_BASE_URL\}\/api\/categories`\)\.then\(\n\s*\(res\) => res\.json\(\)\n\s*\)/g, "api.get<any>('/categories')");

  // ProductCreatePage.tsx
  ensureApiImport('app/products/ProductCreatePage.tsx');
  replaceAll('app/products/ProductCreatePage.tsx', /fetch\(`\$\{import\.meta\.env\.VITE_API_BASE_URL\}\/api\/categories`\)\.then\(\n\s*\(res\) => res\.json\(\)\n\s*\)/g, "api.get<any>('/categories')");

  // ProductsListPage.tsx
  ensureApiImport('app/products/ProductsListPage.tsx');
  replaceAll('app/products/ProductsListPage.tsx', /fetch\(`\$\{import\.meta\.env\.VITE_API_BASE_URL\}\/api\/categories`\)\.then\(\n\s*\(res\) => res\.json\(\)\n\s*\)/g, "api.get<any>('/categories')");

  // CouponFormPage.tsx
  ensureApiImport('app/coupons/CouponFormPage.tsx');
  replaceAll('app/coupons/CouponFormPage.tsx', /fetch\(`\/products\/brands`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\)\.then\(\(r\) => r\.json\(\)\)/g, "api.get<any>('/products/brands')");
  replaceAll('app/coupons/CouponFormPage.tsx', /fetch\(`\/products\?limit=200`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\)\.then\(\(r\) => r\.json\(\)\)/g, "api.get<any>('/products?limit=200')");
  replaceAll('app/coupons/CouponFormPage.tsx', /fetch\(`\/categories`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\)\.then\(\(r\) => r\.json\(\)\)/g, "api.get<any>('/categories')");
  replaceAll('app/coupons/CouponFormPage.tsx', /fetch\(`\/orders\/customers\/search\?q=\$\{customerSearch\}`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\)\.then\(\(r\) => r\.json\(\)\)/g, "api.get<any>(`/orders/customers/search?q=\${customerSearch}`)");
  
}

processFiles();
