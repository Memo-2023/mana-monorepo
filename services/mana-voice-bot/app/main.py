"""
Mana Voice Bot - German Voice Assistant

Complete voice-to-voice pipeline:
1. STT: Whisper (mana-stt) - Speech to Text
2. LLM: Ollama (Gemma/Qwen) - Text Processing
3. TTS: Edge TTS - Text to Speech

Optimized for German language.
"""

import asyncio
import logging
import os
import tempfile
import time
from contextlib import asynccontextmanager
from typing import Optional

import aiohttp
import edge_tts
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Configuration
PORT = int(os.getenv("PORT", "3050"))
STT_URL = os.getenv("STT_URL", "http://localhost:3020")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gemma3:4b")
DEFAULT_VOICE = os.getenv("DEFAULT_VOICE", "de-DE-ConradNeural")
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", """Du bist ein freundlicher und hilfreicher deutscher Sprachassistent.
Antworte immer auf Deutsch, kurz und prägnant.
Halte deine Antworten unter 3 Sätzen, es sei denn, der Nutzer fragt nach mehr Details.""")

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://mana.how,http://localhost:5173,http://localhost:3000",
).split(",")

# German Edge TTS voices
GERMAN_VOICES = {
    "de-DE-ConradNeural": "Male - Conrad (Professional)",
    "de-DE-KatjaNeural": "Female - Katja (Natural)",
    "de-DE-AmalaNeural": "Female - Amala (Friendly)",
    "de-DE-BerndNeural": "Male - Bernd (Calm)",
    "de-DE-ChristophNeural": "Male - Christoph (News)",
    "de-DE-ElkeNeural": "Female - Elke (Warm)",
    "de-DE-KillianNeural": "Male - Killian (Casual)",
    "de-DE-KlarissaNeural": "Female - Klarissa (Cheerful)",
    "de-DE-KlausNeural": "Male - Klaus (Storyteller)",
    "de-DE-LouisaNeural": "Female - Louisa (Assistant)",
    "de-DE-TanjaNeural": "Female - Tanja (Business)",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info(f"Starting Mana Voice Bot on port {PORT}")
    logger.info(f"STT Service: {STT_URL}")
    logger.info(f"Ollama: {OLLAMA_URL}")
    logger.info(f"Default Model: {DEFAULT_MODEL}")
    logger.info(f"Default Voice: {DEFAULT_VOICE}")
    yield
    logger.info("Shutting down Mana Voice Bot")


app = FastAPI(
    title="Mana Voice Bot",
    description="German voice-to-voice assistant using Whisper + Ollama + Edge TTS",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Models
# ============================================================================


class ChatRequest(BaseModel):
    """Text chat request."""
    message: str = Field(..., description="User message")
    model: str = Field(DEFAULT_MODEL, description="Ollama model to use")
    voice: str = Field(DEFAULT_VOICE, description="TTS voice")
    system_prompt: Optional[str] = Field(None, description="Custom system prompt")


class TranscribeResponse(BaseModel):
    """Transcription response."""
    text: str
    language: str
    duration: float


class ChatResponse(BaseModel):
    """Chat response with text."""
    user_text: str
    assistant_text: str
    model: str
    processing_time: float


class VoiceResponse(BaseModel):
    """Voice processing response metadata."""
    user_text: str
    assistant_text: str
    model: str
    voice: str
    stt_time: float
    llm_time: float
    tts_time: float
    total_time: float


# ============================================================================
# Service Functions
# ============================================================================


async def transcribe_audio(audio_bytes: bytes, language: str = "de") -> dict:
    """Transcribe audio using mana-stt (Whisper)."""
    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        data.add_field("file", audio_bytes, filename="audio.wav", content_type="audio/wav")
        data.add_field("language", language)

        async with session.post(f"{STT_URL}/transcribe", data=data) as response:
            if response.status != 200:
                error = await response.text()
                raise HTTPException(status_code=500, detail=f"STT error: {error}")
            return await response.json()


async def chat_with_ollama(
    message: str,
    model: str = DEFAULT_MODEL,
    system_prompt: str = SYSTEM_PROMPT,
) -> str:
    """Send message to Ollama and get response."""
    async with aiohttp.ClientSession() as session:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "stream": False,
        }

        async with session.post(
            f"{OLLAMA_URL}/api/chat",
            json=payload,
            timeout=aiohttp.ClientTimeout(total=120),
        ) as response:
            if response.status != 200:
                error = await response.text()
                raise HTTPException(status_code=500, detail=f"Ollama error: {error}")

            result = await response.json()
            return result.get("message", {}).get("content", "")


async def synthesize_speech(text: str, voice: str = DEFAULT_VOICE) -> bytes:
    """Synthesize speech using Edge TTS."""
    if voice not in GERMAN_VOICES:
        voice = DEFAULT_VOICE

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        output_path = f.name

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)

        with open(output_path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(output_path):
            os.unlink(output_path)


# ============================================================================
# Endpoints
# ============================================================================


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    # Check STT service
    stt_ok = False
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{STT_URL}/health", timeout=aiohttp.ClientTimeout(total=5)) as r:
                stt_ok = r.status == 200
    except Exception:
        pass

    # Check Ollama
    ollama_ok = False
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{OLLAMA_URL}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as r:
                ollama_ok = r.status == 200
    except Exception:
        pass

    return {
        "status": "healthy" if (stt_ok and ollama_ok) else "degraded",
        "services": {
            "stt": "ok" if stt_ok else "unavailable",
            "ollama": "ok" if ollama_ok else "unavailable",
            "tts": "ok",  # Edge TTS is always available (cloud API)
        },
        "config": {
            "default_model": DEFAULT_MODEL,
            "default_voice": DEFAULT_VOICE,
        },
    }


@app.get("/voices")
async def list_voices():
    """List available German voices."""
    return {
        "voices": GERMAN_VOICES,
        "default": DEFAULT_VOICE,
    }


@app.get("/models")
async def list_models():
    """List available Ollama models."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{OLLAMA_URL}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    models = [m["name"] for m in data.get("models", [])]
                    return {"models": models, "default": DEFAULT_MODEL}
    except Exception as e:
        logger.error(f"Failed to get models: {e}")

    return {"models": [], "default": DEFAULT_MODEL, "error": "Could not fetch models"}


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    language: str = Form("de", description="Language code"),
):
    """Transcribe audio to text using Whisper."""
    start = time.time()

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    result = await transcribe_audio(audio_bytes, language)

    return TranscribeResponse(
        text=result.get("text", ""),
        language=result.get("language", language),
        duration=time.time() - start,
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Text chat with the LLM."""
    start = time.time()

    response_text = await chat_with_ollama(
        message=request.message,
        model=request.model,
        system_prompt=request.system_prompt or SYSTEM_PROMPT,
    )

    return ChatResponse(
        user_text=request.message,
        assistant_text=response_text,
        model=request.model,
        processing_time=time.time() - start,
    )


@app.post("/chat/audio")
async def chat_audio(request: ChatRequest):
    """Text chat with audio response."""
    start = time.time()

    # Get LLM response
    llm_start = time.time()
    response_text = await chat_with_ollama(
        message=request.message,
        model=request.model,
        system_prompt=request.system_prompt or SYSTEM_PROMPT,
    )
    llm_time = time.time() - llm_start

    # Synthesize speech
    tts_start = time.time()
    audio_bytes = await synthesize_speech(response_text, request.voice)
    tts_time = time.time() - tts_start

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "X-User-Text": request.message[:100],
            "X-Assistant-Text": response_text[:200],
            "X-Model": request.model,
            "X-Voice": request.voice,
            "X-LLM-Time": str(round(llm_time, 2)),
            "X-TTS-Time": str(round(tts_time, 2)),
            "X-Total-Time": str(round(time.time() - start, 2)),
        },
    )


@app.post("/voice")
async def voice_to_voice(
    audio: UploadFile = File(..., description="Audio input"),
    model: str = Form(DEFAULT_MODEL, description="Ollama model"),
    voice: str = Form(DEFAULT_VOICE, description="TTS voice"),
    language: str = Form("de", description="Input language"),
    system_prompt: Optional[str] = Form(None, description="Custom system prompt"),
):
    """
    Complete voice-to-voice pipeline.

    1. Transcribe audio input (Whisper)
    2. Process with LLM (Ollama)
    3. Synthesize response (Edge TTS)

    Returns audio response with metadata headers.
    """
    total_start = time.time()

    # Read audio
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    # 1. Speech-to-Text
    stt_start = time.time()
    try:
        stt_result = await transcribe_audio(audio_bytes, language)
        user_text = stt_result.get("text", "").strip()
    except Exception as e:
        logger.error(f"STT failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    stt_time = time.time() - stt_start

    if not user_text:
        raise HTTPException(status_code=400, detail="Could not transcribe audio - no speech detected")

    logger.info(f"Transcribed: {user_text}")

    # 2. LLM Processing
    llm_start = time.time()
    try:
        assistant_text = await chat_with_ollama(
            message=user_text,
            model=model,
            system_prompt=system_prompt or SYSTEM_PROMPT,
        )
    except Exception as e:
        logger.error(f"LLM failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {e}")
    llm_time = time.time() - llm_start

    logger.info(f"LLM response: {assistant_text[:100]}...")

    # 3. Text-to-Speech
    tts_start = time.time()
    try:
        response_audio = await synthesize_speech(assistant_text, voice)
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {e}")
    tts_time = time.time() - tts_start

    total_time = time.time() - total_start

    logger.info(f"Pipeline complete - STT: {stt_time:.2f}s, LLM: {llm_time:.2f}s, TTS: {tts_time:.2f}s, Total: {total_time:.2f}s")

    # Return audio with metadata
    return Response(
        content=response_audio,
        media_type="audio/mpeg",
        headers={
            "X-User-Text": user_text[:200].replace("\n", " "),
            "X-Assistant-Text": assistant_text[:500].replace("\n", " "),
            "X-Model": model,
            "X-Voice": voice,
            "X-STT-Time": str(round(stt_time, 2)),
            "X-LLM-Time": str(round(llm_time, 2)),
            "X-TTS-Time": str(round(tts_time, 2)),
            "X-Total-Time": str(round(total_time, 2)),
        },
    )


@app.post("/voice/metadata", response_model=VoiceResponse)
async def voice_to_voice_with_metadata(
    audio: UploadFile = File(..., description="Audio input"),
    model: str = Form(DEFAULT_MODEL, description="Ollama model"),
    voice: str = Form(DEFAULT_VOICE, description="TTS voice"),
    language: str = Form("de", description="Input language"),
    system_prompt: Optional[str] = Form(None, description="Custom system prompt"),
):
    """
    Voice-to-voice pipeline returning JSON metadata (without audio).
    Useful for debugging or when you need the text response.
    """
    total_start = time.time()

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    # STT
    stt_start = time.time()
    stt_result = await transcribe_audio(audio_bytes, language)
    user_text = stt_result.get("text", "").strip()
    stt_time = time.time() - stt_start

    if not user_text:
        raise HTTPException(status_code=400, detail="No speech detected")

    # LLM
    llm_start = time.time()
    assistant_text = await chat_with_ollama(
        message=user_text,
        model=model,
        system_prompt=system_prompt or SYSTEM_PROMPT,
    )
    llm_time = time.time() - llm_start

    # TTS (just measure time, don't return audio)
    tts_start = time.time()
    await synthesize_speech(assistant_text, voice)
    tts_time = time.time() - tts_start

    return VoiceResponse(
        user_text=user_text,
        assistant_text=assistant_text,
        model=model,
        voice=voice,
        stt_time=round(stt_time, 2),
        llm_time=round(llm_time, 2),
        tts_time=round(tts_time, 2),
        total_time=round(time.time() - total_start, 2),
    )


@app.post("/tts")
async def text_to_speech(
    text: str = Form(..., description="Text to synthesize"),
    voice: str = Form(DEFAULT_VOICE, description="Voice to use"),
):
    """Direct text-to-speech synthesis."""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    audio_bytes = await synthesize_speech(text, voice)

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "X-Voice": voice,
            "X-Text-Length": str(len(text)),
        },
    )


# ============================================================================
# Main
# ============================================================================


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
