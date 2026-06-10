const fs = require('fs');
const path = require('path');

const filesToFix = [
  '03-agent-creation.spec.ts',
  '04-brain-map.spec.ts',
  '05-chat.spec.ts',
  '06-knowledge.spec.ts',
  '07-settings.spec.ts',
  '09-channels.spec.ts',
  '10-analytics.spec.ts',
  '11-crm.spec.ts',
  '13-search.spec.ts',
  '21-dialogs.spec.ts',
];

const e2eDir = path.join(__dirname, 'tests/e2e');

for (const filename of filesToFix) {
  const filepath = path.join(e2eDir, filename);
  let lines = fs.readFileSync(filepath, 'utf8').split('\n');
  
  // Find and remove the artifact line: a line with just `    });` after test.describe
  const describeIndex = lines.findIndex(l => l.includes('test.describe'));
  if (describeIndex >= 0) {
    // Look for the artifact within the next 3 lines
    for (let i = describeIndex + 1; i < Math.min(describeIndex + 4, lines.length); i++) {
      if (lines[i].trim() === '});') {
        lines.splice(i, 1);
        console.log('Removed artifact at line', i + 1, 'in', filename);
        break;
      }
    }
  }
  
  fs.writeFileSync(filepath, lines.join('\n'));
}

console.log('Done!');
