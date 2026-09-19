const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchDir(fullPath, pattern);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (pattern.test(content)) {
        console.log(`MATCH in ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (pattern.test(line)) {
            console.log(`  L${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching for FinCollect branding occurrences...');
searchDir(path.join(__dirname, '../src'), /FinCollect/i);
searchDir(path.join(__dirname, '../public'), /FinCollect/i);
