// Very quick script to verify that the demographics_data.csv file dont mind like half the shit i do tbh cuz mostly its just to check if stuff is working.
// Not loaded by actual application

const fs = require('fs');
const path = require('path');

function readCsv(p) {
  const txt = fs.readFileSync(p, 'utf8');
  const lines = txt.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = lines.shift().split(',');
  return lines.map(line => {
    const parts = line.split(',');
    const obj = {};
    header.forEach((h, i) => obj[h] = parts[i] === undefined ? '' : parts[i]);
    return obj;
  });
}

function coerceValue(v) {
  if (v === null || v === undefined) return v;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (s === '') return null;
  if (/^-?\d+(?:\.\d+)?%$/.test(s)) return parseFloat(s.replace('%',''));
  const num = Number(s.replace(/,/g,'').replace(/\s+/g,''));
  if (!Number.isNaN(num)) return num;
  return s;
}

const demoPath = path.join(__dirname, '..', 'data', 'filtered_cia_data', 'demographics_data.csv');
if (!fs.existsSync(demoPath)) {
  console.error('demographics CSV not found:', demoPath);
  process.exit(2);
}

const rows = readCsv(demoPath);
console.log('Rows read:', rows.length);
const sample = rows.find(r => r['Country'] && r['Country'].toUpperCase().includes('AUSTRIA')) || rows[0];
console.log('Sample country:', sample['Country']);

['Total_Literacy_Rate','Female_Literacy_Rate','Youth_Unemployment_Rate'].forEach(k => {
  const raw = sample[k];
  const c = coerceValue(raw);
  console.log(`${k}: raw='${raw}' -> coerced=${c} (${typeof c})`);
});

// Quick scan to ensure keys exist and are numeric for many countries
const missing = [];
for (const k of ['Total_Literacy_Rate','Female_Literacy_Rate','Youth_Unemployment_Rate']) {
  let countNum = 0, countTotal = 0;
  rows.forEach(r => {
    if (!r['Country']) return;
    const c = coerceValue(r[k]);
    if (c !== null && typeof c === 'number') countNum++;
    countTotal++;
  });
  console.log(`${k}: numeric in ${countNum}/${countTotal} rows`);
  if (countNum === 0) missing.push(k);
}

if (missing.length) {
  console.error('Missing numeric keys:', missing);
  process.exit(1);
}
console.log('All checks OK');
