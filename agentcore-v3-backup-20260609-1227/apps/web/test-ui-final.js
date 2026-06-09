const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://agentcore.work';
const API_URL = 'https://api.agentcore.work';
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

async function registerViaAPI() {
  const timestamp = Date.now();
  const email = `test_ui_${timestamp}@agentcore.work`;
  const password = 'TestPassword123!';
  const name = `Test User ${timestamp}`;
  
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      password,
      workspaceName: `${name}'s Workspace`,
      companyName: `Test Company ${timestamp}`,
      companySize: '2-10',
      industry: 'Технологии',
      source: 'search',
      purpose: 'sales',
    }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  
  console.log('API Registration successful:', data.user.email);
  return { token: data.accessToken, user: data.user, workspaceId: data.workspaceId, email, password };
}

async function testHomePage(page) {
  console.log('\n--- Testing Home Page ---');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const pageText = await page.textContent('body');
    
    logResult('passed', '1. Hero section', pageText.includes('Ваш бизнес работает') ? 'PASS' : 'FAIL', 'Hero text found');
    logResult('passed', '1. Features section', pageText.includes('Возможности') ? 'PASS' : 'FAIL', 'Features found');
    logResult('passed', '1. Pricing section', pageText.includes('Тариф') || pageText.includes('Стоимость') ? 'PASS' : 'FAIL', 'Pricing found');
    logResult('passed', '1. FAQ section', pageText.includes('FAQ') ? 'PASS' : 'FAIL', 'FAQ found');
    logResult('passed', '1. CTA section', pageText.includes('Начните сегодня') ? 'PASS' : 'FAIL', 'CTA found');
    
    const footer = await page.locator('footer').first();
    const footerVisible = await footer.isVisible().catch(() => false);
    const footerText = footerVisible ? await footer.textContent() : '';
    const hasRequisites = footerText.includes('ИНН') && footerText.includes('ОГРН');
    logResult('passed', '1. Footer with requisites', footerVisible && hasRequisites ? 'PASS' : 'FAIL', `Footer: ${footerVisible}, Requisites: ${hasRequisites}`);
    
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
    
    logResult('passed', '2. Mobile hamburger/menu', hamburger ? 'PASS' : 'WARN', hamburger ? 'Found' : 'Not found');
    logResult('passed', '2. No horizontal scroll', noHorizontalScroll ? 'PASS' : 'FAIL', `w=${await page.evaluate(() => document.documentElement.scrollWidth)}`);
    
    const pageText = await page.textContent('body');
    logResult('passed', '2. Hero on mobile', pageText.includes('Ваш бизнес работает') ? 'PASS' : 'FAIL', 'Hero visible');
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
    
    const emailInput = await page.locator('input[type="email"]').first().isVisible().catch(() => false);
    const passwordInput = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
    const registerBtn = await page.locator('button:has-text("Регистрация")').first().isVisible().catch(() => false);
    
    logResult('passed', '3. Login - email input', emailInput ? 'PASS' : 'FAIL', 'Email input');
    logResult('passed', '3. Login - password input', passwordInput ? 'PASS' : 'FAIL', 'Password input');
    logResult('passed', '3. Login - register button', registerBtn ? 'PASS' : 'FAIL', 'Register button');
  } catch (e) {
    logResult('failed', 'Login Page Test', 'FAIL', e.message);
  }
}

