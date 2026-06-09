# Dependency Management

## Audit Schedule
- Weekly: `npm audit`
- Monthly: Full dependency review
- Quarterly: Major version upgrades

## Current Stack

### API (apps/api)
Core: express, prisma, zod
Security: helmet, cors, bcryptjs, jsonwebtoken
AI: axios (Suggy API)
Payments: yookassa

### Web (apps/web)
Framework: next, react, react-dom
State: zustand
Styling: tailwindcss
Animation: framer-motion, gsap
Icons: lucide-react

## Deprecation Policy
- Critical vulns: Fix within 24h
- High vulns: Fix within 1 week
- Moderate: Fix within next release
- Low: Track in backlog

## Known Issues

### API — `request` via `yookassa` (Critical)
`yookassa@0.1.1` depends on the deprecated `request` package, introducing 5 transitive vulns (2 critical, 3 moderate). No fix available upstream — `yookassa` is at latest version.
**Action**: Monitor yookassa for an axios-based release, or fork and replace `request` with `axios` internally.

### Web — `next@14.2.20` (High)
Next.js 14 has 14 accumulated vulns. Fix requires upgrading to `next@16.2.7` (major version bump).
**Action**: Plan migration from Next.js 14 → 16 when feasible.
