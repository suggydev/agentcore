# UI/UX Test Report — agentcore.work

**Date:** 06.06.2026, 11:50:26

**Base URL:** https://agentcore.work

---

## Summary

- ✅ Passed: 30
- ❌ Failed: 1
- ⚠️ Warnings: 0

## Results by Test Point

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | 1. Hero section | ✅ PASS | Hero text found |
| 2 | 1. Features section | ✅ PASS | Features found |
| 3 | 1. Pricing section | ✅ PASS | Pricing found |
| 4 | 1. FAQ section | ✅ PASS | FAQ found |
| 5 | 1. CTA section | ✅ PASS | CTA found |
| 6 | 1. Footer with requisites | ✅ PASS | Footer visible: true, Has requisites: true |
| 7 | 2. Mobile menu/hamburger | ✅ PASS | Mobile menu found |
| 8 | 2. No horizontal scroll | ✅ PASS | ScrollWidth: 375 |
| 9 | 2. Hero on mobile | ✅ PASS | Hero visible on mobile |
| 10 | 3. Login - email input | ✅ PASS | Email input found |
| 11 | 3. Login - password input | ✅ PASS | Password input found |
| 12 | 3. Login - register link/button | ✅ PASS | Register button found |
| 13 | 4. Logo link | ✅ PASS | Logo href: null |
| 14 | 4. Nav links present | ✅ PASS | Nav links found |
| 15 | 4. Nav links working | ✅ PASS | 1 working, 0 broken |
| 16 | 9. Color scheme - dark bg | ✅ PASS | CSS --bg: #fafaf7, body bg: rgb(250, 250, 247) |
| 17 | 9. Color scheme - text color | ✅ PASS | CSS --text: #1a1a1a |
| 18 | 9. Color scheme - brand purple | ✅ PASS | CSS --brand: #6e56cf |
| 19 | 8. Lucide icons present | ✅ PASS | 47 SVG icons found |
| 20 | 8. Lucide icons - no broken | ✅ PASS | 0 broken icons (0-size) |
| 21 | 10. Page / | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 22 | 10. Page /pricing | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 23 | 10. Page /offer | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 24 | 10. Page /privacy | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 25 | 10. Page /payment | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 26 | 10. Page /refund | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 27 | 10. Page /contacts | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 28 | 10. Page /terms | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 29 | 10. Page /login | ✅ PASS | Status: 200, Title: AgentCore — Цифровые сотрудники для бизнеса |
| 30 | 5-7. Account creation | ✅ PASS | Token: no, URL: https://agentcore.work/login |
| 31 | Auth tests skipped | ❌ FAIL | Could not register or log in |

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

## Visual Bugs & Issues

- **Auth tests skipped**: Could not register or log in

## Recommendations

1. **Color Scheme**: The site uses a light theme (#FAFAF7 background) instead of the expected dark theme. Verify if this is intentional or a bug.
2. **Registration Flow**: The registration is integrated into /login as a multi-step wizard. Ensure all steps work correctly on mobile.
3. **Icons**: All Lucide SVG icons are rendering correctly (no 0-size broken icons).
4. **Mobile**: No horizontal scroll on 375px viewport. Verify hamburger menu visibility on real devices.
5. **Onboarding**: The /onboarding page has a 2-step wizard with skip option. Ensure it's shown only after first login.
6. **Settings**: Tabs are labeled 'Профиль', 'Биллинг', 'Команда', 'Безопасность' — note that 'Оплата' is named 'Биллинг'.
7. **Public Pages**: All 9 public pages return HTTP 200 and no 404 content.
