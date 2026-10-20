from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph,START,END
from langgraph.prebuilt import ToolNode, tools_condition
from app.workflow.state import ScenarioState
from app.workflow.tools import project_tools
from app.clients.deepgram import transcibe_audio
from pathlib import Path
from clients.bedrock import bedrock_client
from langchain_core.messages import SystemMessage,HumanMessage
from clients.elevenlabs import convert_to_audio
import json
import boto3



parent = Path(__file__).resolve().parent.parent

scenario_folder = parent/ "scenarios"


s3_client = boto3.client('s3')

llm_with_tools = bedrock_client.bind_tools(project_tools)
MAX_MODEL_CALLS_PER_TURN = 4

def load_scenario(state: ScenarioState)-> ScenarioState:
    for file in scenario_folder.iterdir():

        if file.is_file():
            with open(file,"r",encoding="utf-8") as f:
                contents = json.load(f)
            
            if(state["scenario_id"]==contents["id"]):
                state["scenario"] = contents
                break

    return state


def read_audio(audio_s3_key: str)-> bytes:
    response = s3_client.get_object(Bucket="scearniohub-ai",Key=audio_s3_key)
    content = response["Body"]

    try:
        return content.read()
    finally:
        content.close()


def transcribe_audio_node(state: ScenarioState) -> dict:
    audio_key = state["audio_s3_key"]

    audio_bytes = read_audio(audio_key)

    transcript = transcibe_audio(audio_bytes)

    return {
        "transcript": transcript,
        "llm_calls_this_turn": 0,
        "character_reply": "",
        "reply_audio_s3_key": None,
    }

def generate_reply(state: ScenarioState):

    scenario = state["scenario"]
    calls_this_turn = state.get("llm_calls_this_turn", 0)
    if calls_this_turn >= MAX_MODEL_CALLS_PER_TURN:
        raise RuntimeError("The model exceeded the tool-call limit for this turn.")


    character_name = scenario["character"]["name"]
    character_role = scenario["character"]["role"]
    character_personality = scenario["character"]["personality"]
    character_goal = scenario["character"]["goal"]
                                             
    system_msg =  f'''
    You are {character_name}, a {character_role}.

    Your personality:
    {character_personality}

    Your goal:
    {character_goal}

    The student is playing:
    {scenario["student_role"]}

    Situation:
    {scenario["student_brief"]}

    Use get_project_constraints before stating project deadlines, capacity,
    feature effort, or commitments. Use check_release_plan before saying a
    proposed release fits the available capacity. Tool results are the source
    of truth; do not invent constraints or feature names.
    After receiving tool results, either call another tool if needed or give
    your final response to the student. Keep tool names out of spoken replies.
    Stay in character and follow the scenario's facts.
    Respond directly to the student's latest message.
    Keep your replies concise.
    Follow the supplied scenario facts. 
    Do not invent feature priorities or additional business constraints. 
    If a detail is unspecified, acknowledge that it hasn’t been decided.
    '''.strip()

    system_message = SystemMessage(content=system_msg)
    new_messages = []
    if calls_this_turn == 0:
        new_messages.append(HumanMessage(content=state["transcript"]))

    model_input = [system_message] + state["messages"] + new_messages
    response = llm_with_tools.invoke(model_input)
    updates = {
        "messages": new_messages + [response],
        "llm_calls_this_turn": calls_this_turn + 1,
    }

    # A tool request can have no text. Wait for the final answer before speech.
    if response.tool_calls:
        return updates

    if isinstance(response.content, str):
        reply_text = response.content
    else:
        reply_text = "\n".join(
            block["text"]
            for block in response.content
            if isinstance(block, dict) and "text" in block
        )

    if not reply_text.strip():
        raise RuntimeError("Bedrock returned no reply text.")

    updates["character_reply"] = reply_text
    updates["turn_number"] = state["turn_number"] + 1
    return updates


def generate_speech(state: ScenarioState):
    reply = state["character_reply"]

    reply_audio_key = convert_to_audio(reply,state)

    state["reply_audio_s3_key"] = reply_audio_key["reply_audio_s3_key"]
    return state





builder = StateGraph(ScenarioState)

builder.add_node("load_scenario",load_scenario)
builder.add_node("generate_speech",generate_speech)
builder.add_node("transcribe_audio",transcribe_audio_node)
builder.add_node("generate_reply",generate_reply)
builder.add_node("tools", ToolNode(project_tools))

builder.add_edge(START, "load_scenario")
builder.add_edge("load_scenario", "transcribe_audio")
builder.add_edge("transcribe_audio", "generate_reply")
builder.add_conditional_edges(
    "generate_reply",
    tools_condition,
    {"tools": "tools", END: "generate_speech"},
)
builder.add_edge("tools", "generate_reply")
builder.add_edge("generate_speech", END)

graph = builder.compile()


