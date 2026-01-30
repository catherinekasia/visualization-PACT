// shared.js - Common utilities and data shared across all pages
// This module consolidates duplicate functions etc from data.js, map.js, explore.js, and dataLoader.js

// =====================================================================
// ALLOWED COUNTRIES LIST
// Defines which countries are included in the visualizations
// =====================================================================
const ALLOWED_COUNTRIES = new Set([
    // Western Europe
    'PORTUGAL', 'SPAIN', 'ANDORRA', 'MONACO', 'FRANCE', 'UNITED KINGDOM', 'IRELAND', 'ITALY',
    'MALTA', 'LUXEMBOURG', 'BELGIUM', 'NETHERLANDS', 'SWITZERLAND',
    
    // Northern Europe (Nordic)
    'DENMARK', 'FINLAND', 'ICELAND', 'NORWAY', 'SWEDEN',
    
    // Central Europe
    'GERMANY', 'AUSTRIA', 'LIECHTENSTEIN', 'POLAND', 'CZECHIA', 'CZECH REPUBLIC',
    'SLOVAKIA', 'HUNGARY', 'SLOVENIA', 'CROATIA',
    
    // Eastern Europe
    'ESTONIA', 'LATVIA', 'LITHUANIA', 'BELARUS', 'UKRAINE', 'MOLDOVA', 'REPUBLIC OF MOLDOVA',
    'ROMANIA', 'BULGARIA', 'SERBIA', 'MONTENEGRO', 'BOSNIA AND HERZEGOVINA', 'ALBANIA',
    'NORTH MACEDONIA', 'KOSOVO', 'GREECE', 'TURKEY (TURKIYE)', 'TURKEY',
    'RUSSIA', 'RUSSIAN FEDERATION',
    
    // East Asia
    'JAPAN', 'KOREA, SOUTH', 'SOUTH KOREA', 'TAIWAN', 'CHINA', 'SINGAPORE',
    
    // Oceania
    'AUSTRALIA', 'NEW ZEALAND',
    
    // North America
    'CANADA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'USA', 'MEXICO', 'GREENLAND'
]);

// =====================================================================
// REGION COLORS
// Isoluminant color palette (constant perceived brightness ~L=65)
// =====================================================================
const REGION_COLORS = {
    'Western Europe': '#5B8FF9',   // Blue
    'Northern Europe': '#9D7FEA',  // Violet
    'Central Europe': '#5AD8A6',   // Teal-green
    'Eastern Europe': '#F6BD16',   // Gold
    'East Asia': '#E86452',        // Coral
    'North America': '#6DC8EC',    // Sky blue
    'Oceania': '#FF9845',          // Orange
    'Unknown': '#8C8C8C'           // Gray
};

// =====================================================================
// REGION CLASSIFICATION
// Maps countries to their geographic regions
// =====================================================================
const REGION_MAPPING = {
    westernEurope: ['ANDORRA', 'BELGIUM', 'FRANCE', 'IRELAND', 'ITALY', 
        'LUXEMBOURG', 'MALTA', 'MONACO', 'NETHERLANDS', 'PORTUGAL', 'SPAIN', 
        'SWITZERLAND', 'UNITED KINGDOM'],
    northernEurope: ['DENMARK', 'FINLAND', 'ICELAND', 'NORWAY', 'SWEDEN'],
    centralEurope: ['AUSTRIA', 'CROATIA', 'CZECHIA', 'CZECH REPUBLIC', 'GERMANY', 
        'HUNGARY', 'LIECHTENSTEIN', 'POLAND', 'SLOVAKIA', 'SLOVENIA'],
    easternEurope: ['ALBANIA', 'BELARUS', 'BOSNIA', 'BULGARIA', 'ESTONIA', 'GREECE', 
        'KOSOVO', 'LATVIA', 'LITHUANIA', 'MOLDOVA', 'MONTENEGRO', 'NORTH MACEDONIA', 
        'ROMANIA', 'RUSSIA', 'SERBIA', 'TURKEY', 'UKRAINE'],
    eastAsia: ['CHINA', 'JAPAN', 'KOREA', 'SINGAPORE', 'TAIWAN'],
    northAmerica: ['CANADA', 'GREENLAND', 'MEXICO', 'UNITED STATES'],
    oceania: ['AUSTRALIA', 'NEW ZEALAND']
};

