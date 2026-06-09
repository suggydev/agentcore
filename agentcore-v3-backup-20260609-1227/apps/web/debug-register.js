const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://agentcore.work/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    // Click Registration tab
    await page.click('button:has-text("Регистрация")');
    await page.waitForTimeout(1000);
    
    // Fill step 1
    const nameInput = await page.locator('input[placeholder*="Иван"], input[type="text"]').first();
    await nameInput.fill('Test User');
    
    const emailInput = await page.locator('input[type="email"]').first();
    const email = `test_playwright_${Date.now()}@agentcore.work`;
    await emailInput.fill(email);
    
    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill('TestPass123!');
    
    console.log('Step 1 filled. URL:', page.url());
    
    // Click next
    await page.click('button:has-text("Далее")');
    await page.waitForTimeout(1500);
    
    console.log('Step 2 reached. URL:', page.url());
    const step2Text = await page.textContent('body');
    console.log('Step 2 text preview:', step2Text.slice(0, 300));
    
    // Fill step 2 - company
    const companyInput = await page.locator('input[placeholder*="Ромашка"], input[type="text"]').first();
    await companyInput.fill('Test Company');
    
    // Select company size
    const sizeSelect = await page.locator('select').first();
    if (await sizeSelect.isVisible().catch(() => false)) {
      await sizeSelect.selectOption('2-10');
    }
    
    // Select industry
    const industrySelect = await page.locator('select').nth(1);
    if (await industrySelect.isVisible().catch(() => false)) {
      await industrySelect.selectOption('Технологии');
    }
    
    // Select source
    const sourceBtn = await page.locator('button:has-text("Поиск")').first();
    if (await sourceBtn.isVisible().catch(() => false)) {
      await sourceBtn.click();
    }
    
    // Select purpose
    const purposeBtn = await page.locator('button:has-text("Продажи и лиды")').first();
    if (await purposeBtn.isVisible().catch(() => false)) {
      await purposeBtn.click();
    }
    
    console.log('Step 2 filled. URL:', page.url());
    
    // Click next
    await page.click('button:has-text("Далее")');
    await page.waitForTimeout(1500);
    
    console.log('Step 3 reached. URL:', page.url());
    const step3Text = await page.textContent('body');
    console.log('Step 3 text preview:', step3Text.slice(0, 300));
    
    // Click create account
    await page.click('button:has-text("Создать аккаунт")');
    await page.waitForTimeout(5000);
    
    console.log('After create. URL:', page.url());
    const finalText = await page.textContent('body');
    console.log('Final text preview:', finalText.slice(0, 500));
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Token:', token ? 'YES' : 'NO');
    
    // Check for errors
    if (finalText.includes('Ошибка')) {
      console.log('Error found in text!');
    }
    
    // Save HTML for debugging
    const html = await page.content();
    require('fs').writeFileSync('debug-register.html', html);
    
  } catch (e) {
    console.error('Error:', e.message);
    const html = await page.content().catch(() => '');
    require('fs').writeFileSync('debug-error.html', html);
  } finally {
    await browser.close();
  }
})();
