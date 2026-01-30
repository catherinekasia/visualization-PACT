# Economic Stability Index
# StabilityBase = mean(GDP', (1-Inflation'), (1-Unemployment'))
# E = StabilityBase * (0.5 + 0.5*Growth')
#
# Inflation value = mean(Inflation_2023, Inflation_2024)
# Fix inflation CSV read: handle rows with extra commas (unquoted country names)

import pandas as pd
import csv
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent

# The paths to the input data files
PATH_DEMO = DATA_DIR / "demographics_data.csv"
PATH_ECON = DATA_DIR / "economy_data.csv"
PATH_INFL = DATA_DIR / "global_inflation_data.fixed.csv"

OUT_FILE = SCRIPT_DIR / "economic_stability_option_c.csv"


# Country-column detection + standardization

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


# Load CSVs (with clear errors)
def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return pd.read_csv(path)


# Load inflation CSV (fix rows where commas inside country_name were not quoted)
def load_inflation_csv_fixed(path: Path) -> pd.DataFrame:
    fixed_path = path.with_suffix(".fixed.csv")

    with open(path, "r", encoding="utf-8", errors="replace", newline="") as f_in:
        reader = csv.reader(f_in)
        header = next(reader)
        expected = len(header)

        with open(fixed_path, "w", encoding="utf-8", newline="") as f_out:
            writer = csv.writer(f_out)
            writer.writerow(header)

            for row in reader:
                if not row:
                    continue

                # if row has too many fields, merge extra pieces back into the first field (country_name)
                if len(row) > expected:
                    extra = len(row) - expected
                    country_fixed = ",".join(row[:extra + 1])
                    row = [country_fixed] + row[extra + 1:]

                # if row has too few fields, pad with empty strings
                elif len(row) < expected:
                    row = row + [""] * (expected - len(row))

                writer.writerow(row)

    return pd.read_csv(fixed_path)


df_demo = load_csv(PATH_DEMO)
df_econ = load_csv(PATH_ECON)
df_infl = load_inflation_csv_fixed(PATH_INFL)

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

COL_INFL_2023 = "2023"                          # in global_inflation_data.csv
COL_INFL_2024 = "2024"                          # in global_inflation_data.csv

# Keep only the needed columns
df_econ = df_econ[["COUNTRY", COL_GDP_PC, COL_GROWTH, COL_UNEMP ]]
df_infl = df_infl[["COUNTRY", COL_INFL_2023, COL_INFL_2024]]


# Merge everytihng to have one dataset 
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

# Inflation value = mean of 2023 and 2024 (strict: if one is missing -> NaN)
df["INFL_value"] = (
    pd.to_numeric(df[COL_INFL_2023], errors="coerce")
    + pd.to_numeric(df[COL_INFL_2024], errors="coerce")
) / 2

df["GDP_n"]    = minmax(df[COL_GDP_PC])
df["GROWTH_n"] = minmax(df[COL_GROWTH])
df["UNEMP_n"]  = minmax(df[COL_UNEMP])
df["INFL_n"]   = minmax(df["INFL_value"])

# Invert UNEMP and INFL (lower is better)
df["UNEMP_good"] = 1 - df["UNEMP_n"]
df["INFL_good"]  = 1 - df["INFL_n"]

df["StabilityBase"] = df[["GDP_n", "UNEMP_good", "INFL_good"]].mean(axis=1, skipna=False)
df["EconomicStability_E"] = df["StabilityBase"] * (0.5 + 0.5 * df["GROWTH_n"])

# Output the file 
out_cols = ["COUNTRY", "INFL_n", "UNEMP_good", "INFL_good", "StabilityBase", "EconomicStability_E"]
df[out_cols].to_csv(OUT_FILE, index=False)

print("Saved:", OUT_FILE)
print("Rows:", len(df))
print(df[out_cols].head(10))

