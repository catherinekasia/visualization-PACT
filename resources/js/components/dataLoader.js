function loadAttributeData(callback) {
    Promise.all([
        Neutralino.filesystem.readFile('data/economy_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/demographics_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/communications_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/energy_data.csv').then(data => d3.csvParse(data)),
        Neutralino.filesystem.readFile('data/transportation_data.csv').then(data => d3.csvParse(data))
    ]).then(([economy, demographics, communications, energy, transportation]) => {
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

        console.log('Attribute data loaded');
        callback(null, { economyData, demographicsData, commData, energyData, transData });
    }).catch(err => {
        console.error('Error loading attribute data:', err);
        Neutralino.os.showMessageBox('Warning', 'Failed to load some attribute data. The map will still work, but details may be missing.', 'WARNING');
        callback(err);
    });
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
