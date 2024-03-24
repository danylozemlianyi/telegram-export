# telegram-export

Team Bravo repository for Telegram Export application

## Generating mocks

```shell
OUT_PATH=./out COUNT=500 python src/generate_mocks.py
```

## Converting to parquet

```shell
IN_PATH=./out python src/convert_to_parquet.py
```

## Reading resulting parquet

```shell
python src/read_parquet.py
```

# TODOs

1. Partitioning
2. Customization with filenames, dirs, chunks, etc. via env
3. Give up on JSON so that we can preserve non-null constraints in schema?