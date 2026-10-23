import json
from app.api.main import turn_request
from app.schemas.turn import TurnRequest


def handler(event, context):

    for record in event["Records"]:
        body = record["body"]
        payload = json.loads(body)
        request = TurnRequest(**payload)

        turn_request(request)