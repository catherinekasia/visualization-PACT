// data.js - Enhanced Country Comparison with Filtering & Multiple Chart Types
Neutralino.init();
console.log("data.js loaded - Country Comparison Mode!");

const ATTRIBUTES = window.ATTRIBUTES;
if (!ATTRIBUTES) {
  console.error("ATTRIBUTES is missing. Check that data-config.js loads before data.js");
}

let SAMPLE_DATA = [];
let selectedCountries = new Map();
let selectedAttributes = new Map();
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
  'JAPAN', 'KOREA, SOUTH', 'SOUTH KOREA', 'TAIWAN', 'CHINA', 'SINGAPORE', 'HONG KONG',
  'VIETNAM',
  // Oceania
  'AUSTRALIA', 'NEW ZEALAND',
  // North America
  'CANADA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'USA', 'MEXICO', 'GREENLAND'
]);

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

// Colorblind-friendly palette
const COLORBLIND_PALETTE = [
  '#4285F4', // Blue
  '#EA4335', // Red  
  '#FBBC04', // Yellow
  '#34A853', // Green
  '#9333EA', // Purple
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

    // Enhanced column name mapping with multiple normalizations
    for (const rows of datasets) {
      for (const row of rows) {
        const country = row.Country ?? row.country ?? row.COUNTRY;
        if (!country) continue;
        
        // Only include allowed countries
        if (!isAllowedCountry(country)) continue;
        
        // Map CSV column names with multiple normalization strategies
        const mappedRow = {};
        for (const [csvKey, value] of Object.entries(row)) {
          // Keep original key
          mappedRow[csvKey] = value;
          
          // Try multiple normalizations
          const normalized1 = csvKey.trim().replace(/\s+/g, '_'); // spaces to underscores
          const normalized2 = csvKey.trim().replace(/\s+/g, '_').replace(/-/g, '_'); // also hyphens
          const normalized3 = csvKey.trim().replace(/[^\w]/g, '_'); // all non-word chars
          const normalized4 = csvKey.trim().replace(/\s+/g, ''); // remove all spaces
          
          mappedRow[normalized1] = value;
          mappedRow[normalized2] = value;
          mappedRow[normalized3] = value;
          mappedRow[normalized4] = value;
          
          // Also try lowercase versions
          mappedRow[csvKey.toLowerCase().trim()] = value;
          mappedRow[normalized1.toLowerCase()] = value;
        }
        
        const k = normalizeCountryName(country);
        const prev = merged.get(k) || { Country: country };
        merged.set(k, { ...prev, ...mappedRow, Country: prev.Country || country });
      }
    }

    SAMPLE_DATA = Array.from(merged.values());
    DATA_LOADED = true;
    console.log("✅ Merged countries:", SAMPLE_DATA.length);
    
    if (SAMPLE_DATA.length > 0) {
      const firstCountry = SAMPLE_DATA[0];
      console.log("📋 Available columns:", Object.keys(firstCountry).slice(0, 20).sort());
      
      // Check which attributes are missing
      const allAttrKeys = Object.values(ATTRIBUTES)
        .flatMap(category => Object.keys(category));
      const missingKeys = allAttrKeys.filter(key => !(key in firstCountry));
      
      if (missingKeys.length > 0) {
        console.warn("⚠️ Missing attribute keys in merged data:", missingKeys.slice(0, 5));
        console.warn("💡 Total missing:", missingKeys.length);
      } else {
        console.log("✅ All attributes found in data!");
      }
    }
    
    initializeCountrySelector();
    updateCompareButton();
  } catch (e) {
    console.error("Failed to load/merge CSV files:", e);
    const results = document.getElementById("country-results");
    if (results) {
      results.innerHTML = `<div class="loading">❌ Failed to load CSV data.</div>`;
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

  // Filter to only allowed countries (already filtered in loadAllDataAndMerge)
  const sortedCountries = SAMPLE_DATA.sort((a, b) => 
    (a.Country || '').localeCompare(b.Country || '')
  );

  console.log(`✅ Showing ${sortedCountries.length} allowed countries`);

  container.innerHTML = `
    <input type="text" 
      id="country-search" 
      placeholder="Search countries..." 
      aria-label="Search countries"
      style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #475569; background:#1e293b; color:#e2e8f0; border-radius:6px;"
    />
    <div id="country-list" style="max-height:300px; overflow-y:auto;">
      ${sortedCountries.map(country => `
        <div class="country-item" data-country="${country.Country}">
          <input type="checkbox" class="country-checkbox" id="country-${country.Country}" aria-label="Select ${country.Country}">
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
        <input type="checkbox" class="attribute-checkbox" id="attr-${key}" aria-label="Select ${meta.label}">
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
      <button class="remove-tag" data-country="${name}" aria-label="Remove ${name}">&times;</button>
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
      <button class="remove-tag" data-key="${key}" aria-label="Remove ${meta.label}">&times;</button>
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
// VISUALIZATION - Multiple Chart Types
// ============================================================================

function compareCountries() {
  if (selectedCountries.size === 0 || selectedAttributes.size === 0) {
    alert("Please select both countries and attributes");
    return;
  }

  console.log("🔍 Comparing:", Array.from(selectedCountries.keys()));
  console.log("📊 Attributes:", Array.from(selectedAttributes.keys()));

  createVisualizations();
}

function createVisualizations() {
  const container = document.getElementById('visualizations-container');
  if (!container) {
    console.warn("visualizations-container not found, trying country-results");
    const fallback = document.getElementById('country-results');
    if (fallback) {
      fallback.innerHTML = '<div id="visualizations-container"></div>';
      createVisualizations();
      return;
    }
    return;
  }
  
  container.innerHTML = '';

  const countries = Array.from(selectedCountries.values());
  const dims = Array.from(selectedAttributes.entries()).map(([key, meta]) => ({ 
    key, 
    label: meta.label,
    better: meta.better || 'max',
    optimal: meta.optimal
  }));

  console.log('='.repeat(80));
  console.log('🔍 VISUALIZATION DEBUG INFO');
  console.log('='.repeat(80));
  console.log(`📊 Selected ${dims.length} attributes:`, dims.map(d => d.label));
  console.log(`🌍 Selected ${countries.length} countries:`, countries.map(c => c.Country));
  console.log('');
  console.log('🔑 Looking for these keys in country data:');
  dims.forEach(d => {
    console.log(`   - ${d.key} (${d.label})`);
  });
  console.log('');
  
  // Check first country's available keys
  if (countries.length > 0) {
    const firstCountry = countries[0];
    console.log(`📝 Available keys in ${firstCountry.Country}:`, Object.keys(firstCountry).slice(0, 50).sort());
    console.log('');
    
    // Check which selected attributes actually exist in the data
    console.log('✅ Checking attribute presence:');
    dims.forEach(d => {
      const value = firstCountry[d.key];
      const exists = d.key in firstCountry;
      const isValid = typeof value === 'number' && !Number.isNaN(value);
      console.log(`   ${exists ? '✓' : '✗'} ${d.key}: ${exists ? (isValid ? value : `exists but invalid (${value})`) : 'NOT FOUND'}`);
    });
    console.log('');
  }
  console.log('='.repeat(80));

  // Show results header with compared countries
  const resultsHeader = document.getElementById('results-header');
  if (resultsHeader) {
    resultsHeader.style.display = 'block';
    
    const comparedList = document.getElementById('compared-countries-list');
    if (comparedList) {
      comparedList.innerHTML = countries.map((c, i) => `
        <div class="compared-country-tag">
          <div class="country-color-dot" style="background-color: ${COLORBLIND_PALETTE[i % COLORBLIND_PALETTE.length]};"></div>
          ${c.Country}
        </div>
      `).join('');
    }
  }

  // Compute extents for normalization
  const extents = {};
  for (const d of dims) {
    const vals = SAMPLE_DATA
      .map(row => row[d.key])
      .filter(v => typeof v === "number" && !Number.isNaN(v));

    if (vals.length === 0) {
      console.warn(`❌ NO DATA: "${d.label}" (key: "${d.key}") - not found in any country data`);
      extents[d.key] = null;
      continue;
    }

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    extents[d.key] = { min, max: max === min ? min + 1 : max };
    console.log(`✓ "${d.label}": found data in ${vals.length} countries (range: ${min.toFixed(2)} - ${max.toFixed(2)})`);
  }

  // Choose chart type based on number of attributes
  if (dims.length === 1) {
    createBarChart(container, countries, dims[0], extents);
  } else if (dims.length >= 2 && dims.length <= 4) {
    createGroupedBarChart(container, countries, dims, extents);
    createRadarChart(container, countries, dims, extents);
  } else {
    createParallelCoordinates(container, countries, dims, extents);
    createRadarChart(container, countries, dims, extents);
  }
}

function createGroupedBarChart(container, countries, dims, extents) {
  const chartDiv = document.createElement('div');
  chartDiv.className = 'chart-card';
  
  // Create unique ID
  const chartId = `grouped-bar-chart-${Date.now()}`;
  
  chartDiv.innerHTML = `
    <div class="chart-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
        <rect x="3" y="3" width="7" height="18"/><rect x="14" y="8" width="7" height="13"/>
      </svg>
      Multi-Attribute Comparison (Normalized 0-100)
    </div>
    <div class="chart-wrapper">
      <svg id="${chartId}"></svg>
    </div>
  `;
  container.appendChild(chartDiv);

  const W = 900;
  const H = 500;
  const pad = { top: 60, right: 40, bottom: 120, left: 80 };

  const svg = d3.select(`#${chartId}`)
    .attr('width', W)
    .attr('height', H);

  // Pattern definitions for accessibility
  const PATTERNS = ['none', 'diagonal', 'dots', 'vertical', 'cross'];
  
  const defs = svg.append('defs');
  
  defs.append('pattern')
    .attr('id', 'grouped-pattern-diagonal')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8)
    .append('path')
    .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
    .attr('stroke', 'rgba(255,255,255,0.4)')
    .attr('stroke-width', 2);
  
  defs.append('pattern')
    .attr('id', 'grouped-pattern-dots')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8)
    .append('circle')
    .attr('cx', 4)
    .attr('cy', 4)
    .attr('r', 2)
    .attr('fill', 'rgba(255,255,255,0.4)');
  
  defs.append('pattern')
    .attr('id', 'grouped-pattern-vertical')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 6)
    .attr('height', 6)
    .append('path')
    .attr('d', 'M3,0 L3,6')
    .attr('stroke', 'rgba(255,255,255,0.4)')
    .attr('stroke-width', 2);
  
  defs.append('pattern')
    .attr('id', 'grouped-pattern-cross')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8)
    .append('path')
    .attr('d', 'M0,0 L8,8 M8,0 L0,8')
    .attr('stroke', 'rgba(255,255,255,0.4)')
    .attr('stroke-width', 1.5);

  // Normalize all values to 0-100
  const normalizedData = [];
  
  dims.forEach(dim => {
    const extent = extents[dim.key];
    if (!extent) {
      console.warn(`⚠️ No extent for ${dim.label} (${dim.key}) - skipping this attribute`);
      return;
    }

    countries.forEach((c, i) => {
      const raw = c[dim.key];
      if (typeof raw !== 'number' || Number.isNaN(raw)) {
        console.warn(`⚠️ Missing data for ${c.Country} - ${dim.label}: ${raw}`);
        return; // Skip this country for this attribute
      }

      let norm = 100 * (raw - extent.min) / (extent.max - extent.min);
      if (dim.better === 'min') norm = 100 - norm;

      normalizedData.push({
        country: c.Country,
        attribute: dim.label,
        value: norm,
        rawValue: raw,
        color: COLORBLIND_PALETTE[i % COLORBLIND_PALETTE.length],
        pattern: PATTERNS[i % PATTERNS.length]
      });
    });
  });

  if (normalizedData.length === 0) {
    console.error('❌ No valid data to display in grouped bar chart');
    chartDiv.innerHTML += '<div style="padding:40px; text-align:center; color:#ef4444;">No valid data available for selected attributes</div>';
    return;
  }

  console.log(`✅ Grouped bar chart: ${normalizedData.length} data points for ${dims.length} attributes`);
  
  // Log which attributes are actually showing
  const attributesWithData = [...new Set(normalizedData.map(d => d.attribute))];
  console.log(`📊 Attributes with data (${attributesWithData.length}):`, attributesWithData);
  
  const missingAttributes = dims.map(d => d.label).filter(label => !attributesWithData.includes(label));
  if (missingAttributes.length > 0) {
    console.warn(`⚠️ Attributes with NO data (${missingAttributes.length}):`, missingAttributes);
  }


  const xScale0 = d3.scaleBand()
    .domain(dims.map(d => d.label))
    .range([pad.left, W - pad.right])
    .padding(0.2);

  const xScale1 = d3.scaleBand()
    .domain(countries.map(c => c.Country))
    .range([0, xScale0.bandwidth()])
    .padding(0.05);

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([H - pad.bottom, pad.top]);

  // Bars with base color
  svg.selectAll('g.attribute-group')
    .data(dims)
    .join('g')
    .attr('class', 'attribute-group')
    .attr('transform', d => `translate(${xScale0(d.label)},0)`)
    .selectAll('rect')
    .data(d => normalizedData.filter(nd => nd.attribute === d.label))
    .join('rect')
    .attr('x', d => xScale1(d.country))
    .attr('y', d => yScale(d.value))
    .attr('width', xScale1.bandwidth())
    .attr('height', d => H - pad.bottom - yScale(d.value))
    .attr('fill', d => d.color)
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 1.5)
    .attr('rx', 3);
  
  // Pattern overlays
  svg.selectAll('g.attribute-group-pattern')
    .data(dims)
    .join('g')
    .attr('class', 'attribute-group-pattern')
    .attr('transform', d => `translate(${xScale0(d.label)},0)`)
    .selectAll('rect')
    .data(d => normalizedData.filter(nd => nd.attribute === d.label && nd.pattern !== 'none'))
    .join('rect')
    .attr('x', d => xScale1(d.country))
    .attr('y', d => yScale(d.value))
    .attr('width', xScale1.bandwidth())
    .attr('height', d => H - pad.bottom - yScale(d.value))
    .attr('fill', d => `url(#grouped-pattern-${d.pattern})`)
    .attr('rx', 3)
    .style('pointer-events', 'none');

  // X-axis labels (wrapped to max 3 lines)
  svg.selectAll('text.attr-label')
    .data(dims)
    .join('text')
    .attr('class', 'attr-label')
    .attr('x', d => xScale0(d.label) + xScale0.bandwidth() / 2)
    .attr('y', H - pad.bottom + 20)
    .attr('text-anchor', 'middle')
    .attr('fill', '#94a3b8')
    .attr('font-size', '10px')
    .each(function(d) {
      const words = d.label.split(' ');
      const el = d3.select(this);
      el.text('');
      
      // Wrap text intelligently - aim for 2-3 lines
      const maxWordsPerLine = Math.ceil(words.length / 2);
      let currentLine = [];
      let lineNumber = 0;
      
      words.forEach((word, i) => {
        currentLine.push(word);
        
        // Start new line if we hit max words or it's the last word
        if (currentLine.length >= maxWordsPerLine || i === words.length - 1) {
          el.append('tspan')
            .attr('x', xScale0(d.label) + xScale0.bandwidth() / 2)
            .attr('dy', lineNumber === 0 ? 0 : '1.1em')
            .text(currentLine.join(' '));
          
          currentLine = [];
          lineNumber++;
        }
      });
    });

  // Y-axis
  const yAxis = d3.axisLeft(yScale).ticks(5);
  svg.append('g')
    .attr('transform', `translate(${pad.left},0)`)
    .call(yAxis)
    .attr('color', '#64748b');

  // Legend with patterns
  const legend = svg.append('g')
    .attr('transform', `translate(${W - 160}, 20)`);

  countries.forEach((c, i) => {
    const g = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);

    const pattern = PATTERNS[i % PATTERNS.length];
    
    g.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', COLORBLIND_PALETTE[i % COLORBLIND_PALETTE.length])
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('rx', 3);
    
    if (pattern !== 'none') {
      g.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', `url(#grouped-pattern-${pattern})`)
        .attr('rx', 3)
        .style('pointer-events', 'none');
    }

    g.append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .text(c.Country);
  });
}

