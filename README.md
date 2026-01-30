# PACT - Visualization Tool

## Installation instructions

Run the following commands in the terminal when in the project directory:

```
npm install
```

```
npm i -g @neutralinojs/neu
```

```
neu update
```

```
neu run
```

Additional libraries used:

https://github.com/datasets/geo-countries

---

## Project Overview

PACT (Political and Country Trends) is a desktop visualization application built with NeutralinoJS that enables users to explore and analyze country-level data across multiple dimensions including demographics, economy, energy, and various quality-of-life indexes.

## Features

### 🗺️ Map View (`index.html`)
- Interactive world map visualization using D3.js and GeoJSON
- Click on countries to view detailed statistics popup
- Region-based filtering and highlighting

### 📊 Data View (`data.html`) - Country Finder
- Multi-attribute filtering and ranking system
- Select criteria to find countries matching your requirements
- Displays Top 5 matching countries with score breakdowns
- Visual charts for score comparison

### 🔍 Explore View (`explore.html`)
- Parallel Coordinates Plot (PCP) for multi-dimensional data exploration
- Interactive scatter plot visualization
- Region-based color coding with 7 distinct regions
- Interactive legend with click/hover filtering
- Dynamic attribute selection via dropdowns

### ⚙️ Settings View (`settings.html`)
- Application configuration options

---

## Project Structure

```
visualization-PACT/
│
├── bin/                          # Neutralino binaries (cross-platform)
│   ├── neutralino-linux_arm64
│   ├── neutralino-linux_armhf
│   ├── neutralino-linux_x64
│   ├── neutralino-mac_arm64
│   ├── neutralino-mac_universal
│   └── neutralino-mac_x64
│
├── data/                         # Raw data files (unfiltered)
│   ├── economy_data.csv
│   ├── demographics_data.csv
│   ├── communications_data.csv
│   ├── energy_data.csv
│   ├── transportation_data.csv
│   ├── geography_data.csv
│   ├── government_and_civics_data.csv
│   │
│   └── filtered_cia_data/        # Cleaned/filtered data
│       ├── economy_data.csv
│       ├── demographics_data.csv
│       ├── communications_data.csv
│       ├── energy_data.csv
│       ├── geography_data.csv
│       ├── government_and_civics_data.csv
│       ├── transportation_data.csv
│       │
│       ├── global_peace_index.csv
│       ├── criminal_index.csv
│       ├── global_terrorism_index.csv
│       ├── heathcare_index_data.csv
│       ├── global_inflation_data.csv
│       ├── life_expectancy.csv
│       │
│       └── Indexes_calc_code/    # Computed composite indexes
│           ├── safety_index_risk_focused.csv
│           ├── ownhealth_index.csv
│           ├── good_country_index_option3.csv
│           ├── earning_potential_epi_future.csv
│           └── economic_stability_option_c.csv
│
├── resources/                    # Application source files
│   ├── index.html               # Map View (main page)
│   ├── data.html                # Data/Country Finder View
│   ├── explore.html             # Explore View (PCP + scatter)
│   ├── settings.html            # Settings page
│   ├── threejs.html             # 3D visualization (experimental)
│   │
│   ├── styles.css               # Global styles for all pages
│   ├── data-config.js           # Attribute definitions for Data View
│   ├── data.js                  # Data View logic (Country Finder)
│   ├── countries.geojson        # World map boundaries
│   │
│   ├── icons/                   # Icon assets
│   │   └── flags/               # Country flag images
│   │
│   └── js/                      # JavaScript modules
│       ├── main.js              # Map View initialization & logic
│       ├── explore.js           # Explore View (PCP, scatter plot)
│       ├── shared.js            # ⭐ SHARED UTILITIES (consolidated)
│       ├── d3.v7.min.js         # D3.js visualization library
│       ├── neutralino.js        # Neutralino runtime
│       ├── neutralino.d.ts      # TypeScript definitions
│       │
│       └── components/          # Reusable UI components
│           ├── map.js           # Map rendering & interaction
│           ├── popup.js         # Country detail popup modal
│           ├── charts.js        # Radar chart & visualizations
│           ├── dataLoader.js    # CSV data loading utilities
│           └── utils.js         # Formatting utilities
│
├── neutralino.config.json       # Neutralino app configuration
├── package.json                 # Node.js dependencies
├── LICENSE                      # License file
└── README.md                    # This file
```

