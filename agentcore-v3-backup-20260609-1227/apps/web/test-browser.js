const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    console.log('Browser launched successfully');
    await browser.close();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
