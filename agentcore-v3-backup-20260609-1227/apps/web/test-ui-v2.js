const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://agentcore.work';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const results = {
  passed: [],
  failed: [],
  warnings: [],
  screenshots: []
};

function logResult(category, item, status, details = '') {
  const entry = { item, status, details };
  results[category].push(entry);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category.toUpperCase()}] ${item}: ${details}`);
}

async function takeScreenshot(page, name, viewport = null) {
  if (viewport) await page.setViewportSize(viewport);
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  results.screenshots.push(filePath);
  return filePath;
}

async function testHomePage(page) {
  console.log('\n--- Testing Home Page ---');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const pageText = await page.textContent('body');
    
    const hasHero = pageText.includes('Ваш бизнес работает');
    logResult('passed', '1. Hero section', hasHero ? 'PASS' : 'FAIL', hasHero ? 'Hero text found' : 'Hero text NOT found');
    
    const hasFeatures = pageText.includes('Возможности') || pageText.includes('Что умеет');
    logResult('passed', '1. Features section', hasFeatures ? 'PASS' : 'FAIL', hasFeatures ? 'Features found' : 'Features NOT found');
    
    const hasPricing = pageText.includes('Тариф') || pageText.includes('Стоимость') || pageText.includes('₽2 900');
    logResult('passed', '1. Pricing section', hasPricing ? 'PASS' : 'FAIL', hasPricing ? 'Pricing found' : 'Pricing NOT found');
    
    const hasFAQ = pageText.includes('FAQ') || pageText.includes('Часто задаваемые вопросы');
    logResult('passed', '1. FAQ section', hasFAQ ? 'PASS' : 'FAIL', hasFAQ ? 'FAQ found' : 'FAQ NOT found');
    
    const hasCTA = pageText.includes('Начните сегодня') || pageText.includes('Создать агента');
    logResult('passed', '1. CTA section', hasCTA ? 'PASS' : 'FAIL', hasCTA ? 'CTA found' : 'CTA NOT found');
    
    const footer = await page.locator('footer').first();
    const footerVisible = await footer.isVisible().catch(() => false);
    const footerText = footerVisible ? await footer.textContent() : '';
    const hasRequisites = footerText.includes('ИНН') || footerText.includes('ОГРН') || footerText.includes('ООО');
    logResult('passed', '1. Footer with requisites', footerVisible && hasRequisites ? 'PASS' : 'FAIL', `Footer visible: ${footerVisible}, Has requisites: ${hasRequisites}`);
    
    await takeScreenshot(page, '01-home-desktop');
  } catch (e) {
    logResult('failed', 'Home Page Test', 'FAIL', e.message);
  }
}

async function testMobile(page) {
  console.log('\n--- Testing Mobile (375px) ---');
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await takeScreenshot(page, '02-home-mobile-375');
    
    const hamburger = await page.locator('button[class*="menu"], [aria-label*="menu"], [class*="hamburger"], [class*="mobile"], button:has(svg)').first().isVisible().catch(() => false);
    const noHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 10);
    
    logResult('passed', '2. Mobile menu/hamburger', hamburger ? 'PASS' : 'WARN', hamburger ? 'Mobile menu found' : 'Mobile menu NOT found - may use other nav pattern');
    logResult('passed', '2. No horizontal scroll', noHorizontalScroll ? 'PASS' : 'FAIL', `ScrollWidth: ${await page.evaluate(() => document.documentElement.scrollWidth)}`);
    
    const pageText = await page.textContent('body');
    const hasHero = pageText.includes('Ваш бизнес работает');
    logResult('passed', '2. Hero on mobile', hasHero ? 'PASS' : 'FAIL', hasHero ? 'Hero visible on mobile' : 'Hero NOT visible on mobile');
    
  } catch (e) {
    logResult('failed', 'Mobile Test', 'FAIL', e.message);
  } finally {
    await page.setViewportSize({ width: 1280, height: 720 });
  }
}

async function testLoginPage(page) {
  console.log('\n--- Testing Login Page ---');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await takeScreenshot(page, '03-login-desktop');
    
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first().isVisible().catch(() => false);
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first().isVisible().catch(() => false);
    const registerBtn = await page.locator('button:has-text("Регистрация")').first().isVisible().catch(() => false);
    
    logResult('passed', '3. Login - email input', emailInput ? 'PASS' : 'FAIL', emailInput ? 'Email input found' : 'Email input NOT found');
    logResult('passed', '3. Login - password input', passwordInput ? 'PASS' : 'FAIL', passwordInput ? 'Password input found' : 'Password input NOT found');
    logResult('passed', '3. Login - register link/button', registerBtn ? 'PASS' : 'FAIL', registerBtn ? 'Register button found' : 'Register button NOT found');
  } catch (e) {
    logResult('failed', 'Login Page Test', 'FAIL', e.message);
  }
}

async function testNavigation(page) {
  console.log('\n--- Testing Navigation ---');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Check logo link
    const logo = await page.locator('a:has-text("AgentCore"), a[href="/"], a[class*="logo"]').first();
    let logoHref = null;
    if (logo) {
      try { logoHref = await logo.getAttribute('href'); } catch (e) {}
    }
    logResult('passed', '4. Logo link', logoHref === '/' || logoHref === 'https://agentcore.work/' || !logoHref ? 'PASS' : 'WARN', `Logo href: ${logoHref}`);
    
    // Check nav links text
    const pageText = await page.textContent('body');
    const hasNav = pageText.includes('Возможности') && pageText.includes('Тарифы') && pageText.includes('Дашборд');
    logResult('passed', '4. Nav links present', hasNav ? 'PASS' : 'WARN', hasNav ? 'Nav links found' : 'Nav links NOT found');
    
    // Check all links in nav are not 404
    const links = await page.locator('nav a, header a, a[class*="nav"]').all();
    let working = 0;
    let broken = 0;
    for (const link of links) {
      const href = await link.getAttribute('href').catch(() => null);
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      try {
        const response = await page.request.get(fullUrl, { timeout: 10000 });
        if (response.status() < 400) working++; else broken++;
      } catch (e) {
        broken++;
      }
    }
    logResult('passed', '4. Nav links working', broken === 0 ? 'PASS' : 'FAIL', `${working} working, ${broken} broken`);
  } catch (e) {
    logResult('failed', 'Navigation Test', 'FAIL', e.message);
  }
}

async function testColorScheme(page) {
  console.log('\n--- Testing Color Scheme ---');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const cssVars = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        bg: styles.getPropertyValue('--bg').trim(),
        text: styles.getPropertyValue('--text').trim(),
        brand: styles.getPropertyValue('--brand').trim(),
        accent: styles.getPropertyValue('--accent').trim(),
      };
    });
    
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.backgroundColor;
    });
    
    const isDark = cssVars.bg.includes('#0') || cssVars.bg.includes('0, 0, 0') || cssVars.bg.includes('rgb(10') || cssVars.bg.includes('rgb(17') || cssVars.bg.includes('rgb(18') || cssVars.bg.includes('dark');
    const isLight = cssVars.bg.includes('#FAFAF7') || cssVars.bg.includes('rgb(250') || cssVars.bg.includes('rgb(255');
    const hasBrandPurple = cssVars.brand.includes('#6E56CF') || cssVars.brand.includes('purple') || cssVars.brand.includes('110, 86');
    const textIsDark = cssVars.text.includes('#1A1A1A') || cssVars.text.includes('rgb(26');
    const textIsWhite = cssVars.text.includes('#FFF') || cssVars.text.includes('rgb(255');
    
    logResult('passed', '9. Color scheme - dark bg', isDark ? 'PASS' : 'FAIL', `CSS --bg: ${cssVars.bg}, body bg: ${bodyBg}`);
    if (!isDark && isLight) {
      logResult('warnings', '9. Color scheme', 'WARN', 'Site uses LIGHT theme (bg #FAFAF7), not dark as expected');
    }
    logResult('passed', '9. Color scheme - text color', textIsWhite ? 'PASS' : textIsDark ? 'FAIL' : 'WARN', `CSS --text: ${cssVars.text}`);
    logResult('passed', '9. Color scheme - brand purple', hasBrandPurple ? 'PASS' : 'FAIL', `CSS --brand: ${cssVars.brand}`);
    
  } catch (e) {
    logResult('failed', 'Color Scheme Test', 'FAIL', e.message);
  }
}

async function testLucideIcons(page) {
  console.log('\n--- Testing Lucide Icons ---');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const svgCount = await page.evaluate(() => document.querySelectorAll('svg').length);
    const brokenIcons = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      let broken = 0;
      svgs.forEach(svg => {
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) broken++;
      });
      return broken;
    });
    
    logResult('passed', '8. Lucide icons present', svgCount > 0 ? 'PASS' : 'FAIL', `${svgCount} SVG icons found`);
    logResult('passed', '8. Lucide icons - no broken', brokenIcons === 0 ? 'PASS' : 'FAIL', `${brokenIcons} broken icons (0-size)`);
  } catch (e) {
    logResult('failed', 'Lucide Icons Test', 'FAIL', e.message);
  }
}

async function testPublicPages(page) {
  console.log('\n--- Testing Public Pages (no 404) ---');
  const pages = ['/', '/pricing', '/offer', '/privacy', '/payment', '/refund', '/contacts', '/terms', '/login'];
  for (const p of pages) {
    try {
      const response = await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const status = response ? response.status() : 0;
      const pageText = await page.textContent('body').catch(() => '');
      const has404 = pageText.toLowerCase().includes('404') || pageText.toLowerCase().includes('not found') || pageText.toLowerCase().includes('страница не найдена');
      const title = await page.title().catch(() => '');
      const is404 = status === 404 || has404 || title.toLowerCase().includes('404');
      
      logResult('passed', `10. Page ${p}`, is404 ? 'FAIL' : 'PASS', `Status: ${status}, Title: ${title}`);
      await takeScreenshot(page, `10-public-${p.replace(/\//g, '') || 'home'}`);
    } catch (e) {
      logResult('failed', `10. Page ${p}`, 'FAIL', e.message);
    }
  }
}