---

## File Responsibilities

### HTML Pages
| File | Purpose |
|------|---------|
| `index.html` | Main map visualization page |
| `data.html` | Country finder/analysis tool |
| `explore.html` | Multi-dimensional data exploration |
| `settings.html` | App settings and preferences |

### JavaScript - Core Logic
| File | Purpose | Used By |
|------|---------|---------|
| `js/main.js` | Initializes map, loads data, handles interactions | `index.html` |
| `js/explore.js` | Parallel coordinates, scatter plot, region colors | `explore.html` |
| `data.js` | Country finder logic, scoring algorithm | `data.html` |
| `data-config.js` | Attribute definitions (labels, keys, better direction) | `data.html` |
| `js/shared.js` | ⭐ **Consolidated shared code** (see below) | All pages |

### JavaScript - Components
| File | Purpose |
|------|---------|
| `js/components/map.js` | D3 map rendering, pan/zoom, country selection |
| `js/components/popup.js` | Country detail modal with statistics |
| `js/components/charts.js` | Radar chart drawing |
| `js/components/dataLoader.js` | CSV loading and parsing |
| `js/components/utils.js` | Number formatting utilities |

### Shared Utilities (`js/shared.js`)
This file consolidates duplicate code that was previously scattered across multiple files:

| Export | Description |
|--------|-------------|
| `ALLOWED_COUNTRIES` | Set of country names included in visualizations |
| `REGION_COLORS` | Isoluminant color palette for 7 regions |
| `REGION_MAPPING` | Maps countries to geographic regions |
| `VISA_FILTERS` | EU/EEA and English-speaking country groups |
| `DATA_PATHS` | Central registry of all CSV file paths |
| `normalizeCountryName()` | Handles country name variations |
| `isAllowedCountry()` | Checks if country is in allowed list |
| `getRegion()` | Returns region name for a country |
| `getRegionColor()` | Returns color for a region |
| `formatNumber()` | Formats numbers for display |
| `formatLargeNumber()` | Formats with K/M/B suffixes |
| `parseNumericValue()` | Parses various numeric formats |

---

## Data Sources

| Category | Description | Key Fields |
|----------|-------------|------------|
| Demographics | Population, age, literacy | `Total_Population`, `Life_Expectancy`, `Literacy_Rate` |
| Economy | GDP, employment, inflation | `Real_GDP_per_Capita_USD`, `Unemployment_Rate_percent` |
| Energy | Production & consumption | `Electricity_Production`, `Energy_Consumption` |
| Communications | Internet, mobile usage | `internet_users_total`, `mobile_subscriptions` |
| Safety Index | Composite safety score | `safety_index_risk_focused` |
| Health Index | Health metrics composite | `health_index`, `life_expectancy` |
| Peace Index | Global Peace Index | `peace_index` |
| Crime Index | Crime statistics | `criminal_index` |

---

## Region Classification

The app divides countries into 7 regions with distinct colors:

| Region | Countries | Color |
|--------|-----------|-------|
| Western Europe | UK, France, Spain, Italy, etc. | Blue (#5B8FF9) |
| Northern Europe | Denmark, Finland, Sweden, etc. | Violet (#9D7FEA) |
| Central Europe | Germany, Austria, Poland, etc. | Teal (#5AD8A6) |
| Eastern Europe | Russia, Ukraine, Balkans, etc. | Gold (#F6BD16) |
| East Asia | Japan, China, Korea, etc. | Coral (#E86452) |
| North America | USA, Canada, Mexico | Sky Blue (#6DC8EC) |
| Oceania | Australia, New Zealand | Orange (#FF9845) |

---

## Technology Stack

- **Framework**: [NeutralinoJS](https://neutralino.js.org/) - Lightweight desktop app
- **Visualization**: [D3.js v7](https://d3js.org/) - Data-driven visualizations
- **CSV Parsing**: [Papa Parse](https://www.papaparse.com/) (Data View) / D3 (others)
- **Map Data**: [GeoJSON](https://github.com/datasets/geo-countries) GeoJSON country boundaries

---

## License

See [LICENSE](LICENSE) file for details.


