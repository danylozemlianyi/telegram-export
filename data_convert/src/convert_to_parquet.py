from datetime import datetime
from memory_profiler import profile
import os
import pyarrow as pa
from pyarrow import json as pj
from pyarrow.json import ParseOptions
import pyarrow.dataset as ds

media_type = pa.struct([
    pa.field('media_id', pa.string(), nullable=True),
    pa.field('media_type', pa.string(), nullable=True),
    pa.field('media_duration', pa.string(), nullable=True),
])

reaction_type = pa.struct([
    pa.field('emoji', pa.string(), nullable=True),
    pa.field('count', pa.uint32(), nullable=True),
])

partitioning_schema = pa.schema([
    pa.field('post_date', pa.string(), nullable=True),
    pa.field('lang', pa.string(), nullable=True),
])

schema = pa.schema([
    pa.field('id', pa.string(), nullable=True),
    pa.field('schema_version', pa.int32(), nullable=True),
    pa.field('channel_id', pa.int64(), nullable=True),
    pa.field('channel_title', pa.string(), nullable=True),
    pa.field('telegram_post_id', pa.int64(), nullable=True),
    pa.field('post_date', pa.string(), nullable=True),
    pa.field('post_ts', pa.int64(), nullable=True),
    pa.field('updated_at', pa.timestamp('us'), nullable=True),
    pa.field('lang', pa.string(), nullable=True),
    pa.field('segment', pa.string(), nullable=True),
    pa.field('full_text', pa.string(), nullable=True),
    pa.field('media', pa.list_(media_type), nullable=True),
    pa.field('comments', pa.list_(pa.struct([
        pa.field('telegram_message_id', pa.int64(), nullable=True),
        pa.field('sender_id', pa.int64(), nullable=True),
        pa.field('sender_username', pa.string(), nullable=True),
        pa.field('sender_first_name', pa.string(), nullable=True),
        pa.field('sender_last_name', pa.string(), nullable=True),
        pa.field('reply_to', pa.int64(), nullable=True),
        pa.field('full_text', pa.string(), nullable=True),
        pa.field('reactions', pa.list_(reaction_type), nullable=True),
        pa.field('media', pa.list_(media_type), nullable=True),
    ]))),
    pa.field('reactions', pa.list_(reaction_type), nullable=True),
    pa.field('view_count', pa.int32(), nullable=True),
])


@profile()
def read_json_files_as_table(files: list, schema: pa.Schema) -> pa.Table:
    tables = []
    for file in files:
        tables.append(pj.read_json(file, parse_options=ParseOptions(explicit_schema=schema)))
    table = pa.concat_tables(tables)
    return table


def process_files_and_append_to_parquet(base_path: str, files: list, schema: pa.Schema):
    table = read_json_files_as_table(files, schema)
    ds.write_dataset(table, base_path, format="parquet",
                     partitioning=ds.partitioning(schema=partitioning_schema, flavor="hive"),
                     basename_template="part-{{i}}-{}.parquet".format(round(datetime.now().timestamp())),
                     schema=schema,
                     existing_data_behavior="overwrite_or_ignore")


def process_in_chunks_and_write_to_parquet(source_dir: str, chunk_size: int, schema: pa.Schema, dest_base_path: str):
    files = [os.path.join(source_dir, f) for f in os.listdir(source_dir) if f.endswith('.json')]
    for i in range(0, len(files), chunk_size):
        print(f'processing chunk {i}')
        chunk_files = files[i:i + chunk_size]
        process_files_and_append_to_parquet(dest_base_path, chunk_files, schema)
        print(f'wrote chunk {i} to parquet')

    print(f"Data from {len(files)} JSON files has been written to {dest_base_path} with gzip compression.")


if __name__ == "__main__":
    input_directory = os.getenv('IN_PATH', './out')
    dest_base_path = 'telegram'
    process_in_chunks_and_write_to_parquet(input_directory, 2000, schema, dest_base_path)
