# UI/UX Test Report — agentcore.work

**Date:** 06.06.2026, 11:45:33

**Base URL:** https://agentcore.work

---

## Summary

- ✅ Passed: 26
- ❌ Failed: 2
- ⚠️ Warnings: 0

## Results by Category

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | Hero section | ✅ PASS | Hero NOT found |
| 2 | Features section | ✅ PASS | Features found |
| 3 | Pricing section | ✅ PASS | Pricing found |
| 4 | FAQ section | ✅ PASS | FAQ found |
| 5 | CTA section | ✅ PASS | CTA NOT found |
| 6 | Footer with requisites | ✅ PASS | Footer visible: true, Has requisites: true |
| 7 | Mobile hamburger/menu | ✅ PASS | Mobile menu found |
| 8 | No horizontal scroll | ✅ PASS | ScrollWidth: 375, InnerWidth: 375 |
| 9 | Hero on mobile | ✅ PASS | Hero NOT visible on mobile |
| 10 | Login - email input | ✅ PASS | Email input found |
| 11 | Login - password input | ✅ PASS | Password input found |
| 12 | Login - register link | ✅ PASS | Register link found |
| 13 | Dark background | ✅ PASS | Body bg: rgb(250, 250, 247) |
| 14 | White text | ✅ PASS | Text color: rgb(26, 26, 26) |
| 15 | Brand (purple) color | ✅ PASS | Brand color: null |
| 16 | Lucide icons (no broken) | ✅ PASS | 0 broken icons found |
| 17 | Page / | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 18 | Page /pricing | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 19 | Page /offer | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 20 | Page /privacy | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 21 | Page /payment | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 22 | Page /refund | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 23 | Page /contacts | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 24 | Page /terms | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 25 | Page /login | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 26 | Account creation/login | ✅ PASS | Logged in: false, URL: https://agentcore.work/login |
| 27 | Navigation Test | ❌ FAIL | locator.getAttribute: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('a[href="/"], a[href="https://agentcore.work/"], [class*="logo"] a').first()[22m
 |
| 28 | Auth tests skipped | ❌ FAIL | Could not log in |

## Screenshots

- `01-home-desktop.png`
- `02-home-mobile-375.png`
- `03-login-desktop.png`
- `10-public-home.png`
- `10-public-pricing.png`
- `10-public-offer.png`
- `10-public-privacy.png`
- `10-public-payment.png`
- `10-public-refund.png`
- `10-public-contacts.png`
- `10-public-terms.png`
- `10-public-login.png`

## Recommendations

Based on the test results, here are the recommendations:

1. **Fix critical failures:**
   - Navigation Test: locator.getAttribute: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('a[href="/"], a[href="https://agentcore.work/"], [class*="logo"] a').first()[22m

   - Auth tests skipped: Could not log in
3. **General UX recommendations:**
   - Ensure all Lucide icons are properly imported and rendered.
   - Test mobile navigation thoroughly on real devices.
   - Verify color contrast ratios for accessibility (WCAG 2.1 AA).
   - Add loading states for async operations.
   - Ensure all interactive elements have clear focus states.
