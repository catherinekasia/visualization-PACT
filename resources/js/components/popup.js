let modal = null;
let closeBtn = null;

function initPopup() {
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

function openPopup(feature, economyData, demographicsData, commData, energyData) {
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
                "samoa": "ws", "san marino": "sm", "sao tome and principe": "st", "saudi arabia": "sa", "senegal": "sn", "serbia": "rs", "seychelles": "sc", "sierra leone": "sl", "singapore": "sg",
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

    const eco = economyData[nameUpper] || {};
    const demo = demographicsData[nameUpper] || {};

    // Calculate Happiness Index (Mock Logic)
    // Based on GDP per capita and Infant Mortality (inverse)
    let happiness = 5.0; // Default
    let gdp = parseFloat(eco.Real_GDP_per_Capita_USD || 0);
    let mortality = parseFloat(demo.Infant_Mortality_Rate || 0);

    if (gdp > 0) {
        // Log scale for GDP: 0 to 100k -> 0 to 1
        const gdpScore = Math.min(Math.log10(gdp) / 5, 1) * 10;
        // Mortality: 100 to 0 -> 0 to 1
        const mortScore = Math.max(0, (100 - mortality) / 10);

        happiness = (gdpScore * 0.6 + mortScore * 0.4).toFixed(1);
    } else {
        happiness = (Math.random() * 4 + 3).toFixed(1); // Random 3-7 if no data
    }

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
    document.getElementById('modal-happiness-val').textContent = happiness;
    document.getElementById('modal-overview-text').textContent =
        `${name} has a population of ${formatNumber(demo.Total_Population)} and a GDP per capita of $${formatNumber(eco.Real_GDP_per_Capita_USD)}.`;

    document.getElementById('modal-gdp').textContent = eco.Real_GDP_PPP_billion_USD ? `$${eco.Real_GDP_PPP_billion_USD} B` : 'N/A';
    document.getElementById('modal-population').textContent = demo.Total_Population ? formatNumber(demo.Total_Population) : 'N/A';
    document.getElementById('modal-area').textContent = feature.properties.pop_est ? 'N/A' : 'N/A'; // GeoJSON might not have area

    modal.style.display = 'flex';
    // Small delay to allow display:flex to apply before opacity transition
    setTimeout(() => {
        modal.classList.add('active');
        // Draw charts after modal is visible and has dimensions
        drawCharts(feature, economyData, demographicsData, commData, energyData);
    }, 10);
}

function closePopup() {
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function drawCharts(feature, economyData, demographicsData, commData, energyData) {
    const name = feature.properties.name || feature.properties.ADMIN || 'Unknown Country';
    const nameUpper = name.toUpperCase();

    const eco = economyData[nameUpper] || {};
    const demo = demographicsData[nameUpper] || {};
    const comm = commData[nameUpper] || {};
    const energy = energyData[nameUpper] || {};

    // --- Radar Data ---
    let literacy = parseFloat((demo.Total_Literacy_Rate || '0').replace('%', '')) || 0;
    let electricity = parseFloat(energy.electricity_access_percent) || 0;

    let population = parseFloat(demo.Total_Population) || 1;
    let internetUsers = parseFloat(comm.internet_users_total) || 0;
    let internet = (internetUsers / population) * 100;
    if (internet > 100) internet = 100;

    let mobileSubs = parseFloat(comm.mobile_cellular_subscriptions_total) || 0;
    let mobile = (mobileSubs / population) * 100;
    if (mobile > 100) mobile = 100;

    let mortality = parseFloat(demo.Infant_Mortality_Rate) || 0;
    let health = Math.max(0, 100 - mortality);

    const radarData = [
        { axis: "Literacy", value: literacy },
        { axis: "Electricity", value: electricity },
        { axis: "Internet", value: internet },
        { axis: "Mobile", value: mobile },
        { axis: "Health", value: health }
    ];

    drawRadarChart("#chart-radar", radarData);

    // --- Bar Data ---
    const gdp = parseFloat(eco.Real_GDP_per_Capita_USD) || 0;
    const unemployment = parseFloat(eco.Unemployment_Rate_percent) || 0;
    const debt = parseFloat(eco.Public_Debt_percent_of_GDP) || 0;

    const barData = [
        { label: "GDP/Cap", value: gdp, max: 100000, format: v => `$${(v / 1000).toFixed(1)}k` },
        { label: "Unemployment", value: unemployment, max: 20, format: v => `${v}%` },
        { label: "Public Debt", value: debt, max: 150, format: v => `${v}%` }
    ];

    drawBarChart("#chart-bar", barData);
}
