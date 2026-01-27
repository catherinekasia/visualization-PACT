/* data-config.js — Complete attribute configuration */

window.ATTRIBUTES = {
  Indexes: {
    DPI_R:                      { label: "Demographic Pressure Index",  better: "min" },
    EPI_future:                 { label: "Future Earning Potential",    better: "max" },
    EconomicStability_E:        { label: "Economic Stability Index",    better: "max" },
    good_country_index:         { label: "Good Country Index",          better: "max" },
    health_index:               { label: "Health Index",                better: "max" },
    safety_index_risk_focused:  { label: "Safety Index",                better: "max" },
  },

  demographics: {
    Total_Population:           { label: "Country Size", better: "max" },
    Population_Growth_Rate:     { label: "Future Population Pressure", better: "max" }, 
    Net_Migration_Rate:         { label: "Net Migration Rate", better: "max" },
    Median_Age:                 { label: "Age Structure of Society", better: "max" },
    Sex_Ratio:                  { label: "Gender Balance in Population", optimal: 1.0 },
    Total_Fertility_Rate:       { label: "Family & Child Raising Environment", better: "max" }, 
    Total_Literacy_Rate:        { label: "Education Level of Population", better: "max" },
    Female_Literacy_Rate:       { label: "Women's Education Access", better: "max" },
    Youth_Unemployment_Rate:    { label: "Young Adult Integration Indicator", better: "min" }
  },

  communications: {
    internet_users_total:       { label: "Digital Connectivity Scale", better: "max" },
  },

  economy: {
    Real_GDP_Growth_Rate_percent:           { label: "Economic Growth Rate", better: "max" },
    Real_GDP_per_Capita_USD:                { label: "Income Level per Person", better: "max" },
    Unemployment_Rate_percent:              { label: "Unemployment Rate", better: "min" },
    Budget_Deficit_percent_of_GDP:          { label: "Public Budget Balance", better: "min" },
    Public_Debt_percent_of_GDP:             { label: "Government Debt Level", better: "min" },
    Population_Below_Poverty_Line_percent:  { label: "Poverty Rate", better: "min" },
  },

  energy: {
    electricity_access_percent:      { label: "Access to Electricity", better: "max" },
    carbon_dioxide_emissions_Mt:     { label: "Environmental Impact (CO₂ Emissions)", better: "min" }
  },
};