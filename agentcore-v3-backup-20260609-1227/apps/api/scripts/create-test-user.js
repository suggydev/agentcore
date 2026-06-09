const { prisma } = require('/root/agentcore-v3/apps/api/prisma-client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('/root/agentcore-v3/apps/api/config');

async function createTestUser() {
  try {
    const email = 'test@agentcore.work';
    const password = 'TestPassword123';
    
    let user = await prisma.user.findUnique({ where: { email } });
    let workspace;
    
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      workspace = await prisma.workspace.create({
        data: { name: 'Test Workspace', settings: { companyName: 'Test Company', onboardingCompleted: true } }
      });
      user = await prisma.user.create({
        data: {
          name: 'Test User',
          email,
          password: hashedPassword,
          workspaceId: workspace.id,
          role: 'OWNER'
        }
      });
      console.log('✅ Created test user:', user.email, 'workspace:', workspace.id);
    } else {
      workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
      console.log('ℹ️ Test user exists:', user.email);
    }

    // Create test agent for this user
    const agent = await prisma.agent.create({
      data: {
        name: 'Тестовый Агент Продаж',
        description: 'Агент для тестирования продаж',
        channel: 'telegram',
        workspaceId: workspace.id,
        status: 'active',
        isPaid: true,
        isLocal: false,
        systemPrompt: 'Вы — дружелюбный агент по продажам. Помогайте клиентам.',
        model: 'accounts/fireworks/models/glm-5p1'
      }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, workspaceId: workspace.id, role: user.role, tokenVersion: user.tokenVersion },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('\n🔑 Test Token:', token);
    console.log('\n📋 Agent created:', agent.name, '|', agent.id);
    console.log('\n👉 Login: https://agentcore.work/login');
    console.log('   Email: test@agentcore.work');
    console.log('   Password: TestPassword123');

    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createTestUser();
