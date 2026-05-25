const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'apps/admin/src');

function fixFiles() {
  function replaceAll(filePath, search, replacement) {
    let p = path.join(adminDir, filePath);
    if (!fs.existsSync(p)) return;
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(search, replacement);
    fs.writeFileSync(p, c);
  }

  // accounting.api.ts
  replaceAll('app/accounting/api/accounting.api.ts', /fetchWithAuth\([^,]+,\s*\{\s*method:\s*'PATCH'\s*\}\)/g, (m) => {
    let url = m.match(/fetchWithAuth\(([^,]+)/)[1];
    return `api.patch<any>(${url}, {})`;
  });
  replaceAll('app/accounting/api/accounting.api.ts', /const response = await fetch\(`\$\{API_BASE\}\/api\/admin\/accounting\/export\?month=\$\{month\}`,\s*\{\s*headers\s*\}\);/g, `const response = await api.get<any>(\`/admin/accounting/export?month=\${month}\`);`);
  replaceAll('app/accounting/api/accounting.api.ts', /const token = useAuthStore\.getState\(\)\.token;/g, '');

  // coupons.api.ts
  replaceAll('app/coupons/api/coupons.api.ts', /fetchWithAuth\([^,]+,\s*\{\s*method:\s*'PATCH'\s*\}\)/g, (m) => {
    let url = m.match(/fetchWithAuth\(([^,]+)/)[1];
    return `api.patch<any>(${url}, {})`;
  });

  // customers.api.ts
  replaceAll('app/customers/api/customers.api.ts', /fetchWithAuth\([^,]+,\s*\{\s*method:\s*'PATCH'\s*\}\)/g, (m) => {
    let url = m.match(/fetchWithAuth\(([^,]+)/)[1];
    return `api.patch<any>(${url}, {})`;
  });

  // team.api.ts
  replaceAll('app/settings/team/api/team.api.ts', /fetchWithAuth\([^,]+,\s*\{\s*method:\s*'PATCH'\s*\}\)/g, (m) => {
    let url = m.match(/fetchWithAuth\(([^,]+)/)[1];
    return `api.patch<any>(${url}, {})`;
  });

  // CouponFormPage.tsx
  replaceAll('app/coupons/CouponFormPage.tsx', /, API_BASE/g, '');

  // Add back useAuthStore properly
  function addUseAuthStore(filePath, relativePath) {
    let p = path.join(adminDir, filePath);
    if (!fs.existsSync(p)) return;
    let c = fs.readFileSync(p, 'utf8');
    if (!c.includes('import { useAuthStore }')) {
      c = `import { useAuthStore } from '${relativePath}';\n` + c;
      fs.writeFileSync(p, c);
    }
  }

  addUseAuthStore('app/coupons/CouponFormPage.tsx', '../../../stores/auth.store');
  addUseAuthStore('app/orders/OrderDetailPage.tsx', '../../../stores/auth.store');
  addUseAuthStore('app/settings/team/TeamListPage.tsx', '../../../../stores/auth.store');
  addUseAuthStore('routes/_app.tsx', '../stores/auth.store');
  addUseAuthStore('routes/_app/settings/profile.tsx', '../../../../stores/auth.store');
  addUseAuthStore('routes/change-password.tsx', '../stores/auth.store');
  addUseAuthStore('routes/login.tsx', '../stores/auth.store');
}

fixFiles();
