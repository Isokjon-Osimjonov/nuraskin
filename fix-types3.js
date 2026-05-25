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

  // imports
  replaceAll('app/coupons/CouponFormPage.tsx', /import \{ useAuthStore \} from '\.\.\/\.\.\/\.\.\/stores\/auth\.store';/g, "import { useAuthStore } from '../../stores/auth.store';");
  replaceAll('app/orders/OrderDetailPage.tsx', /import \{ useAuthStore \} from '\.\.\/\.\.\/\.\.\/stores\/auth\.store';/g, "import { useAuthStore } from '../../stores/auth.store';");
  replaceAll('app/settings/team/TeamListPage.tsx', /import \{ useAuthStore \} from '\.\.\/\.\.\/\.\.\/\.\.\/stores\/auth\.store';/g, "import { useAuthStore } from '../../../stores/auth.store';");
  replaceAll('routes/_app/settings/profile.tsx', /import \{ useAuthStore \} from '\.\.\/\.\.\/\.\.\/\.\.\/stores\/auth\.store';/g, "import { useAuthStore } from '../../../stores/auth.store';");

  // fetchWithAuth DELETE
  replaceAll('app/accounting/api/accounting.api.ts', /return await fetchWithAuth\(`\/api\/admin\/expenses\/\$\{id\}`,\s*\{\s*method:\s*'DELETE'\s*\}\);/g, 'return await api.delete<any>(`/admin/expenses/${id}`);');
  replaceAll('app/accounting/api/accounting.api.ts', /return await fetchWithAuth\(`\/api\/admin\/orders\/\$\{orderId\}\/expenses\/\$\{expenseId\}`,\s*\{\s*method:\s*'DELETE'\s*\}\);/g, 'return await api.delete<any>(`/admin/orders/${orderId}/expenses/${expenseId}`);');
  
  // API_BASE export fetch
  replaceAll('app/accounting/api/accounting.api.ts', /const response = await fetch\(`\$\{API_BASE\}\/api\/admin\/accounting\/export\?month=\$\{month\}`,\s*\{\s*headers:\s*\{\s*'Authorization':\s*`Bearer \$\{token\}`\s*\}\s*\}\);/g, 'const response = await api.get<any>(`/admin/accounting/export?month=${month}`);');
  // It might be formatted differently
  replaceAll('app/accounting/api/accounting.api.ts', /const response = await fetch\(`\$\{API_BASE\}[\s\S]*?\}\);/g, 'const response = await api.get<any>(`/admin/accounting/export?month=${month}`);');

  // other fetchWithAuth DELETE
  replaceAll('app/coupons/api/coupons.api.ts', /fetchWithAuth\(`\/admin\/coupons\/\$\{id\}`,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, 'api.delete<any>(`/admin/coupons/${id}`)');
  replaceAll('app/customers/api/customers.api.ts', /fetchWithAuth\(`\/customers\/\$\{id\}`,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, 'api.delete<any>(`/customers/${id}`)');
  replaceAll('app/settings/team/api/team.api.ts', /fetchWithAuth\(`\/admin\/team\/\$\{id\}`,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, 'api.delete<any>(`/admin/team/${id}`)');
}

fixFiles();
