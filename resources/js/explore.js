// Global Patterns Explorer - explore.js
// Visualizations for multivariate country data analysis

let allData = [];
let highlightedCountry = null;

// Variable configurations
const variables = {
    population: { 
        key: 'population', 
        label: 'Population', 
        format: d => d3.format('.2s')(d),
        accessor: d => parseFloat(d.demo?.Total_Population) || null
    },
    gdp_per_capita: { 
        key: 'gdp_per_capita', 
        label: 'GDP per Capita (USD)', 
        format: d => '$' + d3.format(',.0f')(d),
        accessor: d => parseFloat(d.eco?.Real_GDP_per_Capita_USD) || null
    },
    life_expectancy: { 
        key: 'life_expectancy', 
        label: 'Life Expectancy (years)', 
        format: d => d3.format('.1f')(d),
        accessor: d => parseFloat(d.health?.life_expectancy) || null
    },
    unemployment: { 
        key: 'unemployment', 
        label: 'Unemployment Rate (%)', 
        format: d => d3.format('.1f')(d) + '%',
        accessor: d => parseFloat(d.eco?.Unemployment_Rate_percent) || null
    },
    literacy: { 
        key: 'literacy', 
        label: 'Literacy Rate (%)', 
        format: d => d3.format('.1f')(d) + '%',
        accessor: d => {
            const val = d.demo?.Total_Literacy_Rate;
            return val ? parseFloat(val.replace('%', '')) : null;
        }
    },
    internet_users: { 
        key: 'internet_users', 
        label: 'Internet Users (millions)', 
        format: d => d3.format('.2s')(d),
        accessor: d => parseFloat(d.comm?.internet_users_total) || null
    },
    gdp: { 
        key: 'gdp', 
        label: 'Total GDP (billions USD)', 
        format: d => '$' + d3.format('.2s')(d),
        accessor: d => parseFloat(d.eco?.Real_GDP_USD_Billions) * 1e9 || null
    },
    safety: { 
        key: 'safety', 
        label: 'Safety Index', 
        format: d => d3.format('.1f')(d),
        accessor: d => parseFloat(d.safety?.safety_index_risk_focused) || null
    },
    health_index: { 
        key: 'health_index', 
        label: 'Health Index', 
        format: d => d3.format('.1f')(d),
        accessor: d => parseFloat(d.health?.health_index) || null
    }
};

// Parallel coordinates dimensions
const pcDimensions = ['population', 'gdp_per_capita', 'life_expectancy', 'unemployment', 'literacy', 'safety'];

// Region colors - isoluminant palette (constant perceived brightness ~L=65)
// All colors have similar luminance for accessibility and visual balance
const regionColors = {
    'Western Europe': '#5B8FF9',   // Blue
    'Northern Europe': '#7DCEA0',  // Mint green
    'Central Europe': '#5AD8A6',   // Teal
    'Eastern Europe': '#F6BD16',   // Gold
    'East Asia': '#E86452',        // Coral
    'North America': '#6DC8EC',    // Light blue
    'Oceania': '#945FB9',          // Purple
    'Unknown': '#8C8C8C'           // Gray
};

// Visa/Migration Filter Groups
// EU/EEA/Schengen - Free movement zone for EU citizens
// English-Speaking - Countries where English is the primary language
const visaFilters = {
    'all': null, // No filter - show all countries
    'eu-eea': new Set([
        'AUSTRIA', 'BELGIUM', 'BULGARIA', 'CROATIA', 'CZECHIA', 'CZECH REPUBLIC', 'DENMARK', 
        'ESTONIA', 'FINLAND', 'FRANCE', 'GERMANY', 'GREECE', 'HUNGARY', 'ICELAND', 'IRELAND', 
        'ITALY', 'LATVIA', 'LIECHTENSTEIN', 'LITHUANIA', 'LUXEMBOURG', 'MALTA', 'NETHERLANDS', 
        'NORWAY', 'POLAND', 'PORTUGAL', 'ROMANIA', 'SLOVAKIA', 'SLOVENIA', 'SPAIN', 'SWEDEN', 
        'SWITZERLAND'
    ]),
    'english': new Set([
        'UNITED KINGDOM', 'IRELAND', 'UNITED STATES', 'CANADA', 'AUSTRALIA', 'NEW ZEALAND'
    ])
};

