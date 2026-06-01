// Set test environment variables BEFORE importing server (which validates env on load)
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://agentcore:agentcore2026@localhost:5432/agentcore?schema=public';
process.env.JWT_SECRET = 'test-secret-key-not-for-production';
process.env.SUGGY_PROJECT_KEY = 'sk_proj_test123';
process.env.SUGGY_BASE_URL = 'https://api.suggy.lol/v1';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.WEBCHAT_API_KEY = 'test-webchat-key';
process.env.MODEL_CACHE_TTL = '60000';

const { prisma } = require('../prisma-client');

beforeAll(async () => {
  // Clean all test data before starting test suite
  // Order matters due to foreign key constraints
  try {
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.cRMContact.deleteMany({});
    await prisma.knowledgeDocument.deleteMany({});
    await prisma.billingTransaction.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.workspace.deleteMany({});
  } catch (e) {
    // Ignore cleanup errors in case tables don't exist yet
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
