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

function processFiles() {
  replaceAll('app/products/ProductEditPage.tsx', /fetch\([\s\S]*?`\$\{import\.meta\.env\.VITE_API_BASE_URL\}\/api\/categories`[\s\S]*?\)\.then\(\s*\(res\)\s*=>\s*res\.json\(\)\s*\)/g, "api.get<any>('/categories')");
  replaceAll('app/products/ProductCreatePage.tsx', /fetch\([\s\S]*?`\$\{import\.meta\.env\.VITE_API_BASE_URL\}\/api\/categories`[\s\S]*?\)\.then\(\s*\(res\)\s*=>\s*res\.json\(\)\s*\)/g, "api.get<any>('/categories')");
  replaceAll('app/products/ProductsListPage.tsx', /fetch\([\s\S]*?`\$\{import\.meta\.env\.VITE_API_BASE_URL\}\/api\/categories`[\s\S]*?\)\.then\(\s*\(res\)\s*=>\s*res\.json\(\)\s*\)/g, "api.get<any>('/categories')");

  replaceAll('app/coupons/CouponFormPage.tsx', /fetch\(`\/products\/brands`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\)\.then\(\(r\) => r\.json\(\)\)/g, "api.get<any>('/products/brands')");
  replaceAll('app/coupons/CouponFormPage.tsx', /fetch\(`\/products\?limit=200`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\)\.then\(\(r\) => r\.json\(\)\)/g, "api.get<any>('/products?limit=200')");
  replaceAll('app/coupons/CouponFormPage.tsx', /fetch\(`\/categories`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\)\.then\(\(r\) => r\.json\(\)\)/g, "api.get<any>('/categories')");
  replaceAll('app/coupons/CouponFormPage.tsx', /fetch\(`\/orders\/customers\/search\?q=\$\{customerSearch\}`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\)\.then\(\(r\) => r\.json\(\)\)/g, "api.get<any>(`/orders/customers/search?q=\${customerSearch}`)");
}

processFiles();
