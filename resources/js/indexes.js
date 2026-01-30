/**
 * indexes.js
 * 
 * Handles the visualization of various global indexes on interactive choropleth maps.
 * Displays data including Global Peace Index, Criminal Index, Terrorism Index, Safety Index,
 * and Health Index. Uses D3.js for rendering and Neutralino for file system access.
 * 
 * Main features:
 * - Dynamic map rendering with color-coded countries based on index values
 * - Interactive tooltips showing country-specific data
 * - Multiple index selection via tab buttons
 * - Automatic color ramp selection for different indexes
 * - CSV data parsing and country name normalization
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof Neutralino === "undefined") {
    alert("Neutralino not loaded");
    return;
  }
  if (typeof d3 === "undefined") {
    alert("D3 not loaded");
    return;
  }
  if (typeof loadMapData === "undefined") {
    alert("loadMapData missing");
    return;
  }

  Neutralino.init();

  Neutralino.events.on("ready", () => {
    // Get DOM elements for map rendering and tooltips
    const host = document.getElementById("single-map-host");
    const tooltip = document.getElementById("tooltip");

    if (!host) {
      console.error("single-map-host not found");
      return;
    }

    // Import shared utilities from shared.js for consistent country name handling
    const { normalizeCountryName, DATA_PATHS } = window.SharedUtils;

    /**
     * Configuration object for all available indexes.
     * Each index includes:
     * - title: Display name for the index
     * - path: File path to the CSV data
     * - ramp: Color scheme name for the choropleth (blues, purples, reds, oranges, greens)
     */
    const INDEXES = {
      gpi: {
        title: "Global Peace Index",
        path: DATA_PATHS.peace,
        ramp: "blues"
      },
      crime: {
        title: "Criminal Index",
        path: DATA_PATHS.crime,
        ramp: "purples"
      },
      gti: {
        title: "Global Terrorism Index",
        path: DATA_PATHS.terrorism,
        ramp: "reds"
      },
      safety: {
        title: "Safety Index (Risk)",
        path: DATA_PATHS.indexes.safety,
        ramp: "oranges"
      },
      health: {
        title: "Own Health Index",
        path: DATA_PATHS.indexes.health,
        ramp: "greens"
      }
    };

    /**
     * Reads and parses a CSV file from the filesystem.
     * @param {string} path - Absolute path to the CSV file
     * @returns {Promise<Array>} Parsed CSV data as array of objects
     */
    async function readCSV(path) {
      console.log(" Reading CSV:", path);
      const txt = await Neutralino.filesystem.readFile(path);
      return d3.csvParse(txt);
    }

    /**
     * Automatically detects the column containing index values in CSV data.
     * Uses a heuristic approach:
     * 1. First looks for columns with "index" in the name
     * 2. Then looks for the first numeric column that isn't excluded
     * 3. Excludes metadata columns like "Country", "country", "Change", etc.
     * 
     * @param {Array<Object>} rows - Parsed CSV data rows
     * @returns {string|null} Name of the value column, or null if not found
     */
    function detectValueColumn(rows) {
      if (!rows || rows.length === 0) return null;
      const cols = Object.keys(rows[0]);
      // Exclude non-numeric metadata columns from consideration
      const banned = new Set(["Country", "country", "Change", "CHANGE"]);

      // Prefer columns with "index" in the name
      const idx = cols.find(c => !banned.has(c) && c.toLowerCase().includes("index"));
      if (idx) return idx;

      // Otherwise, find the first numeric column
      for (const c of cols) {
        if (banned.has(c)) continue;
        const v = +rows[0][c];
        if (!Number.isNaN(v)) return c;
      }
      return cols.find(c => !banned.has(c)) || null;
    }

    /**
     * Builds a Map from normalized country names to their index values.
     * Handles various country name column variations (Country, country, COUNTRY).
     * Uses normalizeCountryName for consistent country name matching.
     * 
     * @param {Array<Object>} rows - CSV data rows
     * @param {string} valueCol - Name of the column containing numeric values
     * @returns {Map<string, number>} Map of normalized country names to values
     */
    function buildCountryValueMap(rows, valueCol) {
      const m = new Map();
      for (const r of rows) {
        // Try multiple possible country column names
        const name = r.Country ?? r.country ?? r.COUNTRY;
        if (!name) continue;
        const v = +r[valueCol];
        if (Number.isNaN(v)) continue;
        // Store with normalized country name for consistent matching
        m.set(normalizeCountryName(name), v);
      }
      console.log(`Built map for ${valueCol}: ${m.size} countries`);
      return m;
    }

    /**
     * Extracts the country name from a GeoJSON feature.
     * Checks multiple possible property names in order of preference.
     * 
     * @param {Object} f - GeoJSON feature object
     * @returns {string} Country name or "unknown" if not found
     */
    function featureName(f) {
      return (
        f.properties?.name ??
        f.properties?.NAME ??
        f.properties?.admin ??
        f.properties?.ADMIN ??
        f.id ??
        "unknown"
      );
    }

    /**
     * Generates HTML for the tooltip that appears on hover.
     * Displays country name, index title, and formatted value.
     * Shows "No data" for countries without values.
     * 
     * @param {string} countryName - Name of the country
     * @param {string} indexTitle - Title of the current index
     * @param {number|null} value - Index value for the country
     * @returns {string} HTML string for tooltip content
     */
    function tooltipHTML(countryName, indexTitle, value) {
      const valueText = (value == null)
        ? `<span class="tt-val" style="color:#94a3b8;font-weight:600">No data</span>`
        : `<span class="tt-val">${d3.format(",.2f")(value)}</span>`;

      return `
        <div class="tt-title">${countryName}</div>
        <div class="tt-sub">${indexTitle}</div>
        <div class="tt-row">
          <span class="tt-key">Value</span>
          ${valueText}
        </div>
      `;
    }

    /**
     * Displays the tooltip at the cursor position.
     * @param {MouseEvent} event - Mouse event containing cursor position
     * @param {string} html - HTML content to display in tooltip
     */
    function showTooltipAt(event, html) {
      if (!tooltip) return;
      tooltip.innerHTML = html;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
      tooltip.style.display = "block";
    }

    /**
     * Updates tooltip position to follow the cursor.
     * @param {MouseEvent} event - Mouse event containing cursor position
     */
    function moveTooltip(event) {
      if (!tooltip) return;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
    }

    /**
     * Hides the tooltip from view.
     */
    function hideTooltip() {
      if (!tooltip) return;
      tooltip.style.display = "none";
    }

    /**
     * Returns the D3 color interpolator function for a given color ramp name.
     * Provides colorblind-safe color schemes for different index types.
     * 
     * @param {string} rampName - Name of the color ramp (reds, oranges, greens, blues, purples)
     * @returns {Function} D3 color interpolator function
     */
    function getInterpolator(rampName) {
      switch ((rampName || "").toLowerCase()) {
        case "reds": return d3.interpolateReds;
        case "oranges": return d3.interpolateOranges;
        case "greens": return d3.interpolateGreens;
        case "blues": return d3.interpolateBlues;
        case "purples": return d3.interpolatePurples;
        default: return d3.interpolateViridis; // very colorblind-safe fallback
      }
    }

    /**
     * Updates the color legend bar to match the current color ramp.
     * Creates a horizontal gradient with 5 color stops.
     * 
     * @param {string} rampName - Name of the color ramp to display
     */
    function updateLegend(rampName) {
      const bar = document.getElementById("legend-bar");
      if (!bar) return;

      const interp = getInterpolator(rampName);
      // Create 5 evenly-spaced color stops for the gradient
      const stops = [0, 0.25, 0.5, 0.75, 1].map(t => interp(t));
      bar.style.background = `linear-gradient(90deg, ${stops.join(", ")})`;
    }

    /**
     * Renders a choropleth map with colored countries based on index values.
     * Creates an interactive SVG map with hover effects and tooltips.
     * Countries without data are shown in dark gray.
     * 
     * @param {Object} geojson - GeoJSON FeatureCollection with country geometries
     * @param {Map<string, number>} countryToValue - Map of country names to index values
     * @param {string} title - Title of the current index being displayed
     * @param {string} currentRamp - Color ramp name for the choropleth
     */
    function renderChoropleth(geojson, countryToValue, title, currentRamp) {
      // Clear previous map
      host.innerHTML = "";

      // Set dimensions based on container size with fallbacks
      const W = host.clientWidth || 900;
      const H = host.clientHeight || 520;

      const svg = d3.select(host).append("svg")
        .attr("width", W)
        .attr("height", H)
        .style("display", "block");

      // Set up map projection - Natural Earth provides a balanced world view
      const projection = d3.geoNaturalEarth1().fitSize([W, H], geojson);
      const path = d3.geoPath(projection);

      // Calculate domain for color scale
      const values = Array.from(countryToValue.values());
      const minV = d3.min(values);
      const maxV = d3.max(values);

      console.log(` ${title} - min: ${minV?.toFixed(2)}, max: ${maxV?.toFixed(2)}`);

      const interp = getInterpolator(currentRamp);

      // Create color scale mapping data values to colors
      const color = d3.scaleSequential()
        .domain([minV, maxV])
        .interpolator(interp)
        .clamp(true); // Clamp ensures values outside domain don't produce invalid colors

      // Create D3 tooltip for hover interactions
      const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(15, 23, 42, 0.95)")
        .style("color", "#e2e8f0")
        .style("border", "1px solid rgba(56, 189, 248, 0.4)")
        .style("border-radius", "6px")
        .style("padding", "8px 12px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("z-index", "10000")
        .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.5)");

      // Draw country paths with data-driven colors
      svg.append("g")
        .selectAll("path")
        .data(geojson.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const name = featureName(d);
          const v = countryToValue.get(normalizeCountryName(name));
          // Countries without data shown in dark gray
          return v == null ? "#1f2937" : color(v);
        })
        .attr("stroke", "rgba(148,163,184,0.25)")
        .attr("stroke-width", 0.7)
        // Mouseover: show tooltip and highlight country border
        .on("mouseover", function(event, d) {
          const name = featureName(d);
          const v = countryToValue.get(normalizeCountryName(name));
          // Only show tooltip for countries with data
          if (v != null) {
            tooltip.html(`<strong>${name}</strong><br/>${title}: ${v.toFixed(2)}`);
            tooltip.style("visibility", "visible");
            d3.select(this)
              .attr("stroke", "#38bdf8")
              .attr("stroke-width", 2);
          }
        })
        // Mousemove: update tooltip position to follow cursor
        .on("mousemove", function(event, d) {
          const name = featureName(d);
          const v = countryToValue.get(normalizeCountryName(name));
          // Only move tooltip if country has data
          if (v != null) {
            tooltip
              .style("top", (event.pageY - 10) + "px")
              .style("left", (event.pageX + 10) + "px");
          }
        })
        // Mouseout: hide tooltip and reset border
        .on("mouseout", function(event, d) {
          const name = featureName(d);
          const v = countryToValue.get(normalizeCountryName(name));
          // Only hide tooltip and reset stroke if country has data
          if (v != null) {
            tooltip.style("visibility", "hidden");
            d3.select(this)
              .attr("stroke", "rgba(148,163,184,0.25)")
              .attr("stroke-width", 0.7);
          }
        });

      // Add text label showing index name and value range
      svg.append("text")
        .attr("x", 12)
        .attr("y", H - 12)
        .attr("fill", "#94a3b8")
        .attr("font-size", 11)
        .text(`${title} | Range: ${minV?.toFixed?.(2) ?? "?"} → ${maxV?.toFixed?.(2) ?? "?"}`);
    }

    // Cache for loaded index data to avoid re-reading files
    const cache = new Map();
    // Global storage for GeoJSON map geometry
    let GEOJSON = null;

    // Load GeoJSON map data from shared.js
    loadMapData((err, mapData) => {
      if (err) {
        host.innerHTML = `<div class="loading"> Failed to load map geometry.</div>`;
        console.error(err);
        return;
      }

      // Normalize map data to FeatureCollection format
      GEOJSON = Array.isArray(mapData)
        ? { type: "FeatureCollection", features: mapData }
        : (mapData.type === "FeatureCollection"
          ? mapData
          : { type: "FeatureCollection", features: mapData.features || [] });

      console.log(" Map geometry loaded:", GEOJSON.features.length, "features");

      // Set up click handlers for index selection tabs
      document.querySelectorAll("#index-tabs .map-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          // Update active state
          document.querySelectorAll("#index-tabs .map-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          // Get index configuration
          const key = btn.dataset.key;
          const cfg = INDEXES[key];
          if (!cfg) return;

          // Update legend and show loading message
          updateLegend(cfg.ramp);
          host.innerHTML = `<div class="loading">Loading ${cfg.title}…</div>`;

          try {
            // Load and cache data if not already loaded
            if (!cache.has(key)) {
              console.log(` Loading ${cfg.title}`);
              const rows = await readCSV(cfg.path);
              const valueCol = detectValueColumn(rows);
              if (!valueCol) throw new Error("No numeric column found");

              console.log(`✅ Using column: ${valueCol}`);
              // Cache processed data for faster subsequent loads
              cache.set(key, {
                title: cfg.title,
                valueCol,
                map: buildCountryValueMap(rows, valueCol)
              });
            }

            // Render the choropleth with cached or newly loaded data
            const item = cache.get(key);
            renderChoropleth(GEOJSON, item.map, item.title, cfg.ramp);
          } catch (e) {
            host.innerHTML = `<div class="loading"> Error: ${String(e.message || e)}</div>`;
            console.error(e);
          }
        });
      });

      // Automatically load the Global Peace Index as the default view
      const first = document.querySelector("#index-tabs .map-btn[data-key='gpi']");
      if (first) first.click();
    });
  });
});
