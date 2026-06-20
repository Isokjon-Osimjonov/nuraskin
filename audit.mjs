import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  
  for (const width of [375, 430]) {
    console.log(`Taking screenshot at ${width}px...`);
    const context = await browser.newContext({
      viewport: { width, height: 812 },
      isMobile: true,
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    // Go to root to set localStorage.
    await page.goto('https://localhost:4200/login');
    await page.evaluate(() => {
      localStorage.setItem('admin-auth', JSON.stringify({
        state: {
          token: 'dummy-token',
          user: { id: '1', email: 'test@example.com', fullName: 'Test', mustChangePassword: false }
        }
      }));
    });

    // Now go to the target page
    await page.goto('https://localhost:4200/telegram/channels');
    await page.waitForTimeout(3000); // Wait for potential rendering/API calls

    await page.screenshot({ path: `channels-mobile-${width}px.png`, fullPage: false });
    await context.close();
  }

  await browser.close();
})();