// Current active filter
let activeVisaFilter = 'all';

// Allowed countries list
const allowedCountries = new Set([
    // Europe
    'PORTUGAL', 'SPAIN', 'ANDORRA', 'MONACO', 'FRANCE', 'UNITED KINGDOM', 'IRELAND', 'ITALY',
    'MALTA', 'LUXEMBOURG', 'BELGIUM', 'NETHERLANDS', 'GERMANY', 'SWITZERLAND', 'AUSTRIA',
    'SLOVENIA', 'CROATIA', 'BOSNIA AND HERZEGOVINA', 'MONTENEGRO', 'ALBANIA', 'GREECE',
    'TURKEY (TURKIYE)', 'TURKEY', 'BULGARIA', 'NORTH MACEDONIA', 'KOSOVO', 'SERBIA', 'HUNGARY',
    'SLOVAKIA', 'CZECHIA', 'CZECH REPUBLIC', 'POLAND', 'UKRAINE', 'ROMANIA', 'MOLDOVA',
    'BELARUS', 'RUSSIA', 'LITHUANIA', 'LATVIA', 'ESTONIA', 'FINLAND', 'SWEDEN', 'NORWAY',
    'DENMARK', 'LIECHTENSTEIN', 'ICELAND',
    // East Asia
    'JAPAN', 'KOREA, SOUTH', 'SOUTH KOREA', 'TAIWAN', 'CHINA', 'SINGAPORE',
    // Oceania
    'AUSTRALIA', 'NEW ZEALAND',
    // North America
    'CANADA', 'UNITED STATES', 'MEXICO', 'GREENLAND'
]);

// Region detection based on country name
function getRegion(countryName) {
    const name = countryName.toUpperCase();
    
    // Western Europe: UK, Ireland, France, Benelux, Iberia, Italy, Switzerland
    const westernEurope = ['ANDORRA', 'BELGIUM', 'FRANCE', 'IRELAND', 'ITALY', 
        'LUXEMBOURG', 'MALTA', 'MONACO', 'NETHERLANDS', 'PORTUGAL', 'SPAIN', 
        'SWITZERLAND', 'UNITED KINGDOM'];
    
    // Northern Europe: Nordic countries
    const northernEurope = ['DENMARK', 'FINLAND', 'ICELAND', 'NORWAY', 'SWEDEN'];
    
    // Central Europe: Germany, Austria, Visegrad, Slovenia, Liechtenstein
    const centralEurope = ['AUSTRIA', 'CROATIA', 'CZECHIA', 'CZECH REPUBLIC', 'GERMANY', 
        'HUNGARY', 'LIECHTENSTEIN', 'POLAND', 'SLOVAKIA', 'SLOVENIA'];
    
    // Eastern Europe: Balkans, Baltics, former Soviet states, Greece, Turkey
    const easternEurope = ['ALBANIA', 'BELARUS', 'BOSNIA', 'BULGARIA', 'ESTONIA', 'GREECE', 
        'KOSOVO', 'LATVIA', 'LITHUANIA', 'MOLDOVA', 'MONTENEGRO', 'NORTH MACEDONIA', 
        'ROMANIA', 'RUSSIA', 'SERBIA', 'TURKEY', 'UKRAINE'];
    
    const eastAsia = ['CHINA', 'JAPAN', 'KOREA', 'SINGAPORE', 'TAIWAN'];
    
    const northAmerica = ['CANADA', 'GREENLAND', 'MEXICO', 'UNITED STATES'];
    
    const oceania = ['AUSTRALIA', 'NEW ZEALAND'];
    
    if (westernEurope.some(c => name.includes(c))) return 'Western Europe';
    if (northernEurope.some(c => name.includes(c))) return 'Northern Europe';
    if (centralEurope.some(c => name.includes(c))) return 'Central Europe';
    if (easternEurope.some(c => name.includes(c))) return 'Eastern Europe';
    if (eastAsia.some(c => name.includes(c))) return 'East Asia';
    if (northAmerica.some(c => name.includes(c))) return 'North America';
    if (oceania.some(c => name.includes(c))) return 'Oceania';
    
    return 'Unknown';
}