// =====================================================================
// VISA/MIGRATION FILTER GROUPS
// =====================================================================
const VISA_FILTERS = {
    'all': null,
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

// =====================================================================
// COUNTRY NAME NORMALIZATION
// Handles variations in country names across data sources
// =====================================================================
const COUNTRY_ALIASES = {
    'united states': 'united states of america',
    'usa': 'united states of america',
    'uk': 'united kingdom',
    'russia': 'russian federation',
    'south korea': 'korea, south',
    'north korea': 'korea, north',
    'czechia': 'czech republic',
    'viet nam': 'vietnam',
    'moldova': 'moldova, republic of',
    'macedonia': 'north macedonia',
    'slovakia': 'slovak republic',
    'ivory coast': 'cote divoire',
    'laos': 'lao peoples democratic republic',
    'syria': 'syrian arab republic',
    'iran': 'iran (islamic republic of)',
    'tanzania': 'tanzania, united republic of',
    'venezuela': 'venezuela (bolivarian republic of)',
    'bolivia': 'bolivia (plurinational state of)',
    'brunei': 'brunei darussalam',
    'palestine': 'palestine, state of',
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
    'congo drc': 'congo, democratic republic of the'
};

/**
 * Normalize a country name for consistent matching across data sources
 * @param {string} name - Raw country name
 * @returns {string} - Normalized country name
 */
function normalizeCountryName(name) {
    if (!name) return '';
    let norm = name.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
    return COUNTRY_ALIASES[norm] || norm;
}

/**
 * Check if a country is in the allowed list
 * @param {string} countryName - Country name to check
 * @returns {boolean} - True if country is allowed
 */
function isAllowedCountry(countryName) {
    if (!countryName) return false;
    const name = String(countryName).toUpperCase().trim();
    if (ALLOWED_COUNTRIES.has(name)) return true;
    // Check partial matches for country name variations
    for (const allowed of ALLOWED_COUNTRIES) {
        if (name.includes(allowed) || allowed.includes(name)) return true;
    }
    return false;
}

/**
 * Get the region for a country
 * @param {string} countryName - Country name
 * @returns {string} - Region name
 */
function getRegion(countryName) {
    const name = countryName.toUpperCase();
    
    if (REGION_MAPPING.westernEurope.some(c => name.includes(c))) return 'Western Europe';
    if (REGION_MAPPING.northernEurope.some(c => name.includes(c))) return 'Northern Europe';
    if (REGION_MAPPING.centralEurope.some(c => name.includes(c))) return 'Central Europe';
    if (REGION_MAPPING.easternEurope.some(c => name.includes(c))) return 'Eastern Europe';
    if (REGION_MAPPING.eastAsia.some(c => name.includes(c))) return 'East Asia';
    if (REGION_MAPPING.northAmerica.some(c => name.includes(c))) return 'North America';
    if (REGION_MAPPING.oceania.some(c => name.includes(c))) return 'Oceania';
    
    return 'Unknown';
}

/**
 * Get the color for a region
 * @param {string} region - Region name
 * @returns {string} - Hex color code
 */
function getRegionColor(region) {
    return REGION_COLORS[region] || REGION_COLORS['Unknown'];
}

// =====================================================================
// DATA FILE PATHS
// Central location for all data file paths
// =====================================================================
const DATA_PATHS = {
    // Main data directory (unfiltered)
    economy: 'data/economy_data.csv',
    demographics: 'data/demographics_data.csv',
    communications: 'data/communications_data.csv',
    energy: 'data/energy_data.csv',
    transportation: 'data/transportation_data.csv',
    geography: 'data/geography_data.csv',
    government: 'data/government_and_civics_data.csv',
    
    // Filtered CIA data
    filtered: {
        economy: 'data/filtered_cia_data/economy_data.csv',
        demographics: 'data/filtered_cia_data/demographics_data.csv',
        communications: 'data/filtered_cia_data/communications_data.csv',
        energy: 'data/filtered_cia_data/energy_data.csv',
        geography: 'data/filtered_cia_data/geography_data.csv',
        government: 'data/filtered_cia_data/government_and_civics_data.csv',
        transportation: 'data/filtered_cia_data/transportation_data.csv'
    },
    
    // Indexes
    indexes: {
        goodCountry: 'data/filtered_cia_data/Indexes_calc_code/good_country_index_option3.csv',
        earningPotential: 'data/filtered_cia_data/Indexes_calc_code/earning_potential_epi_future.csv',
        safety: 'data/filtered_cia_data/Indexes_calc_code/safety_index_risk_focused.csv',
        health: 'data/filtered_cia_data/Indexes_calc_code/ownhealth_index.csv',
        economicStability: 'data/filtered_cia_data/Indexes_calc_code/economic_stability_option_c.csv',
        dpi: 'data/filtered_cia_data/Indexes_calc_code/DPI.csv'
    },
    
    // Other indexes
    peace: 'data/filtered_cia_data/global_peace_index.csv',
    crime: 'data/filtered_cia_data/criminal_index.csv',
    terrorism: 'data/filtered_cia_data/global_terrorism_index.csv',
    healthcare: 'data/filtered_cia_data/heathcare_index_data.csv',
    inflation: 'data/filtered_cia_data/global_inflation_data.csv',
    lifeExpectancy: 'data/filtered_cia_data/life_expectancy.csv',
    
    // Map data
    geojson: 'resources/countries.geojson',
    
    // Visa information
    visaInfo: 'data/visa_info.csv'
};

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Format a number for display
 * @param {number|string} num - Number to format
 * @returns {string} - Formatted number or '--' if invalid
 */
function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '--';
    if (typeof num === 'string') {
        num = num.replace(/,/g, '');
    }
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return '--';
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(parsed);
}

