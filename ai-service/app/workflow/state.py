from typing import TypedDict,Annotated
from langgraph.graph import  add_messages
from langchain_core.messages import AnyMessage

class ScenarioState(TypedDict):
    session_id: str
    turn_id: str
    scenario_id: str
    scenario: dict
    turn_number : int
    llm_calls_this_turn: int
    messages: Annotated[list[AnyMessage], add_messages]

    text: str | None
    audio_s3_key: str | None
    transcript: str

    character_reply: str
    generate_audio: bool
    reply_audio_s3_key: str | None

  