function isAllowedCountry(countryName) {
    const name = countryName.toUpperCase();
    // Check direct match
    if (allowedCountries.has(name)) return true;
    // Check partial matches for country name variations
    for (const allowed of allowedCountries) {
        if (name.includes(allowed) || allowed.includes(name)) return true;
    }
    return false;
}

// Initialize on Neutralino ready
Neutralino.init();
Neutralino.events.on('ready', async () => {
    try {
        await loadAllData();
        initCharts();
        setupEventListeners();
    } catch (err) {
        console.error('Failed to initialize:', err);
    }
});

async function loadAllData() {
    const [economy, demographics, communications, energy, safetyIndex, healthIndex] = await Promise.all([
        Neutralino.filesystem.readFile('data/economy_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/demographics_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/communications_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/energy_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/filtered_cia_data/Indexes_calc_code/safety_index_risk_focused.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/filtered_cia_data/Indexes_calc_code/ownhealth_index.csv').then(data => d3.csvParse(data))
    ]);
    
    // Create lookup maps
    const ecoMap = {};
    economy.forEach(d => { ecoMap[d.Country.toUpperCase()] = d; });
    
    const demoMap = {};
    demographics.forEach(d => { demoMap[d.Country.toUpperCase()] = d; });
    
    const commMap = {};
    communications.forEach(d => { commMap[d.Country.toUpperCase()] = d; });
    
    const energyMap = {};
    energy.forEach(d => { energyMap[d.Country.toUpperCase()] = d; });
    
    const safetyMap = {};
    safetyIndex.forEach(d => { safetyMap[d.Country.toUpperCase()] = d; });
    
    const healthMap = {};
    healthIndex.forEach(d => { healthMap[d.Country.toUpperCase()] = d; });
    
    // Combine all data by country
    const allCountries = new Set([
        ...Object.keys(ecoMap),
        ...Object.keys(demoMap)
    ]);
    
    allData = [];
    allCountries.forEach(country => {
        // Skip invalid entries
        if (!country || country === 'COUNTRY' || country.includes('OCEAN') || country.includes('ISLAND')) return;
        
        // Only include allowed countries
        if (!isAllowedCountry(country)) return;
        
        const record = {
            country: country,
            eco: ecoMap[country] || {},
            demo: demoMap[country] || {},
            comm: commMap[country] || {},
            energy: energyMap[country] || {},
            safety: safetyMap[country] || {},
            health: healthMap[country] || {},
            region: getRegion(country)
        };
        
        // Only include if we have at least some meaningful data
        const pop = variables.population.accessor(record);
        const gdp = variables.gdp_per_capita.accessor(record);
        if (pop && gdp) {
            allData.push(record);
        }
    });
    
    console.log(`Loaded ${allData.length} countries with complete data`);
}

function initCharts() {
    drawParallelCoordinates();
    drawScatterPlot();
}

// Get filtered data based on active visa filter
function getFilteredData() {
    if (activeVisaFilter === 'all' || !visaFilters[activeVisaFilter]) {
        return allData;
    }
    const filterSet = visaFilters[activeVisaFilter];
    return allData.filter(d => {
        const name = d.country.toUpperCase();
        // Check direct match or partial match
        if (filterSet.has(name)) return true;
        for (const allowed of filterSet) {
            if (name.includes(allowed) || allowed.includes(name)) return true;
        }
        return false;
    });
}

function setupEventListeners() {
    // Visa filter change
    document.getElementById('visa-filter').addEventListener('change', (e) => {
        activeVisaFilter = e.target.value;
        drawParallelCoordinates();
        drawScatterPlot();
    });
    
    // Scatter plot axis changes
    document.getElementById('scatter-x').addEventListener('change', drawScatterPlot);
    document.getElementById('scatter-y').addEventListener('change', drawScatterPlot);
    document.getElementById('scatter-size').addEventListener('change', drawScatterPlot);
    
    // Parallel coordinates color change
    document.getElementById('pc-color-by').addEventListener('change', drawParallelCoordinates);
    
    // Country search
    const searchInput = document.getElementById('country-search');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length >= 2) {
            const match = allData.find(d => d.country.toLowerCase().includes(searchTerm));
            if (match) {
                highlightCountry(match.country);
            }
        } else if (searchTerm.length === 0) {
            clearHighlight();
        }
    });
    
    // Clear highlight button
    document.getElementById('clear-highlight').addEventListener('click', () => {
        document.getElementById('country-search').value = '';
        clearHighlight();
    });
}

