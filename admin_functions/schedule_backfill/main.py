import functions_framework
from google.oauth2 import id_token
from google.auth.transport import requests
from google.cloud import scheduler_v1
from google.cloud.scheduler_v1.types import PubsubTarget, Job
import os
from datetime import datetime
import base64
import json


@functions_framework.http
def create_start_backfill_schedule(request):
    # Set CORS headers for the preflight request
    if request.method == 'OPTIONS':
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600',
        }

        return ('', 204, headers)
    if request.method != 'POST':
        return ('Method not allowed', 405)


    # Verify Firebase ID Token
    if 'Authorization' not in request.headers:
        return ('Missing Authorization header!', 401)
    if os.getenv('ENV') == 'production': 
        auth_header = request.headers['Authorization']
        token = auth_header.split(' ').pop()
        try:
            decoded_token = id_token.verify_oauth2_token(token, requests.Request())
            if not decoded_token:
                return ('Invalid Authorization provided: could not decode token', 401)
        except ValueError:
                return ('Invalid Authorization provided: caught ValueError', 401)

    body = request.get_json(silent=True)
    trigger_date = body['trigger_date']

    trigger_day = None
    try:
        trigger_day = datetime.fromisoformat(trigger_date).day
    except ValueError:
        return ('Invalid trigger_date provided!', 400)

    job_details = body['job_details']
    from_date, to_date = job_details['from_date'], job_details['to_date']

    try:
        from_date, to_date = datetime.fromisoformat(from_date), datetime.fromisoformat(to_date)
    except ValueError:
        return ('Invalid from_date or to_date provided!', 400)

    scheduler_client = scheduler_v1.CloudSchedulerClient()
    if not from_date or not to_date:
        return ('Invalid input params!', 400)

    job_details['backfill'] = True
    details_bytes = json.dumps(job_details).encode('utf-8')
    details_bytes = base64.b64encode(details_bytes).decode('utf-8')
    target = PubsubTarget(topic_name=f'projects/{os.getenv('PROJECT_ID')}/topics/{os.getenv('EXPORT_TOPIC_ID')}', data=details_bytes)
    job = Job(description=f'backfill job {from_date}:{to_date}', pubsub_target=target, time_zone='Europe/Warsaw', schedule=f'*/1 * {trigger_day} {datetime.now().month} *')
    request = scheduler_v1.CreateJobRequest(parent=f'projects/{os.getenv('PROJECT_ID')}/locations/{os.getenv('SCHEDULE_LOCATION_ID')}', job=job)
    job = scheduler_client.create_job(request=request)

    return (f'Job {job.name} created!', 200)
