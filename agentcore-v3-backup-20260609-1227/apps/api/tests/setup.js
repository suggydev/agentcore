// Test lifecycle hooks (runs in setupFilesAfterEnv after imports)
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
