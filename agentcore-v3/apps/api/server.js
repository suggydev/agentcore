require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { z } = require('zod');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'agentcore-v3-secret-key-2026';
const SUGGY_API_KEY = process.env.SUGGY_API_KEY || 'sk-suggy-uTw2itn9EUHpGIIY8R1RQ3PZDca5CohPj1AOIV10k';
const SUGGY_BASE_URL = 'https://api.suggy.lol/v1';

// Model cache
let modelsCache = { data: [], timestamp: 0 };
const MODEL_CACHE_TTL = 60 * 1000; // 60 seconds

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));

// Auth middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Trial check middleware - restricts access if trial expired
async function checkTrial(req, res, next) {
  const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

  if (workspace.plan === 'TRIAL' && workspace.trialEndsAt && new Date() > workspace.trialEndsAt) {
    return res.status(402).json({
      error: 'Trial expired',
      message: 'Your free trial has ended. Please upgrade to continue using AgentCore.',
      upgrade_url: '/settings/billing'
    });
  }

  next();
}

// ============================
// MODELS & SMART ROUTING
// ============================

async function fetchModels() {
  const now = Date.now();
  if (now - modelsCache.timestamp < MODEL_CACHE_TTL && modelsCache.data.length > 0) {
    return modelsCache.data;
  }
  try {
    const response = await axios.get(`${SUGGY_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${SUGGY_API_KEY}` },
      timeout: 10000
    });
    modelsCache = {
      data: response.data.data || [],
      timestamp: now
    };
    return modelsCache.data;
  } catch (err) {
    console.error('Failed to fetch models:', err.message);
    return modelsCache.data.length > 0 ? modelsCache.data : [];
  }
}

function routeToModel(task, message, models) {
  const combined = ((task || '') + ' ' + (message || '')).toLowerCase();

  // Image generation
  if (/generate.*image|create.*picture|draw|paint|image.*of|illustration|art.*of/i.test(combined)) {
    return models.find(m => m.id.includes('flux-1-dev')) ||
           models.find(m => m.id.includes('flux-kontext-pro')) ||
           models.find(m => m.id.includes('flux') && m.supports_chat === false);
  }

  // Fast image generation
  if (/fast.*image|quick.*picture|rapid/i.test(combined)) {
    return models.find(m => m.id.includes('flux-1-schnell')) ||
           models.find(m => m.id.includes('flux'));
  }

  // Vision / image understanding
  if (/describe.*image|what.*in.*image|analyze.*photo|vision|look.*at.*this|photo.*of/i.test(combined) ||
      (message && (message.includes('data:image') || message.includes('http') && /\.(jpg|jpeg|png|gif|webp)/i.test(message)))) {
    return models.find(m => m.supports_image_input && m.supports_chat && m.id.includes('kimi')) ||
           models.find(m => m.supports_image_input && m.supports_chat);
  }

  // Long document analysis
  if (/analyze.*document|summarize.*long|read.*file|large.*text|book|paper|research|thesis|dissertation/i.test(combined)) {
    return models.find(m => m.context_length > 500000 && m.supports_chat) ||
           models.find(m => m.context_length > 200000 && m.supports_chat);
  }

  // Coding / technical
  if (/code|program|debug|function|script|algorithm|api|error|bug|fix|syntax|python|javascript|typescript|react|html|css|sql|database/i.test(combined)) {
    return models.find(m => m.id.includes('deepseek') && m.supports_chat) ||
           models.find(m => m.id.includes('gpt-oss') && m.supports_chat) ||
           models.find(m => m.supports_chat);
  }

  // Complex reasoning / math
  if (/reason|logic|math|solve|prove|complex|theorem|equation|calculate|analysis/i.test(combined)) {
    return models.find(m => m.id.includes('deepseek') && m.supports_chat) ||
           models.find(m => m.context_length > 200000 && m.supports_chat);
  }

  // Writing / creative
  if (/write|story|poem|essay|article|blog|creative|content|marketing|copy|email|letter/i.test(combined)) {
    return models.find(m => m.id.includes('glm') && m.supports_chat) ||
           models.find(m => m.id.includes('kimi') && m.supports_chat) ||
           models.find(m => m.supports_chat);
  }

  // General chat / default
  return models.find(m => m.id.includes('glm') && m.supports_chat) ||
         models.find(m => m.id.includes('kimi-k2p6') && m.supports_chat) ||
         models.find(m => m.supports_chat);
}

