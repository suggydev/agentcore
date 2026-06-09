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
    
    // Check hero
    const hero = await page.locator('header, [class*="hero"], [class*="Hero"]').first().isVisible().catch(() => false);
    logResult('passed', 'Hero section', hero ? 'PASS' : 'FAIL', hero ? 'Hero found' : 'Hero NOT found');
    
    // Check features
    const features = await page.locator('section:has-text("Возможности"), [class*="features"], [class*="feature"], #features').first().isVisible().catch(() => false);
    logResult('passed', 'Features section', features ? 'PASS' : 'FAIL', features ? 'Features found' : 'Features NOT found');
    
    // Check pricing
    const pricing = await page.locator('section:has-text("Тариф"), [class*="pricing"], [class*="price"], #pricing').first().isVisible().catch(() => false);
    logResult('passed', 'Pricing section', pricing ? 'PASS' : 'FAIL', pricing ? 'Pricing found' : 'Pricing NOT found');
    
    // Check FAQ
    const faq = await page.locator('section:has-text("FAQ"), [class*="faq"], [class*="FAQ"], #faq').first().isVisible().catch(() => false);
    logResult('passed', 'FAQ section', faq ? 'PASS' : 'FAIL', faq ? 'FAQ found' : 'FAQ NOT found');
    
    // Check CTA
    const cta = await page.locator('section:has-text("Начать"), section:has-text("Регистрация"), [class*="cta"], [class*="CTA"]').first().isVisible().catch(() => false);
    logResult('passed', 'CTA section', cta ? 'PASS' : 'FAIL', cta ? 'CTA found' : 'CTA NOT found');
    
    // Check footer with requisites
    const footer = await page.locator('footer').first();
    const footerVisible = await footer.isVisible().catch(() => false);
    let footerText = '';
    if (footerVisible) footerText = await footer.textContent().catch(() => '');
    const hasRequisites = footerText.includes('ИНН') || footerText.includes('ОГРН') || footerText.includes('ООО') || footerText.includes('реквизит');
    logResult('passed', 'Footer with requisites', footerVisible && hasRequisites ? 'PASS' : 'FAIL', `Footer visible: ${footerVisible}, Has requisites: ${hasRequisites}`);
    
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
    
    // Check if mobile menu/hamburger exists or layout is responsive
    const hamburger = await page.locator('button[class*="menu"], [aria-label*="menu"], [class*="hamburger"], [class*="mobile"]').first().isVisible().catch(() => false);
    const noHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 10);
    
    logResult('passed', 'Mobile hamburger/menu', hamburger ? 'PASS' : 'WARN', hamburger ? 'Mobile menu found' : 'Mobile menu NOT found - may use other navigation');
    logResult('passed', 'No horizontal scroll', noHorizontalScroll ? 'PASS' : 'FAIL', `ScrollWidth: ${await page.evaluate(() => document.documentElement.scrollWidth)}, InnerWidth: ${await page.evaluate(() => window.innerWidth)}`);
    
    // Check home page elements on mobile
    const hero = await page.locator('header, [class*="hero"], [class*="Hero"]').first().isVisible().catch(() => false);
    logResult('passed', 'Hero on mobile', hero ? 'PASS' : 'FAIL', hero ? 'Hero visible on mobile' : 'Hero NOT visible on mobile');
    
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
    const registerLink = await page.locator('a[href*="register"], a[href*="signup"], a[href*="registr"], button:has-text("Регистрация"), a:has-text("Регистрация")').first().isVisible().catch(() => false);
    
    logResult('passed', 'Login - email input', emailInput ? 'PASS' : 'FAIL', emailInput ? 'Email input found' : 'Email input NOT found');
    logResult('passed', 'Login - password input', passwordInput ? 'PASS' : 'FAIL', passwordInput ? 'Password input found' : 'Password input NOT found');
    logResult('passed', 'Login - register link', registerLink ? 'PASS' : 'FAIL', registerLink ? 'Register link found' : 'Register link NOT found');
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
    const logo = await page.locator('a[href="/"], a[href="https://agentcore.work/"], [class*="logo"] a').first();
    const logoHref = logo ? await logo.getAttribute('href') : null;
    logResult('passed', 'Logo link', logoHref === '/' || logoHref === 'https://agentcore.work/' || !logoHref ? 'PASS' : 'WARN', `Logo href: ${logoHref}`);
    
    // Check all nav links
    const links = await page.locator('nav a, header a, [class*="nav"] a').all();
    let workingLinks = 0;
    let brokenLinks = 0;
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      try {
        const response = await page.request.get(fullUrl, { timeout: 10000 });
        if (response.status() < 400) workingLinks++; else brokenLinks++;
      } catch (e) {
        brokenLinks++;
      }
    }
    logResult('passed', 'Navigation links', brokenLinks === 0 ? 'PASS' : 'FAIL', `${workingLinks} working, ${brokenLinks} broken`);
  } catch (e) {
    logResult('failed', 'Navigation Test', 'FAIL', e.message);
  }
}

