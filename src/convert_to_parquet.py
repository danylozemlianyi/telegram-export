import pyarrow as pa
from pyarrow import json as pj
from pyarrow.json import ParseOptions
import pyarrow.parquet as pq
import os

media_type = pa.struct([
    pa.field('media_id', pa.string(), nullable=True),
    pa.field('media_type', pa.string(), nullable=True),
    pa.field('media_duration', pa.string(), nullable=True),
])

reaction_type = pa.struct([
    pa.field('emoji', pa.string(), nullable=True),
    pa.field('count', pa.uint32(), nullable=True),
])

schema = pa.schema([
    pa.field('id', pa.string(), nullable=True),
    pa.field('schema_version', pa.int32(), nullable=True),
    pa.field('channel_id', pa.int64(), nullable=True),
    pa.field('channel_title', pa.string(), nullable=True),
    pa.field('telegram_post_id', pa.int64(), nullable=True),
    pa.field('date', pa.string(), nullable=True),
    pa.field('post_ts', pa.int64(), nullable=True),
    pa.field('updated_at', pa.timestamp('us'), nullable=True),
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


def read_json_files_as_table(files, schema):
    tables = []
    for file in files:
        tables.append(pj.read_json(file, parse_options=ParseOptions(explicit_schema=schema)))
    table = pa.concat_tables(tables)
    return table


def process_files_and_append_to_parquet(writer, files, schema):
    table = read_json_files_as_table(files, schema)
    writer.write_table(table)


def process_in_chunks_and_write_to_parquet(directory, chunk_size, schema, output_file):
    files = [os.path.join(directory, f) for f in os.listdir(directory) if f.endswith('.json')]
    with pq.ParquetWriter(output_file, schema, compression='gzip') as writer:
        for i in range(0, len(files), chunk_size):
            print(f'processing chunk {i}')
            chunk_files = files[i:i + chunk_size]
            process_files_and_append_to_parquet(writer, chunk_files, schema)
            print(f'wrote chunk {i} to parquet')
        writer.close()
        print(f"Data from {len(files)} JSON files has been written to {output_file} with gzip compression.")


if __name__ == "__main__":
    input_directory = os.getenv('IN_PATH', './out')
    output_file = 'summary.parquet.gzip'
    process_in_chunks_and_write_to_parquet(input_directory, 100, schema, output_file)
