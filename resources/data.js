// data.js - COMPLETE REWRITE for Country Comparison
Neutralino.init();
console.log("data.js loaded - Country Comparison Mode!");

const ATTRIBUTES = window.ATTRIBUTES;
if (!ATTRIBUTES) {
  console.error("ATTRIBUTES is missing. Check that data-config.js loads before data.js");
}

let SAMPLE_DATA = [];
let selectedCountries = new Map(); // Map of country name -> country data
let selectedAttributes = new Map(); // Map of attribute key -> attribute meta

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
  "data/filtered_cia_data/Indexes_calc_code/safety_index_risk_focused.csv",
  "data/filtered_cia_data/Indexes_calc_code/ownhealth_index.csv",
  "data/filtered_cia_data/Indexes_calc_code/DPI.csv",
  "data/filtered_cia_data/Indexes_calc_code/earning_potential_epi_future.csv",
  "data/filtered_cia_data/Indexes_calc_code/economic_stability_option_c.csv",
  "data/filtered_cia_data/Indexes_calc_code/good_country_index_option3.csv"
];

// ============================================================================
// DATA LOADING
// ============================================================================

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

async function loadAllDataAndMerge() {
  try {
    console.log("Loading CSV files:", DATA_FILES);

    const datasets = await Promise.all(DATA_FILES.map(loadCsv));
    datasets.forEach((d, i) => console.log(DATA_FILES[i], "rows:", d.length));

    const merged = new Map();

    function normalizeCountryName(name) {
      if (!name) return '';
      let norm = name.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
      const aliases = {
        'united states': 'united states of america',
        'usa': 'united states of america',
        'uk': 'united kingdom',
        'russia': 'russian federation',
        'south korea': 'korea, south',
        'north korea': 'korea, north',
        'ivory coast': 'cote divoire',
        'czechia': 'czech republic',
        'viet nam': 'vietnam',
      };
      if (aliases[norm]) return aliases[norm];
      return norm;
    }

    for (const rows of datasets) {
      for (const row of rows) {
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

    console.log(" Merged countries:", SAMPLE_DATA.length);
    
    initializeCountrySelector();
    updateCompareButton();
  } catch (e) {
    console.error("Failed to load/merge CSV files:", e);
    const results = document.getElementById("country-results");
    if (results) {
      results.innerHTML = `<div class="loading"> Failed to load CSV data.</div>`;
    }
  }
}

// ============================================================================
// UI INITIALIZATION
// ============================================================================

function initializeCountrySelector() {
  const container = document.getElementById('country-selector');
  if (!container) {
    console.error("country-selector element not found");
    return;
  }

  // List of allowed countries (from your CSV)
  const ALLOWED_COUNTRIES = new Set([
    'ALBANIA', 'ANDORRA', 'AUSTRALIA', 'AUSTRIA', 'BELARUS', 'BELGIUM', 
    'BOSNIA AND HERZEGOVINA', 'BULGARIA', 'BURMA', 'CABO VERDE', 'CANADA', 
    'CROATIA', 'CZECHIA', 'DENMARK', 'ESTONIA', 'EUROPEAN UNION', 'FINLAND', 
    'FRANCE', 'GAZA STRIP', 'GERMANY', 'GIBRALTAR', 'GREECE', 'GREENLAND', 
    'GUERNSEY', 'HONG KONG', 'HUNGARY', 'ICELAND', 'IRELAND', 'ISLE OF MAN', 
    'ITALY', 'JAPAN', 'JERSEY', 'KOREA, NORTH', 'KOREA, SOUTH', 'KOSOVO', 
    'LATVIA', 'LIECHTENSTEIN', 'LITHUANIA', 'LUXEMBOURG', 'MALTA', 'MEXICO', 
    'MOLDOVA', 'MONACO', 'MONTENEGRO', 'NETHERLANDS', 'NEW ZEALAND', 
    'NORTH MACEDONIA', 'NORWAY', 'POLAND', 'PORTUGAL', 'ROMANIA', 'RUSSIA', 
    'SERBIA', 'SLOVAKIA', 'SLOVENIA', 'SPAIN', 'SWEDEN', 'SWITZERLAND', 
    'TAIWAN', 'TURKEY (TURKIYE)', 'UKRAINE', 'UNITED KINGDOM', 'UNITED STATES', 
    'VIETNAM', 'WORLD'
  ]);

  // Filter and sort countries
  const filteredCountries = SAMPLE_DATA.filter(country => 
    ALLOWED_COUNTRIES.has((country.Country || '').toUpperCase())
  );

  const sortedCountries = filteredCountries.sort((a, b) => 
    (a.Country || '').localeCompare(b.Country || '')
  );

  console.log(` Showing ${sortedCountries.length} allowed countries out of ${SAMPLE_DATA.length} total`);

  container.innerHTML = `
    <input type="text" 
      id="country-search" 
      placeholder="Search countries..." 
      style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #475569; background:#1e293b; color:#e2e8f0; border-radius:6px;"
    />
    <div id="country-list" style="max-height:300px; overflow-y:auto;">
      ${sortedCountries.map(country => `
        <div class="country-item" data-country="${country.Country}">
          <input type="checkbox" class="country-checkbox" id="country-${country.Country}">
          <label for="country-${country.Country}" class="country-label">${country.Country}</label>
        </div>
      `).join('')}
    </div>
  `;

  // Search functionality
  const searchInput = document.getElementById('country-search');
  searchInput.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('.country-item').forEach(item => {
      const countryName = item.dataset.country.toLowerCase();
      item.style.display = countryName.includes(search) ? 'block' : 'none';
    });
  });

  // Country selection
  document.querySelectorAll('.country-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const countryName = e.target.id.replace('country-', '');
      const countryData = SAMPLE_DATA.find(c => c.Country === countryName);
      
      if (e.target.checked) {
        if (selectedCountries.size >= 5) {
          alert('Maximum 5 countries allowed');
          e.target.checked = false;
          return;
        }
        selectedCountries.set(countryName, countryData);
      } else {
        selectedCountries.delete(countryName);
      }

      updateSelectedCountries();
      updateCompareButton();
    });
  });

  console.log(" Country selector initialized");
}

