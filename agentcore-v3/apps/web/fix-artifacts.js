const fs = require('fs');
const path = require('path');

const filesToFix = [
  '06-knowledge.spec.ts',
  '07-settings.spec.ts',
  '09-channels.spec.ts',
  '10-analytics.spec.ts',
  '11-crm.spec.ts',
  '13-search.spec.ts',
  '21-dialogs.spec.ts',
  '03-agent-creation.spec.ts',
  '04-brain-map.spec.ts',
  '05-chat.spec.ts',
  '08-billing.spec.ts',
];

const e2eDir = path.join(__dirname, 'tests/e2e');

for (const filename of filesToFix) {
  const filepath = path.join(e2eDir, filename);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Remove the artifact: after test.describe(... => {  \n  \n    });\n
  content = content.replace(/(test\.describe\('[^']*', \(\) => \{\n\n)\s+\}\);\n/, '$1');
  
  fs.writeFileSync(filepath, content);
  console.log('Fixed:', filename);
}

console.log('Done!');