async function testPublicPages(page) {
  console.log('\n--- Testing Public Pages (no 404) ---');
  const pages = ['/', '/pricing', '/offer', '/privacy', '/payment', '/refund', '/contacts', '/terms', '/login'];
  for (const p of pages) {
    try {
      const response = await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const status = response ? response.status() : 0;
      const has404 = await page.locator('text=404, text=Not Found, [class*="404"], [class*="not-found"]').first().isVisible().catch(() => false);
      const title = await page.title().catch(() => '');
      const is404 = status === 404 || has404 || title.toLowerCase().includes('404') || title.toLowerCase().includes('not found');
      
      logResult('passed', `Page ${p}`, is404 ? 'FAIL' : 'PASS', `Status: ${status}, Title: ${title}`);
      await takeScreenshot(page, `10-public-${p.replace(/\//g, '') || 'home'}`);
    } catch (e) {
      logResult('failed', `Page ${p}`, 'FAIL', e.message);
    }
  }
}

async function testColorScheme(page) {
  console.log('\n--- Testing Color Scheme ---');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.backgroundColor;
    });
    
    const textColor = await page.evaluate(() => {
      const h1 = document.querySelector('h1, p, span');
      if (!h1) return 'unknown';
      const styles = window.getComputedStyle(h1);
      return styles.color;
    });
    
    const brandColor = await page.evaluate(() => {
      const btn = document.querySelector('button[class*="purple"], a[class*="purple"], button[class*="brand"], [class*="violet"]');
      if (!btn) return null;
      const styles = window.getComputedStyle(btn);
      return styles.backgroundColor || styles.color;
    });
    
    const isDark = bodyBg.includes('0, 0, 0') || bodyBg.includes('rgb(10') || bodyBg.includes('rgb(17') || bodyBg.includes('rgb(18') || bodyBg.includes('rgb(2') || bodyBg.includes('rgba(0, 0, 0') || bodyBg.includes('#0') || bodyBg.includes('dark');
    const isWhiteText = textColor.includes('255') || textColor.includes('white') || textColor.includes('rgb(240');
    const hasBrandColor = brandColor && (brandColor.includes('128') || brandColor.includes('139') || brandColor.includes('147') || brandColor.includes('purple') || brandColor.includes('violet'));
    
    logResult('passed', 'Dark background', isDark ? 'PASS' : 'FAIL', `Body bg: ${bodyBg}`);
    logResult('passed', 'White text', isWhiteText ? 'PASS' : 'WARN', `Text color: ${textColor}`);
    logResult('passed', 'Brand (purple) color', hasBrandColor ? 'PASS' : 'WARN', `Brand color: ${brandColor}`);
  } catch (e) {
    logResult('failed', 'Color Scheme Test', 'FAIL', e.message);
  }
}

async function testLucideIcons(page) {
  console.log('\n--- Testing Lucide Icons ---');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const brokenIcons = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      let broken = 0;
      svgs.forEach(svg => {
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) broken++;
      });
      return broken;
    });
    
    logResult('passed', 'Lucide icons (no broken)', brokenIcons === 0 ? 'PASS' : 'FAIL', `${brokenIcons} broken icons found`);
  } catch (e) {
    logResult('failed', 'Lucide Icons Test', 'FAIL', e.message);
  }
}