/**
 * Format a large number with suffix (K, M, B)
 * @param {number} num - Number to format
 * @returns {string} - Formatted string
 */
function formatLargeNumber(num) {
    if (num === null || num === undefined) return '--';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Parse a numeric value from various formats
 * @param {any} val - Value to parse
 * @returns {number|null} - Parsed number or null
 */
function parseNumericValue(val) {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (typeof val === 'string') {
        // Remove common formatting
        const cleaned = val.replace(/[,%$]/g, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }
    return null;
}

/**
 * Format country name to title case (proper capitalization)
 * @param {string} name - Country name (may be all caps or mixed case)
 * @returns {string} - Properly formatted country name
 */
function formatCountryName(name) {
    if (!name) return '';
    
    // Special cases that need specific formatting
    const specialCases = {
        'UNITED STATES': 'United States',
        'UNITED STATES OF AMERICA': 'United States of America',
        'UNITED KINGDOM': 'United Kingdom',
        'UNITED ARAB EMIRATES': 'United Arab Emirates',
        'NEW ZEALAND': 'New Zealand',
        'SOUTH KOREA': 'South Korea',
        'NORTH KOREA': 'North Korea',
        'CZECH REPUBLIC': 'Czech Republic',
        'COSTA RICA': 'Costa Rica',
        'PUERTO RICO': 'Puerto Rico',
        'EL SALVADOR': 'El Salvador',
        'SAUDI ARABIA': 'Saudi Arabia',
        'SOUTH AFRICA': 'South Africa',
        'SOUTH SUDAN': 'South Sudan',
        'NORTH MACEDONIA': 'North Macedonia',
        'BOSNIA AND HERZEGOVINA': 'Bosnia and Herzegovina',
        'TRINIDAD AND TOBAGO': 'Trinidad and Tobago',
        'ANTIGUA AND BARBUDA': 'Antigua and Barbuda',
        'SAINT KITTS AND NEVIS': 'Saint Kitts and Nevis',
        'SAINT VINCENT AND THE GRENADINES': 'Saint Vincent and the Grenadines',
        'SAO TOME AND PRINCIPE': 'São Tomé and Príncipe',
        'TIMOR-LESTE': 'Timor-Leste',
        'COTE DIVOIRE': 'Côte d\'Ivoire',
        'CABO VERDE': 'Cabo Verde',
        'BURKINA FASO': 'Burkina Faso',
        'SIERRA LEONE': 'Sierra Leone',
        'PAPUA NEW GUINEA': 'Papua New Guinea',
        'SOLOMON ISLANDS': 'Solomon Islands',
        'MARSHALL ISLANDS': 'Marshall Islands',
        'CENTRAL AFRICAN REPUBLIC': 'Central African Republic',
        'EQUATORIAL GUINEA': 'Equatorial Guinea',
        'GUINEA-BISSAU': 'Guinea-Bissau'
    };
    
    const upper = name.toUpperCase().trim();
    
    // Check special cases first
    if (specialCases[upper]) {
        return specialCases[upper];
    }
    
    // Title case conversion for other names
    // Split on spaces, hyphens, and preserve them
    return name.toLowerCase().split(/(\s+|-|,)/).map((word, index) => {
        // Keep separators as-is
        if (word.match(/^\s+$/) || word === '-' || word === ',') {
            return word;
        }
        // Don't capitalize articles and prepositions (unless first word)
        if (index > 0 && ['and', 'of', 'the', 'de', 'la', 'da'].includes(word.toLowerCase())) {
            return word.toLowerCase();
        }
        // Capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('');
}

// Export for use in other modules (if using ES modules)
// For script tag usage, these are available globally
if (typeof window !== 'undefined') {
    window.SharedUtils = {
        ALLOWED_COUNTRIES,
        REGION_COLORS,
        REGION_MAPPING,
        VISA_FILTERS,
        COUNTRY_ALIASES,
        DATA_PATHS,
        normalizeCountryName,
        isAllowedCountry,
        getRegion,
        getRegionColor,
        formatNumber,
        formatLargeNumber,
        parseNumericValue,
        formatCountryName,
        isGreenland,
        getGreenlandMessage
    };
}

/**
 * Check if a country is Greenland (which is part of Denmark)
 * @param {string} countryName - Country name to check
 * @returns {boolean} - True if country is Greenland
 */
function isGreenland(countryName) {
    if (!countryName) return false;
    const name = String(countryName).toUpperCase().trim();
    return name === 'GREENLAND' || name.includes('GREENLAND');
}

/**
 * Get a message explaining Greenland's data situation
 * @returns {string} - Explanation message
 */
function getGreenlandMessage() {
    return 'Greenland is an autonomous territory of Denmark. As such, specific data for Greenland is not available separately in this dataset. Please refer to Denmark for relevant statistics.';
}