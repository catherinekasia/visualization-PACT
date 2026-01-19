/* data-config.js — matches YOUR CSV headers exactly */

window.ATTRIBUTES = {
  Indexes:{
    DPI_R:                      { label: "Demographic Pressure Index",  better: "min" },
    EPI_future:                 { label: "Future Earning Potential",    better: "max" },
    EconomicStability_E:        { label: "Economic Stability Index",    better: "max" },
    good_country_index:         { label: "Good country Index",          better: "max" },
    health_index:               { label: "Health Index",                better: "max" },
    safety_index_risk_focused:  { label: "Safety Index",                better: "max" },
  },

  demographics: {
    Total_Population:           { label: "Country size",            better: "max" },
    Population_Growth_Rate:     { label: "Future Population Pressure",      better: "max" }, 
    Birth_Rate:                 { label: "Birth Rate",                  better: "max" }, 
    Death_Rate:                 { label: "Death Rate",                  better: "min" },
    Net_Migration_Rate:         { label: "Net Migration Rate",          better: "max" },
    Median_Age:                 { label: "Median Age",                  better: "max" },
    Sex_Ratio:                  { label: "Gender Balance in Population",                   better: "max" },
    Total_Fertility_Rate:       { label: "Total Fertility Rate",        better: "max" }, 
    Total_Literacy_Rate:        { label: "Education Level of Population",         better: "max" },
    Male_Literacy_Rate:         { label: "Male Literacy Rate",          better: "max" },
    Female_Literacy_Rate:       { label: "Female Literacy Rate",        better: "max" },
    Youth_Unemployment_Rate:    { label: "Youth Unemployment Rate",     better: "min" }
  },

  communications: {
    internet_users_total:                   { label: "Digital Connectivity Scale",          better: "max" },
  },

  economy: {
    Real_GDP_PPP_billion_USD:                       { label: "Real GDP (PPP) [B USD]",               better: "max" },
    GDP_Official_Exchange_Rate_billion_USD:         { label: "GDP (Official) [B USD]",              better: "max" },
    Real_GDP_Growth_Rate_percent:                   { label: "Real GDP Growth Rate [%]",           better: "max" },
    Real_GDP_per_Capita_USD:                        { label: "Real GDP per Capita [USD]",          better: "max" },

    Unemployment_Rate_percent:                      { label: "Unemployment Rate [%]",              better: "min" },
    Youth_Unemployment_Rate_percent:                { label: "Youth Unemployment Rate [%]",        better: "min" },

    Budget_billion_USD:                             { label: "Budget [B USD]",                      better: "max" },
    Budget_Surplus_billion_USD:                     { label: "Budget Surplus [B USD]",              better: "max" },
    Budget_Deficit_percent_of_GDP:                  { label: "Budget Deficit [% of GDP]",           better: "min" },

    Public_Debt_percent_of_GDP:                     { label: "Public Debt [% of GDP]",              better: "min" },

    Exports_billion_USD:                            { label: "Exports [B USD]",                     better: "max" },
    Imports_billion_USD:                            { label: "Imports [B USD]",                     better: "max" },

    Exchange_Rate_per_USD:                          { label: "Exchange Rate (per USD)",             better: "min" }, 
    Population_Below_Poverty_Line_percent:          { label: "Population Below Poverty Line [%]",   better: "min" },
  },

  energy: {
    electricity_access_percent:                { label: "Electricity Access [%]",            better: "max" },
    electricity_generating_capacity_kW:        { label: "Electric Generating Capacity [kW]", better: "max" }, 
    petroleum_bbl_per_day:                     { label: "Petroleum [bbl/day]",               better: "min" }, 

    refined_petroleum_products_bbl_per_day:    { label: "Refined Petroleum Products [bbl/day]", better: "min" }, 
    refined_petroleum_exports_bbl_per_day:     { label: "Refined Petroleum Exports [bbl/day]",  better: "max" },
    refined_petroleum_imports_bbl_per_day:     { label: "Refined Petroleum Imports [bbl/day]",  better: "min" },

    natural_gas_cubic_meters:                  { label: "Natural Gas [m³]",                  better: "min" }, 
    carbon_dioxide_emissions_Mt:               { label: "CO₂ Emissions [Mt]",                better: "min" }
  },

};

