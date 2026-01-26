function loadAttributeData(callback) {
    // Return a Promise so callers can `await` or use callbacks for backward-compatibility
    const p = Promise.all([
        Neutralino.filesystem.readFile('data/economy_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/demographics_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/communications_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/energy_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/transportation_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/filtered_cia_data/Indexes_calc_code/good_country_index_option3.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/filtered_cia_data/Indexes_calc_code/earning_potential_epi_future.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/filtered_cia_data/Indexes_calc_code/safety_index_risk_focused.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/filtered_cia_data/Indexes_calc_code/ownhealth_index.csv').then(data => d3.csvParse(data))
    ]).then(([economy, demographics, communications, energy, transportation, goodCountryIndex, earningPotentialIndex, safetyIndex, healthIndex]) => {
        const economyData = {};
        economy.forEach(d => {
            economyData[d.Country.toUpperCase()] = d;
        });

        const demographicsData = {};
        demographics.forEach(d => {
            demographicsData[d.Country.toUpperCase()] = d;
        });

        const commData = {};
        communications.forEach(d => {
            commData[d.Country.toUpperCase()] = d;
        });

        const energyData = {};
        energy.forEach(d => {
            energyData[d.Country.toUpperCase()] = d;
        });

        const transData = {};
        transportation.forEach(d => {
            transData[d.Country.toUpperCase()] = d;
        });

        const goodCountryData = {};
        goodCountryIndex.forEach(d => {
            goodCountryData[d.Country.toUpperCase()] = d;
        });

        const earningPotentialData = {};
        earningPotentialIndex.forEach(d => {
            earningPotentialData[d.COUNTRY.toUpperCase()] = d;
        });

        const safetyData = {};
        safetyIndex.forEach(d => {
            safetyData[d.Country.toUpperCase()] = d;
        });

        const healthData = {};
        healthIndex.forEach(d => {
            healthData[d.Country.toUpperCase()] = d;
        });

        console.log('Attribute data loaded');
        const result = { economyData, demographicsData, commData, energyData, transData, goodCountryData, earningPotentialData, safetyData, healthData };
        if (typeof callback === 'function') callback(null, result);
        return result;
    }).catch(err => {
        console.error('Error loading attribute data:', err);
        try { Neutralino.os.showMessageBox('Warning', 'Failed to load some attribute data. The map will still work, but details may be missing.', 'WARNING'); } catch(e){}
        if (typeof callback === 'function') callback(err);
        throw err;
    });

    return p;
}

function loadMapData(callback) {
    Neutralino.filesystem.readFile('resources/countries.geojson')
        .then(data => {
            const geojson = JSON.parse(data);
            console.log('Map data loaded:', geojson.features.length, 'countries');
            callback(null, geojson.features);
        })
        .catch(err => {
            console.error('Error loading map data:', err);
            Neutralino.os.showMessageBox('Error', 'Failed to load map data: ' + err.message, 'ERROR');
            callback(err);
        });
}
