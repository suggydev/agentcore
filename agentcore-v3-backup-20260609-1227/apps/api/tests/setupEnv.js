// Set test environment variables BEFORE any imports
// This file runs in setupFiles (before test files load)
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://agentcore:agentcore2026@localhost:5432/agentcore?schema=public';
process.env.JWT_SECRET = 'test-secret-key-not-for-production';
process.env.SUGGY_PROJECT_KEY = 'sk_proj_test123';
process.env.SUGGY_BASE_URL = 'https://api.suggy.lol/v1';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.WEBCHAT_API_KEY = 'test-webchat-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32bytes!!';
process.env.MODEL_CACHE_TTL = '60000';
