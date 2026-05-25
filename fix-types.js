const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'apps/admin/src');

function fixFiles() {
  // Fix accounting.api.ts
  let p = path.join(adminDir, 'app/accounting/api/accounting.api.ts');
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/fetchWithAuth\([^,]+,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, (match) => {
    let url = match.match(/fetchWithAuth\(([^,]+)/)[1];
    return `api.delete<any>(${url})`;
  });
  c = c.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'POST'\s*\}\)/g, 'api.post<any>($1, {})');
  fs.writeFileSync(p, c);

  // Fix categories.api.ts
  p = path.join(adminDir, 'app/categories/api/categories.api.ts');
  c = fs.readFileSync(p, 'utf8');
  c = c.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'POST'\s*\}\)/g, 'api.post<any>($1, {})');
  fs.writeFileSync(p, c);

  // Fix coupons.api.ts
  p = path.join(adminDir, 'app/coupons/api/coupons.api.ts');
  c = fs.readFileSync(p, 'utf8');
  c = c.replace(/fetchWithAuth\([^,]+,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, (match) => {
    let url = match.match(/fetchWithAuth\(([^,]+)/)[1];
    return `api.delete<any>(${url})`;
  });
  fs.writeFileSync(p, c);

  // Fix customers.api.ts
  p = path.join(adminDir, 'app/customers/api/customers.api.ts');
  c = fs.readFileSync(p, 'utf8');
  c = c.replace(/fetchWithAuth\([^,]+,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, (match) => {
    let url = match.match(/fetchWithAuth\(([^,]+)/)[1];
    return `api.delete<any>(${url})`;
  });
  fs.writeFileSync(p, c);

  // Fix orders.api.ts
  p = path.join(adminDir, 'app/orders/api/orders.api.ts');
  c = fs.readFileSync(p, 'utf8');
  c = c.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'POST'\s*\}\)/g, 'api.post<any>($1, {})');
  fs.writeFileSync(p, c);

  // Fix products.api.ts
  p = path.join(adminDir, 'app/products/api/products.api.ts');
  c = fs.readFileSync(p, 'utf8');
  c = c.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'PATCH'\s*\}\)/g, 'api.patch<any>($1, {})');
  c = c.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'POST'\s*\}\)/g, 'api.post<any>($1, {})');
  fs.writeFileSync(p, c);

  // Fix team.api.ts
  p = path.join(adminDir, 'app/settings/team/api/team.api.ts');
  c = fs.readFileSync(p, 'utf8');
  c = c.replace(/fetchWithAuth\([^,]+,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, (match) => {
    let url = match.match(/fetchWithAuth\(([^,]+)/)[1];
    return `api.delete<any>(${url})`;
  });
  fs.writeFileSync(p, c);

  // Fix telegram.api.ts
  p = path.join(adminDir, 'app/telegram/api/telegram.api.ts');
  c = fs.readFileSync(p, 'utf8');
  c = c.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'PATCH'\s*\}\)/g, 'api.patch<any>($1, {})');
  c = c.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'POST'\s*\}\)/g, 'api.post<any>($1, {})');
  fs.writeFileSync(p, c);

  // Add back useAuthStore
  function addUseAuthStore(filePath, relativePath) {
    p = path.join(adminDir, filePath);
    c = fs.readFileSync(p, 'utf8');
    if (!c.includes('useAuthStore')) {
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
  
  // Fix CouponFormPage.tsx specific fetch calls and typing
  p = path.join(adminDir, 'app/coupons/CouponFormPage.tsx');
  c = fs.readFileSync(p, 'utf8');
  // Type 's'
  c = c.replace(/useAuthStore\(s =>/g, 'useAuthStore((s: any) =>');
  c = c.replace(/useAuthStore\(\(s\) =>/g, 'useAuthStore((s: any) =>');
  
  // Replace API_BASE usages that didn't get caught
  c = c.replace(/\$\{API_BASE\}\/api/g, ''); // just remove ${API_BASE}/api since api.get prepends /api
  c = c.replace(/fetch\(`([^`]+)`(?:, \{[^}]+\})?\)\.then\(r => r\.json\(\)\)/g, 'api.get<any>(`$1`)');
  c = c.replace(/fetch\('([^']+)'(?:, \{[^}]+\})?\)\.then\(r => r\.json\(\)\)/g, 'api.get<any>(\'$1\')');
  
  c = c.replace(/res\.map\(p =>/g, 'res.map((p: any) =>');
  c = c.replace(/res\.map\(c =>/g, 'res.map((c: any) =>');
  fs.writeFileSync(p, c);

  // Fix other files where `s` is untyped
  const fixAnyS = (file) => {
    p = path.join(adminDir, file);
    c = fs.readFileSync(p, 'utf8');
    c = c.replace(/useAuthStore\(s =>/g, 'useAuthStore((s: any) =>');
    c = c.replace(/useAuthStore\(\(s\) =>/g, 'useAuthStore((s: any) =>');
    fs.writeFileSync(p, c);
  };
  fixAnyS('app/orders/OrderDetailPage.tsx');
  fixAnyS('app/settings/team/TeamListPage.tsx');
  fixAnyS('routes/_app.tsx');
  fixAnyS('routes/change-password.tsx');

}

fixFiles();
