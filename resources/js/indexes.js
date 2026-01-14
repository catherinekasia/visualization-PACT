document.addEventListener("DOMContentLoaded", () => {
  if (typeof Neutralino === "undefined") {
    alert("Neutralino not loaded. Check <script src='js/neutralino.js'>");
    return;
  }
  if (typeof d3 === "undefined") {
    alert("D3 not loaded. Check <script src='js/d3.v7.min.js'>");
    return;
  }
  if (typeof loadMapData === "undefined") {
    alert("loadMapData missing. Include js/components/dataLoader.js");
    return;
  }

  Neutralino.init();

  Neutralino.events.on("ready", () => {
    const host = document.getElementById("single-map-host");

    const INDEXES = {
      gpi:    { title: "Global Peace Index",     path: "data/filtered_cia_data/Indexes_calc_code/global_peace_index.csv" },
      crime:  { title: "Criminal Index",         path: "data/filtered_cia_data/Indexes_calc_code/criminal_index.csv" },
      gti:    { title: "Global Terrorism Index", path: "data/filtered_cia_data/Indexes_calc_code/global_terrorism_index.csv" },
      safety: { title: "Safety Index (Risk)",    path: "data/filtered_cia_data/Indexes_calc_code/safety_index_risk_focused.csv" },
      health: { title: "Own Health Index",       path: "data/filtered_cia_data/Indexes_calc_code/ownhealth_index.csv" }
    };

    function normalizeCountryName(x) {
      return String(x ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    }

    async function absAppPath(relPath) {
      const res = await Neutralino.os.getPath("resources"); // .../resources
      const base = (res + "/app/").replace(/\\/g, "/");
      return base + relPath.replace(/\\/g, "/").replace(/^\/+/, "");
    }

    async function readCSV(relPath) {
      const full = await absAppPath(relPath);
      const txt = await Neutralino.filesystem.readFile(full);
      return d3.csvParse(txt);
    }

    function detectValueColumn(rows) {
      if (!rows || rows.length === 0) return null;
      const cols = Object.keys(rows[0]);
      const banned = new Set(["Country", "country", "Change", "CHANGE"]);

      // prefer something with "index"
      const idx = cols.find(c => !banned.has(c) && c.toLowerCase().includes("index"));
      if (idx) return idx;

      // otherwise first numeric-like column
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

      const color = d3.scaleLinear()
        .domain([minV, midV, maxV])
        .range(["#22c55e", "#f59e0b", "#ef4444"])
        .clamp(true);

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
        .attr("stroke-width", 0.7);

      svg.append("text")
        .attr("x", 12)
        .attr("y", H - 12)
        .attr("fill", "#94a3b8")
        .attr("font-size", 11)
        .text(`${title} | Range: ${minV?.toFixed?.(2) ?? "?"} → ${maxV?.toFixed?.(2) ?? "?"}`);
    }

    // Cache so we don’t reread CSV every time
    const cache = new Map();
    let GEOJSON = null;

    // Load the SAME map geometry your app uses
    loadMapData((err, mapData) => {
      if (err) {
        host.innerHTML = `<div class="loading">❌ Failed to load map geometry.</div>`;
        console.error(err);
        return;
      }

      GEOJSON = Array.isArray(mapData)
        ? { type: "FeatureCollection", features: mapData }
        : (mapData.type === "FeatureCollection" ? mapData : { type: "FeatureCollection", features: mapData.features || [] });

      // Activate buttons
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
              const rows = await readCSV(cfg.path);
              const valueCol = detectValueColumn(rows);
              if (!valueCol) throw new Error(`No numeric column found in ${cfg.path}`);
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

      // Default selection
      const first = document.querySelector("#index-tabs .map-btn[data-key='gpi']");
      if (first) first.click();
    });
  });
});
