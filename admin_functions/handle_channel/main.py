import functions_framework
from google.cloud import firestore
from google.oauth2 import id_token
from google.auth.transport import requests
import os

db = firestore.Client(database='backfill')

@functions_framework.http
def handle_channel(request):
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
    if request.method not in ['POST', 'PUT', 'DELETE']:
        return ('Method not allowed', 405)

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
        except ValueError as e:
                return (f"Invalid Authorization provided: caught ValueError {e}", 401)

    body = request.get_json(silent=True)
    if not body:
        return ("No data provided", 400)

    # Read channels from Firestore
    if request.method == 'POST':
        return create_channel(body)
    if request.method == 'PUT':
        return update_channel(body)
    elif request.method == "DELETE":
        return delete_channel(body)


def validate_channel(body):
    if not body.get("id"):
        return "Invalid body: missing id"
    if not body.get("lang"):
        return "Invalid body: missing lang"
    if not body.get("segment"):
        return "Invalid body: missing segment"
    return


def create_channel(body):
    error = validate_channel(body)
    if error:
        return (error, 400)
    
    new_channel_ref = db.collection('channels').document()
    new_channel_ref.set(body)

    return (f"Channel {new_channel_ref.id} created successfully", 201)
   
    
def update_channel(body):
    error = validate_channel(body)
    if error:
        return (error, 400)
    
    channel_id = body.get("id")
    query = db.collection('channels').where("id", "==", channel_id).limit(1)
    channel_docs = query.stream()
    
    for channel_doc in channel_docs:
        channel_doc.reference.update(body)
        return (f"Channel {channel_id} updated successfully", 200)
    
    return (f"Channel with id {channel_id} not found", 404)
    

def delete_channel(body):
    channel_id = body.get("id")
    if not channel_id:
        return ("Invalid body: missing id", 400)
    
    query = db.collection('channels').where("id", "==", channel_id).limit(1)
    channel_docs = query.stream()
    
    for channel_doc in channel_docs:
        channel_doc.reference.delete()
        return (f"Channel {channel_id} deleted successfully", 200)
    
    return (f"Channel with id {channel_id} not found", 404)
    