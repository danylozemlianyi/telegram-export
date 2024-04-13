import asyncio
import json
import os
import time
import base64
import functions_framework
from datetime import datetime, timedelta, timezone
from langdetect import detect

from telethon.sessions import StringSession
from telethon.sync import TelegramClient
from telethon.tl.functions.channels import JoinChannelRequest, GetParticipantRequest
from telethon.tl.types import MessageMediaPhoto, MessageMediaDocument, DocumentAttributeVideo, DocumentAttributeAudio
from telethon.tl.types import User
from google.cloud import secretmanager, bigquery, firestore
from cloudevents.http import CloudEvent

SERVICE_ACCOUNT_PATH = os.environ.get("SERVICE_ACCOUNT_PATH")
GOOGLE_COULD_PROJECT = os.environ.get("PROJECT_ID")
DATABASE_BACKFILL = "backfill"
COLLECTION_CHANNELS = "channels"
COLLECTION_BACKFILL = "backfill"

class SecretsManager:
    CHANNELS = "CHANNELS"
    TELEGRAM_API_HASH = 'TELEGRAM_API_HASH'
    TELEGRAM_API_ID = 'TELEGRAM_API_ID'
    TELEGRAM_PHONE_NUMBER = 'TELEGRAM_PHONE_NUMBER'
    TELEGRAM_SESSION = 'telegram-session'
    TABLE_ID = 'TABLE_ID'

    def __init__(self, project_id):
        self.project_id = project_id
        self.secrets_names = [self.TELEGRAM_API_HASH, self.TELEGRAM_API_ID,
                              self.TELEGRAM_PHONE_NUMBER, self.TELEGRAM_SESSION,
                              self.TABLE_ID]
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

    def get_table_id(self):
        return self.secrets_data[self.TABLE_ID]
    
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
    async for message in client.iter_messages(entity=channel_entity, limit=limit, reply_to=reply_to):
        if from_date <= message.date.astimezone(timezone.utc) <= to_date:
            all_posts.append(message)
            if message.replies and message.replies.comments:
                try:
                    post_to_comments[message.id], _ = await fetch_posts(
                        client, channel_entity, from_date, to_date, limit, reply_to=message.id)
                except:
                    pass
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

        return [{
            "media_id": str(message.media.photo.id if isinstance(message.media, MessageMediaPhoto) else message.media.document.id),
            "media_type": media_type,
            "media_duration": media_duration,
        }]
    return []


async def get_reactions_from_message(message):
    reactions = []
    if message.reactions is None or message.reactions.results is None:
        return reactions
    for reaction in message.reactions.results:
        if hasattr(reaction.reaction, "emoticon"):
            reactions.append({"emoji": reaction.reaction.emoticon, "count": reaction.count})
    return reactions


