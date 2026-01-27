let modal = null;
let closeBtn = null;
let onCloseDeselect = null;

// Normalize country names from GeoJSON to match data file naming conventions
function normalizeCountryName(name) {
    const nameMap = {
        "TURKEY": "TURKEY (TURKIYE)",
        "TURKIYE": "TURKEY (TURKIYE)",
        "TÜRKİYE": "TURKEY (TURKIYE)",
        "UNITED STATES OF AMERICA": "UNITED STATES",
        "USA": "UNITED STATES",
        "CZECH REPUBLIC": "CZECHIA",
        "COCOS ISLANDS": "COCOS (KEELING) ISLANDS",
        "KEELING ISLANDS": "COCOS (KEELING) ISLANDS",
        "DEMOCRATIC REPUBLIC OF THE CONGO": "CONGO, DEMOCRATIC REPUBLIC OF THE",
        "DR CONGO": "CONGO, DEMOCRATIC REPUBLIC OF THE",
        "REPUBLIC OF THE CONGO": "CONGO, REPUBLIC OF THE",
        "IVORY COAST": "COTE D'IVOIRE",
        "CÔTE D'IVOIRE": "COTE D'IVOIRE",
        "SWAZILAND": "ESWATINI",
        "BURMA": "MYANMAR",
        "RUSSIAN FEDERATION": "RUSSIA",
        "REPUBLIC OF KOREA": "SOUTH KOREA",
        "KOREA, REPUBLIC OF": "SOUTH KOREA",
        "DEMOCRATIC PEOPLE'S REPUBLIC OF KOREA": "NORTH KOREA",
        "KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF": "NORTH KOREA",
        "UNITED REPUBLIC OF TANZANIA": "TANZANIA",
        "SYRIAN ARAB REPUBLIC": "SYRIA",
        "PALESTINIAN TERRITORIES": "PALESTINE",
        "WEST BANK AND GAZA": "PALESTINE",
        "LAO PEOPLE'S DEMOCRATIC REPUBLIC": "LAOS",
        "VIET NAM": "VIETNAM",
        "BRUNEI DARUSSALAM": "BRUNEI",
        "TIMOR LESTE": "TIMOR-LESTE",
        "EAST TIMOR": "TIMOR-LESTE",
        "CAPE VERDE": "CABO VERDE",
        "REPUBLIC OF SERBIA": "SERBIA",
        "THE BAHAMAS": "BAHAMAS",
        "THE GAMBIA": "GAMBIA",
        "BOSNIA AND HERZ.": "BOSNIA AND HERZEGOVINA",
        "CENTRAL AFRICAN REP.": "CENTRAL AFRICAN REPUBLIC",
        "S. SUDAN": "SOUTH SUDAN",
        "EQ. GUINEA": "EQUATORIAL GUINEA",
        "SOLOMON IS.": "SOLOMON ISLANDS",
        "FALKLAND IS.": "FALKLAND ISLANDS",
        "SOMALILAND": "SOMALIA",
        "N. CYPRUS": "CYPRUS",
        "NORTHERN CYPRUS": "CYPRUS"
    };
    const upper = name.toUpperCase().trim();
    return nameMap[upper] || upper;
}

function initPopup() {
    // Accept an optional deselect callback when initializing
    const args = Array.from(arguments);
    onCloseDeselect = args[0] || null;

    modal = document.getElementById('country-modal');
    closeBtn = document.getElementById('close-modal');

    if (modal && closeBtn) {
        closeBtn.addEventListener('click', closePopup);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closePopup();
        });
    } else {
        console.error("Popup elements not found on init!");
    }
}

