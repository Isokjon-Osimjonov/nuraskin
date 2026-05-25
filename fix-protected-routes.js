const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'apps/frontend/src/api');

function replaceAll(filePath, search, replacement) {
  let p = path.join(apiDir, filePath);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(search, replacement);
  fs.writeFileSync(p, c);
}

function processFiles() {
  // addresses.ts
  replaceAll('addresses.ts', /api\.get<any>\('\/storefront\/addresses/g, "api.auth.get<any>('/storefront/addresses");
  replaceAll('addresses.ts', /api\.post<any>\('\/storefront\/addresses/g, "api.auth.post<any>('/storefront/addresses");
  replaceAll('addresses.ts', /api\.patch<any>\(`\/storefront\/addresses/g, "api.auth.patch<any>(`/storefront/addresses");
  replaceAll('addresses.ts', /api\.delete<any>\(`\/storefront\/addresses/g, "api.auth.delete<any>(`/storefront/addresses");

  // cart.ts
  replaceAll('cart.ts', /api\.get<CartResponse>\('\/storefront\/cart'\)/g, "api.auth.get<CartResponse>('/storefront/cart')");
  replaceAll('cart.ts', /api\.post<any>\('\/storefront\/cart\/items/g, "api.auth.post<any>('/storefront/cart/items");
  replaceAll('cart.ts', /api\.patch<any>\(`\/storefront\/cart\/items/g, "api.auth.patch<any>(`/storefront/cart/items");
  replaceAll('cart.ts', /api\.delete<any>\(`\/storefront\/cart\/items/g, "api.auth.delete<any>(`/storefront/cart/items");
  replaceAll('cart.ts', /api\.delete<any>\('\/storefront\/cart'/g, "api.auth.delete<any>('/storefront/cart'");

  // orders.ts
  replaceAll('orders.ts', /api\.post<any>\('\/storefront\/orders/g, "api.auth.post<any>('/storefront/orders");
  replaceAll('orders.ts', /api\.get<any>\('\/storefront\/orders\/my'\)/g, "api.auth.get<any>('/storefront/orders/my')");
  replaceAll('orders.ts', /api\.get<any>\(`\/storefront\/orders/g, "api.auth.get<any>(`/storefront/orders");
  replaceAll('orders.ts', /api\.patch<any>\(`\/storefront\/orders/g, "api.auth.patch<any>(`/storefront/orders");
  replaceAll('orders.ts', /api\.delete<any>\(`\/storefront\/orders/g, "api.auth.delete<any>(`/storefront/orders");
  // ensure /categories/upload-url remains public if it was public before, or if it needs auth, we'll see. The prompt said /storefront/* my/cart/waitlist/checkout/addresses/profile are protected.

  // profile.ts
  replaceAll('profile.ts', /api\.patch<any>\('\/storefront\/profile\/region/g, "api.auth.patch<any>('/storefront/profile/region");

  // waitlist.ts
  replaceAll('waitlist.ts', /api\.get<ProductWaitlistResponse\[\]>\('\/storefront\/waitlist'\)/g, "api.auth.get<ProductWaitlistResponse[]>('/storefront/waitlist')");
  replaceAll('waitlist.ts', /api\.post<any>\('\/storefront\/waitlist/g, "api.auth.post<any>('/storefront/waitlist");
  replaceAll('waitlist.ts', /api\.delete<any>\(`\/storefront\/waitlist/g, "api.auth.delete<any>(`/storefront/waitlist");
}

processFiles();
