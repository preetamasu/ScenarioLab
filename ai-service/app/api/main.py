from fastapi import FastAPI, HTTPException
from langchain_core.messages import AIMessage, HumanMessage

from app.clients.dyanmodb import load_previous_turns, load_session, save_turn_result
from app.workflow.graph import graph
from app.schemas.turn import TurnRequest, TurnResult
from app.workflow.state import ScenarioState

app = FastAPI()


@app.post("/turn", response_model=TurnResult)
def turn_request(request: TurnRequest) -> TurnResult:
    if not request.audio_s3_key or not request.audio_s3_key.strip():
        raise HTTPException(status_code=422, detail="audio_s3_key is required.")

    session = load_session(request.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session["scenarioId"] != request.scenario_id:
        raise HTTPException(
            status_code=409,
            detail="Use a new session_id to start a different scenario.",
        )

    previous_turns = load_previous_turns(request.session_id, request.turn_number)
    messages = []
    for turn in previous_turns:
        if turn.get("transcript") and turn.get("characterReply"):
            messages.append(HumanMessage(content=turn["transcript"]))
            messages.append(AIMessage(content=turn["characterReply"]))

    state: ScenarioState = {
        "session_id": request.session_id,
        "turn_id": request.turn_id,
        "scenario_id": request.scenario_id,
        "scenario": {},
        "turn_number": request.turn_number - 1,
        "llm_calls_this_turn": 0,
        "messages": messages,
        "text": request.text,
        "audio_s3_key": request.audio_s3_key,
        "transcript": "",
        "character_reply": "",
        "generate_audio": True,
        "reply_audio_s3_key": None,
    }

    result = graph.invoke(state)
    save_turn_result(result)

    return TurnResult(
        session_id=result["session_id"],
        turn_id=result["turn_id"],
        transcript=result["transcript"],
        character_reply=result["character_reply"],
        reply_audio_s3_key=result["reply_audio_s3_key"],
    )
