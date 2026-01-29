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

    const INDEXES = {
      gpi: {
        title: "Global Peace Index",
        path: "data/filtered_cia_data/global_peace_index.csv",
        ramp: "blues"
      },
      crime: {
        title: "Criminal Index",
        path: "data/filtered_cia_data/criminal_index.csv",
        ramp: "purples"
      },
      gti: {
        title: "Global Terrorism Index",
        path: "data/filtered_cia_data/global_terrorism_index.csv",
        ramp: "reds"
      },
      safety: {
        title: "Safety Index (Risk)",
        path: "data/filtered_cia_data/Indexes_calc_code/safety_index_risk_focused.csv",
        ramp: "oranges"
      },
      health: {
        title: "Own Health Index",
        path: "data/filtered_cia_data/Indexes_calc_code/ownhealth_index.csv",
        ramp: "greens"
      }
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

      const x = event.clientX + 14;
      const y = event.clientY + 14;

      tooltip.style.left = `${x}px`;
      tooltip.style.top  = `${y}px`;
      tooltip.style.display = "block";
    }

    function moveTooltip(event) {
      if (!tooltip) return;

      const x = event.clientX + 14;
      const y = event.clientY + 14;

      tooltip.style.left = `${x}px`;
      tooltip.style.top  = `${y}px`;
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

      const g = svg.append("g");

      g.selectAll("path")
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
        .style("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          const name = featureName(d);
          const v = countryToValue.get(normalizeCountryName(name));

          d3.select(this)
            .attr("stroke", "rgba(226,232,240,0.85)")
            .attr("stroke-width", 1.6);

          showTooltipAt(event, tooltipHTML(name, title, v));
        })
        .on("mousemove", function (event) {
          moveTooltip(event);
        })
        .on("mouseleave", function () {
          d3.select(this)
            .attr("stroke", "rgba(148,163,184,0.25)")
            .attr("stroke-width", 0.7);

          hideTooltip();
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