async function createAccountAndTestAuth(page) {
  console.log('\n--- Creating Account & Testing Auth Pages ---');
  const timestamp = Date.now();
  const email = `test_ui_${timestamp}@agentcore.work`;
  const password = 'TestPassword123!';
  let loggedIn = false;
  
  try {
    // Navigate to login or register
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    // Try to find registration link or form
    const registerLink = page.locator('a[href*="register"], a[href*="signup"], a[href*="registr"], button:has-text("Регистрация"), a:has-text("Регистрация")').first();
    if (await registerLink.isVisible().catch(() => false)) {
      await registerLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Try to fill registration form (if we're on register page)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitBtn = page.locator('button[type="submit"], button:has-text("Зарегистрироваться"), button:has-text("Регистрация")').first();
    
    if (await emailInput.isVisible().catch(() => false) && await passwordInput.isVisible().catch(() => false)) {
      await emailInput.fill(email);
      await passwordInput.fill(password);
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Check if we are logged in
    const currentUrl = page.url();
    loggedIn = !currentUrl.includes('/login') && !currentUrl.includes('/register');
    
    if (!loggedIn) {
      // Maybe registration failed, try login
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const emailInput2 = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput2 = page.locator('input[type="password"], input[name="password"]').first();
      const submitBtn2 = page.locator('button[type="submit"], button:has-text("Войти")').first();
      
      if (await emailInput2.isVisible().catch(() => false)) {
        await emailInput2.fill(email);
        await passwordInput2.fill(password);
        await submitBtn2.click();
        await page.waitForTimeout(3000);
      }
      
      const url2 = page.url();
      loggedIn = !url2.includes('/login') && !url2.includes('/register');
    }
    
    logResult('passed', 'Account creation/login', loggedIn ? 'PASS' : 'FAIL', `Logged in: ${loggedIn}, URL: ${page.url()}`);
    
    if (!loggedIn) {
      logResult('failed', 'Auth tests skipped', 'FAIL', 'Could not log in');
      return;
    }
    
    // Test /agents
    await page.goto(`${BASE_URL}/agents`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '05-agents');
    
    const agentCards = await page.locator('[class*="card"], [class*="agent"], [class*="Card"], [class*="Agent"]').count();
    const hasBadge = await page.locator('text=Не активирован, [class*="badge"], [class*="Badge"]').first().isVisible().catch(() => false);
    
    logResult('passed', 'Agents page - cards', agentCards > 0 ? 'PASS' : 'FAIL', `${agentCards} agent cards found`);
    logResult('passed', 'Agents page - badge "Не активирован"', hasBadge ? 'PASS' : 'WARN', hasBadge ? 'Badge found' : 'Badge NOT found - maybe user already has active agents');
    
    // Test /settings
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '06-settings');
    
    const profileTab = await page.locator('button:has-text("Профиль"), a:has-text("Профиль"), [class*="tab"]:has-text("Профиль")').first().isVisible().catch(() => false);
    const securityTab = await page.locator('button:has-text("Безопасность"), a:has-text("Безопасность"), [class*="tab"]:has-text("Безопасность")').first().isVisible().catch(() => false);
    const paymentTab = await page.locator('button:has-text("Оплата"), a:has-text("Оплата"), [class*="tab"]:has-text("Оплата"), button:has-text("Платежи"), a:has-text("Платежи")').first().isVisible().catch(() => false);
    const pageText = await page.textContent('body').catch(() => '');
    const hasRuble = pageText.includes('₽') || pageText.includes('руб');
    
    logResult('passed', 'Settings - Profile tab', profileTab ? 'PASS' : 'FAIL', profileTab ? 'Profile tab found' : 'Profile tab NOT found');
    logResult('passed', 'Settings - Security tab', securityTab ? 'PASS' : 'FAIL', securityTab ? 'Security tab found' : 'Security tab NOT found');
    logResult('passed', 'Settings - Payment tab', paymentTab ? 'PASS' : 'FAIL', paymentTab ? 'Payment tab found' : 'Payment tab NOT found');
    logResult('passed', 'Settings - Balance in ₽', hasRuble ? 'PASS' : 'WARN', hasRuble ? 'Ruble sign found' : 'Ruble sign NOT found');
    
    // Test /onboarding
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '07-onboarding');
    
    const hasWizard = await page.locator('[class*="wizard"], [class*="step"], [class*="onboarding"], button:has-text("Далее"), button:has-text("Пропустить"), button:has-text("Skip"), button:has-text("Next")').first().isVisible().catch(() => false);
    const currentUrlOnboarding = page.url();
    const isOnboarding = currentUrlOnboarding.includes('/onboarding');
    
    logResult('passed', 'Onboarding page exists', isOnboarding ? 'PASS' : 'WARN', `URL: ${currentUrlOnboarding}`);
    logResult('passed', 'Onboarding wizard or skip', hasWizard ? 'PASS' : 'WARN', hasWizard ? 'Wizard elements found' : 'No wizard elements found');
    
  } catch (e) {
    logResult('failed', 'Auth tests', 'FAIL', e.message);
  }
}

async function generateReport() {
  const reportPath = path.join(__dirname, 'ui-test-report.md');
  
  let md = `# UI/UX Test Report — agentcore.work\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n\n`;
  md += `**Base URL:** ${BASE_URL}\n\n`;
  md += `---\n\n`;
  
  md += `## Summary\n\n`;
  md += `- ✅ Passed: ${results.passed.length}\n`;
  md += `- ❌ Failed: ${results.failed.length}\n`;
  md += `- ⚠️ Warnings: ${results.warnings.length}\n\n`;
  
  md += `## Results by Category\n\n`;
  
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
  
  md += `\n## Recommendations\n\n`;
  md += `Based on the test results, here are the recommendations:\n\n`;
  
  const failures = results.failed;
  if (failures.length === 0) {
    md += `1. **No critical failures found.** The site appears to be functioning well overall.\n`;
  } else {
    md += `1. **Fix critical failures:**\n`;
    failures.forEach(f => {
      md += `   - ${f.item}: ${f.details}\n`;
    });
  }
  
  const warnings = results.warnings;
  if (warnings.length > 0) {
    md += `2. **Address warnings:**\n`;
    warnings.forEach(w => {
      md += `   - ${w.item}: ${w.details}\n`;
    });
  }
  
  md += `3. **General UX recommendations:**\n`;
  md += `   - Ensure all Lucide icons are properly imported and rendered.\n`;
  md += `   - Test mobile navigation thoroughly on real devices.\n`;
  md += `   - Verify color contrast ratios for accessibility (WCAG 2.1 AA).\n`;
  md += `   - Add loading states for async operations.\n`;
  md += `   - Ensure all interactive elements have clear focus states.\n`;
  
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
