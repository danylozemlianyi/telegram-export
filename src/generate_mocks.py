import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from random import choice, randint


def generate_uuid():
    return str(uuid.uuid4())


def generate_date_range(start_date, end_date) -> list[datetime]:
    start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    date_generated = [start + timedelta(days=x) for x in range(0, (end - start).days + 1)]
    return date_generated


def date_to_timestamp(date):
    if choice([True, False]):
        # 12 AM
        selected_datetime = datetime(year=date.year, month=date.month, day=date.day, hour=0,
                                     minute=0, second=0, tzinfo=timezone.utc)
    else:
        # 12 PM
        selected_datetime = datetime(year=date.year, month=date.month, day=date.day, hour=12,
                                     minute=0, second=0, tzinfo=timezone.utc)

    # Convert to timestamp
    timestamp = round(selected_datetime.timestamp())
    return timestamp


def generate_timestamp():
    return datetime.now().isoformat()


def generate_media():
    media_type = choice(["image", "video", "audio"])
    media = {
        "media_id": generate_uuid(),
        "media_type": media_type,
    }
    if media_type in ["video", "audio"]:
        media["media_duration"] = str(randint(10, 300))
    else:
        media["media_duration"] = None
    return media


def generate_reaction():
    return {
        "emoji": choice(["😀", "😂", "❤️", "😢", "👍", "👎"]),
        "count": randint(1, 100),
    }


def generate_comment():
    return {
        "telegram_message_id": randint(10000, 99999),
        "sender_id": randint(1000, 9999),
        "sender_username": None if choice([True, False]) else "user" + str(randint(1, 100)),
        "sender_first_name": "FirstName" + str(randint(1, 100)),
        "sender_last_name": None if choice([True, False]) else "LastName" + str(randint(1, 100)),
        "reply_to": randint(10000, 99999) if choice([True, False]) else None,
        "full_text": "This is a sample comment text.",
        "reactions": [generate_reaction() for _ in range(randint(1, 10))],
        "media": [generate_media() for _ in range(randint(0, 2))],
    }


def generate_post(date_range: list[datetime]):
    full_text = choice(["This is a sample post text.", "Пример текста.", "Приклад тексту."])
    if "This" in full_text:
        lang = "en"
    elif "Пример" in full_text:
        lang = "ru"
    else:
        lang = "ua"

    post_date = choice(date_range)
    post_ts = date_to_timestamp(post_date)
    post = {
        "id": generate_uuid(),
        "schema_version": 1,
        "channel_id": randint(100, 999),
        "channel_title": "ChannelName" + str(randint(1, 100)),
        "telegram_post_id": randint(100000, 999999),
        "post_date": post_date.strftime('%Y-%m-%d'),
        "post_ts": post_ts,
        "updated_at": generate_timestamp(),
        "lang": lang,
        "segment": choice(["ukr", "katsap", "western"]),
        "full_text": full_text,
        "media": [generate_media() for _ in range(randint(1, 3))],
        "comments": [generate_comment() for _ in range(randint(200, 1000))],
        "reactions": [generate_reaction() for _ in range(randint(1, 3))],
        "view_count": randint(1, 10000),
    }
    return post


def write_json_file(data):
    dirname = os.getenv('OUT_PATH', './out')
    try:
        os.makedirs(dirname)
    except OSError:
        print('outdir already exists, skipping...')
    filename = os.path.join(dirname, generate_uuid() + ".json")
    with open(filename, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=0)
    print(f"Generated file: {filename}")


def main():
    count = int(os.getenv("COUNT", 1))  # Default to generating 1 file if COUNT is not set
    date_range = generate_date_range("2023-01-01", "2023-01-31")
    for _ in range(count):
        mock_post = generate_post(date_range)
        write_json_file(mock_post)


if __name__ == "__main__":
    main()
