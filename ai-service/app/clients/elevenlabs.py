from elevenlabs import ElevenLabs
from app.core.config import ELEVENLABS_API_KEY,AUDIO_BUCKET_NAME
from app.workflow.state import ScenarioState
from app.clients.bedrock import s3_client

elevenlabs = ElevenLabs(
    api_key=ELEVENLABS_API_KEY
)

def convert_to_audio(text:str,state: ScenarioState):

    audio_chunks = elevenlabs.text_to_speech.convert(
        text=text,
        voice_id="JBFqnCBsd6RMkjVDRZzb",  
        model_id="eleven_v4",
        output_format="mp3_44100_128",
    )
    audio_bytes = b"".join(chunk for chunk in audio_chunks if chunk)

    reply_audio_s3_key = f"audio-request/{state["session_id"]}/{state["turn_id"]}.mp3"

    s3_client.put_object(
        Bucket=AUDIO_BUCKET_NAME,
        Key = reply_audio_s3_key,
        Body = audio_bytes,
        ContentType = "audio/mpeg"
    )

    return {
    "reply_audio_s3_key": reply_audio_s3_key,
    } 
    

