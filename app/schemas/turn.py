from pydantic import BaseModel

class TurnRequest(BaseModel):
    session_id: str
    turn_id: str
    scenario_id: str
    text: str | None = None
    audio_s3_key: str | None = None

class TurnResult(BaseModel):
    session_id: str
    turn_id: str
    transcript: str
    character_reply: str
    reply_audio_s3_key: str | None = None
