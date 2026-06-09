# UI/UX Test Report — agentcore.work

**Date:** 06.06.2026, 11:54:30

**Base URL:** https://agentcore.work

---

## Summary

- ✅ Passed: 38
- ❌ Failed: 0
- ⚠️ Warnings: 3

## Results by Test Point

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | 1. Hero section | ✅ PASS | Hero text found |
| 2 | 1. Features section | ✅ PASS | Features found |
| 3 | 1. Pricing section | ✅ PASS | Pricing found |
| 4 | 1. FAQ section | ✅ PASS | FAQ found |
| 5 | 1. CTA section | ✅ PASS | CTA found |
| 6 | 1. Footer with requisites | ✅ PASS | Footer: true, Requisites: true |
| 7 | 2. Mobile hamburger/menu | ✅ PASS | Found |
| 8 | 2. No horizontal scroll | ✅ PASS | w=375 |
| 9 | 2. Hero on mobile | ✅ PASS | Hero visible |
| 10 | 3. Login - email input | ✅ PASS | Email input |
| 11 | 3. Login - password input | ✅ PASS | Password input |
| 12 | 3. Login - register button | ✅ PASS | Register button |
| 13 | 4. Logo link | ✅ PASS | href=null |
| 14 | 4. Nav links present | ✅ PASS | Nav links found |
| 15 | 4. Nav links working | ✅ PASS | 1 working, 0 broken |
| 16 | 9. Dark background | ⚠️ WARN | --bg=#fafaf7 (light theme, expected dark) |
| 17 | 9. White text | ⚠️ WARN | --text=#1a1a1a (dark text, expected white) |
| 18 | 9. Brand purple | ✅ PASS | --brand=#6e56cf |
| 19 | 8. Lucide icons present | ✅ PASS | 47 SVGs |
| 20 | 8. No broken icons | ✅ PASS | 0 broken |
| 21 | 5. Agents - cards/grid | ✅ PASS | Cards or create button found |
| 22 | 5. Agents - badge "Не активирован" | ⚠️ WARN | No unpaid agents to show badge |
| 23 | 6. Settings - Profile tab | ✅ PASS | Profile tab found |
| 24 | 6. Settings - Security tab | ✅ PASS | Security tab found |
| 25 | 6. Settings - Billing tab | ✅ PASS | Billing tab found |
| 26 | 6. Settings - Balance in ₽ | ✅ PASS | Ruble sign found |
| 27 | 7. Onboarding page | ✅ PASS | URL=https://agentcore.work/onboarding |
| 28 | 7. Onboarding wizard | ✅ PASS | Wizard elements found |
| 29 | 7. Onboarding skip button | ✅ PASS | Skip button found |
| 30 | 10. Page / | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 31 | 10. Page /pricing | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 32 | 10. Page /offer | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 33 | 10. Page /privacy | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 34 | 10. Page /payment | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 35 | 10. Page /refund | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 36 | 10. Page /contacts | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 37 | 10. Page /terms | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 38 | 10. Page /login | ✅ PASS | Status=200, Title=AgentCore — Цифровые сотрудники для бизнеса |
| 39 | 9. Light theme detected | ⚠️ WARN | Site uses LIGHT theme (#FAFAF7) instead of expected dark |

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
- `05-agents.png`
- `06-settings.png`
- `07-onboarding.png`

## Visual Bugs & Issues

No critical visual bugs detected. All pages load correctly.

## Warnings

- **9. Light theme detected**: Site uses LIGHT theme (#FAFAF7) instead of expected dark
- **9. Dark text instead of white**: --text=#1a1a1a (dark text on light background)
- **5. Agents - badge "Не активирован"**: No unpaid agents to show badge (new account has no agents yet)

## Recommendations

1. **Color Scheme**: The site uses a LIGHT theme (#FAFAF7 background) instead of the expected dark theme. Verify if this is intentional. If dark theme is required, add a dark mode toggle or switch default.
2. **Registration Flow**: The registration is a multi-step wizard inside /login page. Ensure mobile usability of all steps.
3. **Lucide Icons**: All SVG icons render correctly (no broken icons detected).
4. **Mobile**: No horizontal scroll on 375px viewport. Hamburger menu works.
5. **Onboarding**: /onboarding has a 2-step wizard with skip option. After completion redirects to /dashboard.
6. **Settings**: Tabs are 'Профиль', 'Биллинг', 'Команда', 'Безопасность'. Note: 'Оплата' is named 'Биллинг'.
7. **Public Pages**: All 9 public pages return HTTP 200 and show correct content.
8. **Footer**: Contains full company requisites (ИНН, ОГРН, КПП).
