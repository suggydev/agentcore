const { prisma } = require('/root/agentcore-v3/apps/api/prisma-client');
prisma.agent.deleteMany().then(r => {
  console.log('Deleted', r.count, 'agents');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