async def generate_comments(message, comments):
    schema_comments = []
    for comment in comments:
        if not comment.from_id:
            continue
        first_name = comment.sender.first_name if isinstance(comment.sender, User) else comment.sender.title
        if not first_name: # deleted account
            continue
        schema_comments.append({
            "telegram_message_id": message.id,
            "sender_id": comment.sender.id,
            "sender_username": comment.sender.username,
            "sender_first_name": first_name,
            "sender_last_name": comment.sender.last_name if isinstance(comment.sender, User) else None,
            "reply_to": comment.reply_to.reply_to_msg_id if comment.reply_to else None,
            "full_text": comment.message,
            "media": await generate_media_info(comment),
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
        "media": await generate_media_info(message),
        "comments": await generate_comments(message, comments) if comments else [],
        "reactions": await get_reactions_from_message(message),
        "view_count": message.views if message.views is not None else 0,
    }


def write_bigquery(bq_client: bigquery.Client, secrets: SecretsManager, data):
    insert = bq_client.insert_rows_json(secrets.get_table_id(), data)
    for i, result in enumerate(insert):
        for j, error in enumerate(result.get("errors")):
            print(f'{i}.{j}, {error}')
            return


async def process_channel(client, channel_username, segment, from_date, to_date):
    posts = []
    try:
        channel_entity = await client.get_entity(channel_username)
        if not await is_subscribed_on_channel(client, channel_entity):
            await client(JoinChannelRequest(channel_entity))

        messages, comments = await fetch_posts(client, channel_entity, from_date, to_date)
        if len(messages) == 0:
            return posts
        
        chat = messages[0].chat
        channel_title = chat.title
        for message in messages:
            posts.append(await generate_post(message, comments.get(message.id), channel_title, segment))

    except ValueError:
        print(f"Skipping invalid channel username: {channel_username}")
    except Exception as e:
        print(f"An error occurred with channel {channel_username}: {e}")
    
    return posts


async def is_subscribed_on_channel(client, channel_entity):
    try:
        participant = await client(GetParticipantRequest(
            channel=channel_entity,
            participant=(await client.get_me()).id
        ))
    except:
        participant = False
    return bool(participant)
    

async def get_channels_posts(from_date, to_date, channels_config):
    secrets = SecretsManager(GOOGLE_COULD_PROJECT)
    client = TelegramClient(StringSession(secrets.get_session()), secrets.get_api_id(), secrets.get_api_hash())
    bq_client = bigquery.Client(project=GOOGLE_COULD_PROJECT)
    
    await client.start(phone=secrets.get_api_phone_number())
    
    posts = []
    for channel in channels_config:
        posts.extend(await process_channel(client, channel.get("id"), channel.get("segment"), from_date, to_date))
        await asyncio.sleep(1)

    await client.disconnect()
    if len(posts) > 0:
        write_bigquery(bq_client, secrets, posts)


def handle_backfill(db: firestore.Client, payload: dict, channels, job_id):
    from_date, to_date = parse_dates(payload)
    job_id = job_id if job_id else payload.get("job_id", "1")
    backfill_ref = db.collection(COLLECTION_BACKFILL)
    query = backfill_ref.limit(1)

    last_processed_item = {
        "job_id": job_id, 
        "last_date_processed": from_date.strftime("%Y-%m-%d"), 
        "updated_at": datetime.now()
    }

    item = None
    for item in query.stream():
        last_processed_item = item.to_dict()
        break

    if last_processed_item.get("last_date_processed") != payload.get("to_date"):
        from_date = datetime.strptime(last_processed_item["last_date_processed"], "%Y-%m-%d") \
            .replace(tzinfo=timezone.utc) + timedelta(days=1)
        to_date = from_date + timedelta(days=1)
        last_processed_item["last_date_processed"] = from_date.strftime("%Y-%m-%d")
        asyncio.run(get_channels_posts(from_date, to_date, channels))
        if item:
            backfill_ref.document(item.id).set(last_processed_item)
        else:
            backfill_ref.add(last_processed_item)  
    else:
        print("No dates left for backfill. Backfill is not required or all available dates have already been processed")


def get_channels(db):
    channels = []
    for channel in db.collection(COLLECTION_CHANNELS).stream():
        channels.append(channel)
    return channels


@functions_framework.cloud_event
def subscribe(cloud_event: CloudEvent) -> None:
    try:
        db = firestore.Client(database=DATABASE_BACKFILL)
        channels = get_channels(db)
        if len(channels) == 0:
            print("No channels to handle")
            return
        
        payload = json.loads((base64.b64decode(cloud_event.data["message"]["data"])).decode())
        backfill = payload.get("backfill")
        if backfill is not None and backfill:
            handle_backfill(db, payload, channels, cloud_event.get("id"))
        else:
            to_date = datetime.now().replace(tzinfo=timezone.utc)
            from_date = to_date - timedelta(hours=6)
            asyncio.run(get_channels_posts(from_date, to_date, channels))

    except Exception as e:
        print(f"Could not handle incoming message {e}")