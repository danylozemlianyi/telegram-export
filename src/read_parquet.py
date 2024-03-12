import pandas as pd

parquet_file = 'summary.parquet.gzip'

df = pd.read_parquet(parquet_file, engine='pyarrow')
print(df.head())
