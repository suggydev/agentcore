const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const { app, prisma } = require('../server');

describe('Agents CRUD', () => {
  const uniqueId = Date.now();
  let authToken;
  let workspaceId;
  let testAgentId;

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
        name: 'Agent Test User',
        email: `agenttest_${uniqueId}@example.com`,
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

  describe('GET /api/agents', () => {
    it('should return paginated agents list with default pagination', async () => {
      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should respect custom pagination', async () => {
      const res = await request(app)
        .get('/api/agents?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.limit).toBe(2);
    });
  });

  describe('POST /api/agents', () => {
    it('should create a new agent', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Support Agent',
          description: 'Test agent for support',
          model: 'accounts/fireworks/models/glm-5p1',
          systemPrompt: 'You are a test support agent.',
          temperature: 0.5,
          maxTokens: 1000
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Support Agent');
      expect(res.body.workspaceId).toBe(workspaceId);
      testAgentId = res.body.id;
    });

    it('should reject request without auth', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({ name: 'No Auth Agent' });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/agents/:id', () => {
    it('should update an existing agent', async () => {
      const res = await request(app)
        .put(`/api/agents/${testAgentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Agent Name',
          description: 'Updated description'
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Agent Name');
      expect(res.body.description).toBe('Updated description');
    });

    it('should return 404 for non-existent agent', async () => {
      const res = await request(app)
        .put('/api/agents/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Ghost Agent' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should delete an existing agent', async () => {
      const res = await request(app)
        .delete(`/api/agents/${testAgentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent agent', async () => {
      const res = await request(app)
        .delete('/api/agents/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
