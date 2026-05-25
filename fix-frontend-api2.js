const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'apps/frontend/src/api');

function fixFiles() {
  function replaceAll(filePath, search, replacement) {
    let p = path.join(apiDir, filePath);
    if (!fs.existsSync(p)) return;
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(search, replacement);
    fs.writeFileSync(p, c);
  }

  // addresses.ts
  replaceAll('addresses.ts', /api\.post\('\/storefront\/addresses', \$3\);/g, "api.post<any>('/storefront/addresses', input);");
  replaceAll('addresses.ts', /apiFetch<[^>]+>\(`\/storefront\/addresses\/\$\{id\}`,\s*\{\s*method:\s*'DELETE',\s*\}\);/g, "api.delete<any>(`/storefront/addresses/${id}`);");
  replaceAll('addresses.ts', /apiFetch<[^>]+>\(`\/storefront\/addresses\/\$\{id\}\/set-default`,\s*\{\s*method:\s*'PATCH',\s*\}\);/g, "api.patch<any>(`/storefront/addresses/${id}/set-default`, {});");
  replaceAll('addresses.ts', /api\.get\('\/storefront\/addresses\?region='\s*\+\s*region\)/g, "api.get<any>('/storefront/addresses?region=' + region)");

  // cart.ts
  replaceAll('cart.ts', /api\.post\('\/storefront\/cart\/items', \$3\);/g, "api.post<any>('/storefront/cart/items', input);");
  replaceAll('cart.ts', /apiFetch<[^>]+>\(`\/storefront\/cart\/items\/\$\{itemId\}`,\s*\{\s*method:\s*'DELETE',\s*\}\);/g, "api.delete<any>(`/storefront/cart/items/${itemId}`);");
  replaceAll('cart.ts', /apiFetch<[^>]+>\('\/storefront\/cart',\s*\{\s*method:\s*'DELETE',\s*body:\s*regionCode \? JSON\.stringify\(\{ regionCode \}\) : undefined,\s*\}\);/g, "api.delete<any>('/storefront/cart' + (regionCode ? `?regionCode=\${regionCode}` : ''));");
  replaceAll('cart.ts', /api\.get\('\/storefront\/cart'\)/g, "api.get<any>('/storefront/cart')");

  // coupons.ts
  replaceAll('coupons.ts', /api\.post\('\/storefront\/coupons\/validate', \$3\);/g, "api.post<any>('/storefront/coupons/validate', input);");

  // orders.ts
  replaceAll('orders.ts', /api\.post\('\/storefront\/orders', \$3\);/g, "api.post<any>('/storefront/orders', input);");
  replaceAll('orders.ts', /apiFetch<[^>]+>\(`\/storefront\/orders\/\$\{id\}`\);/g, "api.get<any>(`/storefront/orders/${id}`);");
  replaceAll('orders.ts', /apiFetch<[^>]+>\(`\/storefront\/orders\/\$\{orderId\}\/receipt`\);/g, "api.get<any>(`/storefront/orders/${orderId}/receipt`);");
  replaceAll('orders.ts', /apiFetch<[^>]+>\('\/categories\/upload-url',\s*\{\s*method:\s*'POST'\s*\}\);/g, "api.post<any>('/categories/upload-url', {});");
  replaceAll('orders.ts', /apiFetch<[^>]+>\(`\/storefront\/orders\/\$\{orderId\}\/receipt`,\s*\{\s*method:\s*'PATCH',\s*body:\s*JSON\.stringify\(input\),\s*\}\);/g, "api.patch<any>(`/storefront/orders/${orderId}/receipt`, input);");
  replaceAll('orders.ts', /apiFetch<[^>]+>\(`\/storefront\/orders\/\$\{orderId\}`,\s*\{\s*method:\s*'DELETE',\s*\}\);/g, "api.delete<any>(`/storefront/orders/${orderId}`);");

  // products.ts
  replaceAll('products.ts', /apiFetch<[^>]+>\(`\/storefront\/products\/\$\{slug\}`\);/g, "api.get<any>(`/storefront/products/${slug}`);");

  // profile.ts
  replaceAll('profile.ts', /apiFetch<[^>]+>\('\/storefront\/profile\/region',\s*\{\s*method:\s*'PATCH',\s*body:\s*JSON\.stringify\(\{ regionCode \}\),\s*\}\);/g, "api.patch<any>('/storefront/profile/region', { regionCode });");

  // settings.ts
  replaceAll('settings.ts', /apiFetch<[^>]+>\(`\/storefront\/payment-info\?region=\$\{region\}`\);/g, "api.get<any>(`/storefront/payment-info?region=${region}`);");

  // waitlist.ts
  replaceAll('waitlist.ts', /api\.post<any>\('\/storefront\/waitlist', arguments\[1\]\);/g, "api.post<any>('/storefront/waitlist', { productId });");
  replaceAll('waitlist.ts', /apiFetch<[^>]+>\(`\/storefront\/waitlist\/\$\{productId\}`,\s*\{\s*method:\s*'DELETE',\s*\}\);/g, "api.delete<any>(`/storefront/waitlist/${productId}`);");

  // add "any" to api.get
  replaceAll('waitlist.ts', /api\.get\(/g, "api.get<any>(");
  replaceAll('coupons.ts', /api\.get\(/g, "api.get<any>(");
  replaceAll('orders.ts', /api\.get\(/g, "api.get<any>(");
  replaceAll('products.ts', /api\.get\(/g, "api.get<any>(");

  // Other components errors are mostly because of api.get not returning 'any'.
  // I'll make sure all api.get calls in frontend are `api.get<any>`.
}

fixFiles();
