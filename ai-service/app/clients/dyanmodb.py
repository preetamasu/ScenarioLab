import boto3
from boto3.dynamodb.conditions import Key


dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
turns_table = dynamodb.Table("ConversationTurns")


def load_previous_turns(session_id: str, current_turn_number: int) -> list[dict]:
    query = {
        "KeyConditionExpression": Key("sessionId").eq(session_id)
        & Key("turnNumber").lt(current_turn_number),
        "ScanIndexForward": True,
        "ConsistentRead": True,
    }
    turns = []

    while True:
        response = turns_table.query(**query)
        turns.extend(response.get("Items", []))

        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            return turns

        query["ExclusiveStartKey"] = last_key



def load_session(session_id: str) -> dict | None:
    table = dynamodb.Table("LearningSessions")
    response = table.get_item(Key={"sessionId": session_id}, ConsistentRead=True)
    return response.get("Item")


def save_turn_result(result: dict) -> None:
    turns_table.update_item(
        Key={
            "sessionId": result["session_id"],
            "turnNumber": result["turn_number"],
        },
        UpdateExpression=(
            "SET transcript = :transcript, characterReply = :reply, "
            "replyAudioS3Key = :audio"
        ),
        ConditionExpression="turnId = :turn_id",
        ExpressionAttributeValues={
            ":transcript": result["transcript"],
            ":reply": result["character_reply"],
            ":audio": result["reply_audio_s3_key"],
            ":turn_id": result["turn_id"],
        },
    )
