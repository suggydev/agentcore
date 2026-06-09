const { prisma } = require('/root/agentcore-v3/apps/api/prisma-client');

async function testAgents() {
  try {
    // Find or create test workspace
    let workspace = await prisma.workspace.findFirst({
      where: { name: 'Test Integration Workspace' }
    });
    
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: { name: 'Test Integration Workspace', settings: {} }
      });
    }

    // Create test agents for each integration
    const integrations = [
      { name: 'Тест Telegram', channel: 'telegram', description: 'Тестовый агент для Telegram' },
      { name: 'Тест WhatsApp', channel: 'whatsapp', description: 'Тестовый агент для WhatsApp' },
      { name: 'Тест VK', channel: 'vk', description: 'Тестовый агент для VK' },
      { name: 'Тест Email', channel: 'email', description: 'Тестовый агент для Email' },
      { name: 'Тест WebChat', channel: 'webchat', description: 'Тестовый агент для WebChat' },
    ];

    for (const int of integrations) {
      const existing = await prisma.agent.findFirst({
        where: { workspaceId: workspace.id, name: int.name }
      });
      
      if (!existing) {
        await prisma.agent.create({
          data: {
            name: int.name,
            description: int.description,
            channel: int.channel,
            workspaceId: workspace.id,
            status: 'active',
            isPaid: true,
            isLocal: false,
            systemPrompt: `Вы — тестовый агент для ${int.channel}. Отвечайте вежливо и по делу.`,
            model: 'accounts/fireworks/models/glm-5p1'
          }
        });
        console.log(`✅ Created agent: ${int.name}`);
      } else {
        console.log(`ℹ️ Agent already exists: ${int.name}`);
      }
    }

    // List all agents
    const agents = await prisma.agent.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true, channel: true, status: true, isPaid: true, isLocal: true }
    });
    
    console.log('\n📋 All test agents:');
    agents.forEach(a => {
      console.log(`  ${a.name} | ${a.channel} | status=${a.status} | paid=${a.isPaid} | local=${a.isLocal}`);
    });

    console.log('\n✅ Test setup complete');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAgents();