function openPopup(feature, economyData, demographicsData, commData, energyData, goodCountryData, earningPotentialData, safetyData, healthData) {
        // Helper: map country name to ISO 2-letter code
        function getCountryCode(name) {
            const map = {
                "afghanistan": "af", "albania": "al", "algeria": "dz", "andorra": "ad", "angola": "ao", "argentina": "ar", "armenia": "am", "australia": "au", "austria": "at", "azerbaijan": "az",
                "bahamas": "bs", "bahrain": "bh", "bangladesh": "bd", "barbados": "bb", "belarus": "by", "belgium": "be", "belize": "bz", "benin": "bj", "bhutan": "bt", "bolivia": "bo",
                "bosnia and herzegovina": "ba", "botswana": "bw", "brazil": "br", "brunei": "bn", "bulgaria": "bg", "burkina faso": "bf", "burundi": "bi", "cambodia": "kh", "cameroon": "cm", "canada": "ca",
                "cape verde": "cv", "central african republic": "cf", "chad": "td", "chile": "cl", "china": "cn", "colombia": "co", "comoros": "km", "congo": "cg", "costa rica": "cr", "croatia": "hr",
                "cuba": "cu", "cyprus": "cy", "czechia": "cz", "czech republic": "cz", "denmark": "dk", "djibouti": "dj", "dominica": "dm", "dominican republic": "do", "ecuador": "ec", "egypt": "eg",
                "el salvador": "sv", "equatorial guinea": "gq", "eritrea": "er", "estonia": "ee", "eswatini": "sz", "ethiopia": "et", "fiji": "fj", "finland": "fi", "france": "fr", "gabon": "ga",
                "gambia": "gm", "georgia": "ge", "germany": "de", "ghana": "gh", "greece": "gr","greenland": "gl", "grenada": "gd", "guatemala": "gt", "guinea": "gn", "guinea-bissau": "gw", "guyana": "gy",
                "haiti": "ht", "honduras": "hn", "hungary": "hu", "iceland": "is", "india": "in", "indonesia": "id", "iran": "ir", "iraq": "iq", "ireland": "ie", "israel": "il", "italy": "it",
                "jamaica": "jm", "japan": "jp", "jordan": "jo", "kazakhstan": "kz", "kenya": "ke", "kiribati": "ki", "korea, north": "kp", "north korea": "kp", "korea, south": "kr", "south korea": "kr",
                "kosovo": "xk", "kuwait": "kw", "kyrgyzstan": "kg", "laos": "la", "latvia": "lv", "lebanon": "lb", "lesotho": "ls", "liberia": "lr", "libya": "ly", "liechtenstein": "li",
                "lithuania": "lt", "luxembourg": "lu", "madagascar": "mg", "malawi": "mw", "malaysia": "my", "maldives": "mv", "mali": "ml", "malta": "mt", "marshall islands": "mh", "mauritania": "mr",
                "mauritius": "mu", "mexico": "mx", "micronesia": "fm", "moldova": "md", "monaco": "mc", "mongolia": "mn", "montenegro": "me", "morocco": "ma", "mozambique": "mz", "myanmar": "mm",
                "namibia": "na", "nauru": "nr", "nepal": "np", "netherlands": "nl", "new zealand": "nz", "nicaragua": "ni", "niger": "ne", "nigeria": "ng", "north macedonia": "mk", "norway": "no",
                "oman": "om", "pakistan": "pk", "palau": "pw", "palestine": "ps", "panama": "pa", "papua new guinea": "pg", "paraguay": "py", "peru": "pe", "philippines": "ph", "poland": "pl",
                "portugal": "pt", "qatar": "qa", "romania": "ro", "russia": "ru", "rwanda": "rw", "saint kitts and nevis": "kn", "saint lucia": "lc", "saint vincent and the grenadines": "vc",
                "samoa": "ws", "san marino": "sm", "sao tome and principe": "st", "saudi arabia": "sa", "senegal": "sn", "republic of serbia": "rs", "seychelles": "sc", "sierra leone": "sl", "singapore": "sg",
                "slovakia": "sk", "slovenia": "si", "solomon islands": "sb", "somalia": "so", "south africa": "za", "south sudan": "ss", "spain": "es", "sri lanka": "lk", "sudan": "sd", "suriname": "sr",
                "sweden": "se", "switzerland": "ch", "syria": "sy", "taiwan": "tw", "tajikistan": "tj", "tanzania": "tz", "thailand": "th", "timor-leste": "tl", "togo": "tg", "tonga": "to",
                "trinidad and tobago": "tt", "tunisia": "tn", "turkey": "tr", "turkmenistan": "tm", "tuvalu": "tv", "uganda": "ug", "ukraine": "ua", "united arab emirates": "ae", "united kingdom": "gb",
                "united states": "us", "united states of america": "us", "uruguay": "uy", "uzbekistan": "uz", "vanuatu": "vu", "vatican city": "va", "venezuela": "ve", "vietnam": "vn", "yemen": "ye",
                "zambia": "zm", "zimbabwe": "zw"
            };
            let key = name.trim().toLowerCase();
            return map[key] || 'unknown';
        }
    if (!modal) {
        console.error("Popup not initialized, cannot open.");
        return;
    }
    const name = feature.properties.name || feature.properties.ADMIN || 'Unknown Country';
    const nameUpper = name.toUpperCase();
    const normalizedName = normalizeCountryName(name);

    const eco = economyData[normalizedName] || economyData[nameUpper] || {};
    const demo = demographicsData[normalizedName] || demographicsData[nameUpper] || {};
    const goodCountry = (goodCountryData && (goodCountryData[normalizedName] || goodCountryData[nameUpper])) || {};
    const earningPotential = (earningPotentialData && (earningPotentialData[normalizedName] || earningPotentialData[nameUpper])) || {};
    const safety = (safetyData && (safetyData[normalizedName] || safetyData[nameUpper])) || {};
    const health = (healthData && (healthData[normalizedName] || healthData[nameUpper])) || {};

    // Get Life Expectancy from health data
    const lifeExpectancyVal = parseFloat(health.life_expectancy);
    const lifeExpectancy = !isNaN(lifeExpectancyVal) ? lifeExpectancyVal.toFixed(1) + ' yrs' : 'N/A';

    // Update UI
        document.getElementById('modal-country-name').textContent = name;
        // Set flag image source based on country name (replace spaces and special chars)
        const flagImg = document.getElementById('modal-country-flag');
        if(flagImg) {
            // Use mapping function for country code
            let code = getCountryCode(name);
            let flagFile = `${code}.svg`;
            let flagPath = `icons/flags/${flagFile}`;
            console.log('Flag path for', name, ':', flagPath);
            flagImg.src = flagPath;
            flagImg.alt = `${name} flag`;
            flagImg.onerror = function() {
                console.error('Flag failed to load:', flagPath);
            };
        }
    document.getElementById('modal-happiness-val').textContent = lifeExpectancy;
    
    // Format index values
    const goodCountryIndexVal = goodCountry.good_country_index ? parseFloat(goodCountry.good_country_index).toFixed(2) : 'N/A';
    const earningPotentialVal = earningPotential.EPI_future ? parseFloat(earningPotential.EPI_future).toFixed(2) : 'N/A';
    const safetyIndexVal = safety.safety_index_risk_focused ? parseFloat(safety.safety_index_risk_focused).toFixed(2) : 'N/A';
    const healthIndexVal = health.health_index ? parseFloat(health.health_index).toFixed(2) : 'N/A';
    
    // Build index list HTML
    const overviewEl = document.getElementById('modal-overview-text');
    overviewEl.innerHTML = `${name} has a population of ${formatNumber(demo.Total_Population)} and has the following index values:
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Good Country Index:</strong> ${goodCountryIndexVal}</li>
            <li><strong>Earning Potential Index:</strong> ${earningPotentialVal}</li>
            <li><strong>Safety Index:</strong> ${safetyIndexVal}</li>
            <li><strong>Health Index:</strong> ${healthIndexVal}</li>
        </ul>
        <a href="#" id="explain-indexes-link" style="color: #4a90d9; text-decoration: underline; cursor: pointer;">What do these indexes mean?</a>`;
    
    // Add click handler for explanation link using onclick directly
    const explainLink = document.getElementById('explain-indexes-link');
    if (explainLink) {
        explainLink.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openIndexExplanationPopup();
            return false;
        };
    }

    modal.style.display = 'flex';
    // Small delay to allow display:flex to apply before opacity transition
    setTimeout(() => {
        modal.classList.add('active');
        // Draw charts after modal is visible and has dimensions
        drawCharts(feature, economyData, demographicsData, commData, energyData, goodCountryData, earningPotentialData, safetyData, healthData);
    }, 10);
}

