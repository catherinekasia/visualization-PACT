// data.js
Neutralino.init();
console.log("data.js loaded!");

const ATTRIBUTES = window.ATTRIBUTES; // from data-config.js
if (!ATTRIBUTES) {
  console.error("ATTRIBUTES is missing. Check that data-config.js loads before data.js");
}
let SAMPLE_DATA = [];

// State
let selectedAttributes = new Map();
let topCountries = [];

let DATA_LOADED = false;

// Allowed countries list (Europe, select East Asia, AU/NZ, North America)
const ALLOWED_COUNTRIES = new Set([
  // Europe
  'PORTUGAL', 'SPAIN', 'ANDORRA', 'MONACO', 'FRANCE', 'UNITED KINGDOM', 'IRELAND', 'ITALY',
  'MALTA', 'LUXEMBOURG', 'BELGIUM', 'NETHERLANDS', 'GERMANY', 'SWITZERLAND', 'AUSTRIA',
  'SLOVENIA', 'CROATIA', 'BOSNIA AND HERZEGOVINA', 'MONTENEGRO', 'ALBANIA', 'GREECE',
  'TURKEY (TURKIYE)', 'TURKEY', 'BULGARIA', 'NORTH MACEDONIA', 'KOSOVO', 'SERBIA', 'HUNGARY',
  'SLOVAKIA', 'CZECHIA', 'CZECH REPUBLIC', 'POLAND', 'UKRAINE', 'ROMANIA', 'MOLDOVA',
  'REPUBLIC OF MOLDOVA', 'BELARUS', 'RUSSIA', 'RUSSIAN FEDERATION', 'LITHUANIA', 'LATVIA', 
  'ESTONIA', 'FINLAND', 'SWEDEN', 'NORWAY', 'DENMARK', 'LIECHTENSTEIN', 'ICELAND',
  // East Asia
  'JAPAN', 'KOREA, SOUTH', 'SOUTH KOREA', 'TAIWAN', 'CHINA', 'SINGAPORE',
  // Oceania
  'AUSTRALIA', 'NEW ZEALAND',
  // North America
  'CANADA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'USA', 'MEXICO', 'GREENLAND'
]);

function isAllowedCountry(countryName) {
  if (!countryName) return false;
  const name = String(countryName).toUpperCase().trim();
  if (ALLOWED_COUNTRIES.has(name)) return true;
  // Check partial matches
  for (const allowed of ALLOWED_COUNTRIES) {
    if (name.includes(allowed) || allowed.includes(name)) return true;
  }
  return false;
}

const DATA_FILES = [
  "data/filtered_cia_data/demographics_data.csv",
  "data/filtered_cia_data/communications_data.csv",
  "data/filtered_cia_data/economy_data.csv",
  "data/filtered_cia_data/energy_data.csv",
  "data/filtered_cia_data/global_peace_index.csv",
  "data/filtered_cia_data/criminal_index.csv",
  "data/filtered_cia_data/global_terrorism_index.csv",
  "data/filtered_cia_data/Indexes_calc_code/safety_index_risk_focused.csv",
  "data/filtered_cia_data/Indexes_calc_code/ownhealth_index.csv"
];

// Load one CSV file using Neutralino
async function loadCsv(path) {
  try {
    const content = await Neutralino.filesystem.readFile(path);

    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data || []),
        error: (err) => reject(err)
      });
    });
  } catch (e) {
    console.error("Failed to read file:", path, e);
    throw e;
  }
}

// Merge rows from many files by Country
async function loadAllDataAndMerge() {
  try {
    console.log("Loading CSV files:", DATA_FILES);

    const datasets = await Promise.all(DATA_FILES.map(loadCsv));
    datasets.forEach((d, i) => console.log(DATA_FILES[i], "rows:", d.length));
    // Map: normalizedCountry -> merged row object
    const merged = new Map();

    // Helper to normalize country names for merging
    function normalizeCountryName(name) {
      if (!name) return '';
      // Basic normalization: lowercase, trim, remove punctuation
      let norm = name.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
      // Alias map for common country name variations
      const aliases = {
        'united states': 'united states of america',
        'usa': 'united states of america',
        'uk': 'united kingdom',
        'russia': 'russian federation',
        'south korea': 'korea, south',
        'north korea': 'korea, north',
        'ivory coast': 
          'cote divoire',
        'czechia': 'czech republic',
        'viet nam': 'vietnam',
        'laos': 'lao peoples democratic republic',
        'syria': 'syrian arab republic',
        'iran': 'iran (islamic republic of)',
        'tanzania': 'tanzania, united republic of',
        'venezuela': 'venezuela (bolivarian republic of)',
        'moldova': 'moldova, republic of',
        'bolivia': 'bolivia (plurinational state of)',
        'brunei': 'brunei darussalam',
        'palestine': 'palestine, state of',
        'macedonia': 'north macedonia',
        'slovakia': 'slovak republic',
        'myanmar': 'myanmar (burma)',
        'cape verde': 'cabo verde',
        'swaziland': 'eswatini',
        'east timor': 'timor-leste',
        'micronesia': 'micronesia, federated states of',
        'sao tome and principe': 'sao tome & principe',
        'st vincent and the grenadines': 'saint vincent and the grenadines',
        'st kitts and nevis': 'saint kitts and nevis',
        'st lucia': 'saint lucia',
        'bahamas': 'the bahamas',
        'gambia': 'the gambia',
        'congo': 'congo, republic of the',
        'congo drc': 'congo, democratic republic of the',
      };
      if (aliases[norm]) return aliases[norm];
      return norm;
    }
    for (const rows of datasets) {
      for (const row of rows) {
        // pick the country field name in that file
        const country = row.Country ?? row.country ?? row.COUNTRY;
        if (!country) continue;

        // Only include allowed countries
        if (!isAllowedCountry(country)) continue;

        const k = normalizeCountryName(country);

        const prev = merged.get(k) || { Country: country };
        merged.set(k, { ...prev, ...row, Country: prev.Country || country });
      }
    }

    SAMPLE_DATA = Array.from(merged.values());

    DATA_LOADED = true;
    console.log("Merged countries:", SAMPLE_DATA.length);
    console.log("Example merged row keys:", Object.keys(SAMPLE_DATA[0] || {}));
    console.log("Safety index example:", SAMPLE_DATA[0]?.safety_index);

    updateFindButton();
  } catch (e) {
    console.error("Failed to load/merge CSV files:", e);

    const results = document.getElementById("country-results");
    if (results) {
      results.innerHTML =
        `<div class="loading"> Failed to load CSV data. Check console/network for 404/CORS.</div>`;
    }
  }
}



