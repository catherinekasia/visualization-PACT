import pandas as pd

# Load both files
original = pd.read_csv('data/filtered_cia_data/Indexes_calc_code/DPI.csv')
optionB = pd.read_csv('data/filtered_cia_data/Indexes_calc_code/DPI_optionB.csv')

# Merge on country
merged = original.merge(optionB, on='COUNTRY', suffixes=('_orig', '_optB'))

print('=== COMPARISON: Original DPI vs Option B ===\n')

print('ORIGINAL (with 1.6 exponent):')
print(f'  Range: {original["DPI_R"].min():.2f} - {original["DPI_R"].max():.2f}')
print(f'  Mean:  {original["DPI_R"].mean():.2f}')
print(f'  Std:   {original["DPI_R"].std():.2f}\n')

print('OPTION B (linear):')
print(f'  Range: {optionB["DPI_R"].min():.2f} - {optionB["DPI_R"].max():.2f}')
print(f'  Mean:  {optionB["DPI_R"].mean():.2f}')
print(f'  Std:   {optionB["DPI_R"].std():.2f}\n')

print('TOP 10 HIGHEST PRESSURE (Original):')
for _, row in original.nlargest(10, 'DPI_R').iterrows():
    print(f'  {row["COUNTRY"]}: {row["DPI_R"]:.2f}')

print('\nTOP 10 HIGHEST PRESSURE (Option B):')
for _, row in optionB.nlargest(10, 'DPI_R').iterrows():
    print(f'  {row["COUNTRY"]}: {row["DPI_R"]:.2f}')

print('\nSAMPLE COMPARISON (Orig vs OptB):')
for country in ['GERMANY', 'JAPAN', 'MEXICO', 'UKRAINE', 'MOLDOVA']:
    row = merged[merged['COUNTRY'] == country]
    if len(row) > 0:
        orig = row['DPI_R_orig'].values[0]
        optb = row['DPI_R_optB'].values[0]
        print(f'  {country}: {orig:.2f} vs {optb:.2f} (diff: {optb - orig:+.2f})')