function highlightCountry(countryName) {
    highlightedCountry = countryName;
    
    // Update parallel coordinates
    d3.selectAll('.pc-line')
        .classed('highlighted', d => d.country === countryName)
        .classed('dimmed', d => d.country !== countryName);
    
    // Update scatter plot
    d3.selectAll('.scatter-dot')
        .classed('highlighted', d => d.country === countryName)
        .classed('dimmed', d => d.country !== countryName);
}

function clearHighlight() {
    highlightedCountry = null;
    
    d3.selectAll('.pc-line')
        .classed('highlighted', false)
        .classed('dimmed', false);
    
    d3.selectAll('.scatter-dot')
        .classed('highlighted', false)
        .classed('dimmed', false);
}

// Tooltip functions
const tooltip = d3.select('#explore-tooltip');

function showTooltip(event, d, extraInfo = {}) {
    let html = `<h4>${formatCountryName(d.country)}</h4>`;
    html += `<p>Region: <span class="value">${d.region}</span></p>`;
    
    if (extraInfo.x) {
        html += `<p>${extraInfo.xLabel}: <span class="value">${extraInfo.xFormat(extraInfo.x)}</span></p>`;
    }
    if (extraInfo.y) {
        html += `<p>${extraInfo.yLabel}: <span class="value">${extraInfo.yFormat(extraInfo.y)}</span></p>`;
    }
    
    // Add key stats for migrants
    const pop = variables.population.accessor(d);
    const gdp = variables.gdp_per_capita.accessor(d);
    const life = variables.life_expectancy.accessor(d);
    const safety = variables.safety.accessor(d);
    const healthIdx = variables.health_index.accessor(d);
    
    if (pop && !extraInfo.x) html += `<p>Population: <span class="value">${variables.population.format(pop)}</span></p>`;
    if (gdp && !extraInfo.x) html += `<p>GDP/Capita: <span class="value">${variables.gdp_per_capita.format(gdp)}</span></p>`;
    if (life) html += `<p>Life Expectancy: <span class="value">${variables.life_expectancy.format(life)}</span></p>`;
    if (safety) html += `<p>Safety Index: <span class="value">${variables.safety.format(safety)}</span></p>`;
    if (healthIdx) html += `<p>Health Index: <span class="value">${variables.health_index.format(healthIdx)}</span></p>`;
    
    tooltip
        .style('display', 'block')
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .html(html);
}

function hideTooltip() {
    tooltip.style('display', 'none');
}