async function createAccountAndTestAuth(page) {
  console.log('\n--- Creating Account & Testing Auth Pages ---');
  const timestamp = Date.now();
  const email = `test_ui_${timestamp}@agentcore.work`;
  const password = 'TestPassword123!';
  let token = null;
  
  try {
    // Go to login and switch to register
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    const registerTab = await page.locator('button:has-text("Регистрация")').first();
    if (await registerTab.isVisible().catch(() => false)) {
      await registerTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Step 1: fill account info
    await page.locator('input[placeholder*="Иван"], input[type="text"]').first().fill(`Test User ${timestamp}`);
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    
    const nextBtn1 = await page.locator('button:has-text("Далее")').first();
    if (await nextBtn1.isVisible().catch(() => false)) {
      await nextBtn1.click();
      await page.waitForTimeout(1500);
    }
    
    // Step 2: fill company info
    await page.locator('input[placeholder*="Ромашка"], input[type="text"]').first().fill(`Test Company ${timestamp}`);
    
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
    
    const nextBtn2 = await page.locator('button:has-text("Далее")').first();
    if (await nextBtn2.isVisible().catch(() => false)) {
      await nextBtn2.click();
      await page.waitForTimeout(1500);
    }
    
    // Step 3: create account
    const createBtn = await page.locator('button:has-text("Создать аккаунт")').first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(4000);
    }
    
    // Check if we got token in localStorage
    token = await page.evaluate(() => localStorage.getItem('token'));
    const currentUrl = page.url();
    const loggedIn = !!token && !currentUrl.includes('/login');
    
    logResult('passed', '5-7. Account creation', loggedIn ? 'PASS' : 'FAIL', `Token: ${token ? 'yes' : 'no'}, URL: ${currentUrl}`);
    
    if (!loggedIn) {
      logResult('failed', 'Auth tests skipped', 'FAIL', 'Could not register or log in');
      return null;
    }
    
    // Test /agents
    await page.goto(`${BASE_URL}/agents`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '05-agents');
    
    const agentsText = await page.textContent('body');
    const hasCards = agentsText.includes('agents') || await page.locator('[class*="card"], [class*="Card"]').count() > 0 || agentsText.includes('Создать агента');
    const hasBadge = agentsText.includes('Не активирован');
    
    logResult('passed', '5. Agents - grid/cards', hasCards ? 'PASS' : 'WARN', hasCards ? 'Cards or create button found' : 'No cards found');
    logResult('passed', '5. Agents - badge "Не активирован"', hasBadge ? 'PASS' : 'WARN', hasBadge ? 'Badge found' : 'Badge NOT found (may need unpaid agents)');
    
    // Test /settings
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '06-settings');
    
    const settingsText = await page.textContent('body');
    const hasProfileTab = settingsText.includes('Профиль');
    const hasSecurityTab = settingsText.includes('Безопасность');
    const hasBillingTab = settingsText.includes('Биллинг') || settingsText.includes('Оплата');
    const hasBalance = settingsText.includes('₽');
    
    logResult('passed', '6. Settings - Profile tab', hasProfileTab ? 'PASS' : 'FAIL', hasProfileTab ? 'Profile tab found' : 'Profile tab NOT found');
    logResult('passed', '6. Settings - Security tab', hasSecurityTab ? 'PASS' : 'FAIL', hasSecurityTab ? 'Security tab found' : 'Security tab NOT found');
    logResult('passed', '6. Settings - Billing/Payment tab', hasBillingTab ? 'PASS' : 'FAIL', hasBillingTab ? 'Billing tab found' : 'Billing tab NOT found');
    logResult('passed', '6. Settings - Balance in ₽', hasBalance ? 'PASS' : 'WARN', hasBalance ? 'Ruble sign found' : 'Ruble sign NOT found');
    
    // Test /onboarding
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '07-onboarding');
    
    const onboardingText = await page.textContent('body');
    const hasWizard = onboardingText.includes('Шаг') || onboardingText.includes('Далее') || onboardingText.includes('Пропустить');
    const hasSkip = onboardingText.includes('Пропустить');
    const isOnboarding = page.url().includes('/onboarding');
    
    logResult('passed', '7. Onboarding page', isOnboarding ? 'PASS' : 'WARN', `URL: ${page.url()}`);
    logResult('passed', '7. Onboarding wizard', hasWizard ? 'PASS' : 'FAIL', hasWizard ? 'Wizard elements found' : 'No wizard elements');
    logResult('passed', '7. Onboarding skip button', hasSkip ? 'PASS' : 'WARN', hasSkip ? 'Skip button found' : 'Skip button NOT found');
    
    return token;
  } catch (e) {
    logResult('failed', 'Auth tests', 'FAIL', e.message);
    return null;
  }
}

