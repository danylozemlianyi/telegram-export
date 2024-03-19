import pandas as pd

parquet_dir = 'telegram'

df = pd.read_parquet(parquet_dir, engine='pyarrow')
print(df.head())
print(f"df size: {df.count()}")
