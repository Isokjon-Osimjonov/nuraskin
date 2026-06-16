import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  try {
    // Navigate to admin
    await page.goto('https://localhost:4200');
    
    // Inject auth state
    await page.evaluate(() => {
      const authData = {
        state: {
          token: 'fake-token',
          user: {
            id: 'fake-id',
            email: 'admin@nuraskin.com',
            fullName: 'Admin User',
            mustChangePassword: false
          }
        },
        version: 0
      };
      localStorage.setItem('nuraskin-admin-auth', JSON.stringify(authData));
    });

    // Reload to apply auth state
    await page.goto('https://localhost:4200');
    await page.waitForLoadState('networkidle');
    
    // Wait for the sidebar to be visible
    await page.waitForSelector('.group\\/sidebar-wrapper', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'sidebar-fix-verification.png', fullPage: true });
    console.log('Screenshot saved to sidebar-fix-verification.png');

    // Verify properties
    const results = await page.evaluate(() => {
      const provider = document.querySelector('.group\\/sidebar-wrapper');
      const sidebarWrapper = document.querySelector('.group.peer');
      const inset = document.querySelector('main');
      
      return {
        providerClasses: provider?.className,
        sidebarVariant: sidebarWrapper?.getAttribute('data-variant'),
        insetClasses: inset?.className,
        insetMarginLeft: getComputedStyle(inset)?.marginLeft
      };
    });

    console.log('Verification Results:', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
})();