function closePopup() {
    if (!modal) return;
    modal.classList.remove('active');
    // Notify map (or other) to clear selection
    try { if (typeof onCloseDeselect === 'function') onCloseDeselect(); } catch (e) { console.error(e); }
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function drawCharts(feature, economyData, demographicsData, commData, energyData, goodCountryData, earningPotentialData, safetyData, healthData) {
    const name = feature.properties.name || feature.properties.ADMIN || 'Unknown Country';
    const nameUpper = name.toUpperCase();
    const normalizedName = normalizeCountryName(name);

    const eco = economyData[normalizedName] || economyData[nameUpper] || {};
    const demo = demographicsData[normalizedName] || demographicsData[nameUpper] || {};
    const comm = commData[normalizedName] || commData[nameUpper] || {};
    const energy = energyData[normalizedName] || energyData[nameUpper] || {};
    const goodCountry = (goodCountryData && (goodCountryData[normalizedName] || goodCountryData[nameUpper])) || {};
    const earningPotential = (earningPotentialData && (earningPotentialData[normalizedName] || earningPotentialData[nameUpper])) || {};
    const safety = (safetyData && (safetyData[normalizedName] || safetyData[nameUpper])) || {};
    const health = (healthData && (healthData[normalizedName] || healthData[nameUpper])) || {};

    // --- Radar Data using Raw Data Values ---
    // Literacy Rate (0-100%)
    let literacy = parseFloat((demo.Total_Literacy_Rate || '0').replace('%', '')) || 0;
    
    // Electricity Access (0-100%)
    let electricity = parseFloat(energy.electricity_access_percent) || 0;
    
    // Employment Rate (100 - unemployment rate, 0-100%)
    let employment = 100 - (parseFloat(eco.Unemployment_Rate_percent) || 0);
    if (employment < 0) employment = 0;
    if (employment > 100) employment = 100;
    
    // Internet Penetration (internet users / population * 100)
    let population = parseFloat(demo.Total_Population) || 1;
    let internetUsers = parseFloat(comm.internet_users_total) || 0;
    let internet = (internetUsers / population) * 100;
    if (internet > 100) internet = 100;
    
    // Life Expectancy (normalized to 0-100, where 50 years = 0 and 90 years = 100)
    let lifeExpectancy = parseFloat(health.life_expectancy) || 0;
    let lifeExpectancyScore = ((lifeExpectancy - 50) / 40) * 100;
    if (lifeExpectancyScore < 0) lifeExpectancyScore = 0;
    if (lifeExpectancyScore > 100) lifeExpectancyScore = 100;

    const radarData = [
        { axis: "Literacy", value: literacy },
        { axis: "Electricity", value: electricity },
        { axis: "Employment", value: employment },
        { axis: "Internet", value: internet },
        { axis: "Life Exp", value: lifeExpectancyScore }
    ];

    drawRadarChart("#chart-radar", radarData);

    // --- Bar Data: Population Demographics ---
    const birthRate = parseFloat(demo.Birth_Rate) || 0;
    const deathRate = parseFloat(demo.Death_Rate) || 0;
    const medianAge = parseFloat(demo.Median_Age) || 0;

    const barData = [
        { label: "Birth Rate", value: birthRate, max: 40, format: v => `${v.toFixed(1)}/1k` },
        { label: "Death Rate", value: deathRate, max: 20, format: v => `${v.toFixed(1)}/1k` },
        { label: "Median Age", value: medianAge, max: 50, format: v => `${v.toFixed(0)} yrs` }
    ];

    drawBarChart("#chart-bar", barData);
}

function openIndexExplanationPopup() {
    console.log('Opening index explanation popup');
    // Check if modal already exists
    let explainModal = document.getElementById('index-explanation-modal');
    
    if (!explainModal) {
        console.log('Creating new explanation modal');
        // Create the modal dynamically
        explainModal = document.createElement('div');
        explainModal.id = 'index-explanation-modal';
        explainModal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; justify-content: center; align-items: center;';
        
        explainModal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #fff; margin: 0;">What do these indexes mean?</h2>
                    <button id="close-explain-modal" style="background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
                </div>
                
                <div style="color: #e0e0e0; line-height: 1.6;">
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <h3 style="color: #4a90d9; margin: 0 0 10px 0;">🌍 Good Country Index</h3>
                        <p style="margin: 0;">From a scale of 0 to 100, with higher scores indicating a "better" country. This index was created by taking into account the healthcare available, life expectancy, the safety, economic stability, and earning potential of each country. It is meant to be used as a generalized index of each country. </p>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <h3 style="color: #4a90d9; margin: 0 0 10px 0;">💰 Earning Potential Index (EPI)</h3>
                        <p style="margin: 0;">Evaluates future earning potential based on GDP per capita, GDP growth rate, normalized unemployment rate, and inflation rate. The index normalizes these factors and weighs them to predict economic opportunity for individuals in each country. The higher the value, the higher the earning potential.</p>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <h3 style="color: #4a90d9; margin: 0 0 10px 0;">🛡️ Safety Index</h3>
                        <p style="margin: 0;">A risk-focused measure combining the global terrorism index, global peace index, and crime index. Each component is normalized and inverted (where applicable) so higher scores indicate safer countries. Factors include criminal rates, arrests, and conflict levels.</p>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <h3 style="color: #4a90d9; margin: 0 0 10px 0;">🏥 Health Index</h3>
                        <p style="margin: 0;">This index provides an overall view of the health of citizens in each country. The index factors in a life expectancy index, infant mortality rate, and a healthcare availability index. Higher scores indicate better overall health outcomes.</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(explainModal);
        
        // Add close handlers
        const closeBtn = document.getElementById('close-explain-modal');
        if (closeBtn) {
            closeBtn.onclick = function() {
                closeIndexExplanationPopup();
            };
        }
        explainModal.onclick = function(e) {
            if (e.target === explainModal) closeIndexExplanationPopup();
        };
    } else {
        explainModal.style.display = 'flex';
    }
}

function closeIndexExplanationPopup() {
    const explainModal = document.getElementById('index-explanation-modal');
    if (explainModal) {
        explainModal.style.display = 'none';
    }
}
