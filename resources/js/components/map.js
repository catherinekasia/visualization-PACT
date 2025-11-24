
function initMap(canvas, initialCountries, onCountrySelected) {
    const context = canvas.getContext('2d');
    const offscreenCanvas = document.createElement('canvas');
    const offscreenContext = offscreenCanvas.getContext('2d');

    // State
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    let countries = initialCountries;
    let selectedCountry = null;
    let hoveredCountry = null;
    let transform = d3.zoomIdentity;
    let isZooming = false;

    // D3 Projection
    const projection = d3.geoMercator()
        .scale(width / (2 * Math.PI))
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    let redrawPending = false;
    function requestDraw() {
        if (!redrawPending) {
            redrawPending = true;
            requestAnimationFrame(draw);
        }
    }

    function preRenderBaseMap(quality = 'low') {
        const renderPath = d3.geoPath().projection(projection);
        let tempCanvas;
        let tempContext;

        if (quality === 'high') {
            // For high-quality rendering, draw directly on the offscreen canvas at full resolution
            tempCanvas = offscreenCanvas;
            tempContext = offscreenContext;
        } else {
            // For low-quality (fast) rendering, use a smaller temporary canvas
            tempCanvas = document.createElement('canvas');
            tempContext = tempCanvas.getContext('2d');
        }
        
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        renderPath.context(tempContext);

        tempContext.clearRect(0, 0, width, height);
        tempContext.save();
        tempContext.fillStyle = '#1e293b'; // Ocean
        tempContext.fillRect(0, 0, width, height);

        countries.forEach(feature => {
            tempContext.beginPath();
            renderPath(feature);
            tempContext.fillStyle = '#334155';
            tempContext.fill();
            tempContext.strokeStyle = '#475569';
            tempContext.lineWidth = 0.5;
            tempContext.stroke();
        });
        tempContext.restore();

        if (quality === 'low') {
            // If we rendered low-quality, copy it to the main offscreen canvas
            offscreenContext.clearRect(0, 0, width, height);
            offscreenContext.drawImage(tempCanvas, 0, 0, width, height);
        }
        requestDraw();
    }

    function draw() {
        redrawPending = false;
        context.save();
        context.clearRect(0, 0, width, height);

        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);

        if (isZooming) {
            // While zooming, draw the low-res cached image for performance
            context.drawImage(offscreenCanvas, 0, 0, width, height);
        } else {
            // When not zooming, draw vectors directly for high quality
            path.context(context);
            context.fillStyle = '#1e293b'; // Ocean
            context.fillRect(-transform.x / transform.k, -transform.y / transform.k, width / transform.k, height / transform.k);

            countries.forEach(feature => {
                context.beginPath();
                path(feature);
                context.fillStyle = '#334155';
                context.fill();
                context.strokeStyle = '#475569';
                context.lineWidth = 0.5 / transform.k;
                context.stroke();
            });
        }

        // Highlights are always drawn with vectors on top
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
        .on('start', () => {
            isZooming = true;
            // No need to pre-render here, the cache is static
        })
        .on('zoom', (event) => {
            transform = event.transform;
            requestDraw(); // Fast, low-quality redraw during zoom
        })
        .on('end', () => {
            isZooming = false;
            requestDraw(); // Trigger a final high-quality redraw
        });

    d3.select(canvas)
        .call(zoom)
        .on('dblclick.zoom', null);

    document.getElementById('reset-map-btn').addEventListener('click', () => {
        d3.select(canvas).transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });

    // Mouse Move (Hover)
    let lastHovered = null;
    d3.select(canvas).on('mousemove', (event) => {
        const [x, y] = d3.pointer(event);
        const invertedX = (x - transform.x) / transform.k;
        const invertedY = (y - transform.y) / transform.k;
        const [lon, lat] = projection.invert([invertedX, invertedY]);

        const found = countries.find(feature => d3.geoContains(feature, [lon, lat]));

        if (found !== lastHovered) {
            hoveredCountry = found;
            lastHovered = found;
            requestDraw();
            canvas.style.cursor = found ? 'pointer' : 'default';
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
                    .duration(750)
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

    return {
        updateCountries: (newCountries) => {
            countries = newCountries;
            preRenderBaseMap();
        },
        resize,
    };
}