function createBarChart(container, countries, dim, extents) {
  const chartDiv = document.createElement('div');
  chartDiv.className = 'chart-card';
  
  // Create unique ID
  const chartId = `bar-chart-${Date.now()}`;
  
  chartDiv.innerHTML = `
    <div class="chart-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
      </svg>
      ${dim.label} Comparison
    </div>
    <div class="chart-wrapper">
      <svg id="${chartId}"></svg>
    </div>
  `;
  container.appendChild(chartDiv);

  const W = 800;
  const H = 400;
  const pad = { top: 40, right: 40, bottom: 80, left: 180 };

  const svg = d3.select(`#${chartId}`)
    .attr('width', W)
    .attr('height', H);

  const extent = extents[dim.key];
  if (!extent) {
    console.error(`❌ No extent for ${dim.label}`);
    chartDiv.innerHTML += '<div style="padding:40px; text-align:center; color:#ef4444;">No data available for this attribute</div>';
    return;
  }

  const PATTERNS = ['none', 'diagonal', 'dots', 'vertical', 'cross'];
  
  const defs = svg.append('defs');
  
  defs.append('pattern')
    .attr('id', `pattern-diagonal-${chartId}`)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8)
    .append('path')
    .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
    .attr('stroke', 'rgba(255,255,255,0.3)')
    .attr('stroke-width', 2);
  
  defs.append('pattern')
    .attr('id', `pattern-dots-${chartId}`)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8)
    .append('circle')
    .attr('cx', 4)
    .attr('cy', 4)
    .attr('r', 2)
    .attr('fill', 'rgba(255,255,255,0.3)');
  
  defs.append('pattern')
    .attr('id', `pattern-vertical-${chartId}`)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 6)
    .attr('height', 6)
    .append('path')
    .attr('d', 'M3,0 L3,6')
    .attr('stroke', 'rgba(255,255,255,0.3)')
    .attr('stroke-width', 2);
  
  defs.append('pattern')
    .attr('id', `pattern-cross-${chartId}`)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8)
    .append('path')
    .attr('d', 'M0,0 L8,8 M8,0 L0,8')
    .attr('stroke', 'rgba(255,255,255,0.3)')
    .attr('stroke-width', 1.5);

  const data = countries.map((c, i) => ({
    country: c.Country,
    value: c[dim.key] || 0,
    color: COLORBLIND_PALETTE[i % COLORBLIND_PALETTE.length],
    pattern: PATTERNS[i % PATTERNS.length],
    chartId: chartId
  })).filter(d => typeof d.value === 'number' && !Number.isNaN(d.value));

  if (data.length === 0) {
    console.error(`❌ No valid data for ${dim.label}`);
    chartDiv.innerHTML += '<div style="padding:40px; text-align:center; color:#ef4444;">No valid data for selected countries</div>';
    return;
  }

  console.log(`✅ Bar chart: ${data.length} countries with data for ${dim.label}`);

  const maxVal = Math.max(...data.map(d => d.value));

  const xScale = d3.scaleLinear()
    .domain([0, maxVal * 1.1])
    .range([pad.left, W - pad.right]);

  const yScale = d3.scaleBand()
    .domain(data.map(d => d.country))
    .range([pad.top, H - pad.bottom])
    .padding(0.2);

  // Bars
  svg.selectAll('rect.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', pad.left)
    .attr('y', d => yScale(d.country))
    .attr('width', d => xScale(d.value) - pad.left)
    .attr('height', yScale.bandwidth())
    .attr('fill', d => d.color)
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 2)
    .attr('rx', 4);
  
  // Pattern overlays
  svg.selectAll('rect.pattern-overlay')
    .data(data.filter(d => d.pattern !== 'none'))
    .join('rect')
    .attr('class', 'pattern-overlay')
    .attr('x', pad.left)
    .attr('y', d => yScale(d.country))
    .attr('width', d => xScale(d.value) - pad.left)
    .attr('height', yScale.bandwidth())
    .attr('fill', d => `url(#pattern-${d.pattern}-${d.chartId})`)
    .attr('rx', 4)
    .style('pointer-events', 'none');

  // Value labels
  svg.selectAll('text.value')
    .data(data)
    .join('text')
    .attr('class', 'value')
    .attr('x', d => xScale(d.value) + 8)
    .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#e2e8f0')
    .attr('font-size', '14px')
    .attr('font-weight', '600')
    .text(d => d.value.toFixed(2));

  // Country names
  svg.selectAll('text.country')
    .data(data)
    .join('text')
    .attr('class', 'country')
    .attr('x', pad.left - 10)
    .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('fill', '#94a3b8')
    .attr('font-size', '13px')
    .text(d => d.country);

  // X-axis
  const xAxis = d3.axisBottom(xScale).ticks(5);
  svg.append('g')
    .attr('transform', `translate(0,${H - pad.bottom})`)
    .call(xAxis)
    .attr('color', '#64748b');
}

