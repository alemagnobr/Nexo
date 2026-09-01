const fs = require('fs');
let file = fs.readFileSync('./components/MercadoEsportivoView.tsx', 'utf8');

file = file.replace(
  /return ops\.sort\(\(a, b\) => \{[\s\S]*?return dateB - dateA;\n    \}\);/g,
  'return ops.sort((a, b) => getOpTimestamp(b.date, b.time) - getOpTimestamp(a.date, a.time));'
);

if (!file.includes('getOpTimestamp')) {
  file = file.replace("import { getSportsBettingStats", "import { getSportsBettingStats, getOpTimestamp");
}

fs.writeFileSync('./components/MercadoEsportivoView.tsx', file);