function findColumnKey(row, wantedKey) {
  const keys = Object.keys(row || {});
  const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

  const target = normalize(wantedKey);

  // exact match
  if (wantedKey in row) return wantedKey;

  // normalized match
  for (const k of keys) {
    if (normalize(k) === target) return k;
  }

  return null;
}

// Initialize attribute selection UI
function initializeAttributes() {
  const ATTRIBUTES = window.ATTRIBUTES;
  if (!ATTRIBUTES) {
    console.error("window.ATTRIBUTES is missing. Check script order in data.html");
    return;
  }

  for (const [category, attributes] of Object.entries(ATTRIBUTES)) {
    const container = document.getElementById(`${category}-attributes`);
    if (!container) continue;

    container.innerHTML = '';

    for (const [key, meta] of Object.entries(attributes)) {
      const div = document.createElement('div');
      div.className = 'attribute-item';

      div.innerHTML = `
        <input type="checkbox" class="attribute-checkbox" id="attr-${key}">
        <label for="attr-${key}" class="attribute-label">${meta.label}</label>
      `;

      container.appendChild(div);

      const checkbox = div.querySelector('input');

      checkbox.addEventListener('change', (e) => {
        toggleAttribute(key, meta, e.target.checked);
        div.classList.toggle('selected', e.target.checked);
      });

      div.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'input') return;
        checkbox.click();
      });
    }
  }
}


function toggleAttribute(key, meta, isSelected) {
  if (isSelected) {
    if (selectedAttributes.size >= 10) {
      alert('Maximum 10 attributes allowed');
      document.getElementById(`attr-${key}`).checked = false;
      return;
    }
    selectedAttributes.set(key, meta);
  } else {
    selectedAttributes.delete(key);
  }

  updateSelectedTags();
  updateSelectedCount();
  updateFindButton();
}

function updateSelectedTags() {
  const container = document.getElementById('selected-tags');
  container.innerHTML = '';

  for (const [key, meta] of selectedAttributes.entries()) {
    const tag = document.createElement('div');
    tag.className = 'selected-tag';
    tag.innerHTML = `
      ${meta.label}
      <button class="remove-tag" data-key="${key}">&times;</button>
    `;
    container.appendChild(tag);

    tag.querySelector('.remove-tag').addEventListener('click', (e) => {
      e.stopPropagation();

      const checkbox = document.getElementById(`attr-${key}`);
      if (checkbox) checkbox.checked = false;

      const item = checkbox?.closest('.attribute-item');
      if (item) item.classList.remove('selected');

      selectedAttributes.delete(key);
      updateSelectedTags();
      updateSelectedCount();
      updateFindButton();
    });
  }
}



function updateSelectedCount() {
  document.getElementById('selected-count').textContent = `${selectedAttributes.size}/10`;
}

function updateFindButton() {
  const button = document.getElementById("find-countries");
  if (!button) return;

  button.disabled = selectedAttributes.size === 0 || !DATA_LOADED;

  button.textContent = DATA_LOADED ? "FIND TOP COUNTRIES" : "LOADING DATA...";
}

