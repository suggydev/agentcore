# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 3.x     | :white_check_mark: |
| < 3.0   | :x:                |

## Reporting a Vulnerability

Report security issues to **security@agentcore.work**. Do not open public issues.

You will receive a response within 48 hours. We ask that you do not disclose the vulnerability publicly until it has been addressed.

## Security Guidelines

### Environment Variables

- Never commit `.env`, `.env.local`, `.env.production`, or `.env.development` files
- Use `.env.example` as a template — it must never contain real secrets
- Rotate secrets (JWT, encryption keys) immediately if exposed

### Authentication & Authorization

- JWT tokens expire in 7 days by default
- All API routes (except `/auth/*`, `/webchat/*`, health check) require authentication
- Passwords are hashed with bcrypt (12 rounds)
- Rate limiting is applied to all API endpoints

### API Security

- Helmet.js for security headers
- CORS restricted to allowed origins
- Input validation via Zod schemas
- SQL injection prevented via Prisma ORM (parameterized queries)

### Infrastructure

- HTTPS enforced via Let's Encrypt
- Nginx reverse proxy with security headers
- PM2 for process management with auto-restart
- Regular dependency updates (`npm audit`)

### Data Protection

- Encryption at rest for sensitive fields
- ENCRYPTION_KEY must be a 32-character random string
- Webhook secrets stored separately from app secrets
- API keys are stored hashed where possible

## Security Checklist for Deployments

- [ ] All `.env` files excluded from git
- [ ] `JWT_SECRET` is a strong random string
- [ ] `ENCRYPTION_KEY` is a 32-character random string
- [ ] YooKassa webhook secret set
- [ ] CORS origins match actual domains
- [ ] HTTPS is configured
- [ ] Rate limiting is active
- [ ] Database firewall restricts access to app server only
- [ ] `NODE_ENV=production` on production server
