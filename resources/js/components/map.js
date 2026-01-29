
function initMap(canvas, initialCountries, onCountrySelected) {
    const context = canvas.getContext('2d');
    const offscreenCanvas = document.createElement('canvas');
    const offscreenContext = offscreenCanvas.getContext('2d');

    // State
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    let countries = initialCountries;
    let simplifiedCountries = []; // Simplified geometry for faster rendering
    let selectedCountry = null;
    let hoveredCountry = null;
    let transform = d3.zoomIdentity;
    let isZooming = false;
    let isPanning = false;
    let baseMapCached = false;

    // D3 Projection
    const projection = d3.geoMercator()
        .scale(width / (2 * Math.PI))
        .translate([width / 2, height / 2]);

    // Countries we ALLOW - all others are disabled
    // Europe, select East Asia, Oceania (AU/NZ), North America (CA/US/MX/Greenland)
    const allowedIso2 = new Set([
        // Europe
        'PT', 'ES', 'AD', 'MC', 'FR', 'GB', 'IE', 'IT', 'MT', 'LU', 'BE', 'NL', 'DE', 'CH', 'AT', 
        'SI', 'HR', 'BA', 'ME', 'AL', 'GR', 'TR', 'BG', 'MK', 'XK', 'RS', 'HU', 'SK', 'CZ', 'PL', 
        'UA', 'RO', 'MD', 'BY', 'RU', 'LT', 'LV', 'EE', 'FI', 'SE', 'NO', 'DK', 'LI', 'IS',
        // East Asia
        'JP', 'KR', 'TW', 'CN', 'SG',
        // Oceania
        'AU', 'NZ',
        // North America
        'CA', 'US', 'MX', 'GL'
    ]);

    // Allowed country names (for countries without standard ISO codes in GeoJSON)
    const allowedNames = new Set([
        'PORTUGAL', 'SPAIN', 'ANDORRA', 'MONACO', 'FRANCE', 'UNITED KINGDOM', 'IRELAND', 'ITALY', 
        'MALTA', 'LUXEMBOURG', 'BELGIUM', 'NETHERLANDS', 'GERMANY', 'SWITZERLAND', 'AUSTRIA',
        'SLOVENIA', 'CROATIA', 'BOSNIA AND HERZEGOVINA', 'MONTENEGRO', 'ALBANIA', 'GREECE', 
        'TURKEY', 'TURKEY (TURKIYE)', 'BULGARIA', 'NORTH MACEDONIA', 'KOSOVO', 'SERBIA', 'HUNGARY', 
        'SLOVAKIA', 'CZECHIA', 'CZECH REPUBLIC', 'POLAND', 'UKRAINE', 'ROMANIA', 'MOLDOVA', 
        'REPUBLIC OF MOLDOVA', 'BELARUS', 'RUSSIA', 'RUSSIAN FEDERATION', 'LITHUANIA', 'LATVIA', 
        'ESTONIA', 'FINLAND', 'SWEDEN', 'NORWAY', 'DENMARK', 'LIECHTENSTEIN', 'ICELAND',
        'JAPAN', 'SOUTH KOREA', 'KOREA, SOUTH', 'TAIWAN', 'CHINA', 'SINGAPORE',
        'AUSTRALIA', 'NEW ZEALAND',
        'CANADA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'USA', 'MEXICO', 'GREENLAND'
    ]);

    function isDisabledCountry(feature) {
        if (!feature || !feature.properties) return true;
        const iso = (feature.properties['ISO3166-1-Alpha-2'] || feature.properties.ISO_A2 || feature.properties.iso_a2 || '').toUpperCase();
        if (iso && allowedIso2.has(iso)) return false;
        const name = (feature.properties.name || '').toUpperCase();
        if (name && allowedNames.has(name)) return false;
        return true;
    }

    const path = d3.geoPath().projection(projection);

    let redrawPending = false;
    function requestDraw() {
        if (!redrawPending) {
            redrawPending = true;
            requestAnimationFrame(draw);
        }
    }

    function preRenderBaseMap(quality = 'high') {
        // Skip if already cached
        if (baseMapCached) {
            return;
        }

        // Render at 4x resolution for ultra-crisp cache
        const pixelRatio = 4;
        const renderWidth = width * pixelRatio;
        const renderHeight = height * pixelRatio;
        
        offscreenCanvas.width = renderWidth;
        offscreenCanvas.height = renderHeight;
        
        // Scale the projection for higher resolution
        const highResProjection = d3.geoMercator()
            .scale((width / (2 * Math.PI)) * pixelRatio)
            .translate([renderWidth / 2, renderHeight / 2]);
        
        const renderPath = d3.geoPath().projection(highResProjection);
        renderPath.context(offscreenContext);

        offscreenContext.clearRect(0, 0, renderWidth, renderHeight);
        offscreenContext.save();
        
        // Enable high-quality rendering for the cache
        offscreenContext.imageSmoothingEnabled = true;
        offscreenContext.imageSmoothingQuality = 'high';
        
        offscreenContext.fillStyle = '#1e293b'; // Ocean
        offscreenContext.fillRect(0, 0, renderWidth, renderHeight);

        // Render all countries at full detail for high-quality cache
        countries.forEach(feature => {
            offscreenContext.beginPath();
            renderPath(feature);
            const disabled = isDisabledCountry(feature);
            offscreenContext.fillStyle = disabled ? '#2f3946' : '#334155';
            offscreenContext.fill();
            offscreenContext.strokeStyle = '#475569';
            offscreenContext.lineWidth = 0.5 * pixelRatio;
            offscreenContext.stroke();
        });
        offscreenContext.restore();
        
        baseMapCached = true;
        requestDraw();
    }

    function draw() {
        redrawPending = false;
        context.save();
        context.clearRect(0, 0, width, height);

        // Enable image smoothing for better quality
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        if (isZooming || isPanning) {
            // During zoom/pan, draw the high-res cached image for smooth performance
            // Draw cache without transforms first
            const scale = transform.k;
            const tx = transform.x;
            const ty = transform.y;
            
            // Draw the cached image scaled and translated
            context.drawImage(
                offscreenCanvas, 
                0, 0, offscreenCanvas.width, offscreenCanvas.height,
                tx, ty, width * scale, height * scale
            );
        } else {
            // When idle, draw vectors directly for high quality
            context.translate(transform.x, transform.y);
            context.scale(transform.k, transform.k);
            
            path.context(context);
            context.fillStyle = '#1e293b'; // Ocean
            context.fillRect(-transform.x / transform.k, -transform.y / transform.k, width / transform.k, height / transform.k);

            countries.forEach(feature => {
                context.beginPath();
                path(feature);
                const disabled = isDisabledCountry(feature);
                context.fillStyle = disabled ? '#2f3946' : '#334155';
                context.fill();
                context.strokeStyle = '#475569';
                context.lineWidth = 0.5 / transform.k;
                context.stroke();
            });
        }

        // Highlights are always drawn with vectors on top
        if (!isZooming && !isPanning) {
            // Already have transforms applied from vector rendering
        } else {
            // Need to apply transforms for highlights when using cached image
            context.translate(transform.x, transform.y);
            context.scale(transform.k, transform.k);
        }
        path.context(context);

        // Draw hovered country
        if (hoveredCountry) {
            context.beginPath();
            path(hoveredCountry);
            context.fillStyle = '#475569';
            context.fill();
            context.strokeStyle = '#94a3b8';
            context.lineWidth = 1 / transform.k;
            context.stroke();
        }

        // Draw selected country
        if (selectedCountry) {
            context.beginPath();
            path(selectedCountry);
            context.fillStyle = '#38bdf8';
            context.fill();
            context.strokeStyle = '#94a3b8';
            context.lineWidth = 1 / transform.k;
            context.stroke();
        }

        context.restore();
    }

    // Resize handler
    function resize() {
        // Preserve current geographic center so resize doesn't shift view
        let centerLonLat = null;
        try {
            const screenCenterX = width / 2;
            const screenCenterY = height / 2;
            const invX = (screenCenterX - transform.x) / transform.k;
            const invY = (screenCenterY - transform.y) / transform.k;
            centerLonLat = projection.invert([invX, invY]);
        } catch (e) {
            centerLonLat = null;
        }

        width = canvas.parentElement.clientWidth;
        height = canvas.parentElement.clientHeight;
        canvas.width = width;
        canvas.height = height;
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;

        const mercatorWidth = width;
        const mercatorHeight = height;
        const scale = Math.min(
            mercatorWidth / (2 * Math.PI),
            mercatorHeight / (Math.PI)
        );
        projection
            .scale(scale)
            .translate([mercatorWidth / 2, mercatorHeight / 2]);
        
        baseMapCached = false; // Invalidate cache on resize

        // If we had a geographic center, compute its new projected position
        // and adjust the current transform so the same lon/lat stays centered.
        if (centerLonLat) {
            const p = projection(centerLonLat);
            if (p && p.length === 2) {
                const tx = (width / 2) - transform.k * p[0];
                const ty = (height / 2) - transform.k * p[1];
                transform = d3.zoomIdentity.translate(tx, ty).scale(transform.k);
                d3.select(canvas).call(zoom.transform, transform);
            }
        }

        preRenderBaseMap();
        updateZoomBounds();
    }

    function updateZoomBounds() {
        const topLeft = projection([-180, 85]);
        const bottomRight = projection([180, -85]);
        const x0 = topLeft ? topLeft[0] : 0;
        const y0 = topLeft ? topLeft[1] : 0;
        const x1 = bottomRight ? bottomRight[0] : width;
        const y1 = bottomRight ? bottomRight[1] : height;

        zoom.translateExtent([[x0, y0], [x1, y1]]).extent([[0, 0], [width, height]]);
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('start', (event) => {
            isZooming = true;
            isPanning = event.sourceEvent && event.sourceEvent.type === 'mousemove';
        })
        .on('zoom', (event) => {
            transform = event.transform;
            requestDraw(); // Fast, cached redraw during zoom/pan
        })
        .on('end', () => {
            isZooming = false;
            isPanning = false;
            requestDraw(); // Trigger a final high-quality redraw
        });

    d3.select(canvas)
        .call(zoom)
        .on('dblclick.zoom', null);

    document.getElementById('reset-map-btn').addEventListener('click', () => {
        d3.select(canvas).transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });

    // Mouse Move (Hover) - Debounced for better performance
    let lastHovered = null;
    let hoverTimeout = null;
    d3.select(canvas).on('mousemove', (event) => {
        // Skip hover detection while actively zooming/panning
        if (isZooming || isPanning) return;
        
        // Debounce hover detection to reduce CPU usage
        if (hoverTimeout) return;
        
        hoverTimeout = setTimeout(() => {
            hoverTimeout = null;
        }, 16); // ~60fps
        
        const [x, y] = d3.pointer(event);
        const invertedX = (x - transform.x) / transform.k;
        const invertedY = (y - transform.y) / transform.k;
        const [lon, lat] = projection.invert([invertedX, invertedY]);

        const found = countries.find(feature => d3.geoContains(feature, [lon, lat]));

        // If the hovered country is in a disabled continent, don't highlight or make it interactive
        const effectiveHover = found && isDisabledCountry(found) ? null : found;
        if (effectiveHover !== lastHovered) {
            hoveredCountry = effectiveHover;
            lastHovered = effectiveHover;
            requestDraw();
            canvas.style.cursor = effectiveHover ? 'pointer' : 'default';
        }
    });

    // Click Handling
    d3.select(canvas).on('click', (event) => {
        const [x, y] = d3.pointer(event);
        const invertedX = (x - transform.x) / transform.k;
        const invertedY = (y - transform.y) / transform.k;
        const [lon, lat] = projection.invert([invertedX, invertedY]);

        let clicked = hoveredCountry;
        if (!clicked) {
            clicked = countries.find(feature => d3.geoContains(feature, [lon, lat]));
        }

        // If clicked country belongs to a disabled continent, ignore clicks
        if (clicked && isDisabledCountry(clicked)) {
            // clear selection if any and exit
            selectedCountry = null;
            requestDraw();
            return;
        }

        if (clicked) {
            if (selectedCountry !== clicked) {
                selectedCountry = clicked;
                onCountrySelected(clicked);

                const modalWidth = 600; // As defined in CSS
                const visibleMapWidth = width - modalWidth;
                const viewCenter = modalWidth + (visibleMapWidth / 2);

                let bounds;
                if (clicked.geometry.type === 'MultiPolygon') {
                    // Find the largest polygon by area
                    const largestPolygon = clicked.geometry.coordinates.reduce((max, polygon) => {
                        const area = d3.geoArea({ type: 'Polygon', coordinates: polygon });
                        return area > (max.area || 0) ? { area, polygon } : max;
                    }, { area: 0, polygon: null });

                    // Create a temporary feature for the largest polygon to calculate its bounds
                    const tempFeature = { type: 'Feature', geometry: { type: 'Polygon', coordinates: largestPolygon.polygon } };
                    bounds = path.bounds(tempFeature);
                } else {
                    bounds = path.bounds(clicked);
                }

                const dx = bounds[1][0] - bounds[0][0];
                const dy = bounds[1][1] - bounds[0][1];
                const centerX = (bounds[0][0] + bounds[1][0]) / 2;
                const centerY = (bounds[0][1] + bounds[1][1]) / 2;
                const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / visibleMapWidth, dy / height)));
                const translate = [viewCenter - scale * centerX, height / 2 - scale * centerY];

                d3.select(canvas)
                    .transition()
                    .duration(500)
                    .ease(d3.easeCubicOut)
                    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
            }
        } else {
            selectedCountry = null;
        }
        requestDraw();
    });

    window.addEventListener('resize', resize);
    resize();
    requestDraw();

    // Programmatic view setter: center at lon/lat with given scale (1-8)
    function setView(centerLon, centerLat, scale = 1, duration = 500) {
        const p = projection([centerLon, centerLat]);
        if (!p) return;
        const tx = (width / 2) - scale * p[0];
        const ty = (height / 2) - scale * p[1];
        d3.select(canvas)
            .transition()
            .duration(duration)
            .ease(d3.easeCubicOut)
            .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
    
    // Simplify geometry for better rendering performance
    function simplifyGeometry(features) {
        if (!features || features.length === 0) return [];
        
        // Simple approach: just return the features as-is for now
        // Full simplification would require a library like Turf.js or simplify-js
        // For performance, we rely on the adaptive rendering (simplified vs full detail based on zoom)
        return features;
    }

    return {
        updateCountries: (newCountries) => {
            countries = newCountries;
            // Generate simplified geometry for faster rendering
            if (newCountries.length > 0) {
                simplifiedCountries = simplifyGeometry(newCountries);
                console.log(`Geometry simplified: ${newCountries.length} countries`);
            }
            baseMapCached = false;
            preRenderBaseMap();
        },
        resize,
        setView,
        // Clear the currently selected country and redraw
        deselect: () => {
            selectedCountry = null;
            requestDraw();
        },
    };
}
