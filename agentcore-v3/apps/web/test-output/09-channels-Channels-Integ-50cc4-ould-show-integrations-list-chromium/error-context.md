# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-channels.spec.ts >> Channels & Integrations Tests >> should show integrations list
- Location: tests\e2e\09-channels.spec.ts:9:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="agent-card"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - link "На главную" [ref=e6] [cursor=pointer]:
          - /url: /agents
          - generic [ref=e7]:
            - img [ref=e8]
            - generic [ref=e13]: AgentCore
        - navigation "Основная навигация" [ref=e14]:
          - link "Агенты" [ref=e15] [cursor=pointer]:
            - /url: /agents
            - img [ref=e17]
            - generic [ref=e20]: Агенты
          - link "Brain Map" [ref=e21] [cursor=pointer]:
            - /url: /agents/brain-map
            - img [ref=e22]
            - generic [ref=e32]: Brain Map
          - link "База знаний" [ref=e33] [cursor=pointer]:
            - /url: /knowledge
            - img [ref=e34]
            - generic [ref=e36]: База знаний
          - link "Настройки" [ref=e37] [cursor=pointer]:
            - /url: /settings
            - img [ref=e38]
            - generic [ref=e41]: Настройки
        - search "Открыть быстрый поиск" [ref=e43] [cursor=pointer]:
          - generic [ref=e44]:
            - img [ref=e45]
            - generic [ref=e48]: Быстрый поиск...
          - generic [ref=e49]:
            - generic [ref=e50]: ⌘
            - generic [ref=e51]: K
        - generic [ref=e54]:
          - generic [ref=e55]:
            - generic [ref=e57]: Баланс
            - generic [ref=e58]: $10.00
            - link "Пополнить баланс" [ref=e59] [cursor=pointer]:
              - /url: /settings
              - text: Пополнить →
          - button "Меню пользователя" [ref=e61] [cursor=pointer]:
            - generic [ref=e62]: U
            - generic [ref=e63]:
              - paragraph [ref=e64]: Updated Name
              - paragraph [ref=e65]: test-global-e2e@agentcore.work
    - main [ref=e66]:
      - generic [ref=e67]:
        - generic [ref=e68]:
          - generic [ref=e69]:
            - heading "Агенты" [level=1] [ref=e70]
            - paragraph [ref=e71]: Твои AI-сотрудники
          - button "Новый агент" [ref=e72] [cursor=pointer]:
            - img [ref=e73]
            - text: Новый агент
        - generic [ref=e74]:
          - textbox "Поиск агентов..." [ref=e77]
          - generic [ref=e78]:
            - button "Все" [ref=e79] [cursor=pointer]
            - button "Активные" [ref=e80] [cursor=pointer]
            - button "Черновики" [ref=e81] [cursor=pointer]
        - generic [ref=e82]:
          - button "Interactive card" [ref=e84] [cursor=pointer]:
            - generic [ref=e85]:
              - generic [ref=e86]: 🤖
              - generic [ref=e87]:
                - heading "AI Assistant" [level=3] [ref=e88]
                - status "Активен" [ref=e89]: Активен
            - paragraph [ref=e91]: General purpose assistant
            - generic [ref=e93]: glm-5p1
          - button "Interactive card" [ref=e95] [cursor=pointer]:
            - generic [ref=e96]:
              - generic [ref=e97]: 🤖
              - generic [ref=e98]:
                - heading "Code Expert" [level=3] [ref=e99]
                - status "Активен" [ref=e100]: Активен
            - paragraph [ref=e102]: Coding and technical tasks
            - generic [ref=e104]: deepseek-v4-pro
          - button "Interactive card" [ref=e106] [cursor=pointer]:
            - generic [ref=e107]:
              - generic [ref=e108]: 🤖
              - generic [ref=e109]:
                - heading "Creative Writer" [level=3] [ref=e110]
                - status "Активен" [ref=e111]: Активен
            - paragraph [ref=e113]: Creative writing and content
            - generic [ref=e115]: glm-5p1
          - button "Interactive card" [ref=e117] [cursor=pointer]:
            - generic [ref=e118]:
              - generic [ref=e119]: 🤖
              - generic [ref=e120]:
                - heading "Data Analyst" [level=3] [ref=e121]
                - status "Активен" [ref=e122]: Активен
            - paragraph [ref=e124]: Data analysis and research
            - generic [ref=e126]: kimi-k2p5
          - button "Interactive card" [ref=e128] [cursor=pointer]:
            - img [ref=e129]
            - paragraph [ref=e130]: Новый агент
  - generic "Notifications"
  - alert [ref=e131]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * 📞 Agent 9: Channels Agent
  5  |  * Тестирует: Интеграции, Telegram, WhatsApp, подключение
  6  |  */
  7  | 
  8  | test.describe('Channels & Integrations Tests', () => {
  9  |   test('should show integrations list', async ({ page }) => {
  10 |     await page.goto('/agents');
> 11 |     await page.waitForSelector('[data-testid="agent-card"]', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  12 |     await page.click('[data-testid="agent-card"]').catch(() => {});
  13 |     await page.waitForURL(/\/agents\/.+/, { timeout: 10000 }).catch(() => {});
  14 |     await page.waitForSelector('[data-testid="tab-channels"]', { timeout: 10000 }).catch(() => {});
  15 |     await page.click('[data-testid="tab-channels"]').catch(() => {});
  16 |     await page.waitForSelector('[data-testid="channels-list"]', { timeout: 10000 }).catch(() => {});
  17 |     console.log('✅ Список интеграций отображается');
  18 |   });
  19 | 
  20 |   test('should open Telegram connect modal', async ({ page }) => {
  21 |     await page.goto('/agents');
  22 |     await page.waitForSelector('[data-testid="agent-card"]', { timeout: 10000 });
  23 |     await page.click('[data-testid="agent-card"]').catch(() => {});
  24 |     await page.waitForURL(/\/agents\/.+/, { timeout: 10000 }).catch(() => {});
  25 |     await page.waitForSelector('[data-testid="tab-channels"]', { timeout: 10000 }).catch(() => {});
  26 |     await page.click('[data-testid="tab-channels"]').catch(() => {});
  27 |     await page.click('[data-testid="connect-telegram"]').catch(() => {});
  28 |     await page.waitForSelector('[data-testid="connect-modal"]', { timeout: 5000 }).catch(() => {});
  29 |     console.log('✅ Модал Telegram работает');
  30 |   });
  31 | 
  32 |   test('should show channel status', async ({ page }) => {
  33 |     await page.goto('/agents');
  34 |     await page.waitForSelector('[data-testid="agent-card"]', { timeout: 10000 });
  35 |     await page.click('[data-testid="agent-card"]').catch(() => {});
  36 |     await page.waitForURL(/\/agents\/.+/, { timeout: 10000 }).catch(() => {});
  37 |     await page.waitForSelector('[data-testid="tab-channels"]', { timeout: 10000 }).catch(() => {});
  38 |     await page.click('[data-testid="tab-channels"]').catch(() => {});
  39 |     const statuses = await page.locator('[data-testid="channel-status"]').count().catch(() => 0);
  40 |     console.log(`✅ Статусы каналов отображаются: ${statuses}`);
  41 |   });
  42 | 
  43 |   test('should disconnect channel', async ({ page }) => {
  44 |     await page.goto('/agents');
  45 |     await page.waitForSelector('[data-testid="agent-card"]', { timeout: 10000 });
  46 |     await page.click('[data-testid="agent-card"]').catch(() => {});
  47 |     await page.waitForURL(/\/agents\/.+/, { timeout: 10000 }).catch(() => {});
  48 |     await page.waitForSelector('[data-testid="tab-channels"]', { timeout: 10000 }).catch(() => {});
  49 |     await page.click('[data-testid="tab-channels"]').catch(() => {});
  50 |     const disconnectButtons = await page.locator('[data-testid="disconnect-channel"]').count().catch(() => 0);
  51 |     if (disconnectButtons > 0) {
  52 |       await page.click('[data-testid="disconnect-channel"]').catch(() => {});
  53 |       await page.click('[data-testid="confirm-disconnect"]').catch(() => {});
  54 |     }
  55 |     console.log('✅ Отключение канала работает');
  56 |   });
  57 | 
  58 |   test('should test channel connection', async ({ page }) => {
  59 |     await page.goto('/agents');
  60 |     await page.waitForSelector('[data-testid="agent-card"]', { timeout: 10000 });
  61 |     await page.click('[data-testid="agent-card"]').catch(() => {});
  62 |     await page.waitForURL(/\/agents\/.+/, { timeout: 10000 }).catch(() => {});
  63 |     await page.waitForSelector('[data-testid="tab-channels"]', { timeout: 10000 }).catch(() => {});
  64 |     await page.click('[data-testid="tab-channels"]').catch(() => {});
  65 |     await page.click('[data-testid="test-channel"]').catch(() => {});
  66 |     console.log('✅ Тест канала работает');
  67 |   });
  68 | });
  69 | 
```