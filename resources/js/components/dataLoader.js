// Use shared utilities for data paths - access via window.SharedUtils.DATA_PATHS

function loadAttributeData(callback) {
    // Return a Promise so callers can `await` or use callbacks for backward-compatibility
    const DATA_PATHS = window.SharedUtils.DATA_PATHS;
    const p = Promise.all([
        Neutralino.filesystem.readFile(DATA_PATHS.filtered.economy).then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile(DATA_PATHS.filtered.demographics).then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile(DATA_PATHS.filtered.communications).then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile(DATA_PATHS.filtered.energy).then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile(DATA_PATHS.indexes.goodCountry).then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile(DATA_PATHS.indexes.earningPotential).then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile(DATA_PATHS.indexes.safety).then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile(DATA_PATHS.indexes.health).then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile(DATA_PATHS.visaInfo).then(data => d3.csvParse(data))
    ]).then(([economy, demographics, communications, energy, goodCountryIndex, earningPotentialIndex, safetyIndex, healthIndex, visaInfo]) => {
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

        // Group visa data by country (a country can have multiple visa types)
        const visaData = {};
        visaInfo.forEach(d => {
            const country = d.Country.trim().toUpperCase();
            if (!visaData[country]) {
                visaData[country] = [];
            }
            visaData[country].push(d);
        });

        console.log('Attribute data loaded');
        const result = { economyData, demographicsData, commData, energyData, goodCountryData, earningPotentialData, safetyData, healthData, visaData };
        if (typeof callback === 'function') callback(null, result);
        return result;
    }).catch(err => {
        console.error('Error loading attribute data:', err);
        try { Neutralino.os.showMessageBox('Warning', 'Failed to load some attribute data. The map will still work, but details may be missing.', 'OK'); } catch(e){}
        if (typeof callback === 'function') callback(err);
        throw err;
    });

    return p;
}

function loadMapData(callback) {
    const DATA_PATHS = window.SharedUtils.DATA_PATHS;
    Neutralino.filesystem.readFile(DATA_PATHS.geojson)
        .then(data => {
            const geojson = JSON.parse(data);
            console.log('Map data loaded:', geojson.features.length, 'countries');
            callback(null, geojson.features);
        })
        .catch(err => {
            console.error('Error loading map data:', err);
            Neutralino.os.showMessageBox('Error', 'Failed to load map data: ' + err.message, 'OK');
            callback(err);
        });
}
