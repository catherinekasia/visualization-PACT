# Economic Stability Index (Option C)
# StabilityBase = mean(GDP', (1-Inflation'), (1-Unemployment'))
# E = StabilityBase * (0.5 + 0.5*Growth')

import pandas as pd
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent

# Files directions
PATH_DEMO = DATA_DIR / "demographics_data.csv"
PATH_ECON = DATA_DIR / "economy_data.csv"
PATH_INFL = DATA_DIR / "global_inflation_data.csv"

OUT_FILE = SCRIPT_DIR / "economic_stability_option_c.csv"


# -----------------------
# 1) Robust country-column detection + standardization
# -----------------------
def detect_country_column(df: pd.DataFrame) -> str:
    # try most common options first, just doing this, because problems may arise
    candidates = [
        "Country", "country", "COUNTRY",
        "Country Name", "country_name", "countryname",
        "Entity", "Location", "Area", "Name", "name"
    ]
    # exact match (case-sensitive) first
    for c in candidates:
        if c in df.columns:
            return c

    # case-insensitive match
    lower_map = {c.lower(): c for c in df.columns}
    for c in candidates:
        if c.lower() in lower_map:
            return lower_map[c.lower()]

    raise KeyError(
        f"Could not find a country column. Available columns are:\n{list(df.columns)}"
    )

def standardize_country(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    col = detect_country_column(df)
    df["COUNTRY"] = (
        df[col].astype(str).str.strip().str.upper()
    )
    return df


#  Load CSVs (with clear errors)
def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return pd.read_csv(path)


df_demo = load_csv(PATH_DEMO)
df_econ = load_csv(PATH_ECON)
df_infl = load_csv(PATH_INFL)

df_demo = standardize_country(df_demo)
df_econ = standardize_country(df_econ)
df_infl = standardize_country(df_infl)


# Pick columns to choose the correct ones.

print("\n--- Columns in economy_data.csv ---")
print(list(df_econ.columns))
print("\n--- Columns in global_inflation_data.csv ---")
print(list(df_infl.columns))


COL_GDP_PC = "Real_GDP_per_Capita_USD"          # in economy_data.csv
COL_GROWTH = "Real_GDP_Growth_Rate_percent"     # in economy_data.csv
COL_UNEMP  = "Unemployment_Rate_percent"        # in economy_data.csv
COL_INFL   = "2024"           # in global_inflation_data.csv

# Keep only the needed columns
df_econ = df_econ[["COUNTRY", COL_GDP_PC, COL_GROWTH, COL_UNEMP ]]

df_infl = df_infl[["COUNTRY", COL_INFL]]


#  Merge everytihng to have one dataset 
df = df_econ.merge(df_demo, on="COUNTRY", how="inner").merge(df_infl, on="COUNTRY", how="inner")


# Normalization function
def minmax(series: pd.Series) -> pd.Series:
    s = pd.to_numeric(series, errors="coerce")
    mn = s.min(skipna=True)
    mx = s.max(skipna=True)
    if pd.isna(mn) or pd.isna(mx) or mx == mn:
        return pd.Series(pd.NA, index=s.index)
    return (s - mn) / (mx - mn)


# calc the index itself 
df["GDP_n"]    = minmax(df[COL_GDP_PC])
df["GROWTH_n"] = minmax(df[COL_GROWTH])
df["UNEMP_n"]  = minmax(df[COL_UNEMP])
df["INFL_n"]   = minmax(df[COL_INFL])

df["UNEMP_good"] = 1 - df["UNEMP_n"]
df["INFL_good"]  = 1 - df["INFL_n"]

df["StabilityBase"] = df[["GDP_n", "UNEMP_good", "INFL_good"]].mean(axis=1, skipna=False)
df["EconomicStability_E"] = df["StabilityBase"] * (0.5 + 0.5 * df["GROWTH_n"])


# Output the file 
df.to_csv(OUT_FILE, index=False)
print("\n✅ Saved:", OUT_FILE)
print("Rows:", len(df))
