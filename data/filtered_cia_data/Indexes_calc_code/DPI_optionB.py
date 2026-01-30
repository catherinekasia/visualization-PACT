# Demographic Pressure Index (DPI) - Option B
# 
# What this measures:
# How much "demographic stress" a country is under, based on population growth
# and infant mortality. Countries with rapid growth AND high infant deaths
# are under more pressure (think: strained healthcare, resources, etc.)
#
# The score goes from 0 to 100:
#   - Low (0-20): Stable demographics, not much pressure
#   - Medium (20-40): Some challenges but manageable  
#   - High (40+): Significant demographic stress
#
# Higher score = more pressure = generally tougher conditions

import pandas as pd
import numpy as np
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent 

PATH_DEMO = DATA_DIR / "demographics_data.csv"
OUT_FILE = SCRIPT_DIR / "DPI_optionB.csv"


def detect_country_column(df: pd.DataFrame) -> str:
    """Try to find the column that contains country names."""
    candidates = [
        "Country", "country", "COUNTRY",
        "Country Name", "country_name",
        "Entity", "Location", "Name", "name"
    ]
    for c in candidates:
        if c in df.columns:
            return c
    lower_map = {c.lower(): c for c in df.columns}
    for c in candidates:
        if c.lower() in lower_map:
            return lower_map[c.lower()]
    raise KeyError(f"Couldn't find a country column. Available: {list(df.columns)}")


def find_column_by_keywords(df: pd.DataFrame, required_any=(), required_all=()):
    """Find a column by searching for keywords in its name."""
    for col in df.columns:
        low = col.lower()
        if required_any and not any(tok in low for tok in required_any):
            continue
        if required_all and not all(tok in low for tok in required_all):
            continue
        return col
    return None


def to_numeric_series(s: pd.Series) -> pd.Series:
    """Clean up messy data and convert to numbers."""
    x = (
        s.astype(str)
         .str.replace(",", "", regex=False)
         .str.replace("%", "", regex=False)
         .str.strip()
    )
    x = x.replace({"": np.nan, "NA": np.nan, "N/A": np.nan, "nan": np.nan, "None": np.nan})
    return pd.to_numeric(x, errors="coerce")


def minmax(series: pd.Series) -> pd.Series:
    """Scale values to 0-1 range (0 = lowest in dataset, 1 = highest)."""
    s = to_numeric_series(series)
    mn = s.min(skipna=True)
    mx = s.max(skipna=True)
    if pd.isna(mn) or pd.isna(mx) or mx == mn:
        return pd.Series(np.nan, index=s.index)
    return (s - mn) / (mx - mn)


def main():
    if not PATH_DEMO.exists():
        raise FileNotFoundError(f"Can't find the file: {PATH_DEMO}")
    
    df = pd.read_csv(PATH_DEMO)

    # Figure out which column has country names
    country_col = detect_country_column(df)
    df["COUNTRY"] = df[country_col].astype(str).str.strip().str.upper()

    # Find the columns we need
    growth_col = (
        find_column_by_keywords(df, required_any=("population",), required_all=("growth",)) or
        find_column_by_keywords(df, required_any=("pop",), required_all=("growth",)) or
        find_column_by_keywords(df, required_any=("population_growth", "population growth", "pop growth"), required_all=())
    )

    infmort_col = (
        find_column_by_keywords(df, required_any=("infant",), required_all=("mort",)) or
        find_column_by_keywords(df, required_any=("infant_mortality", "infant mortality"), required_all=()) or
        find_column_by_keywords(df, required_any=("mortality",), required_all=("infant",))
    )

    if growth_col is None or infmort_col is None:
        print("Available columns:", list(df.columns))
        raise KeyError(
            f"Couldn't find the columns we need.\n"
            f"Found growth_col={growth_col}, infmort_col={infmort_col}"
        )

    print("Using these columns:")
    print(f"  Country: {country_col}")
    print(f"  Population growth: {growth_col}")
    print(f"  Infant mortality: {infmort_col}")

    # Scale both inputs to 0-1
    g_n = minmax(df[growth_col])   # higher growth = more pressure
    m_n = minmax(df[infmort_col])  # higher mortality = more pressure

    # Calculate the index: simple average of the two factors
    # Both contribute equally (50/50 split)
    dpi = 100.0 * (0.50 * g_n + 0.50 * m_n)

    # Build output table
    out = df[["COUNTRY"]].copy()
    out["population_growth_rate_raw"] = to_numeric_series(df[growth_col])
    out["infant_mortality_raw"] = to_numeric_series(df[infmort_col])
    out["g_norm"] = g_n
    out["m_norm"] = m_n
    out["DPI_R"] = dpi

    # Drop rows with missing data and save
    out = out.dropna(subset=["DPI_R"]).reset_index(drop=True)

    out.to_csv(OUT_FILE, index=False)
    print(f"\nSaved to: {OUT_FILE}")
    print(f"Countries: {len(out)}")
    print(f"DPI range: {out['DPI_R'].min():.1f} - {out['DPI_R'].max():.1f}")
    print(f"Average: {out['DPI_R'].mean():.1f}")


if __name__ == "__main__":
    main()