function createRadarChart(container, countries, dims, extents) {
  console.log(`🎯 Creating radar chart with ${dims.length} attributes:`, dims.map(d => d.label));
  console.log(`📊 Countries:`, countries.map(c => c.Country));
  
  const chartDiv = document.createElement('div');
  chartDiv.className = 'chart-card';
  
  // Create unique ID for this chart
  const chartId = `radar-chart-${Date.now()}`;
  
  chartDiv.innerHTML = `
    <div class="chart-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
      </svg>
      Radar Chart - Overall Profile
    </div>
    <div class="chart-wrapper">
      <svg id="${chartId}"></svg>
    </div>
  `;
  container.appendChild(chartDiv);

  const W = 700;
  const H = 600;
  const centerX = W / 2;
  const centerY = H / 2;
  const radius = Math.min(W, H) / 2 - 120;

  const svg = d3.select(`#${chartId}`)
    .attr('width', W)
    .attr('height', H);

  const angleSlice = (Math.PI * 2) / dims.length;

  // Add pattern definitions for colorblind accessibility
  const PATTERNS = ['none', 'diagonal', 'dots', 'cross', 'horizontal'];
  const defs = svg.append('defs');
  
  const timestamp = Date.now();
  PATTERNS.forEach((pattern, i) => {
    if (pattern === 'none') return;
    
    const patternEl = defs.append('pattern')
      .attr('id', `radar-pattern-${pattern}-${timestamp}`)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8);
    
    if (pattern === 'diagonal') {
      patternEl.append('path')
        .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
        .attr('stroke', 'rgba(255,255,255,0.5)')
        .attr('stroke-width', 2);
    } else if (pattern === 'dots') {
      patternEl.append('circle')
        .attr('cx', 4).attr('cy', 4).attr('r', 2)
        .attr('fill', 'rgba(255,255,255,0.5)');
    } else if (pattern === 'cross') {
      patternEl.append('path')
        .attr('d', 'M0,0 L8,8 M8,0 L0,8')
        .attr('stroke', 'rgba(255,255,255,0.5)')
        .attr('stroke-width', 1.5);
    } else if (pattern === 'horizontal') {
      patternEl.append('path')
        .attr('d', 'M0,4 L8,4')
        .attr('stroke', 'rgba(255,255,255,0.5)')
        .attr('stroke-width', 2);
    }
  });

  // Background circles
  [0.25, 0.5, 0.75, 1].forEach(level => {
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius * level)
      .attr('fill', 'none')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('opacity', 0.4);
  });

  // Axis lines and labels
  dims.forEach((dim, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    svg.append('line')
      .attr('x1', centerX)
      .attr('y1', centerY)
      .attr('x2', x)
      .attr('y2', y)
      .attr('stroke', '#475569')
      .attr('stroke-width', 1);

    const labelX = centerX + Math.cos(angle) * (radius + 40);
    const labelY = centerY + Math.sin(angle) * (radius + 40);

    // Wrap label text - max 2-3 lines
    const words = dim.label.split(' ');
    const maxWordsPerLine = Math.max(2, Math.ceil(words.length / 2));
    let currentLine = [];
    let lineNum = 0;
    
    const labelGroup = svg.append('g');
    
    words.forEach((word, wi) => {
      currentLine.push(word);
      
      if (currentLine.length >= maxWordsPerLine || wi === words.length - 1) {
        labelGroup.append('text')
          .attr('x', labelX)
          .attr('y', labelY + (lineNum * 11) - ((words.length > maxWordsPerLine ? 5 : 0)))
          .attr('text-anchor', 'middle')
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .text(currentLine.join(' '));
        
        currentLine = [];
        lineNum++;
      }
    });
  });

  // Draw country paths with patterns - FIXED to close the polygon
  countries.forEach((country, ci) => {
    const points = [];
    
    // Collect all points
    dims.forEach((dim, i) => {
      const extent = extents[dim.key];
      if (!extent) {
        console.warn(`No extent for ${dim.label}`);
        return;
      }

      const raw = country[dim.key];
      if (typeof raw !== 'number' || Number.isNaN(raw)) {
        console.warn(`Missing data for ${country.Country} - ${dim.label}`);
        // Use 0 as fallback to keep polygon shape
        const angle = angleSlice * i - Math.PI / 2;
        points.push({
          x: centerX + Math.cos(angle) * 0,
          y: centerY + Math.sin(angle) * 0
        });
        return;
      }

      let norm = (raw - extent.min) / (extent.max - extent.min);
      if (dim.better === 'min') norm = 1 - norm;

      const angle = angleSlice * i - Math.PI / 2;
      const r = radius * norm;

      points.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r
      });
    });

    if (points.length === 0) return;

    const color = COLORBLIND_PALETTE[ci % COLORBLIND_PALETTE.length];
    const pattern = PATTERNS[ci % PATTERNS.length];

    // Create path data that closes the polygon properly
    const pathData = points.map((p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      return `L ${p.x},${p.y}`;
    }).join(' ') + ' Z'; // Z closes the path

    // Draw filled polygon with base color - MORE TRANSPARENT
    svg.append('path')
      .attr('d', pathData)
      .attr('fill', color)
      .attr('fill-opacity', 0.08) // Changed from 0.15 to 0.08
      .attr('stroke', color)
      .attr('stroke-width', 2.5) // Changed from 3 to 2.5
      .attr('stroke-linejoin', 'round')
      .attr('stroke-opacity', 0.9);
    
    // Add pattern overlay if not 'none' - MORE TRANSPARENT
    if (pattern !== 'none') {
      svg.append('path')
        .attr('d', pathData)
        .attr('fill', `url(#radar-pattern-${pattern}-${timestamp})`)
        .attr('fill-opacity', 0.2) // Changed from 0.3 to 0.2
        .attr('stroke', 'none')
        .style('pointer-events', 'none');
    }
    
    // Draw points at vertices for better visibility - SLIGHTLY BIGGER
    points.forEach(p => {
      svg.append('circle')
        .attr('cx', p.x)
        .attr('cy', p.y)
        .attr('r', 5) // Changed from 4 to 5
        .attr('fill', color)
        .attr('stroke', '#0b1220')
        .attr('stroke-width', 2.5); // Changed from 2 to 2.5
    });
  });

  // Legend with patterns
  const legend = svg.append('g')
    .attr('transform', `translate(${W - 150}, 20)`);

  countries.forEach((c, i) => {
    const g = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);

    const color = COLORBLIND_PALETTE[i % COLORBLIND_PALETTE.length];
    const pattern = PATTERNS[i % PATTERNS.length];

    // Base color rect
    g.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', color)
      .attr('rx', 3);
    
    // Pattern overlay
    if (pattern !== 'none') {
      g.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', `url(#radar-pattern-${pattern}-${timestamp})`)
        .attr('rx', 3)
        .style('pointer-events', 'none');
    }

    g.append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .text(c.Country);
  });
}

