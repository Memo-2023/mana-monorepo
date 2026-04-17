"""
Mana TTS - Text-to-Speech Microservice

Provides TTS synthesis using:
- Kokoro: Fast preset voices
- F5-TTS: Voice cloning with reference audio

Optimized for Apple Silicon (MLX).
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .auth import verify_api_key, AuthResult, REQUIRE_AUTH

from .audio_utils import convert_audio, SUPPORTED_FORMATS, cleanup_temp_file, save_temp_audio
from .kokoro_service import (
    synthesize_kokoro,
    get_kokoro_model,
    is_kokoro_loaded,
    KOKORO_VOICES,
    DEFAULT_VOICE as DEFAULT_KOKORO_VOICE,
    DEFAULT_KOKORO_MODEL,
)
from .f5_service import (
    synthesize_f5,
    synthesize_f5_from_bytes,
    get_f5_model,
    is_f5_loaded,
    DEFAULT_F5_MODEL,
)
from .voice_manager import get_voice_manager, CustomVoice
from .piper_service import (
    synthesize_piper,
    PIPER_VOICES,
    is_piper_loaded,
)
from .orpheus_service import (
    synthesize_orpheus,
    is_orpheus_loaded,
    ORPHEUS_VOICES,
    DEFAULT_VOICE as DEFAULT_ORPHEUS_VOICE,
)
from .zonos_service import (
    synthesize_zonos,
    is_zonos_loaded,
    EMOTION_PRESETS as ZONOS_EMOTIONS,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Configuration from environment
PORT = int(os.getenv("PORT", "3022"))
PRELOAD_MODELS = os.getenv("PRELOAD_MODELS", "false").lower() == "true"
MAX_TEXT_LENGTH = int(os.getenv("MAX_TEXT_LENGTH", "1000"))
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://mana.how,https://chat.mana.how,https://todo.mana.how,http://localhost:5173",
).split(",")

# Supported audio extensions for uploads
SUPPORTED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown."""
    logger.info(f"Starting Mana TTS service on port {PORT}")

    # Initialize voice manager (scans voices directory)
    voice_manager = get_voice_manager()
    logger.info(f"Voice manager initialized with {len(voice_manager.list_voices())} custom voices")

    if PRELOAD_MODELS:
        logger.info("Pre-loading models (PRELOAD_MODELS=true)...")
        try:
            get_kokoro_model()
            logger.info("Kokoro model pre-loaded")
        except Exception as e:
            logger.warning(f"Failed to pre-load Kokoro: {e}")

        try:
            get_f5_model()
            logger.info("F5-TTS model pre-loaded")
        except Exception as e:
            logger.warning(f"Failed to pre-load F5-TTS: {e}")
    else:
        logger.info("Models will be loaded on first request (lazy loading)")

    yield

    logger.info("Shutting down Mana TTS service")