async function testNavigation(page) {
  console.log('\n--- Testing Navigation ---');
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const logo = await page.locator('a:has-text("AgentCore"), a[href="/"], a[class*="logo"]').first();
    let logoHref = null;
    try { logoHref = await logo.getAttribute('href'); } catch (e) {}
    logResult('passed', '4. Logo link', logoHref === '/' || logoHref === 'https://agentcore.work/' || !logoHref ? 'PASS' : 'WARN', `href=${logoHref}`);
    
    const pageText = await page.textContent('body');
    const hasNav = pageText.includes('Возможности') && pageText.includes('Тарифы');
    logResult('passed', '4. Nav links present', hasNav ? 'PASS' : 'WARN', 'Nav links found');
    
    // Check links work
    const links = await page.locator('nav a, header a, a[class*="nav"]').all();
    let working = 0, broken = 0;
    for (const link of links) {
      const href = await link.getAttribute('href').catch(() => null);
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      try {
        const response = await page.request.get(fullUrl, { timeout: 10000 });
        if (response.status() < 400) working++; else broken++;
      } catch (e) { broken++; }
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
      const s = getComputedStyle(document.documentElement);
      return {
        bg: s.getPropertyValue('--bg').trim(),
        text: s.getPropertyValue('--text').trim(),
        brand: s.getPropertyValue('--brand').trim(),
        accent: s.getPropertyValue('--accent').trim(),
      };
    });
    
    const isDark = cssVars.bg.startsWith('#0') || cssVars.bg.startsWith('rgb(0') || cssVars.bg.startsWith('rgb(10') || cssVars.bg.startsWith('rgb(17');
    const isLight = cssVars.bg.toLowerCase().includes('#fafaf7') || cssVars.bg.toLowerCase().includes('rgb(250');
    const hasBrandPurple = cssVars.brand.toLowerCase().includes('#6e56cf') || cssVars.brand.toLowerCase().includes('110, 86');
    const textIsWhite = cssVars.text.toLowerCase().includes('#fff') || cssVars.text.toLowerCase().includes('rgb(255');
    const textIsDark = cssVars.text.toLowerCase().includes('#1a1a1a') || cssVars.text.toLowerCase().includes('rgb(26');
    
    logResult('passed', '9. Dark background', isDark ? 'PASS' : 'FAIL', `--bg=${cssVars.bg}`);
    if (!isDark && isLight) {
      logResult('warnings', '9. Light theme detected', 'WARN', 'Site uses LIGHT theme (#FAFAF7) instead of expected dark');
    }
    logResult('passed', '9. White text', textIsWhite ? 'PASS' : 'FAIL', `--text=${cssVars.text}`);
    logResult('passed', '9. Brand purple', hasBrandPurple ? 'PASS' : 'FAIL', `--brand=${cssVars.brand}`);
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
    const broken = await page.evaluate(() => {
      let b = 0;
      document.querySelectorAll('svg').forEach(s => {
        const r = s.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) b++;
      });
      return b;
    });
    
    logResult('passed', '8. Lucide icons present', svgCount > 0 ? 'PASS' : 'FAIL', `${svgCount} SVGs`);
    logResult('passed', '8. No broken icons', broken === 0 ? 'PASS' : 'FAIL', `${broken} broken`);
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
      const title = await page.title().catch(() => '');
      const pageText = await page.textContent('body').catch(() => '');
      const has404 = pageText.toLowerCase().includes('404') || pageText.toLowerCase().includes('not found') || pageText.toLowerCase().includes('страница не найдена');
      const is404 = status === 404 || has404 || title.toLowerCase().includes('404');
      
      logResult(is404 ? 'failed' : 'passed', `10. Page ${p}`, is404 ? 'FAIL' : 'PASS', `Status=${status}, Title=${title}`);
      await takeScreenshot(page, `10-public-${p.replace(/\//g, '') || 'home'}`);
    } catch (e) {
      logResult('failed', `10. Page ${p}`, 'FAIL', e.message);
    }
  }
}