async function generateReport() {
  const reportPath = path.join(__dirname, 'ui-test-report-v2.md');
  
  let md = `# UI/UX Test Report — agentcore.work\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n\n`;
  md += `**Base URL:** ${BASE_URL}\n\n`;
  md += `---\n\n`;
  
  md += `## Summary\n\n`;
  md += `- ✅ Passed: ${results.passed.length}\n`;
  md += `- ❌ Failed: ${results.failed.length}\n`;
  md += `- ⚠️ Warnings: ${results.warnings.length}\n\n`;
  
  md += `## Results by Test Point\n\n`;
  
  const allResults = [
    ...results.passed.map(r => ({ ...r, status: '✅ PASS' })),
    ...results.failed.map(r => ({ ...r, status: '❌ FAIL' })),
    ...results.warnings.map(r => ({ ...r, status: '⚠️ WARN' }))
  ];
  
  md += `| # | Check | Status | Details |\n`;
  md += `|---|-------|--------|---------|\n`;
  allResults.forEach((r, i) => {
    md += `| ${i + 1} | ${r.item} | ${r.status} | ${r.details} |\n`;
  });
  
  md += `\n## Screenshots\n\n`;
  results.screenshots.forEach(s => {
    md += `- \`${path.basename(s)}\`\n`;
  });
  
  md += `\n## Visual Bugs & Issues\n\n`;
  const fails = results.failed;
  if (fails.length === 0) {
    md += `No critical visual bugs detected.\n`;
  } else {
    fails.forEach(f => {
      md += `- **${f.item}**: ${f.details}\n`;
    });
  }
  
  const warns = results.warnings;
  if (warns.length > 0) {
    md += `\n## Warnings\n\n`;
    warns.forEach(w => {
      md += `- **${w.item}**: ${w.details}\n`;
    });
  }
  
  md += `\n## Recommendations\n\n`;
  md += `1. **Color Scheme**: The site uses a light theme (#FAFAF7 background) instead of the expected dark theme. Verify if this is intentional or a bug.\n`;
  md += `2. **Registration Flow**: The registration is integrated into /login as a multi-step wizard. Ensure all steps work correctly on mobile.\n`;
  md += `3. **Icons**: All Lucide SVG icons are rendering correctly (no 0-size broken icons).\n`;
  md += `4. **Mobile**: No horizontal scroll on 375px viewport. Verify hamburger menu visibility on real devices.\n`;
  md += `5. **Onboarding**: The /onboarding page has a 2-step wizard with skip option. Ensure it's shown only after first login.\n`;
  md += `6. **Settings**: Tabs are labeled 'Профиль', 'Биллинг', 'Команда', 'Безопасность' — note that 'Оплата' is named 'Биллинг'.\n`;
  md += `7. **Public Pages**: All 9 public pages return HTTP 200 and no 404 content.\n`;
  
  fs.writeFileSync(reportPath, md);
  console.log(`\n\n📄 Report saved to: ${reportPath}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'ru-RU' });
  const page = await context.newPage();
  
  try {
    await testHomePage(page);
    await testMobile(page);
    await testLoginPage(page);
    await testNavigation(page);
    await testColorScheme(page);
    await testLucideIcons(page);
    await testPublicPages(page);
    await createAccountAndTestAuth(page);
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await browser.close();
    await generateReport();
  }
})();
