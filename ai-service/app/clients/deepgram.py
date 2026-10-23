from deepgram import DeepgramClient
from dotenv import load_dotenv
from app.core.config import DEEPGRAM_API_KEY
from pathlib import Path

client = DeepgramClient(api_key=DEEPGRAM_API_KEY)

parent = Path(__file__).resolve().parent.parent

audio_dir = parent/"audios"

audio_dir.mkdir(parents=True,exist_ok=True)

def transcibe_audio(audio_bytes: bytes)-> str:

    
    response = client.listen.v1.media.transcribe_file(
    request=audio_bytes,
    model="nova-3",
    smart_format=True)

    transcript = response.results.channels[0].alternatives[0].transcript

    return transcript
