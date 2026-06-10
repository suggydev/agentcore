const fs = require('fs');
const path = require('path');

const filesWithBeforeEach = [
  '08-billing.spec.ts',
  '05-chat.spec.ts',
  '04-brain-map.spec.ts',
  '03-agent-creation.spec.ts',
  '21-dialogs.spec.ts',
  '13-search.spec.ts',
  '11-crm.spec.ts',
  '10-analytics.spec.ts',
  '09-channels.spec.ts',
  '07-settings.spec.ts',
  '06-knowledge.spec.ts',
];

const e2eDir = path.join(__dirname, 'tests/e2e');

for (const filename of filesWithBeforeEach) {
  const filepath = path.join(e2eDir, filename);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Remove TEST_EMAIL constant line
  content = content.replace(/const TEST_EMAIL = .*\n/, '');
  
  // Handle TEST_PASSWORD - count uses beyond declaration
  const passwordUses = (content.match(/TEST_PASSWORD/g) || []).length;
  if (passwordUses <= 2) { // Only in declaration and beforeEach (which we'll remove)
    content = content.replace(/const TEST_PASSWORD = .*\n/, '');
  } else {
    // Keep it but make it static
    content = content.replace(/const TEST_PASSWORD = .*\n/, "const TEST_PASSWORD = 'TestPass123!';\n");
  }
  
  // Remove the entire beforeEach block
  // Match: test.beforeEach(async ({ page }) => { ... });
  const beforeEachRegex = /test\.beforeEach\(async \(\{ page \}\) => \{[\s\S]*?\}\);\n/;
  content = content.replace(beforeEachRegex, '');
  
  fs.writeFileSync(filepath, content);
  console.log('Updated:', filename);
}

console.log('Done updating', filesWithBeforeEach.length, 'files');