// ============================
// AUTH ENDPOINTS
// ============================

app.post('/api/auth/register', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      workspaceName: z.string().optional()
    });
    const data = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const workspace = await prisma.workspace.create({
      data: {
        name: data.workspaceName || data.name + "'s Workspace",
        plan: 'TRIAL',
        trialEndsAt,
        settings: {}
      }
    });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        workspaceId: workspace.id,
        role: 'OWNER'
      }
    });

    // Create default agents for the workspace with smart model routing
    const models = await fetchModels();
    const defaultModels = {
      assistant: routeToModel('general chat', 'hello', models)?.id || 'accounts/fireworks/models/glm-5p1',
      coder: routeToModel('coding', 'write code', models)?.id || 'accounts/fireworks/models/deepseek-v4-pro',
      creative: routeToModel('creative writing', 'write story', models)?.id || 'accounts/fireworks/models/glm-5p1',
      analyst: routeToModel('analyze document', 'analyze long text', models)?.id || 'accounts/fireworks/models/deepseek-v4-pro'
    };

    await prisma.agent.createMany({
      data: [
        { name: 'AI Assistant', description: 'General purpose assistant', workspaceId: workspace.id, model: defaultModels.assistant, systemPrompt: 'You are a helpful AI assistant.' },
        { name: 'Code Expert', description: 'Coding and technical tasks', workspaceId: workspace.id, model: defaultModels.coder, systemPrompt: 'You are an expert programmer. Write clean, well-documented code.' },
        { name: 'Creative Writer', description: 'Creative writing and content', workspaceId: workspace.id, model: defaultModels.creative, systemPrompt: 'You are a creative writer with excellent storytelling skills.' },
        { name: 'Data Analyst', description: 'Data analysis and research', workspaceId: workspace.id, model: defaultModels.analyst, systemPrompt: 'You are a data analyst and researcher. Provide thorough, evidence-based analysis.' }
      ],
      skipDuplicates: true
    });

    const token = jwt.sign({ userId: user.id, workspaceId: workspace.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaceId: workspace.id,
      plan: workspace.plan,
      trialEndsAt: workspace.trialEndsAt
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
    const token = jwt.sign({ userId: user.id, workspaceId: user.workspaceId, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaceId: user.workspaceId,
      plan: workspace?.plan || 'FREE',
      trialEndsAt: workspace?.trialEndsAt
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { workspace: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, workspace: user.workspace });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// MODELS ENDPOINT
// ============================

app.get('/api/v1/models', async (req, res) => {
  try {
    const models = await fetchModels();
    res.json({ object: 'list', data: models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// AI CHAT COMPLETIONS
// ============================

app.post('/api/v1/chat/completions', authenticate, checkTrial, async (req, res) => {
  try {
    const { messages, model, agentId, temperature = 0.7, max_tokens = 2000, stream = false } = req.body;

    let selectedModel = model;

    // If no model specified, use smart routing
    if (!selectedModel && messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const models = await fetchModels();
      const routed = routeToModel(lastMessage.role, lastMessage.content, models);
      selectedModel = routed ? routed.id : 'accounts/fireworks/models/glm-5p1';
    }

    // If agentId specified, get agent's model
    if (agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, workspaceId: req.user.workspaceId }
      });
      if (agent && agent.model) {
        selectedModel = agent.model;
      }
    }

    // Call Suggy API
    const response = await axios.post(
      `${SUGGY_BASE_URL}/chat/completions`,
      {
        model: selectedModel,
        messages: messages,
        temperature,
        max_tokens,
        stream
      },
      {
        headers: {
          'Authorization': `Bearer ${SUGGY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000,
        responseType: stream ? 'stream' : 'json'
      }
    );

    // If streaming, pipe through
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      response.data.pipe(res);
      return;
    }

    // Save conversation to database
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: req.user.workspaceId,
        agentId: agentId || null,
        userId: req.user.userId,
        title: messages[0]?.content?.substring(0, 50) || 'New Chat',
        messages: {
          create: messages.map((m, idx) => ({
            role: m.role,
            content: m.content,
            model: selectedModel,
            order: idx
          }))
        }
      },
      include: { messages: true }
    });

    res.json({
      ...response.data,
      _meta: {
        model_used: selectedModel,
        conversation_id: conversation.id
      }
    });
  } catch (err) {
    console.error('Chat completion error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error?.message || err.message,
      model: req.body.model || 'auto-routed'
    });
  }
});

// ============================
// IMAGE GENERATION
// ============================

app.post('/api/v1/images/generations', authenticate, async (req, res) => {
  try {
    const { prompt, n = 1, size = '1024x1024', model } = req.body;

    const models = await fetchModels();
    const imageModel = model ||
      models.find(m => m.id.includes('flux-1-dev'))?.id ||
      models.find(m => m.id.includes('flux'))?.id ||
      'accounts/fireworks/models/flux-1-dev-fp8';

    const response = await axios.post(
      `${SUGGY_BASE_URL}/images/generations`,
      { prompt, n, size, model: imageModel },
      {
        headers: {
          'Authorization': `Bearer ${SUGGY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    res.json({
      ...response.data,
      _meta: { model_used: imageModel }
    });
  } catch (err) {
    console.error('Image generation error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error?.message || err.message
    });
  }
});

// ============================
// AGENTS
// ============================

app.get('/api/agents', authenticate, async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { workspaceId: req.user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agents', authenticate, async (req, res) => {
  try {
    const { name, description, model, systemPrompt, temperature, maxTokens, isActive } = req.body;

    // Validate model exists
    const models = await fetchModels();
    const validModel = models.find(m => m.id === model);
    if (model && !validModel) {
      return res.status(400).json({ error: 'Invalid model selected' });
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        model: model || 'accounts/fireworks/models/glm-5p1',
        systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 2000,
        isActive: isActive !== false,
        workspaceId: req.user.workspaceId
      }
    });
    res.json(agent);
  } catch (err) {
    console.error('Create agent error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/agents/:id', authenticate, async (req, res) => {
  try {
    const { name, description, model, systemPrompt, temperature, maxTokens, isActive } = req.body;
    const agent = await prisma.agent.updateMany({
      where: { id: req.params.id, workspaceId: req.user.workspaceId },
      data: { name, description, model, systemPrompt, temperature, maxTokens, isActive }
    });
    res.json(agent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/agents/:id', authenticate, async (req, res) => {
  try {
    await prisma.agent.deleteMany({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================
// CONVERSATIONS
// ============================

app.get('/api/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { workspaceId: req.user.workspaceId },
      include: { agent: { select: { id: true, name: true } }, messages: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations', authenticate, async (req, res) => {
  try {
    const { title, agentId } = req.body;
    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'New Conversation',
        workspaceId: req.user.workspaceId,
        agentId: agentId || null
      }
    });
    res.json(conversation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/conversations/:id', authenticate, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId },
      include: { messages: { orderBy: { order: 'asc' } }, agent: true }
    });
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const { content, role = 'user', model } = req.body;
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, workspaceId: req.user.workspaceId }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const count = await prisma.message.count({ where: { conversationId: req.params.id } });
    const message = await prisma.message.create({
      data: {
        content,
        role,
        model,
        order: count,
        conversationId: req.params.id
      }
    });

    // If user message, generate AI response using smart routing
    if (role === 'user') {
      const models = await fetchModels();
      let selectedModel = model;

      if (conversation.agentId) {
        const agent = await prisma.agent.findUnique({ where: { id: conversation.agentId } });
        if (agent?.model) selectedModel = agent.model;
      }

      if (!selectedModel) {
        const routed = routeToModel('chat', content, models);
        selectedModel = routed ? routed.id : 'accounts/fireworks/models/glm-5p1';
      }

      // Get conversation history
      const history = await prisma.message.findMany({
        where: { conversationId: req.params.id },
        orderBy: { order: 'asc' }
      });

      const messages = history.map(m => ({ role: m.role, content: m.content }));

      try {
        const aiResponse = await axios.post(
          `${SUGGY_BASE_URL}/chat/completions`,
          {
            model: selectedModel,
            messages,
            temperature: 0.7,
            max_tokens: 2000
          },
          {
            headers: {
              'Authorization': `Bearer ${SUGGY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000
          }
        );

        const aiContent = aiResponse.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
        const aiMessage = await prisma.message.create({
          data: {
            content: aiContent,
            role: 'assistant',
            model: selectedModel,
            order: count + 1,
            conversationId: req.params.id
          }
        });

        return res.json({ userMessage: message, aiMessage, model_used: selectedModel });
      } catch (aiErr) {
        console.error('AI response error:', aiErr.response?.data || aiErr.message);
        const errorMessage = await prisma.message.create({
          data: {
            content: `Error: ${aiErr.response?.data?.error?.message || aiErr.message}. Model tried: ${selectedModel}`,
            role: 'assistant',
            model: selectedModel,
            order: count + 1,
            conversationId: req.params.id
          }
        });
        return res.json({ userMessage: message, aiMessage: errorMessage, model_used: selectedModel, error: true });
      }
    }

    res.json({ message });
  } catch (err) {
    console.error('Message error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ============================
// WEBCHAT
// ============================

app.post('/api/channels/webchat/message', async (req, res) => {
  try {
    const { workspaceId, agentId, sessionId, content, customerName, customerEmail } = req.body;

    if (!workspaceId || !content) {
      return res.status(400).json({ error: 'workspaceId and content are required' });
    }

    // Find or create agent
    let agent;
    if (agentId) {
      agent = await prisma.agent.findFirst({ where: { id: agentId, workspaceId } });
    }
    if (!agent) {
      agent = await prisma.agent.findFirst({ where: { workspaceId, isActive: true } });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { workspaceId, title: `WebChat: ${sessionId || 'anonymous'}` }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          title: `WebChat: ${sessionId || 'anonymous'}`,
          workspaceId,
          agentId: agent?.id || null
        }
      });
    }

    // Save customer message
    const count = await prisma.message.count({ where: { conversationId: conversation.id } });
    await prisma.message.create({
      data: {
        content,
        role: 'user',
        order: count,
        conversationId: conversation.id
      }
    });

    // Generate AI response
    const models = await fetchModels();
    const selectedModel = agent?.model ||
      (routeToModel('customer support', content, models)?.id) ||
      'accounts/fireworks/models/glm-5p1';

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { order: 'asc' }
    });

    const systemPrompt = agent?.systemPrompt || 'You are a helpful customer support AI assistant. Be friendly, concise, and helpful.';
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      const aiResponse = await axios.post(
        `${SUGGY_BASE_URL}/chat/completions`,
        {
          model: selectedModel,
          messages,
          temperature: 0.7,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${SUGGY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      const aiContent = aiResponse.data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
      await prisma.message.create({
        data: {
          content: aiContent,
          role: 'assistant',
          model: selectedModel,
          order: count + 1,
          conversationId: conversation.id
        }
      });

      res.json({ response: aiContent, model_used: selectedModel, conversationId: conversation.id });
    } catch (aiErr) {
      console.error('WebChat AI error:', aiErr.response?.data || aiErr.message);
      res.status(500).json({
        error: aiErr.response?.data?.error?.message || aiErr.message,
        model_used: selectedModel
      });
    }
  } catch (err) {
    console.error('WebChat error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ============================
// BILLING
// ============================

app.get('/api/billing/plan', authenticate, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    res.json({
      plan: workspace?.plan || 'FREE',
      trialEndsAt: workspace?.trialEndsAt,
      settings: workspace?.settings || {},
      limits: { agents: 5, messages: 1000, storage: 100 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/trial-status', authenticate, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const trialEndsAt = workspace.trialEndsAt;
    if (!trialEndsAt) {
      return res.json({ trialEndsAt: null, daysLeft: null, isTrialing: false });
    }

    const now = new Date();
    const diffMs = trialEndsAt.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    res.json({
      trialEndsAt: trialEndsAt.toISOString(),
      daysLeft,
      isTrialing: workspace.plan === 'TRIAL',
      isExpired: workspace.plan === 'TRIAL' && diffMs <= 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/usage', authenticate, async (req, res) => {
  try {
    const messagesCount = await prisma.message.count({
      where: { conversation: { workspaceId: req.user.workspaceId } }
    });
    const conversationsCount = await prisma.conversation.count({
      where: { workspaceId: req.user.workspaceId }
    });
    res.json({ messages: messagesCount, conversations: conversationsCount, month: new Date().toISOString().slice(0, 7) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// WORKSPACE ONBOARDING
// ============================

app.put('/api/workspace/onboarding', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      workspaceName: z.string().min(1).optional(),
      companyName: z.string().optional(),
      companySize: z.string().optional(),
      industry: z.string().optional(),
      geography: z.string().optional(),
      channels: z.array(z.string()).optional(),
      website: z.string().optional(),
      crm: z.string().optional(),
      agentGoal: z.string().optional(),
      onboardingCompleted: z.boolean().optional()
    });
    const data = schema.parse(req.body);

    const workspace = await prisma.workspace.findUnique({ where: { id: req.user.workspaceId } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const currentSettings = (workspace.settings && typeof workspace.settings === 'object') ? { ...workspace.settings } : {};
    const merged = { ...currentSettings, ...data };

    const updateData = { settings: merged };
    if (data.workspaceName) updateData.name = data.workspaceName;

    const updated = await prisma.workspace.update({
      where: { id: req.user.workspaceId },
      data: updateData
    });

    res.json({ success: true, settings: updated.settings });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ============================
// CRM
// ============================

app.get('/api/crm/customers', authenticate, async (req, res) => {
  try {
    const customers = await prisma.cRMContact.findMany({
      where: { workspaceId: req.user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/customers', authenticate, async (req, res) => {
  try {
    const customer = await prisma.cRMContact.create({
      data: { ...req.body, workspaceId: req.user.workspaceId }
    });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================
// KNOWLEDGE BASE
// ============================

app.get('/api/knowledge/documents', authenticate, async (req, res) => {
  try {
    const docs = await prisma.knowledgeDocument.findMany({
      where: { workspaceId: req.user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/knowledge/documents', authenticate, async (req, res) => {
  try {
    const doc = await prisma.knowledgeDocument.create({
      data: { ...req.body, workspaceId: req.user.workspaceId }
    });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================
// ANALYTICS
// ============================

app.get('/api/analytics/dashboard', authenticate, async (req, res) => {
  try {
    const [conversations, messages, agents, customers] = await Promise.all([
      prisma.conversation.count({ where: { workspaceId: req.user.workspaceId } }),
      prisma.message.count({ where: { conversation: { workspaceId: req.user.workspaceId } } }),
      prisma.agent.count({ where: { workspaceId: req.user.workspaceId } }),
      prisma.cRMContact.count({ where: { workspaceId: req.user.workspaceId } })
    ]);

    const recentMessages = await prisma.message.findMany({
      where: { conversation: { workspaceId: req.user.workspaceId }, role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { conversation: { select: { title: true } } }
    });

    res.json({
      conversations,
      messages,
      agents,
      customers,
      recentActivity: recentMessages.map(m => ({
        id: m.id,
        content: m.content.substring(0, 100),
        role: m.role,
        createdAt: m.createdAt,
        conversationTitle: m.conversation.title
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// HEALTH CHECK
// ============================

app.get('/api/health', async (req, res) => {
  const models = await fetchModels();
  res.json({
    status: 'ok',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    models_loaded: models.length,
    models: models.map(m => ({ id: m.id, name: m.id.split('/').pop() }))
  });
});

// ============================
// START SERVER
// ============================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AgentCore v3 API running on http://0.0.0.0:${PORT}`);
  console.log(`🤖 Suggy API: ${SUGGY_BASE_URL}`);
  console.log(`📦 Models cache TTL: ${MODEL_CACHE_TTL}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

module.exports = app;