function findTopCountries() {
  if (selectedAttributes.size === 0) return;

  if (!SAMPLE_DATA || SAMPLE_DATA.length === 0) {
    alert("Data is still loading. Try again in a moment.");
    return;
  }

  // Build dimensions from selected attributes
  const dims = Array.from(selectedAttributes.entries()).map(([key, meta]) => ({
    key,
    label: meta.label,
    better: meta.better || "max"
  }));

  const extents = {};

  // Compute min/max ONLY for numeric columns
  for (const d of dims) {
    const vals = SAMPLE_DATA
      .map(row => row[d.key])
      .filter(v => typeof v === "number" && !Number.isNaN(v));

    // Non-numeric column → skip
    if (vals.length === 0) {
      extents[d.key] = null;
      continue;
    }

    const min = Math.min(...vals);
    const max = Math.max(...vals);

    extents[d.key] = {
      min,
      max: max === min ? min + 1 : max
    };
  }

  // Score countries
  const countriesWithScores = SAMPLE_DATA.map(country => {
    let total = 0;
    let count = 0;

    const attributes = [];

    for (const d of dims) {
      const extent = extents[d.key];

      // Skip non-numeric attributes
      if (!extent) continue;

      const raw = country[d.key];
      if (typeof raw !== "number" || Number.isNaN(raw)) continue;

      let norm = 100 * (raw - extent.min) / (extent.max - extent.min);

      // invert if lower is better
      if (d.better === "min") {
        norm = 100 - norm;
      }

      total += norm;
      count++;

      attributes.push({
        key: d.key,
        label: d.label,
        raw,
        norm: Math.round(norm * 10) / 10
      });
    }

    //  Country has no valid numeric attributes
    if (count === 0) return null;

    return {
      country: country.Country || country.country,
      score: Math.round((total / count) * 10) / 10,
      attributes
    };
  }).filter(Boolean);


  topCountries = countriesWithScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  displayTopCountries();
  createRadarChart();
}


function displayTopCountries() {
  const container = document.getElementById('country-results');
  container.innerHTML = '';

  if (topCountries.length === 0) {
    container.innerHTML = '<div class="loading">No countries match the criteria</div>';
    return;
  }

  topCountries.forEach((country, index) => {
    const rank = index + 1;
    const div = document.createElement('div');
    div.className = `country-result rank-${rank}`;

    if (!SAMPLE_DATA || SAMPLE_DATA.length === 0) {
    alert("Data is still loading. Please try again in a moment.");
    return;
    }

    // FIX: you had b.value (doesn't exist). Use b.norm.
    const topAttributes = [...country.attributes]
      .sort((a, b) => b.norm - a.norm)
      .slice(0, 3);

    div.innerHTML = `
      <div class="rank-badge">${rank}</div>
      <div class="country-info">
        <div class="country-name">${country.country}</div>
        <div class="country-score">Overall Score: ${country.score}/100</div>
        <div class="country-stats">
          ${topAttributes.map(attr => `
            <div class="stat-item">
              ${attr.label.split(' ')[0]}: <span class="stat-value">${attr.norm}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function createRadarChart() {
  if (topCountries.length === 0 || selectedAttributes.size === 0) return;

  const container = document.getElementById('radar-container');
  container.innerHTML = '';

  const dims = Array.from(selectedAttributes.entries()).map(([key, label]) => ({ key, label }));

  const W = container.clientWidth || 700;
  const H = container.clientHeight || 420;
  const pad = { top: 80, right: 30, bottom: 50, left: 40 };

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));
  svg.style.display = 'block';

  const xStep = (W - pad.left - pad.right) / Math.max(1, (dims.length - 1));
  const xPos = (i) => pad.left + i * xStep;

  const yPos = (norm) => {
    const t = norm / 100;
    return pad.top + (1 - t) * (H - pad.top - pad.bottom);
  };

  const colors = ['#38bdf8', '#0ea5e9', '#0284c7'];

  // axes
  dims.forEach((d, i) => {
    const x = xPos(i);

    const axis = document.createElementNS(svg.namespaceURI, 'line');
    axis.setAttribute('x1', x);
    axis.setAttribute('x2', x);
    axis.setAttribute('y1', pad.top);
    axis.setAttribute('y2', H - pad.bottom);
    axis.setAttribute('stroke', '#334155');
    axis.setAttribute('stroke-width', '1');
    svg.appendChild(axis);

    const label = document.createElementNS(svg.namespaceURI, 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', 28);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('transform', `rotate(-35 ${x} 28)`);
    label.setAttribute('fill', '#94a3b8');
    label.setAttribute('font-size', '12');
    label.textContent = d.label;
    svg.appendChild(label);
  });

  // lines
  topCountries.forEach((country, ci) => {
    const normByKey = new Map(country.attributes.map(a => [a.key, a.norm]));

    const pts = dims.map((d, i) => {
      const x = xPos(i);
      const norm = normByKey.get(d.key) ?? 0;
      const y = yPos(norm);
      return `${x},${y}`;
    }).join(' ');

    const poly = document.createElementNS(svg.namespaceURI, 'polyline');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', colors[ci % colors.length]);
    poly.setAttribute('stroke-width', '3');
    poly.setAttribute('stroke-linejoin', 'round');
    poly.setAttribute('opacity', '0.95');
    svg.appendChild(poly);
  });

  container.appendChild(svg);
}

// DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initializeAttributes();
  updateSelectedCount();
  updateFindButton();

  document.getElementById("find-countries")
    .addEventListener("click", findTopCountries);

  loadAllDataAndMerge(); // load all CSVs from /data
});

