// Define all available attributes from your CSV files
export const ATTRIBUTES = {
  // From demographics_data.csv
  demographics: {
    'population': 'Total Population',
    'population_density': 'Population Density',
    'life_expectancy': 'Life Expectancy',
    'birth_rate': 'Birth Rate',
    'death_rate': 'Death Rate',
    'median_age': 'Median Age',
    'urban_population': 'Urban Population %'
  },
  
  // From economy_data.csv
  economy: {
    'gdp': 'GDP',
    'gdp_per_capita': 'GDP per Capita',
    'gdp_growth': 'GDP Growth',
    'inflation': 'Inflation Rate',
    'unemployment': 'Unemployment Rate',
    'debt_to_gdp': 'Debt to GDP Ratio'
  },
  
  // From energy_data.csv
  energy: {
    'energy_consumption': 'Energy Consumption',
    'renewable_energy': 'Renewable Energy %',
    'fossil_fuel': 'Fossil Fuel %',
    'co2_emissions': 'CO2 Emissions'
  },
  
  // From transportation_data.csv
  transportation: {
    'road_network': 'Road Network Length',
    'rail_network': 'Rail Network Length',
    'airports': 'Number of Airports',
    'ports': 'Number of Ports'
  },
  
  // From geography_data.csv
  geography: {
    'area': 'Total Area',
    'land_area': 'Land Area',
    'water_area': 'Water Area',
    'coastline': 'Coastline Length'
  }
};

// Sample country data (you'll replace this with actual CSV loading)
export const SAMPLE_DATA = [
  {
    country: 'Norway',
    gdp: 75, life_expectancy: 82, happiness: 85, population_density: 15,
    renewable_energy: 98, education: 90, median_age: 39,
    inflation: 2.1, unemployment: 3.2, area: 385207, coastline: 25148
  },
  {
    country: 'Sweden',
    gdp: 70, life_expectancy: 83, happiness: 88, population_density: 25,
    renewable_energy: 65, education: 88, median_age: 41,
    inflation: 2.3, unemployment: 6.8, area: 450295, coastline: 3218
  },
  {
    country: 'Denmark',
    gdp: 68, life_expectancy: 81, happiness: 90, population_density: 140,
    renewable_energy: 60, education: 85, median_age: 42,
    inflation: 1.8, unemployment: 5.0, area: 42931, coastline: 7314
  },
  {
    country: 'Finland',
    gdp: 65, life_expectancy: 82, happiness: 87, population_density: 18,
    renewable_energy: 45, education: 92, median_age: 43,
    inflation: 1.9, unemployment: 6.7, area: 338424, coastline: 1250
  },
  {
    country: 'Switzerland',
    gdp: 85, life_expectancy: 84, happiness: 82, population_density: 220,
    renewable_energy: 25, education: 87, median_age: 43,
    inflation: 0.7, unemployment: 2.3, area: 41277, coastline: 0
  },
  {
    country: 'Germany',
    gdp: 78, life_expectancy: 81, happiness: 80, population_density: 240,
    renewable_energy: 30, education: 86, median_age: 46,
    inflation: 1.5, unemployment: 3.2, area: 357022, coastline: 2389
  },
  {
    country: 'Canada',
    gdp: 73, life_expectancy: 83, happiness: 83, population_density: 4,
    renewable_energy: 20, education: 84, median_age: 41,
    inflation: 2.2, unemployment: 5.5, area: 9984670, coastline: 202080
  },
  {
    country: 'Australia',
    gdp: 71, life_expectancy: 83, happiness: 81, population_density: 3,
    renewable_energy: 15, education: 82, median_age: 38,
    inflation: 2.8, unemployment: 3.7, area: 7692024, coastline: 25760
  }
];