# Create FastAPI app
app = FastAPI(
    title="Mana TTS",
    description="Text-to-Speech service with voice cloning support",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request/Response Models
# ============================================================================


class KokoroRequest(BaseModel):
    """Request for Kokoro TTS synthesis."""

    text: str = Field(..., description="Text to synthesize", max_length=5000)
    voice: str = Field(DEFAULT_KOKORO_VOICE, description="Voice ID")
    speed: float = Field(1.0, ge=0.5, le=2.0, description="Speech speed")
    output_format: str = Field("wav", description="Output format (wav, mp3)")


class AutoRequest(BaseModel):
    """Request for auto-selection TTS synthesis."""

    text: str = Field(..., description="Text to synthesize", max_length=5000)
    voice: Optional[str] = Field(None, description="Voice ID (Kokoro preset or registered)")
    speed: float = Field(1.0, ge=0.5, le=2.0, description="Speech speed")
    output_format: str = Field("wav", description="Output format (wav, mp3)")


class RegisterVoiceRequest(BaseModel):
    """Request to register a new custom voice."""

    voice_id: str = Field(..., description="Unique voice identifier", min_length=2, max_length=50)
    name: str = Field(..., description="Display name")
    description: str = Field("", description="Voice description")
    transcript: str = Field(..., description="Transcript of the reference audio")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    service: str
    models_loaded: dict
    auth_required: bool


class ModelsResponse(BaseModel):
    """Available models response."""

    kokoro: dict
    f5: dict


class VoiceInfo(BaseModel):
    """Voice information."""

    id: str
    name: str
    description: str
    type: str  # "kokoro" or "f5_custom"


class VoicesResponse(BaseModel):
    """Available voices response."""

    kokoro_voices: list[VoiceInfo]
    custom_voices: list[VoiceInfo]


class VoiceRegisteredResponse(BaseModel):
    """Response after registering a voice."""

    voice_id: str
    message: str


class VoiceDeletedResponse(BaseModel):
    """Response after deleting a voice."""

    voice_id: str
    message: str


# ============================================================================
# Health & Info Endpoints
# ============================================================================


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check service health and model status."""
    return HealthResponse(
        status="healthy",
        service="mana-tts",
        models_loaded={
            "kokoro": is_kokoro_loaded(),
            "f5": is_f5_loaded(),
            "orpheus": is_orpheus_loaded(),
            "zonos": is_zonos_loaded(),
        },
        auth_required=REQUIRE_AUTH,
    )


@app.get("/models", response_model=ModelsResponse)
async def get_models(auth: AuthResult = Depends(verify_api_key)):
    """Get information about available models."""
    return ModelsResponse(
        kokoro={
            "name": "Kokoro-82M",
            "description": "Fast TTS with preset voices",
            "model_id": DEFAULT_KOKORO_MODEL,
            "loaded": is_kokoro_loaded(),
            "voice_count": len(KOKORO_VOICES),
        },
        f5={
            "name": "F5-TTS",
            "description": "Voice cloning with reference audio",
            "model_id": DEFAULT_F5_MODEL,
            "loaded": is_f5_loaded(),
            "supports_cloning": True,
        },
    )


# ============================================================================
# Voice Management Endpoints
# ============================================================================


@app.get("/voices", response_model=VoicesResponse)
async def get_voices(auth: AuthResult = Depends(verify_api_key)):
    """Get all available voices."""
    # Kokoro preset voices
    kokoro_voices = [
        VoiceInfo(
            id=voice_id,
            name=voice_id,
            description=description,
            type="kokoro",
        )
        for voice_id, description in KOKORO_VOICES.items()
    ]

    # Custom voices from voice manager
    voice_manager = get_voice_manager()
    custom_voices = [
        VoiceInfo(
            id=voice.id,
            name=voice.name,
            description=voice.description,
            type="f5_custom",
        )
        for voice in voice_manager.list_voices()
    ]

    return VoicesResponse(
        kokoro_voices=kokoro_voices,
        custom_voices=custom_voices,
    )


@app.post("/voices", response_model=VoiceRegisteredResponse)
async def register_voice(
    voice_id: str = Form(..., description="Unique voice identifier"),
    name: str = Form(..., description="Display name"),
    description: str = Form("", description="Voice description"),
    transcript: str = Form(..., description="Transcript of the reference audio"),
    reference_audio: UploadFile = File(..., description="Reference audio file"),
    auth: AuthResult = Depends(verify_api_key),
):
    """
    Register a new custom voice for F5-TTS voice cloning.

    Requires:
    - Reference audio file (WAV, MP3, M4A, FLAC, OGG)
    - Transcript of what is said in the audio
    """
    # Validate file extension
    if reference_audio.filename:
        ext = Path(reference_audio.filename).suffix.lower()
        if ext not in SUPPORTED_AUDIO_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported audio format. Use one of: {SUPPORTED_AUDIO_EXTENSIONS}",
            )
    else:
        ext = ".wav"

    # Read audio bytes
    audio_bytes = await reference_audio.read()

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    if len(audio_bytes) > 50 * 1024 * 1024:  # 50 MB limit
        raise HTTPException(status_code=400, detail="Audio file too large (max 50 MB)")

    # Register voice
    voice_manager = get_voice_manager()
    try:
        voice_manager.register_voice(
            voice_id=voice_id,
            name=name,
            description=description,
            audio_bytes=audio_bytes,
            transcript=transcript,
            audio_extension=ext,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return VoiceRegisteredResponse(
        voice_id=voice_id,
        message=f"Voice '{voice_id}' registered successfully",
    )


@app.delete("/voices/{voice_id}", response_model=VoiceDeletedResponse)
async def delete_voice(voice_id: str, auth: AuthResult = Depends(verify_api_key)):
    """Delete a registered custom voice."""
    voice_manager = get_voice_manager()

    if not voice_manager.delete_voice(voice_id):
        raise HTTPException(status_code=404, detail=f"Voice '{voice_id}' not found")

    return VoiceDeletedResponse(
        voice_id=voice_id,
        message=f"Voice '{voice_id}' deleted successfully",
    )


# ============================================================================
# Kokoro TTS Endpoint
# ============================================================================


@app.post("/synthesize/kokoro")
async def synthesize_with_kokoro(
    request: KokoroRequest,
    auth: AuthResult = Depends(verify_api_key),
):
    """
    Synthesize speech using Kokoro with preset voices.

    Fast synthesis with high-quality preset voices.
    """
    # Validate text length
    if len(request.text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds maximum length of {MAX_TEXT_LENGTH} characters",
        )

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Validate output format
    output_format = request.output_format.lower()
    if output_format not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Use one of: {SUPPORTED_FORMATS}",
        )

    try:
        # Synthesize
        result = await synthesize_kokoro(
            text=request.text,
            voice=request.voice,
            speed=request.speed,
        )

        # Convert to requested format
        audio_bytes, content_type = convert_audio(
            result.audio,
            result.sample_rate,
            output_format,
        )

        # Return audio response
        return Response(
            content=audio_bytes,
            media_type=content_type,
            headers={
                "X-Voice": result.voice,
                "X-Duration": str(result.duration),
                "X-Sample-Rate": str(result.sample_rate),
            },
        )

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Kokoro synthesis error: {e}")
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {e}")


# ============================================================================
# F5-TTS Endpoint
# ============================================================================


@app.post("/synthesize")
async def synthesize_with_f5(
    text: str = Form(..., description="Text to synthesize"),
    voice_id: Optional[str] = Form(None, description="Registered voice ID"),
    reference_audio: Optional[UploadFile] = File(None, description="Reference audio for cloning"),
    reference_text: Optional[str] = Form(None, description="Transcript of reference audio"),
    output_format: str = Form("wav", description="Output format (wav, mp3)"),
    speed: float = Form(1.0, ge=0.5, le=2.0, description="Speech speed"),
    steps: int = Form(32, ge=8, le=64, description="Diffusion steps"),
    auth: AuthResult = Depends(verify_api_key),
):
    """
    Synthesize speech using F5-TTS with voice cloning.

    Provide either:
    - voice_id: Use a pre-registered voice
    - reference_audio + reference_text: Clone voice from audio sample
    """
    # Validate text
    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds maximum length of {MAX_TEXT_LENGTH} characters",
        )

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Validate output format
    output_format = output_format.lower()
    if output_format not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Use one of: {SUPPORTED_FORMATS}",
        )

    voice_manager = get_voice_manager()
    ref_audio_path: Optional[str] = None
    ref_text: Optional[str] = None
    temp_file_path: Optional[str] = None

    try:
        # Option 1: Use registered voice
        if voice_id:
            voice = voice_manager.get_voice(voice_id)
            if not voice:
                raise HTTPException(
                    status_code=404,
                    detail=f"Voice '{voice_id}' not found. Register it first or provide reference audio.",
                )
            ref_audio_path = voice.audio_path
            ref_text = voice.transcript

        # Option 2: Use uploaded reference audio
        elif reference_audio and reference_text:
            # Get file extension
            ext = ".wav"
            if reference_audio.filename:
                ext = Path(reference_audio.filename).suffix.lower()
                if ext not in SUPPORTED_AUDIO_EXTENSIONS:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported audio format. Use one of: {SUPPORTED_AUDIO_EXTENSIONS}",
                    )

            # Read and save to temp file
            audio_bytes = await reference_audio.read()
            if len(audio_bytes) == 0:
                raise HTTPException(status_code=400, detail="Reference audio is empty")

            temp_file_path = save_temp_audio(audio_bytes, suffix=ext)
            ref_audio_path = temp_file_path
            ref_text = reference_text

        else:
            raise HTTPException(
                status_code=400,
                detail="Provide either voice_id or reference_audio + reference_text",
            )

        # Synthesize with F5-TTS
        result = await synthesize_f5(
            text=text,
            reference_audio_path=ref_audio_path,
            reference_text=ref_text,
            speed=speed,
            steps=steps,
        )

        # Convert to requested format
        audio_bytes, content_type = convert_audio(
            result.audio,
            result.sample_rate,
            output_format,
        )

        # Return audio response
        return Response(
            content=audio_bytes,
            media_type=content_type,
            headers={
                "X-Model": "f5-tts",
                "X-Voice-ID": voice_id or "custom",
                "X-Duration": str(result.duration),
                "X-Sample-Rate": str(result.sample_rate),
            },
        )

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"F5-TTS synthesis error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice cloning synthesis failed: {e}")
    finally:
        # Clean up temp file
        if temp_file_path:
            cleanup_temp_file(temp_file_path)


# ============================================================================
# Orpheus TTS Endpoint (German, high-quality)
# ============================================================================


class OrpheusRequest(BaseModel):
    """Request for Orpheus TTS synthesis."""

    text: str = Field(..., description="Text to synthesize (German)", max_length=5000)
    voice: str = Field(DEFAULT_ORPHEUS_VOICE, description="Speaker voice")
    output_format: str = Field("wav", description="Output format (wav, mp3)")
    temperature: float = Field(0.6, ge=0.1, le=1.5, description="Sampling temperature")


@app.post("/synthesize/orpheus")
async def synthesize_with_orpheus(
    request: OrpheusRequest,
    auth: AuthResult = Depends(verify_api_key),
):
    """
    Synthesize German speech using Orpheus TTS.

    High-quality German synthesis with natural intonation.
    Not optimized for real-time — designed for pre-generation.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if len(request.text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds maximum length of {MAX_TEXT_LENGTH} characters",
        )

    output_format = request.output_format.lower()
    if output_format not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Use one of: {SUPPORTED_FORMATS}",
        )

    try:
        result = await synthesize_orpheus(
            text=request.text,
            voice=request.voice,
            temperature=request.temperature,
        )

        audio_bytes, content_type = convert_audio(
            result.audio,
            result.sample_rate,
            output_format,
        )

        return Response(
            content=audio_bytes,
            media_type=content_type,
            headers={
                "X-Model": "orpheus-german",
                "X-Voice": result.voice,
                "X-Duration": str(result.duration),
                "X-Sample-Rate": str(result.sample_rate),
            },
        )

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Orpheus synthesis error: {e}")
        raise HTTPException(status_code=500, detail=f"Orpheus synthesis failed: {e}")