function createParallelCoordinates(container, countries, dims, extents) {
  const chartDiv = document.createElement('div');
  chartDiv.className = 'chart-card chart-wide';
  
  // Create unique ID
  const chartId = `parallel-chart-${Date.now()}`;
  
  chartDiv.innerHTML = `
    <div class="chart-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
        <path d="M3 12h18M3 6h18M3 18h18"/>
      </svg>
      Parallel Coordinates - Detailed Comparison
    </div>
    <div class="chart-wrapper">
      <svg id="${chartId}"></svg>
    </div>
  `;
  container.appendChild(chartDiv);

  const W = 1000;
  const H = 500;
  const pad = { top: 100, right: 40, bottom: 50, left: 40 };

  const svg = d3.select(`#${chartId}`)
    .attr('width', W)
    .attr('height', H);

  const xStep = (W - pad.left - pad.right) / Math.max(1, dims.length - 1);
  const xPos = (i) => pad.left + i * xStep;

  // Y scales for each dimension
  const yScales = {};
  dims.forEach((d) => {
    const extent = extents[d.key];
    if (!extent) return;

    yScales[d.key] = d3.scaleLinear()
      .domain([extent.min, extent.max])
      .range([H - pad.bottom, pad.top]);
  });

  const LINE_DASH = ["", "6,4", "2,4", "10,4,2,4", "1,3"];

  // Axes and labels
  dims.forEach((d, i) => {
    const extent = extents[d.key];
    if (!extent) return;

    const x = xPos(i);
    const y = yScales[d.key];

    const g = svg.append("g")
      .attr("transform", `translate(${x},0)`);

    g.call(d3.axisLeft(y).ticks(5))
      .attr("color", "#64748b");

    const label = svg.append("text")
      .attr("x", x)
      .attr("y", pad.top - 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "10px")
      .attr("font-weight", 700);

    const words = (d.label || d.key).split(" ");
    label.text("");
    
    // Aim for 2-3 lines max - distribute words evenly
    const maxWordsPerLine = Math.max(2, Math.ceil(words.length / 3));
    let currentLine = [];
    let lineNumber = 0;
    
    words.forEach((w, wi) => {
      currentLine.push(w);
      
      // Start new line when hitting max words per line or last word
      if (currentLine.length >= maxWordsPerLine || wi === words.length - 1) {
        label.append("tspan")
          .attr("x", x)
          .attr("dy", lineNumber === 0 ? 0 : "1.15em")
          .text(currentLine.join(" "));
        
        currentLine = [];
        lineNumber++;
      }
    });

    svg.append("line")
      .attr("x1", x).attr("x2", x)
      .attr("y1", pad.top - 10).attr("y2", H - pad.bottom)
      .attr("stroke", "#334155")
      .attr("stroke-width", 1)
      .attr("opacity", 0.6);
  });

  const line = d3.line()
    .defined(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))
    .x(p => p.x)
    .y(p => p.y);

  const countrySeries = countries.map((c, ci) => {
    const pts = dims.map((dim, i) => {
      const extent = extents[dim.key];
      if (!extent) return null;

      const raw = c[dim.key];
      if (typeof raw !== "number" || Number.isNaN(raw)) return null;

      const x = xPos(i);
      const y = yScales[dim.key](raw);
      return { x, y, dim, raw, country: c.Country };
    }).filter(Boolean);

    return {
      country: c.Country,
      color: COLORBLIND_PALETTE[ci % COLORBLIND_PALETTE.length],
      dash: LINE_DASH[ci % LINE_DASH.length],
      points: pts
    };
  });

  const linesG = svg.append("g").attr("class", "pc-lines");

  linesG.selectAll("path.country-line")
    .data(countrySeries)
    .join("path")
    .attr("class", "country-line")
    .attr("d", d => line(d.points))
    .attr("fill", "none")
    .attr("stroke", d => d.color)
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", d => d.dash || null)
    .attr("opacity", 0.85);

  const pointsG = svg.append("g").attr("class", "pc-points");

  const allPoints = countrySeries.flatMap(s =>
    s.points.map(p => ({ ...p, color: s.color }))
  );

  pointsG.selectAll("circle.pc-point")
    .data(allPoints)
    .join("circle")
    .attr("class", "pc-point")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 4)
    .attr("fill", d => d.color)
    .attr("stroke", "#0b1220")
    .attr("stroke-width", 2)
    .attr("opacity", 0.95);

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${pad.left}, ${H - pad.bottom + 20})`);

  countrySeries.forEach((s, i) => {
    const row = legend.append("g").attr("transform", `translate(${i * 190}, 0)`);

    row.append("line")
      .attr("x1", 0).attr("x2", 34)
      .attr("y1", 10).attr("y2", 10)
      .attr("stroke", s.color)
      .attr("stroke-width", 4)
      .attr("stroke-dasharray", s.dash || null);

    row.append("text")
      .attr("x", 42)
      .attr("y", 10)
      .attr("dy", "0.35em")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .text(s.country);
  });
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