function formatCountryName(name) {
    return name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

// ========== PARALLEL COORDINATES ==========
function drawParallelCoordinates() {
    const container = document.getElementById('parallel-coords-chart');
    container.innerHTML = '';
    
    const margin = { top: 40, right: 30, bottom: 20, left: 30 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    if (width <= 0 || height <= 0) return;
    
    // Get filtered data based on visa filter selection
    const filteredData = getFilteredData();
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Color scale based on selection
    const colorBy = document.getElementById('pc-color-by').value;
    let colorScale;
    
    // Colorblind-friendly discrete palettes (5 categories, constant luminance progression)
    // Blue palette for GDP - safe for red-green and blue-yellow colorblindness
    const gdpColors = ['#f0f9e8', '#7bccc4', '#43a2ca', '#0868ac', '#084081'];
    // Orange/Brown palette for Population - safe for colorblindness
    const popColors = ['#fef0d9', '#fdcc8a', '#fc8d59', '#d7301f', '#7f0000'];
    
    if (colorBy === 'region') {
        colorScale = d => regionColors[d.region] || '#64748b';
    } else if (colorBy === 'gdp') {
        // Use quantiles to create 5 even buckets (handles skewed data better)
        const gdpValues = filteredData
            .map(d => variables.gdp_per_capita.accessor(d))
            .filter(v => v !== null)
            .sort((a, b) => a - b);
        
        // Calculate quantile thresholds (20%, 40%, 60%, 80%)
        const gdpThresholds = [0.2, 0.4, 0.6, 0.8].map(q => 
            gdpValues[Math.floor(q * gdpValues.length)]
        );
        
        colorScale = d => {
            const val = variables.gdp_per_capita.accessor(d);
            if (val === null) return '#64748b';
            if (val < gdpThresholds[0]) return gdpColors[0];
            if (val < gdpThresholds[1]) return gdpColors[1];
            if (val < gdpThresholds[2]) return gdpColors[2];
            if (val < gdpThresholds[3]) return gdpColors[3];
            return gdpColors[4];
        };
    } else {
        // Population - use quantiles for even distribution
        const popValues = filteredData
            .map(d => variables.population.accessor(d))
            .filter(v => v !== null)
            .sort((a, b) => a - b);
        
        // Calculate quantile thresholds (20%, 40%, 60%, 80%)
        const popThresholds = [0.2, 0.4, 0.6, 0.8].map(q => 
            popValues[Math.floor(q * popValues.length)]
        );
        
        colorScale = d => {
            const val = variables.population.accessor(d);
            if (val === null) return '#64748b';
            if (val < popThresholds[0]) return popColors[0];
            if (val < popThresholds[1]) return popColors[1];
            if (val < popThresholds[2]) return popColors[2];
            if (val < popThresholds[3]) return popColors[3];
            return popColors[4];
        };
    }
    
    // Create scales for each dimension
    const y = {};
    const dimensions = pcDimensions.filter(dim => {
        const values = filteredData.map(d => variables[dim].accessor(d)).filter(v => v !== null);
        if (values.length < 5) return false;
        
        y[dim] = d3.scaleLinear()
            .domain(d3.extent(values))
            .range([height, 0])
            .nice();
        return true;
    });
    
    // X scale for dimensions
    const x = d3.scalePoint()
        .domain(dimensions)
        .range([0, width])
        .padding(0.1);
    
    // Draw lines
    function path(d) {
        return d3.line()(dimensions.map(dim => {
            const val = variables[dim].accessor(d);
            if (val === null) return null;
            return [x(dim), y[dim](val)];
        }).filter(p => p !== null));
    }
    
    // Add lines for each country
    svg.selectAll('.pc-line')
        .data(filteredData)
        .join('path')
        .attr('class', 'pc-line')
        .attr('d', path)
        .style('stroke', colorScale)
        .on('mouseover', function(event, d) {
            d3.select(this).raise().style('stroke-opacity', 1).style('stroke-width', 3);
            showTooltip(event, d);
        })
        .on('mouseout', function(event, d) {
            if (highlightedCountry !== d.country) {
                d3.select(this).style('stroke-opacity', 0.4).style('stroke-width', 1.5);
            }
            hideTooltip();
        })
        .on('click', function(event, d) {
            document.getElementById('country-search').value = formatCountryName(d.country);
            highlightCountry(d.country);
        });
    
    // Add axes
    dimensions.forEach(dim => {
        const axis = svg.append('g')
            .attr('class', 'pc-axis')
            .attr('transform', `translate(${x(dim)},0)`)
            .call(d3.axisLeft(y[dim]).ticks(5).tickFormat(d => {
                if (d >= 1e9) return (d / 1e9).toFixed(0) + 'B';
                if (d >= 1e6) return (d / 1e6).toFixed(0) + 'M';
                if (d >= 1e3) return (d / 1e3).toFixed(0) + 'K';
                return d;
            }));
        
        // Add dimension label
        axis.append('text')
            .attr('class', 'pc-axis-label')
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .text(variables[dim].label.split(' ')[0]);
    });
    
    // Update legend
    updateLegend(colorBy);
}

function updateLegend(colorBy) {
    const legendContainer = document.getElementById('pc-legend');
    legendContainer.innerHTML = '';
    
    // Colorblind-friendly discrete palettes (must match drawParallelCoordinates)
    const gdpColors = ['#f0f9e8', '#7bccc4', '#43a2ca', '#0868ac', '#084081'];
    const popColors = ['#fef0d9', '#fdcc8a', '#fc8d59', '#d7301f', '#7f0000'];
    
    if (colorBy === 'region') {
        Object.entries(regionColors).forEach(([region, color]) => {
            if (region === 'Unknown') return;
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `<span class="legend-color" style="background:${color}"></span>${region}`;
            legendContainer.appendChild(item);
        });
    } else if (colorBy === 'gdp') {
        const labels = ['Lowest 20%', 'Low', 'Medium', 'High', 'Highest 20%'];
        gdpColors.forEach((color, i) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `<span class="legend-color" style="background:${color}"></span>${labels[i]}`;
            legendContainer.appendChild(item);
        });
    } else {
        const labels = ['Lowest 20%', 'Low', 'Medium', 'High', 'Highest 20%'];
        popColors.forEach((color, i) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `<span class="legend-color" style="background:${color}"></span>${labels[i]}`;
            legendContainer.appendChild(item);
        });
    }
}

