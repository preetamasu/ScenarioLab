from copy import deepcopy

from fastapi import FastAPI, HTTPException

from app.workflow.graph import graph
from app.schemas.turn import TurnRequest, TurnResult
from app.workflow.state import ScenarioState

app = FastAPI()

# Local MVP storage: cleared when this process restarts.
sessions: dict[str, ScenarioState] = {}


@app.post("/turn", response_model=TurnResult)
def turn_request(request: TurnRequest) -> TurnResult:
    if not request.audio_s3_key or not request.audio_s3_key.strip():
        raise HTTPException(status_code=422, detail="audio_s3_key is required.")

    previous_state = sessions.get(request.session_id)

    if previous_state is not None:
        if previous_state["scenario_id"] != request.scenario_id:
            raise HTTPException(
                status_code=409,
                detail="Use a new session_id to start a different scenario.",
            )
        state = deepcopy(previous_state)
    else:
        state: ScenarioState = {
            "session_id": request.session_id,
            "turn_id": request.turn_id,
            "scenario_id": request.scenario_id,
            "scenario": {},
            "turn_number": 0,
            "llm_calls_this_turn": 0,
            "messages": [],
            "text": None,
            "audio_s3_key": None,
            "transcript": "",
            "character_reply": "",
            "generate_audio": True,
            "reply_audio_s3_key": None,
        }

    state["turn_id"] = request.turn_id
    state["audio_s3_key"] = request.audio_s3_key
    state["text"] = request.text

    result = graph.invoke(state)

    response = TurnResult(
        session_id=result["session_id"],
        turn_id=result["turn_id"],
        transcript=result["transcript"],
        character_reply=result["character_reply"],
        reply_audio_s3_key=result["reply_audio_s3_key"],
    )
    sessions[request.session_id] = result
    return response
