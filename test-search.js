const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('React') || msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
    }
  });

  page.on('pageerror', err => console.log('[BROWSER UNCAUGHT ERROR]', err.message));
  page.on('request', req => {
    if (req.url().includes('/api/admin/search')) {
      console.log('[NETWORK REQUEST]', req.method(), req.url());
    }
  });

  try {
    const token = require('jsonwebtoken').sign(
      { sub: '718e055f-af7f-40ac-93f4-3774fb724e62', role: 'SUPER_ADMIN' },
      'change-me-access-32-chars-min-xxxxx'
    );
    console.log('Navigating and injecting auth...');
    await page.goto('https://localhost:4200/login', { timeout: 10000 });

    await page.evaluate(jwtToken => {
      localStorage.setItem(
        'nuraskin-admin-auth',
        JSON.stringify({
          state: {
            token: jwtToken,
            user: {
              id: '718e055f-af7f-40ac-93f4-3774fb724e62',
              email: 'manager@nuraskin.uz',
              fullName: 'Manager',
              mustChangePassword: false,
            },
          },
          version: 0,
        })
      );
    }, token);

    console.log('Navigating to dashboard...');
    await page.goto('https://localhost:4200/', { timeout: 10000 });

    console.log('Typing in search...');
    await page.waitForSelector('input[type="search"]');
    await page.fill('input[type="search"]', 'rose');
    await page.waitForTimeout(2000); // Wait for debounce and network

    // Check if PopoverContent exists
    const popoverCount = await page.locator('[data-radix-popper-content-wrapper]').count();
    console.log('POPOVER CONTENT WRAPPERS FOUND:', popoverCount);

    if (popoverCount > 0) {
      const isVisible = await page
        .locator('[data-radix-popper-content-wrapper]')
        .first()
        .isVisible();
      console.log('POPOVER VISIBLE:', isVisible);
      const box = await page.locator('[data-radix-popper-content-wrapper]').first().boundingBox();
      console.log('POPOVER BOUNDING BOX:', box);
    }

    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    if (bodyHtml.includes('RoseGlo')) {
      console.log('Found "RoseGlo" somewhere in the body html');
    } else {
      console.log('"RoseGlo" not found in body html');
    }
  } catch (err) {
    console.error('Test script failed:', err);
  } finally {
    await browser.close();
  }
})();