// ========== SCATTER PLOT ==========
function drawScatterPlot() {
    const container = document.getElementById('scatter-chart');
    container.innerHTML = '';
    
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    if (width <= 0 || height <= 0) return;
    
    const xVar = document.getElementById('scatter-x').value;
    const yVar = document.getElementById('scatter-y').value;
    const sizeVar = document.getElementById('scatter-size').value;
    
    const xConfig = variables[xVar];
    const yConfig = variables[yVar];
    
    // Get filtered data based on visa filter, then filter to those with both values
    const filteredData = getFilteredData();
    const plotData = filteredData.filter(d => {
        const xVal = xConfig.accessor(d);
        const yVal = yConfig.accessor(d);
        return xVal !== null && yVal !== null;
    });
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xExtent = d3.extent(plotData, d => xConfig.accessor(d));
    const yExtent = d3.extent(plotData, d => yConfig.accessor(d));
    
    const x = d3.scaleLinear()
        .domain(xExtent)
        .range([0, width])
        .nice();
    
    const y = d3.scaleLinear()
        .domain(yExtent)
        .range([height, 0])
        .nice();
    
    // Size scale
    let sizeScale;
    if (sizeVar === 'none') {
        sizeScale = () => 6;
    } else {
        const sizeConfig = variables[sizeVar];
        const sizeExtent = d3.extent(plotData, d => sizeConfig.accessor(d));
        sizeScale = d3.scaleSqrt()
            .domain(sizeExtent)
            .range([4, 25]);
    }
    
    // Color by region
    const colorScale = d => regionColors[d.region] || '#64748b';
    
    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(8).tickFormat(d => {
            if (d >= 1e9) return (d / 1e9).toFixed(1) + 'B';
            if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
            if (d >= 1e3) return (d / 1e3).toFixed(0) + 'K';
            return d;
        }))
        .selectAll('text')
        .style('fill', '#94a3b8');
    
    svg.append('g')
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => {
            if (d >= 1e9) return (d / 1e9).toFixed(1) + 'B';
            if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
            if (d >= 1e3) return (d / 1e3).toFixed(0) + 'K';
            return d;
        }))
        .selectAll('text')
        .style('fill', '#94a3b8');
    
    // Axis labels
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .text(xConfig.label);
    
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -55)
        .attr('text-anchor', 'middle')
        .text(yConfig.label);
    
    // Add dots
    svg.selectAll('.scatter-dot')
        .data(plotData)
        .join('circle')
        .attr('class', 'scatter-dot')
        .attr('cx', d => x(xConfig.accessor(d)))
        .attr('cy', d => y(yConfig.accessor(d)))
        .attr('r', d => {
            if (sizeVar === 'none') return 6;
            const val = variables[sizeVar].accessor(d);
            return val ? sizeScale(val) : 4;
        })
        .attr('fill', colorScale)
        .on('mouseover', function(event, d) {
            d3.select(this).raise();
            showTooltip(event, d, {
                x: xConfig.accessor(d),
                xLabel: xConfig.label,
                xFormat: xConfig.format,
                y: yConfig.accessor(d),
                yLabel: yConfig.label,
                yFormat: yConfig.format
            });
        })
        .on('mouseout', hideTooltip)
        .on('click', function(event, d) {
            document.getElementById('country-search').value = formatCountryName(d.country);
            highlightCountry(d.country);
        });
    
    // Update info text
    document.getElementById('scatter-info').innerHTML = 
        `💡 Showing <strong>${plotData.length}</strong> countries. Hover for details, click to highlight.`;
}

// Redraw on window resize
window.addEventListener('resize', () => {
    if (allData.length > 0) {
        drawParallelCoordinates();
        drawScatterPlot();
    }
});
