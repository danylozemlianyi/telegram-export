import functions_framework
from google.cloud import firestore
from google.oauth2 import id_token
from google.auth.transport import requests
import os

db = firestore.Client(database='backfill')

@functions_framework.http
def read_channels(request):
    # Set CORS headers for the preflight request
    if request.method == "OPTIONS":
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }

        return ("", 204, headers)

    # Verify Firebase ID Token
    if 'Authorization' not in request.headers:
        return ("Missing Authorization header!", 401)
    if os.getenv('ENV') == 'production': 
        auth_header = request.headers['Authorization']
        token = auth_header.split(' ').pop()
        try:
            decoded_token = id_token.verify_oauth2_token(token, requests.Request())
            if not decoded_token:
                return ("Invalid Authorization provided: could not decode token", 401)
        except ValueError:
                return ("Invalid Authorization provided: caught ValueError", 401)

    # Read channels from Firestore

    channels = []
    doc_ref = db.collection('channels').stream()
    for channel in doc_ref:
        channels.append(channel.to_dict())

    return channels
