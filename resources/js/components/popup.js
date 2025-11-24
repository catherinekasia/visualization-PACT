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
