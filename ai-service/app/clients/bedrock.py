from langchain_aws import ChatBedrockConverse
from app.core.config import AWS_REGION,BEDROCK_MODEL_ID
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph,START,END,add_messages
import boto3
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode,tools_condition
from langgraph.checkpoint.memory import MemorySaver


s3_client = boto3.client('s3')


bedrock_client = ChatBedrockConverse(
    model=BEDROCK_MODEL_ID,
    region_name=AWS_REGION,
    temperature=0.0,
    max_tokens=None
)

