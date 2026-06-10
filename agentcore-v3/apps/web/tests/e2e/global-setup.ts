import { request, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  const authDir = path.join(__dirname, '../../playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const authFile = path.join(authDir, 'user.json');
  const email = 'test-global-e2e@agentcore.work';
  const password = 'TestPass123!';
  const apiBase = 'https://api.agentcore.work';

  // If auth state file exists and is recent (< 1 hour), reuse it
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const ageMs = Date.now() - stats.mtimeMs;
    const oneHour = 60 * 60 * 1000;
    if (ageMs < oneHour) {
      console.log('Reusing existing auth state (age:', Math.round(ageMs / 1000), 's)');
      process.env.TEST_EMAIL = email;
      process.env.TEST_PASSWORD = password;
      return;
    }
  }

  // Helper to make API requests with retries
  async function apiRequest(method: string, url: string, data?: object, retries = 3): Promise<any> {
    const apiContext = await request.newContext({
      baseURL: apiBase,
    });

    try {
      let lastError: Error | null = null;
      
      for (let i = 0; i < retries; i++) {
        try {
          let response;
          if (method === 'POST') {
            response = await apiContext.post(url, { data });
          } else if (method === 'GET') {
            response = await apiContext.get(url);
          } else {
            throw new Error(`Unsupported method: ${method}`);
          }

          const body = await response.json().catch(() => ({}));
          
          if (response.ok()) {
            return { status: response.status(), body };
          }

          // If "Too many attempts", wait and retry
          if (body.error === 'Too many attempts' || response.status() === 429) {
            console.log(`Rate limited, waiting ${(i + 1) * 2}s before retry...`);
            await new Promise(r => setTimeout(r, (i + 1) * 2000));
            lastError = new Error(`Rate limited: ${JSON.stringify(body)}`);
            continue;
          }

          return { status: response.status(), body };
        } catch (err) {
          lastError = err as Error;
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, (i + 1) * 1000));
          }
        }
      }
      
      throw lastError || new Error('All retries failed');
    } finally {
      await apiContext.dispose();
    }
  }

  // Step 1: Try to login first (user might already exist)
  console.log('Attempting to login with existing test user...');
  const loginResult = await apiRequest('POST', '/api/auth/login', {
    email,
    password,
  });

  if (loginResult.status === 200 && loginResult.body.accessToken) {
    console.log('✅ Test user already exists, reusing');
  } else {
    console.log('Test user not found, registering...');
    
    // Step 2: Register the user
    const registerResult = await apiRequest('POST', '/api/auth/register', {
      name: 'E2E Test User',
      email,
      password,
      companyName: 'E2E Test Company',
      companySize: '2-10',
      industry: 'Технологии',
      source: 'search',
      purpose: 'sales',
    });

    if (registerResult.status === 201 || registerResult.status === 200) {
      console.log('✅ Test user registered successfully');
    } else if (registerResult.body.error?.includes('already exists') || registerResult.body.error?.includes('Already registered')) {
      console.log('User already exists (registration conflict), proceeding');
    } else {
      console.error('Registration failed:', registerResult.body);
      throw new Error(`Failed to register test user: ${JSON.stringify(registerResult.body)}`);
    }
  }

  // Step 3: Login via browser to save storage state
  console.log('Logging in via browser to save auth state...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: 'https://agentcore.work',
  });
  const page = await context.newPage();

  try {
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check if already logged in (redirect to dashboard)
    if (page.url().includes('/dashboard') || page.url().includes('/onboarding')) {
      console.log('Already logged in (redirected to dashboard)');
    } else {
      // Fill login form
      await page.getByTestId('login-email').fill(email);
      await page.getByTestId('login-password').fill(password);
      await page.getByTestId('login-submit').click();
      
      // Wait for navigation to dashboard or onboarding
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });
      console.log('✅ Browser login successful');
    }

    // Save storage state
    await context.storageState({ path: authFile });
    console.log(`✅ Auth state saved to ${authFile}`);
  } catch (err) {
    console.error('Browser login failed:', err);
    throw err;
  } finally {
    await browser.close();
  }

  // Set env vars for tests
  process.env.TEST_EMAIL = email;
  process.env.TEST_PASSWORD = password;
  console.log('Global setup complete');
}
