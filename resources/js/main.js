document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');

    if (typeof d3 === 'undefined') {
        console.error('CRITICAL: D3.js is not loaded!');
        alert('Error: D3.js library not found.');
        return;
    } else {
        console.log('D3.js loaded, version:', d3.version);
    }

    try {
        Neutralino.init();
        console.log('Neutralino initialized');
    } catch (e) {
        console.error('Neutralino init failed:', e);
    }

    Neutralino.events.on('ready', () => {
        console.log('Neutralino ready event fired');
        try {
            document.title = 'World Happiness Map';
        } catch (e) { }

        const canvas = document.getElementById('map-canvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        let appState = {
            countries: [],
            economyData: {},
            demographicsData: {},
            commData: {},
            energyData: {},
            transData: {},
            map: null,
        };

        function onCountrySelected(feature) {
            openPopup(
                feature,
                appState.economyData,
                appState.demographicsData,
                appState.commData,
                appState.energyData
            );
        }

        appState.map = initMap(canvas, [], onCountrySelected);
        initPopup();

        loadMapData((err, mapData) => {
            if (err) return;
            appState.countries = mapData;
            appState.map.updateCountries(mapData);

            loadAttributeData((err, attributeData) => {
                if (err) return;
                appState.economyData = attributeData.economyData;
                appState.demographicsData = attributeData.demographicsData;
                appState.commData = attributeData.commData;
                appState.energyData = attributeData.energyData;
                appState.transData = attributeData.transData;
            });
        });

        window.addEventListener('resize', () => {
            if (appState.map) {
                appState.map.resize();
            }
        });
    });
});
