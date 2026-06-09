const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const { app, prisma } = require('../server');

describe('Conversations API', () => {
  const uniqueId = Date.now();
  let authToken;
  let workspaceId;
  let conversationId;

  beforeAll(async () => {
    // Cleanup before this test suite
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.cRMContact.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.workspace.deleteMany({});

    const registerRes = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({
        name: 'Conv Test User',
        email: `convtest_${uniqueId}@example.com`,
        password: 'securePassword123'
      });

    authToken = registerRes.body.accessToken;
    workspaceId = registerRes.body.workspaceId;
  });

  afterAll(async () => {
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.workspace.deleteMany({});
  });

  describe('POST /api/conversations', () => {
    it('should create a new conversation', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Conversation',
          agentId: null
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Test Conversation');
      expect(res.body.workspaceId).toBe(workspaceId);
      conversationId = res.body.id;
    });

    it('should create conversation with default title', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Conversation');
    });
  });

  describe('GET /api/conversations', () => {
    it('should return paginated conversations', async () => {
      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/conversations/:id', () => {
    it('should return conversation with messages', async () => {
      const res = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(conversationId);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('should return 404 for non-existent conversation', async () => {
      const res = await request(app)
        .get('/api/conversations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/conversations/:id/messages', () => {
    it('should add a user message and get AI response structure', async () => {
      const res = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Hello, this is a test message',
          role: 'user'
        });

      expect(res.status).toBe(200);
      // When role=user, endpoint returns { userMessage, aiMessage } (or error variant)
      expect(res.body).toHaveProperty('userMessage');
      expect(res.body.userMessage.content).toBe('Hello, this is a test message');
      expect(res.body.userMessage.role).toBe('user');
      expect(res.body).toHaveProperty('aiMessage');
      expect(res.body).toHaveProperty('model_used');
    });

    it('should add a system message without AI response', async () => {
      const res = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'System instruction',
          role: 'system'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message.content).toBe('System instruction');
      expect(res.body.message.role).toBe('system');
    });

    it('should return 404 for non-existent conversation', async () => {
      const res = await request(app)
        .post('/api/conversations/non-existent-id/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test message',
          role: 'user'
        });

      expect(res.status).toBe(404);
    });

    it('should reject request without auth', async () => {
      const res = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .send({
          content: 'No auth message',
          role: 'user'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/chat/completions persistence', () => {
    // NOTE: This test requires a valid Suggy API key.
    // With test/fallback keys it returns 401 from the external API.
    // It validates real persistence behavior when external API is available.
    it.skip('should persist conversation and messages before external API call', async () => {
      const messageContent = 'Persistence test question';
      const res = await request(app)
        .post('/api/v1/chat/completions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [
            { role: 'user', content: messageContent }
          ],
          model: 'accounts/fireworks/models/glm-5p1',
          stream: false
        });

      // Suggy API may return 200 (success) or 401/429/500/504 depending on key validity
      // We accept any status to verify persistence behavior
      expect([200, 401, 429, 500, 504]).toContain(res.status);

      // Verify conversation was persisted BEFORE external API call
      const convs = await prisma.conversation.findMany({
        where: { workspaceId, title: { contains: messageContent.substring(0, 10) } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { messages: true }
      });
      
      expect(convs.length).toBeGreaterThan(0);
      expect(convs[0].messages.length).toBeGreaterThanOrEqual(1);
      const userMessage = convs[0].messages.find(m => m.role === 'user');
      expect(userMessage).toBeTruthy();
      expect(userMessage.content).toBe(messageContent);
    });

    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/v1/chat/completions')
        .send({
          messages: [{ role: 'user', content: 'Hello' }]
        });

      expect(res.status).toBe(401);
    });
  });
});