function initializeAttributes() {
  if (!ATTRIBUTES) {
    console.error("window.ATTRIBUTES is missing");
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
  updateCompareButton();
}

function updateSelectedCountries() {
  const container = document.getElementById('selected-countries');
  if (!container) return;
  
  container.innerHTML = '';

  for (const [name, data] of selectedCountries.entries()) {
    const tag = document.createElement('div');
    tag.className = 'selected-tag';
    tag.innerHTML = `
      ${name}
      <button class="remove-tag" data-country="${name}">&times;</button>
    `;
    container.appendChild(tag);

    tag.querySelector('.remove-tag').addEventListener('click', (e) => {
      e.stopPropagation();

      const checkbox = document.getElementById(`country-${name}`);
      if (checkbox) checkbox.checked = false;

      selectedCountries.delete(name);
      updateSelectedCountries();
      updateCompareButton();
    });
  }

  const countEl = document.getElementById('country-count');
  if (countEl) {
    countEl.textContent = `${selectedCountries.size}/5`;
  }
}

function updateSelectedTags() {
  const container = document.getElementById('selected-tags');
  if (!container) return;
  
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
      updateCompareButton();
    });
  }
}

function updateSelectedCount() {
  const countEl = document.getElementById('selected-count');
  if (countEl) {
    countEl.textContent = `${selectedAttributes.size}/10`;
  }
}

function updateCompareButton() {
  const button = document.getElementById("compare-countries");
  if (!button) return;

  button.disabled = selectedCountries.size === 0 || selectedAttributes.size === 0 || !DATA_LOADED;

  if (!DATA_LOADED) {
    button.textContent = "LOADING DATA...";
  } else if (selectedCountries.size === 0) {
    button.textContent = "SELECT COUNTRIES";
  } else if (selectedAttributes.size === 0) {
    button.textContent = "SELECT ATTRIBUTES";
  } else {
    button.textContent = "COMPARE COUNTRIES";
  }
}

// ============================================================================
// COMPARISON & VISUALIZATION
// ============================================================================

function compareCountries() {
  if (selectedCountries.size === 0 || selectedAttributes.size === 0) {
    alert("Please select both countries and attributes");
    return;
  }

  console.log("🔍 Comparing countries:", Array.from(selectedCountries.keys()));
  console.log("📊 On attributes:", Array.from(selectedAttributes.keys()));

  displayComparison();
  createComparisonCharts();
}

