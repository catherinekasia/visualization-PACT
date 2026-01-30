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
            goodCountryData: {},
            earningPotentialData: {},
            safetyData: {},
            healthData: {},
            visaData: {},
            map: null,
        };

        function onCountrySelected(feature) {
            openPopup(
                feature,
                appState.economyData,
                appState.demographicsData,
                appState.commData,
                appState.energyData,
                appState.goodCountryData,
                appState.earningPotentialData,
                appState.safetyData,
                appState.healthData,
                appState.visaData
            );
        }

        // Only initialize map-related features on the homepage
        const isHome = /index\.html?$/.test(window.location.pathname) || window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
        if (isHome) {
            // Show loading indicator
            const loadingEl = document.getElementById('map-loading');
            if (loadingEl) loadingEl.style.display = 'block';
            
            appState.map = initMap(canvas, [], onCountrySelected);
            // Default to Europe view
            // centerLon, centerLat, scale
            // Call slightly after initialization to ensure projection/resizing applied
            setTimeout(() => {
                if (appState.map && typeof appState.map.setView === 'function') {
                    appState.map.setView(10, 50, 3, 0);
                }
            }, 50);
            // Initialize popup and pass a callback so closing the modal deselects the map
            initPopup(() => {
                if (appState.map && typeof appState.map.deselect === 'function') {
                    appState.map.deselect();
                }
            });

            // Load map data first (needed for rendering). Attributes are heavier; load them lazily.
            loadMapData((err, mapData) => {
                if (err) {
                    // Hide loading on error
                    if (loadingEl) loadingEl.style.display = 'none';
                    return;
                }
                appState.countries = mapData;
                appState.map.updateCountries(mapData);
                
                // Hide loading indicator once map is ready
                if (loadingEl) {
                    setTimeout(() => {
                        loadingEl.style.opacity = '0';
                        loadingEl.style.transition = 'opacity 0.3s ease';
                        setTimeout(() => loadingEl.style.display = 'none', 300);
                    }, 100);
                }

                // Defer attribute loading to idle time so initial UI stays snappy.
                const loadAttributes = () => {
                    loadAttributeData().then(attributeData => {
                        appState.economyData = attributeData.economyData;
                        appState.demographicsData = attributeData.demographicsData;
                        appState.commData = attributeData.commData;
                        appState.energyData = attributeData.energyData;
                        appState.transData = attributeData.transData;
                        appState.goodCountryData = attributeData.goodCountryData;
                        appState.earningPotentialData = attributeData.earningPotentialData;
                        appState.safetyData = attributeData.safetyData;
                        appState.healthData = attributeData.healthData;
                        appState.visaData = attributeData.visaData;
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

                // Region buttons
                const btnEurope = document.getElementById('btn-europe');
                const btnAmerica = document.getElementById('btn-america');
                const btnEastAsia = document.getElementById('btn-eastasia');
                const btnAusNz = document.getElementById('btn-ausnz');
                const resetBtn = document.getElementById('reset-map-btn');

                if (btnEurope) btnEurope.addEventListener('click', () => { appState.map.setView(10, 50, 3); });
                if (btnAmerica) btnAmerica.addEventListener('click', () => { appState.map.setView(-100, 20, 2.2); });
                if (btnEastAsia) btnEastAsia.addEventListener('click', () => { appState.map.setView(135, 35, 4); });
                if (btnAusNz) btnAusNz.addEventListener('click', () => { appState.map.setView(135, -25, 3.5); });
                // Reset button behavior is handled inside `map.js` (world view)
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
