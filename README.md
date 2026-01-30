# PACT - Visualization Tool

## Installation instructions

Run the following commands in the terminal when in the project directory:

Node.js and npm are required to install NeutralinoJS. Please follow the installation instructions by [Node](https://nodejs.org/en/download)

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

---

## Project Overview

PACT (Political and Country Trends) is a desktop visualization application built with NeutralinoJS that enables users to explore and analyze country-level data across multiple dimensions including demographics, economy, energy, and various quality-of-life indexes.

## Features

### 🗺️ Map View (`index.html`)
- Interactive world map visualization using D3.js and GeoJSON
- Click on countries to view detailed statistics popup with:
  - Demographics, economy, and quality of life indexes
  - **Work visa & permit information** with requirements and costs
  - Interactive charts (radar and bar charts)
- Region-based filtering and highlighting

### 📊 Data View (`data.html`) - Country Comparison Tool
- **Visa/region filtering** (All Countries, EU/EEA/Schengen, English-Speaking)
- Multi-country selection (up to 5 countries)
- Multi-attribute selection (up to 10 attributes) with:
  - **Search functionality** to find attributes quickly
  - **Group selection buttons** (All/Clear) for each category
- Compare mode: Side-by-side country comparison with charts
- Weights mode: Customize attribute importance for scoring
- **Selection caching** - Your selections persist across page refreshes
- Visual charts for data comparison

### 🔍 Explore View (`explore.html`)
- Parallel Coordinates Plot (PCP) for multi-dimensional data exploration
- Interactive scatter plot visualization
- **Visa/region filtering** (All Countries, EU/EEA/Schengen, English-Speaking)
- Region-based color coding with 7 distinct regions
- Interactive legend with click/hover filtering
- Dynamic attribute selection via dropdowns

### 📈 Indexes View (`indexes.html`)
- Choropleth maps for various country indexes
- Global Peace Index, Crime Index, Terrorism Index
- Safety, Health, and composite indexes
- Interactive map navigation with color-coded values

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
│   ├── visa_info.csv            # Work visa & permit information
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
│   ├── data.html                # Data/Country Comparison View
│   ├── explore.html             # Explore View (PCP + scatter)
│   ├── indexes.html             # Indexes View (choropleth maps)
│   ├── settings.html            # Settings page
│   │
│   ├── styles.css               # Global styles for all pages
│   ├── data-config.js           # Attribute definitions for Data View
│   ├── data.js                  # Data View logic (Country Comparison)
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
│           ├── popup.js         # Country detail popup modal with visa info
│           ├── charts.js        # Radar & bar chart visualizations
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
| `data.html` | Country comparison tool with filtering & caching |
| `explore.html` | Multi-dimensional data exploration (PCP & scatter) |
| `indexes.html` | Index-based choropleth map visualizations |
| `settings.html` | App settings and preferences |

### JavaScript - Core Logic
| File | Purpose | Used By |
|------|---------|---------|
| `js/main.js` | Initializes map, loads data, handles interactions | `index.html` |
| `js/explore.js` | Parallel coordinates, scatter plot, region colors | `explore.html` |
| `js/indexes.js` | Index map rendering and interactions | `indexes.html` |
| `data.js` | Country comparison logic with caching & filtering | `data.html` |
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
| Visa Information | Work visas & permits | `Visa Name`, `Temporary/Permanent`, `Min. Education Level`, `Cost` |
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
- **CSV Parsing**: Papa Parse (Data View) / D3 (other views)
- **Map Data**: [GeoJSON](https://github.com/datasets/geo-countries) country boundaries
- **Storage**: localStorage for user preference caching

---

## Key Features

### Data Persistence
- User selections (countries, attributes, filters) are saved to localStorage
- Selections automatically restore on page reload
- "Clear All Selections" button to reset cached data

### Visa Information System
- Comprehensive work visa database for all countries
- Displays visa types (temporary/permanent)
- Shows education requirements, sponsorship needs, and costs
- Integrated into country popup modals

### Advanced Filtering
- Visa/region filters: All Countries, EU/EEA/Schengen, English-Speaking
- Search functionality for finding specific attributes
- Group selection for batch attribute selection

---

## License

See [LICENSE](LICENSE) file for details.