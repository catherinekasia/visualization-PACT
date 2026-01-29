// indexes.js - FIXED to use same paths as working data.js

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

    // FIXED: Use "data/" paths (NOT "../../data/") to match working data.js
    const INDEXES = {
      gpi:    { title: "Global Peace Index",     path: "data/filtered_cia_data/global_peace_index.csv" },
      crime:  { title: "Criminal Index",         path: "data/filtered_cia_data/criminal_index.csv" },
      gti:    { title: "Global Terrorism Index", path: "data/filtered_cia_data/global_terrorism_index.csv" },
      safety: { title: "Safety Index (Risk)",    path: "data/filtered_cia_data/Indexes_calc_code/safety_index_risk_focused.csv" },
      health: { title: "Own Health Index",       path: "data/filtered_cia_data/Indexes_calc_code/ownhealth_index.csv" }
    };

    function normalizeCountryName(x) {
      return String(x ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    }

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

    function renderChoropleth(geojson, countryToValue, title) {
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
      const midV = (minV + maxV) / 2;

      console.log(`📊 ${title} - min: ${minV?.toFixed(2)}, max: ${maxV?.toFixed(2)}`);

      const color = d3.scaleLinear()
        .domain([minV,midV,midV,midV, maxV])
        .range(["#2166ac", "#67a9cf", "#f7f7f7", "#fdae61", "#ff7b00"])
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
        : (mapData.type === "FeatureCollection" ? mapData : { type: "FeatureCollection", features: mapData.features || [] });

      console.log("✅ Map geometry loaded:", GEOJSON.features.length, "features");

      document.querySelectorAll("#index-tabs .map-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          document.querySelectorAll("#index-tabs .map-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          const key = btn.dataset.key;
          const cfg = INDEXES[key];
          if (!cfg) return;

          host.innerHTML = `<div class="loading">Loading ${cfg.title}…</div>`;

          try {
            if (!cache.has(key)) {
              console.log(`🔄 Loading ${cfg.title}`);
              const rows = await readCSV(cfg.path);
              const valueCol = detectValueColumn(rows);
              if (!valueCol) throw new Error(`No numeric column found`);
              console.log(`✅ Using column: ${valueCol}`);
              cache.set(key, { title: cfg.title, valueCol, map: buildCountryValueMap(rows, valueCol) });
            }

            const item = cache.get(key);
            renderChoropleth(GEOJSON, item.map, item.title);
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