const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const { app, prisma } = require('../server');

describe('Auth Endpoints', () => {
  const uniqueId = Date.now();
  const testUser = {
    name: 'Test User',
    email: `test_${uniqueId}@example.com`,
    password: 'securePassword123'
  };

  let authToken;
  let createdWorkspaceId;

  beforeAll(async () => {
    // Ensure clean state for this test file
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.cRMContact.deleteMany({});
    await prisma.knowledgeDocument.deleteMany({});
    await prisma.billingTransaction.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.workspace.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup after all auth tests
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.workspace.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should create a new user with workspace and agents', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:3000')
        .send(testUser);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('workspaceId');
      expect(res.body.plan).toBe('TRIAL');
      expect(res.body).toHaveProperty('trialEndsAt');

      authToken = res.body.accessToken;
      createdWorkspaceId = res.body.workspaceId;

      // Verify workspace was created
      const workspace = await prisma.workspace.findUnique({
        where: { id: res.body.workspaceId }
      });
      expect(workspace).toBeTruthy();
      expect(workspace.plan).toBe('TRIAL');

      // Verify default agents were created
      const agents = await prisma.agent.findMany({
        where: { workspaceId: res.body.workspaceId }
      });
      expect(agents.length).toBe(4);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:3000')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email already registered');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:3000')
        .send({
          name: 'Bad',
          email: 'not-an-email',
          password: 'short'
        });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', 'http://localhost:3000')
        .send({
          name: 'Bad',
          email: `another_${uniqueId}@example.com`,
          password: '123'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({
          email: `nonexistent_${uniqueId}@example.com`,
          password: 'password123'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with workspace', async () => {
      // Re-login to get fresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('workspace');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBe('3.0.0');
      expect(res.body).toHaveProperty('models_loaded');
    });
  });
});
