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

        // Only initialize map-related features on the homepage
        const isHome = /index\.html?$/.test(window.location.pathname) || window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
        if (isHome) {
            appState.map = initMap(canvas, [], onCountrySelected);
            // Initialize popup and pass a callback so closing the modal deselects the map
            initPopup(() => {
                if (appState.map && typeof appState.map.deselect === 'function') {
                    appState.map.deselect();
                }
            });

            // Load map data first (needed for rendering). Attributes are heavier; load them lazily.
            loadMapData((err, mapData) => {
                if (err) return;
                appState.countries = mapData;
                appState.map.updateCountries(mapData);

                // Defer attribute loading to idle time so initial UI stays snappy.
                const loadAttributes = () => {
                    loadAttributeData().then(attributeData => {
                        appState.economyData = attributeData.economyData;
                        appState.demographicsData = attributeData.demographicsData;
                        appState.commData = attributeData.commData;
                        appState.energyData = attributeData.energyData;
                        appState.transData = attributeData.transData;
                    }).catch(err => {
                        // already logged in loader
                    });
                };

                if ('requestIdleCallback' in window) {
                    requestIdleCallback(loadAttributes, {timeout: 2000});
                } else {
                    // Fallback: slight timeout
                    setTimeout(loadAttributes, 1000);
                }
            });
        } else {
            // Not home page: don't initialize map or load heavy data
            console.log('Not homepage — skipping map initialization.');
        }

        window.addEventListener('resize', () => {
            if (appState.map) {
                appState.map.resize();
            }
        });
    });
});
