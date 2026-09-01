const fs = require('fs');
let file = fs.readFileSync('./services/sportsBettingService.ts', 'utf8');

const helper = `
export function getOpTimestamp(dateStr: string, timeStr?: string): number {
  try {
    let d = dateStr;
    if (d.includes('T') && d.endsWith('Z')) return new Date(d).getTime();
    if (d.includes('/')) {
      const p = d.split('/');
      if (p.length === 3) d = \`\${p[2]}-\${p[1]}-\${p[0]}\`;
    }
    if (d.includes('T')) d = d.split('T')[0];
    const t = timeStr || '00:00';
    const ts = new Date(\`\${d}T\${t}\`).getTime();
    if (!isNaN(ts)) return ts;
    return new Date(dateStr).getTime() || 0;
  } catch (e) {
    return 0;
  }
}
`;

if (!file.includes('getOpTimestamp')) {
  file = helper + '\n' + file;
}

file = file.replace(
  /const sortedOps = \[\.\.\.operations\]\.sort\(\(a, b\) => \{[\s\S]*?return dateA - dateB;\n  \}\);/g,
  'const sortedOps = [...operations].sort((a, b) => getOpTimestamp(a.date, a.time) - getOpTimestamp(b.date, b.time));'
);

file = file.replace(
  /const chronologicalOps = \[\.\.\.completedOps\]\.sort\(\(a, b\) => \{[\s\S]*?return dateA - dateB;\n  \}\);/g,
  'const chronologicalOps = [...completedOps].sort((a, b) => getOpTimestamp(a.date, a.time) - getOpTimestamp(b.date, b.time));'
);

fs.writeFileSync('./services/sportsBettingService.ts', file);
