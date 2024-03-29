import asyncio
import json
import os
import time
from datetime import datetime, timezone
from langdetect import detect

import yaml
from telethon.sync import TelegramClient
from telethon.tl.functions.channels import JoinChannelRequest, GetParticipantRequest
from telethon.tl.types import MessageMediaPhoto, MessageMediaDocument, DocumentAttributeVideo, DocumentAttributeAudio

CONFIG_FILE = os.environ.get('CONFIG_FILE') or 'config.yaml'
CHANNELS_FILE = os.environ.get('CHANNELS_FILE') or 'channels.json'
OUT_PATH = os.environ.get('OUT_PATH') or './out'


def load_configuration(config_file):
    with open(config_file, 'r') as file:
        return yaml.safe_load(file)


def parse_dates(date_range):
    from_date = datetime.strptime(date_range['from_date'], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    to_date = datetime.strptime(date_range['to_date'], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return from_date, to_date


async def fetch_messages(client, channel_entity, from_date, to_date, limit=100):
    all_messages = []
    async for message in client.iter_messages(entity=channel_entity, limit=limit):
        if from_date <= message.date.astimezone(timezone.utc) <= to_date:
            all_messages.append(message)
        elif message.date < from_date:
            break
    return all_messages


async def generate_media_info(message):
    if isinstance(message.media, (MessageMediaPhoto, MessageMediaDocument)):
        media_attributes = message.media.document.attributes if isinstance(message.media, MessageMediaDocument) else []
        doc_attributes = {type(attr): attr for attr in media_attributes}
        media_type = "photo" if isinstance(message.media, MessageMediaPhoto) else "document"
        duration = doc_attributes.get(DocumentAttributeVideo, doc_attributes.get(DocumentAttributeAudio, None))
        media_duration = duration.duration if duration else None

        return {
            "media_id": str(message.media.photo.id if isinstance(message.media, MessageMediaPhoto) else message.media.document.id),
            "media_type": media_type,
            "media_duration": media_duration,
        }
    return {}


async def get_reactions_from_message(message):
    reactions = []
    if message.reactions is None or message.reactions.results is None:
        return reactions
    for reaction in message.reactions.results:
        reactions.append({"emoji": reaction.reaction.emoticon, "count": reaction.count})
    return reactions


async def generate_post(message, channel_title, segment):
    try:
        lang = detect(message.message)
    except:
        lang = ''
    return {
        "id": str(message.id - time.time()),
        "schema_version": 1,
        "channel_id": message.peer_id.channel_id if hasattr(message.peer_id, 'channel_id') else 0,
        "channel_title": channel_title,
        "telegram_post_id": message.id,
        "post_date": message.date.date().isoformat(),
        "post_ts": int(message.date.timestamp()),
        "updated_at": datetime.now().isoformat(),
        "lang": lang,
        "segment": segment,
        "full_text": message.message,
        "media": [await generate_media_info(message)],
        "comments": [],  # Placeholder
        "reactions": await get_reactions_from_message(message),
        "view_count": message.views if message.views is not None else 0,
    }


def write_json_file(data, filename):
    os.makedirs(OUT_PATH, exist_ok=True)
    filepath = os.path.join(OUT_PATH, f"{filename}.json")
    with open(filepath, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)
    print(f"Generated file: {filepath}")


async def process_channel(client, channel_username, segment, from_date, to_date):
    try:
        channel_entity = await client.get_entity(channel_username)
        if not await is_subscribed_on_channel(client, channel_entity):
            await client(JoinChannelRequest(channel_entity))

        messages = await fetch_messages(client, channel_entity, from_date, to_date)
        if len(messages) == 0:
            return
        
        chat = messages[0].chat
        channel_title = chat.title
        for message in messages:
            post = await generate_post(message, channel_title, segment)
            write_json_file(post, f'{chat.id}_{message.id}')            

    except ValueError:
        print(f"Skipping invalid channel username: {channel_username}")
    except Exception as e:
        print(f"An error occurred with channel {channel_username}: {e}")


async def is_subscribed_on_channel(client, channel_entity):
    participant = await client(GetParticipantRequest(
        channel=channel_entity,
        participant=(await client.get_me()).id
    ))
    return bool(participant)
    

async def main():
    config = load_configuration(CONFIG_FILE)
    client = TelegramClient('session_name', config['api_id'], config['api_hash'])
    await client.start(phone=config['phone_number'])

    channels_config = json.load(open(CHANNELS_FILE))
    from_date, to_date = parse_dates(config['date_range'])

    for segment, channels in channels_config['segments'].items():
        for channel_username in channels:
            await process_channel(client, channel_username, segment, from_date, to_date)
            await asyncio.sleep(1)

    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())