# ============================================================================
# Zonos TTS Endpoint (Multilingual, expressive)
# ============================================================================


class ZonosRequest(BaseModel):
    """Request for Zonos TTS synthesis."""

    text: str = Field(..., description="Text to synthesize", max_length=5000)
    language: str = Field("de", description="Language code")
    emotion: str = Field("friendly", description="Emotion preset: neutral, friendly, warm, curious")
    speaking_rate: float = Field(13.0, ge=5.0, le=25.0, description="Phonemes per second")
    pitch_std: float = Field(20.0, ge=5.0, le=50.0, description="Pitch variation in Hz")
    output_format: str = Field("wav", description="Output format (wav, mp3)")


@app.post("/synthesize/zonos")
async def synthesize_with_zonos(
    request: ZonosRequest,
    auth: AuthResult = Depends(verify_api_key),
):
    """
    Synthesize speech using Zonos TTS by Zyphra.

    Expressive multilingual synthesis with emotion control.
    Trained on 200k hours — explicit German support.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if len(request.text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds maximum length of {MAX_TEXT_LENGTH} characters",
        )

    output_format = request.output_format.lower()
    if output_format not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Use one of: {SUPPORTED_FORMATS}",
        )

    if request.emotion not in ZONOS_EMOTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown emotion. Use one of: {list(ZONOS_EMOTIONS.keys())}",
        )

    try:
        result = await synthesize_zonos(
            text=request.text,
            language=request.language,
            emotion=request.emotion,
            speaking_rate=request.speaking_rate,
            pitch_std=request.pitch_std,
        )

        audio_bytes, content_type = convert_audio(
            result.audio,
            result.sample_rate,
            output_format,
        )

        return Response(
            content=audio_bytes,
            media_type=content_type,
            headers={
                "X-Model": "zonos-v0.1",
                "X-Emotion": result.emotion,
                "X-Duration": str(result.duration),
                "X-Sample-Rate": str(result.sample_rate),
            },
        )

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Zonos synthesis error: {e}")
        raise HTTPException(status_code=500, detail=f"Zonos synthesis failed: {e}")


# ============================================================================
# Auto-Selection Endpoint
# ============================================================================


@app.post("/synthesize/auto")
async def synthesize_auto(
    request: AutoRequest,
    auth: AuthResult = Depends(verify_api_key),
):
    """
    Auto-select the best TTS model based on voice parameter.

    - If voice is a Kokoro preset: Use Kokoro
    - If voice is a registered custom voice: Use F5-TTS
    - If no voice specified: Use Kokoro with default voice
    """
    # Validate text
    if len(request.text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds maximum length of {MAX_TEXT_LENGTH} characters",
        )

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Determine which model to use
    voice = request.voice or DEFAULT_KOKORO_VOICE

    # Check if it's a Kokoro voice
    if voice in KOKORO_VOICES:
        kokoro_request = KokoroRequest(
            text=request.text,
            voice=voice,
            speed=request.speed,
            output_format=request.output_format,
        )
        return await synthesize_with_kokoro(kokoro_request)

    # Check if it's a Piper/German voice
    if voice in PIPER_VOICES:
        try:
            # Convert speed to length_scale (inverse relationship)
            # speed > 1 means faster, so length_scale < 1
            length_scale = 1.0 / request.speed

            result = await synthesize_piper(
                text=request.text,
                voice=voice,
                length_scale=length_scale,
            )

            # Convert to requested format
            output_format = request.output_format.lower()
            audio_bytes, content_type = convert_audio(
                result.audio,
                result.sample_rate,
                output_format,
            )

            return Response(
                content=audio_bytes,
                media_type=content_type,
                headers={
                    "X-Model": "piper",
                    "X-Voice": voice,
                    "X-Duration": str(result.duration),
                    "X-Sample-Rate": str(result.sample_rate),
                },
            )
        except Exception as e:
            logger.error(f"Piper synthesis error: {e}")
            raise HTTPException(status_code=500, detail=f"German voice synthesis failed: {e}")

    # Check if it's a registered custom voice
    voice_manager = get_voice_manager()
    if voice_manager.voice_exists(voice):
        # Use F5-TTS with registered voice
        # Create a form-like context for the F5 endpoint
        custom_voice = voice_manager.get_voice(voice)
        try:
            result = await synthesize_f5(
                text=request.text,
                reference_audio_path=custom_voice.audio_path,
                reference_text=custom_voice.transcript,
                speed=request.speed,
            )

            # Convert to requested format
            output_format = request.output_format.lower()
            audio_bytes, content_type = convert_audio(
                result.audio,
                result.sample_rate,
                output_format,
            )

            return Response(
                content=audio_bytes,
                media_type=content_type,
                headers={
                    "X-Model": "f5-tts",
                    "X-Voice-ID": voice,
                    "X-Duration": str(result.duration),
                    "X-Sample-Rate": str(result.sample_rate),
                },
            )
        except Exception as e:
            logger.error(f"F5-TTS auto synthesis error: {e}")
            raise HTTPException(status_code=500, detail=f"Voice synthesis failed: {e}")

    # Unknown voice - fall back to Kokoro with default
    logger.warning(f"Unknown voice '{voice}', falling back to Kokoro default")
    kokoro_request = KokoroRequest(
        text=request.text,
        voice=DEFAULT_KOKORO_VOICE,
        speed=request.speed,
        output_format=request.output_format,
    )
    return await synthesize_with_kokoro(kokoro_request)


# ============================================================================
# Error Handler
# ============================================================================


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}")
    return Response(
        content=f'{{"error": "Internal server error", "detail": "{str(exc)}"}}',
        status_code=500,
        media_type="application/json",
    )


# ============================================================================
# Main
# ============================================================================


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
