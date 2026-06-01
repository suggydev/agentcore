process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://agentcore:agentcore2026@localhost:5432/agentcore?schema=public';
process.env.JWT_SECRET = 'test-secret-key-not-for-production';
process.env.SUGGY_PROJECT_KEY = 'sk_proj_test123';
process.env.SUGGY_BASE_URL = 'https://api.suggy.lol/v1';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.WEBCHAT_API_KEY = 'test-webchat-key';
process.env.MODEL_CACHE_TTL = '60000';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32bytes!!';

const { encrypt, decrypt, hashSecret, verifyHmac } = require('../../utils/encryption');

function createMockProvider(providerName, ProviderClass) {
  const instance = new ProviderClass();
  const mockExecute = jest.fn();
  instance.execute = mockExecute;
  return { instance, mockExecute };
}

function createMockIntegration(overrides = {}) {
  return {
    id: 'test-integration-id',
    agentId: 'test-agent-id',
    provider: 'telegram',
    credentials: encrypt(JSON.stringify({ botToken: 'test-token' })),
    status: 'active',
    webhookUrl: 'https://api.agentcore.work/api/webhooks/telegram/test-agent-id',
    webhookSecret: 'test-secret',
    lastHealthCheck: null,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function mockAxiosSuccess(data) {
  return { data, status: 200, headers: {} };
}

function mockAxiosError(status, message) {
  const err = new Error(message || 'Request failed');
  err.response = { status, data: { error: message }, headers: {} };
  return err;
}

module.exports = {
  createMockProvider,
  createMockIntegration,
  mockAxiosSuccess,
  mockAxiosError,
  encryption: { encrypt, decrypt, hashSecret, verifyHmac }
};
