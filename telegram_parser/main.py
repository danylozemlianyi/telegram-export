import asyncio
import json
import os
import time
import base64
import functions_framework
from datetime import datetime, timezone
from langdetect import detect

from telethon.sessions import StringSession
from telethon.sync import TelegramClient
from telethon.tl.functions.channels import JoinChannelRequest, GetParticipantRequest
from telethon.tl.types import MessageMediaPhoto, MessageMediaDocument, DocumentAttributeVideo, DocumentAttributeAudio
from telethon.tl.types import PeerChannel, User
from google.cloud import secretmanager
from cloudevents.http import CloudEvent


CHANNELS_FILE = os.environ.get('CHANNELS_FILE') or 'channels.json'
OUT_PATH = os.environ.get('OUT_PATH') or './out'
SERVICE_ACCOUNT_PATH = os.environ.get("SERVICE_ACCOUNT_PATH")
GOOGLE_COULD_PROJECT = os.environ.get("PROJECT_ID")

class SecretsManager:
    TELEGRAM_API_HASH = 'TELEGRAM_API_HASH'
    TELEGRAM_API_ID = 'TELEGRAM_API_ID'
    TELEGRAM_PHONE_NUMBER = 'TELEGRAM_PHONE_NUMBER'
    TELEGRAM_SESSION = 'telegram-session'

    def __init__(self, project_id):
        self.project_id = project_id
        self.secrets_names = [self.TELEGRAM_API_HASH, self.TELEGRAM_API_ID,
                              self.TELEGRAM_PHONE_NUMBER, self.TELEGRAM_SESSION]
        self.secrets_data = {}
        self.load_secrets()

    def get_api_hash(self):
        return self.secrets_data[self.TELEGRAM_API_HASH]

    def get_api_id(self):
        return self.secrets_data[self.TELEGRAM_API_ID]

    def get_api_phone_number(self):
        return self.secrets_data[self.TELEGRAM_PHONE_NUMBER]

    def get_session(self):
        return self.secrets_data[self.TELEGRAM_SESSION]

    def load_secrets(self):
        client = secretmanager.SecretManagerServiceClient()
        if SERVICE_ACCOUNT_PATH:
            client = client.from_service_account_json(SERVICE_ACCOUNT_PATH)
        for secret_name in self.secrets_names:
            name = f'projects/{self.project_id}/secrets/{secret_name}/versions/latest'
            response = client.access_secret_version(name=name)
            secret_value = response.payload.data.decode("UTF-8")
            self.secrets_data[secret_name] = secret_value


def parse_dates(date_range):
    from_date = datetime.strptime(date_range['from_date'], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    to_date = datetime.strptime(date_range['to_date'], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return from_date, to_date


async def fetch_posts(client, channel_entity, from_date, to_date, limit=100, reply_to=None):
    all_posts = []
    post_to_comments = {}
    skip_comments = False
    async for message in client.iter_messages(entity=channel_entity, limit=limit, reply_to=reply_to):
        if from_date <= message.date.astimezone(timezone.utc) <= to_date:
            all_posts.append(message)
            if message.post and not skip_comments:
                try:
                    post_to_comments[message.id], _ = await fetch_posts(
                        client, channel_entity, from_date, to_date, limit, reply_to=message.id)
                except Exception:
                    skip_comments = True
        elif message.date < from_date:
            break
    return all_posts, post_to_comments


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


async def generate_comments(message, comments):
    schema_comments = []
    for comment in comments:
        schema_comments.append({
            "telegram_message_id": message.id,
            "sender_id": comment.sender.id,
            "sender_username": comment.sender.username,
            "sender_first_name": comment.sender.first_name if isinstance(comment.sender, User) else comment.sender.title,
            "sender_last_name": comment.sender.last_name if isinstance(comment.sender, User) else None,
            "reply_to": comment.reply_to.reply_to_msg_id if comment.reply_to else None,
            "full_text": comment.message,
            "media": [await generate_media_info(comment)],
            "reactions": await get_reactions_from_message(comment),
        })
    return schema_comments


async def generate_post(message, comments, channel_title, segment):
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
        "comments": await generate_comments(message, comments) if comments else [],
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

        messages, comments = await fetch_posts(client, channel_entity, from_date, to_date)
        if len(messages) == 0:
            return
        
        chat = messages[0].chat
        channel_title = chat.title
        for message in messages:
            post = await generate_post(message, comments.get(message.id), channel_title, segment)
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
    

async def get_channels_posts(from_date, to_date):
    secrets = SecretsManager(GOOGLE_COULD_PROJECT)
    client = TelegramClient(StringSession(secrets.get_session()), secrets.get_api_id(), secrets.get_api_hash())
    await client.start(phone=secrets.get_api_phone_number())
    channels_config = json.load(open(CHANNELS_FILE))

    for segment, channels in channels_config['segments'].items():
        for channel_username in channels:
            await process_channel(client, channel_username, segment, from_date, to_date)
            await asyncio.sleep(1)

    await client.disconnect()


@functions_framework.cloud_event
def subscribe(cloud_event: CloudEvent) -> None:
    try:
        date_range = json.loads(base64.b64decode(cloud_event.data["message"]["data"]).decode())
        from_date, to_date = parse_dates(date_range)
        asyncio.run(get_channels_posts(from_date, to_date))
    except Exception as e:
        print("Could not handle incoming message" + e)