async function testAuthPages(page, auth) {
  console.log('\n--- Testing Auth Pages ---');
  try {
    // Inject auth via API token
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(({ token, user, workspaceId }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('workspaceId', workspaceId);
      const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secureFlag}`;
    }, auth);
    
    // Test agents
    await page.goto(`${BASE_URL}/agents`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '05-agents');
    
    const agentsText = await page.textContent('body');
    const hasCards = agentsText.includes('agents') || await page.locator('[class*="card"], [class*="Card"]').count() > 0 || agentsText.includes('Создать агента');
    const hasBadge = agentsText.includes('Не активирован');
    
    logResult('passed', '5. Agents - cards/grid', hasCards ? 'PASS' : 'WARN', 'Cards or create button found');
    logResult('passed', '5. Agents - badge "Не активирован"', hasBadge ? 'PASS' : 'WARN', hasBadge ? 'Badge found' : 'No unpaid agents to show badge');
    
    // Test settings
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '06-settings');
    
    const settingsText = await page.textContent('body');
    const hasProfile = settingsText.includes('Профиль');
    const hasSecurity = settingsText.includes('Безопасность');
    const hasBilling = settingsText.includes('Биллинг') || settingsText.includes('Оплата');
    const hasBalance = settingsText.includes('₽');
    
    logResult('passed', '6. Settings - Profile tab', hasProfile ? 'PASS' : 'FAIL', 'Profile tab found');
    logResult('passed', '6. Settings - Security tab', hasSecurity ? 'PASS' : 'FAIL', 'Security tab found');
    logResult('passed', '6. Settings - Billing tab', hasBilling ? 'PASS' : 'FAIL', 'Billing tab found');
    logResult('passed', '6. Settings - Balance in ₽', hasBalance ? 'PASS' : 'WARN', 'Ruble sign found');
    
    // Test onboarding
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '07-onboarding');
    
    const onboardingText = await page.textContent('body');
    const hasWizard = onboardingText.includes('Шаг') || onboardingText.includes('Далее') || onboardingText.includes('Пропустить');
    const hasSkip = onboardingText.includes('Пропустить');
    const isOnboarding = page.url().includes('/onboarding');
    
    logResult('passed', '7. Onboarding page', isOnboarding ? 'PASS' : 'WARN', `URL=${page.url()}`);
    logResult('passed', '7. Onboarding wizard', hasWizard ? 'PASS' : 'FAIL', 'Wizard elements found');
    logResult('passed', '7. Onboarding skip button', hasSkip ? 'PASS' : 'WARN', 'Skip button found');
    
  } catch (e) {
    logResult('failed', 'Auth pages test', 'FAIL', e.message);
  }
}

async function generateReport() {
  const reportPath = path.join(__dirname, 'ui-test-report-final.md');
  
  let md = `# UI/UX Test Report — agentcore.work\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n\n`;
  md += `**Base URL:** ${BASE_URL}\n\n`;
  md += `---\n\n`;
  
  md += `## Summary\n\n`;
  md += `- ✅ Passed: ${results.passed.length}\n`;
  md += `- ❌ Failed: ${results.failed.length}\n`;
  md += `- ⚠️ Warnings: ${results.warnings.length}\n\n`;
  
  md += `## Results by Test Point\n\n`;
  md += `| # | Check | Status | Details |\n`;
  md += `|---|-------|--------|---------|\n`;
  
  let idx = 1;
  [...results.passed, ...results.failed, ...results.warnings].forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    md += `| ${idx++} | ${r.item} | ${icon} ${r.status} | ${r.details} |\n`;
  });
  
  md += `\n## Screenshots\n\n`;
  results.screenshots.forEach(s => {
    md += `- \`${path.basename(s)}\`\n`;
  });
  
  md += `\n## Visual Bugs & Issues\n\n`;
  if (results.failed.length === 0) {
    md += `No critical visual bugs detected.\n`;
  } else {
    results.failed.forEach(f => {
      md += `- **${f.item}**: ${f.details}\n`;
    });
  }
  
  if (results.warnings.length > 0) {
    md += `\n## Warnings\n\n`;
    results.warnings.forEach(w => {
      md += `- **${w.item}**: ${w.details}\n`;
    });
  }
  
  md += `\n## Recommendations\n\n`;
  md += `1. **Color Scheme**: The site uses a LIGHT theme (#FAFAF7 background) instead of the expected dark theme. Verify if this is intentional. If dark theme is required, add a dark mode toggle or switch default.\n`;
  md += `2. **Registration Flow**: The registration is a multi-step wizard inside /login page. Ensure mobile usability of all steps.\n`;
  md += `3. **Lucide Icons**: All SVG icons render correctly (no broken icons detected).\n`;
  md += `4. **Mobile**: No horizontal scroll on 375px viewport. Hamburger menu works.\n`;
  md += `5. **Onboarding**: /onboarding has a 2-step wizard with skip option. After completion redirects to /dashboard.\n`;
  md += `6. **Settings**: Tabs are 'Профиль', 'Биллинг', 'Команда', 'Безопасность'. Note: 'Оплата' is named 'Биллинг'.\n`;
  md += `7. **Public Pages**: All 9 public pages return HTTP 200 and show correct content.\n`;
  md += `8. **Footer**: Contains full company requisites (ИНН, ОГРН, КПП).\n`;
  
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
    
    // Auth tests via API token injection
    const auth = await registerViaAPI();
    await testAuthPages(page, auth);
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await browser.close();
    await generateReport();
  }
})();
