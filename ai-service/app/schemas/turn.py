from pydantic import BaseModel, Field

class TurnRequest(BaseModel):
    session_id: str
    turn_id: str
    scenario_id: str
    turn_number: int = Field(gt=0)
    text: str | None = None
    audio_s3_key: str | None = None

class TurnResult(BaseModel):
    session_id: str
    turn_id: str
    transcript: str
    character_reply: str
    reply_audio_s3_key: str | None = None