function displayComparison() {
  const container = document.getElementById('country-results');
  if (!container) return;
  
  container.innerHTML = '';

  const countries = Array.from(selectedCountries.values());
  const attributes = Array.from(selectedAttributes.entries());

  countries.forEach((country, index) => {
    const div = document.createElement('div');
    div.className = `country-result rank-${index + 1}`;

    const countryAttrs = attributes
      .map(([key, meta]) => ({
        label: meta.label,
        value: country[key],
        key: key
      }))
      .filter(a => a.value != null);

    div.innerHTML = `
      <div class="rank-badge">${index + 1}</div>
      <div class="country-info">
        <div class="country-name">${country.Country}</div>
        <div class="country-stats">
          ${countryAttrs.slice(0, 5).map(attr => `
            <div class="stat-item">
              ${attr.label}: <span class="stat-value">${
                typeof attr.value === 'number' ? attr.value.toFixed(2) : attr.value
              }</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function createComparisonCharts() {
  const container = document.getElementById('radar-container');
  if (!container) return;
  
  container.innerHTML = '';

  const countries = Array.from(selectedCountries.values());
  const dims = Array.from(selectedAttributes.entries()).map(([key, meta]) => ({ 
    key, 
    label: meta.label,
    better: meta.better || 'max'
  }));

  // Compute min/max for normalization
  const extents = {};
  for (const d of dims) {
    const vals = SAMPLE_DATA
      .map(row => row[d.key])
      .filter(v => typeof v === "number" && !Number.isNaN(v));

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

  const colors = ['#38bdf8', '#0ea5e9', '#0284c7', '#22c55e', '#f59e0b'];

  // Draw axes
  dims.forEach((d, i) => {
    const x = xPos(i);

    const axis = document.createElementNS(svg.namespaceURI, 'line');
    axis.setAttribute('x1', String(x));
    axis.setAttribute('x2', String(x));
    axis.setAttribute('y1', String(pad.top));
    axis.setAttribute('y2', String(H - pad.bottom));
    axis.setAttribute('stroke', '#334155');
    axis.setAttribute('stroke-width', '1');
    svg.appendChild(axis);

    const label = document.createElementNS(svg.namespaceURI, 'text');
    label.setAttribute('x', String(x));
    label.setAttribute('y', '28');
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('transform', `rotate(-35 ${x} 28)`);
    label.setAttribute('fill', '#94a3b8');
    label.setAttribute('font-size', '12');
    label.textContent = d.label;
    svg.appendChild(label);
  });

  // Draw country lines
  countries.forEach((country, ci) => {
    const pts = dims.map((d, i) => {
      const x = xPos(i);
      const extent = extents[d.key];
      
      if (!extent) {
        return `${x},${yPos(0)}`;
      }

      const raw = country[d.key];
      if (typeof raw !== "number" || Number.isNaN(raw)) {
        return `${x},${yPos(0)}`;
      }

      let norm = 100 * (raw - extent.min) / (extent.max - extent.min);
      if (d.better === "min") {
        norm = 100 - norm;
      }

      const y = yPos(norm);
      return `${x},${y}`;
    }).join(' ');

    const poly = document.createElementNS(svg.namespaceURI, 'polyline');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', colors[ci % colors.length]);
    poly.setAttribute('stroke-width', '3');
    poly.setAttribute('stroke-linejoin', 'round');
    poly.setAttribute('opacity', '0.9');
    svg.appendChild(poly);
  });

  // Legend
  const legend = document.createElementNS(svg.namespaceURI, 'g');
  countries.forEach((country, i) => {
    const y = H - 25 - (i * 15);
    
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', '10');
    line.setAttribute('x2', '30');
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', colors[i % colors.length]);
    line.setAttribute('stroke-width', '3');
    legend.appendChild(line);

    const text = document.createElementNS(svg.namespaceURI, 'text');
    text.setAttribute('x', '35');
    text.setAttribute('y', String(y + 4));
    text.setAttribute('fill', '#e2e8f0');
    text.setAttribute('font-size', '11');
    text.textContent = country.Country;
    legend.appendChild(text);
  });
  svg.appendChild(legend);

  container.appendChild(svg);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeAttributes();
  updateSelectedCount();
  updateCompareButton();

  const compareBtn = document.getElementById("compare-countries");
  if (compareBtn) {
    compareBtn.addEventListener("click", compareCountries);
  }

  loadAllDataAndMerge();
});