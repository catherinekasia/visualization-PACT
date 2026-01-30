// indexes.js

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
    const host = document.getElementById("single-map-host");
    const tooltip = document.getElementById("tooltip");

    if (!host) {
      console.error("single-map-host not found");
      return;
    }

    // Use shared utilities from shared.js
    const { normalizeCountryName, DATA_PATHS } = window.SharedUtils;

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

    async function readCSV(path) {
      console.log("📂 Reading CSV:", path);
      const txt = await Neutralino.filesystem.readFile(path);
      return d3.csvParse(txt);
    }

    function detectValueColumn(rows) {
      if (!rows || rows.length === 0) return null;
      const cols = Object.keys(rows[0]);
      const banned = new Set(["Country", "country", "Change", "CHANGE"]);

      const idx = cols.find(c => !banned.has(c) && c.toLowerCase().includes("index"));
      if (idx) return idx;

      for (const c of cols) {
        if (banned.has(c)) continue;
        const v = +rows[0][c];
        if (!Number.isNaN(v)) return c;
      }
      return cols.find(c => !banned.has(c)) || null;
    }

    function buildCountryValueMap(rows, valueCol) {
      const m = new Map();
      for (const r of rows) {
        const name = r.Country ?? r.country ?? r.COUNTRY;
        if (!name) continue;
        const v = +r[valueCol];
        if (Number.isNaN(v)) continue;
        m.set(normalizeCountryName(name), v);
      }
      console.log(`✅ Built map for ${valueCol}: ${m.size} countries`);
      return m;
    }

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

    function showTooltipAt(event, html) {
      if (!tooltip) return;
      tooltip.innerHTML = html;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
      tooltip.style.display = "block";
    }

    function moveTooltip(event) {
      if (!tooltip) return;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
    }

    function hideTooltip() {
      if (!tooltip) return;
      tooltip.style.display = "none";
    }

    function getInterpolator(rampName) {
      switch ((rampName || "").toLowerCase()) {
        case "reds": return d3.interpolateReds;
        case "oranges": return d3.interpolateOranges;
        case "greens": return d3.interpolateGreens;
        case "blues": return d3.interpolateBlues;
        case "purples": return d3.interpolatePurples;
        default: return d3.interpolateViridis; // very colorblind-safe
      }
    }

    function updateLegend(rampName) {
      const bar = document.getElementById("legend-bar");
      if (!bar) return;

      const interp = getInterpolator(rampName);
      const stops = [0, 0.25, 0.5, 0.75, 1].map(t => interp(t));
      bar.style.background = `linear-gradient(90deg, ${stops.join(", ")})`;
    }

    function renderChoropleth(geojson, countryToValue, title, currentRamp) {
      host.innerHTML = "";

      const W = host.clientWidth || 900;
      const H = host.clientHeight || 520;

      const svg = d3.select(host).append("svg")
        .attr("width", W)
        .attr("height", H)
        .style("display", "block");

      const projection = d3.geoNaturalEarth1().fitSize([W, H], geojson);
      const path = d3.geoPath(projection);

      const values = Array.from(countryToValue.values());
      const minV = d3.min(values);
      const maxV = d3.max(values);

      console.log(`📊 ${title} - min: ${minV?.toFixed(2)}, max: ${maxV?.toFixed(2)}`);

      const interp = getInterpolator(currentRamp);

      const color = d3.scaleSequential()
        .domain([minV, maxV])
        .interpolator(interp)
        .clamp(true);

      // Create tooltip
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

      svg.append("g")
        .selectAll("path")
        .data(geojson.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const name = featureName(d);
          const v = countryToValue.get(normalizeCountryName(name));
          return v == null ? "#1f2937" : color(v);
        })
        .attr("stroke", "rgba(148,163,184,0.25)")
        .attr("stroke-width", 0.7)
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

      svg.append("text")
        .attr("x", 12)
        .attr("y", H - 12)
        .attr("fill", "#94a3b8")
        .attr("font-size", 11)
        .text(`${title} | Range: ${minV?.toFixed?.(2) ?? "?"} → ${maxV?.toFixed?.(2) ?? "?"}`);
    }

    const cache = new Map();
    let GEOJSON = null;

    loadMapData((err, mapData) => {
      if (err) {
        host.innerHTML = `<div class="loading">❌ Failed to load map geometry.</div>`;
        console.error(err);
        return;
      }

      GEOJSON = Array.isArray(mapData)
        ? { type: "FeatureCollection", features: mapData }
        : (mapData.type === "FeatureCollection"
          ? mapData
          : { type: "FeatureCollection", features: mapData.features || [] });

      console.log("✅ Map geometry loaded:", GEOJSON.features.length, "features");

      document.querySelectorAll("#index-tabs .map-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          document.querySelectorAll("#index-tabs .map-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          const key = btn.dataset.key;
          const cfg = INDEXES[key];
          if (!cfg) return;

          updateLegend(cfg.ramp);
          host.innerHTML = `<div class="loading">Loading ${cfg.title}…</div>`;

          try {
            if (!cache.has(key)) {
              console.log(`🔄 Loading ${cfg.title}`);
              const rows = await readCSV(cfg.path);
              const valueCol = detectValueColumn(rows);
              if (!valueCol) throw new Error("No numeric column found");

              console.log(`✅ Using column: ${valueCol}`);
              cache.set(key, {
                title: cfg.title,
                valueCol,
                map: buildCountryValueMap(rows, valueCol)
              });
            }

            const item = cache.get(key);
            renderChoropleth(GEOJSON, item.map, item.title, cfg.ramp);
          } catch (e) {
            host.innerHTML = `<div class="loading">❌ Error: ${String(e.message || e)}</div>`;
            console.error(e);
          }
        });
      });

      const first = document.querySelector("#index-tabs .map-btn[data-key='gpi']");
      if (first) first.click();
    });
  });
});
