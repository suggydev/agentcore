# Bug Report: AgentCore v3 Production Testing

## Testing Date: 2026-06-09
## Testing Agents: 25 parallel agents
## Target: https://agentcore.work

## Critical Bugs Found

### 1. CRITICAL: Database Schema Mismatch - Missing `plan` column in Workspace table
- **Severity**: CRITICAL
- **Impact**: New user registration fails completely
- **Error**: `Invalid prisma.workspace.create() invocation: The column plan does not exist in the current database.`
- **Location**: `/api/auth/register`
- **Reproduction**: Try to register any new user
- **Fix Required**: Run migration to add `plan` column to Workspace table

### 2. CRITICAL: Database Schema Mismatch - Missing `SUPERADMIN` in UserRole enum
- **Severity**: CRITICAL
- **Impact**: Login fails for existing users
- **Error**: `Invalid prisma.user.findUnique() invocation: Value 'SUPERADMIN' not found in enum 'UserRole'`
- **Location**: `/api/auth/login`
- **Reproduction**: Try to login with existing credentials
- **Fix Required**: Update UserRole enum to include SUPERADMIN

### 3. HIGH: Rate Limiting Too Aggressive
- **Severity**: HIGH
- **Impact**: Testing blocked, legitimate users may be blocked
- **Error**: `429 Too Many Attempts`
- **Location**: `/api/auth/register`
- **Reproduction**: Multiple registration attempts within short time
- **Fix Required**: Adjust rate limiting settings for production

### 4. MEDIUM: Missing data-testid attributes
- **Severity**: MEDIUM
- **Impact**: E2E testing difficult, maintenance hard
- **Description**: Frontend components lack `data-testid` attributes
- **Fix Required**: Add `data-testid` to all interactive elements

### 5. MEDIUM: Test Infrastructure Incomplete
- **Severity**: MEDIUM
- **Impact**: Cannot run automated tests reliably
- **Description**: 
  - No CI/CD pipeline for automated testing
  - No test database setup
  - No test fixtures
- **Fix Required**: Complete test infrastructure

## Frontend Issues

### 6. LOW: Registration form multi-step navigation
- **Severity**: LOW
- **Impact**: UX confusion
- **Description**: Registration requires 3 steps, but error handling between steps unclear
- **Fix Required**: Add progress indicators and better error messages

### 7. LOW: Mobile menu accessibility
- **Severity**: LOW
- **Impact**: Mobile UX
- **Description**: Mobile menu toggle lacks aria-label
- **Fix Required**: Add accessibility attributes

## API Issues

### 8. MEDIUM: API error messages not user-friendly
- **Severity**: MEDIUM
- **Impact**: User experience
- **Description**: Database errors exposed directly to users
- **Fix Required**: Sanitize error messages

### 9. MEDIUM: Missing health check for database schema
- **Severity**: MEDIUM
- **Impact**: Deployment verification
- **Description**: Health check only checks connection, not schema compatibility
- **Fix Required**: Add schema version check to health endpoint

## Recommended Fixes Priority

1. **URGENT**: Run database migration to add missing columns and enum values
2. **HIGH**: Fix rate limiting configuration
3. **HIGH**: Add proper error handling to prevent database errors leaking to users
4. **MEDIUM**: Add data-testid attributes to frontend
5. **MEDIUM**: Complete test infrastructure
6. **LOW**: Improve mobile UX

## SQL Migration Required

See: `packages/prisma/migrations/20240609_fix_production/migration.sql`

## Testing Coverage

- ✅ Landing page loads
- ✅ Mobile responsive works
- ✅ FAQ section displays
- ✅ Pricing section displays
- ✅ Login form displays
- ✅ Registration form displays
- ❌ User registration fails (database issue)
- ❌ User login fails (database issue)
- ⚠️ Brain map editor loads but needs testing
- ⚠️ Chat interface loads but needs testing
- ⚠️ Settings page loads but needs testing
- ⚠️ Knowledge base loads but needs testing

## Next Steps

1. Apply database migration
2. Re-run all 25 test agents
3. Verify all critical paths work
4. Run regression tests
