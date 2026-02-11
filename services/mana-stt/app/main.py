"""
ManaCore STT API Service
Speech-to-Text with Whisper (MLX), Voxtral (vLLM), and Mistral API (fallback)

Run with: uvicorn app.main:app --host 0.0.0.0 --port 3020
"""

import os
import logging
import time
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Environment
PORT = int(os.getenv("PORT", "3020"))
DEFAULT_WHISPER_MODEL = os.getenv("WHISPER_MODEL", "large-v3")
PRELOAD_MODELS = os.getenv("PRELOAD_MODELS", "false").lower() == "true"
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://mana.how,https://chat.mana.how,http://localhost:5173"
).split(",")

# vLLM configuration (disabled by default - has issues on macOS CPU)
VLLM_URL = os.getenv("VLLM_URL", "http://localhost:8100")
USE_VLLM = os.getenv("USE_VLLM", "false").lower() == "true"


# Response models
class TranscriptionResponse(BaseModel):
    text: str
    language: Optional[str] = None
    model: str
    latency_ms: Optional[float] = None
    duration_seconds: Optional[float] = None


class HealthResponse(BaseModel):
    status: str
    whisper_loaded: bool
    vllm_available: bool
    vllm_url: Optional[str] = None
    mistral_api_available: bool
    models: dict


class ModelsResponse(BaseModel):
    whisper: list
    voxtral_vllm: list
    default_whisper: str


# Track loaded models
models_status = {
    "whisper_loaded": False,
    "vllm_available": False,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting ManaCore STT Service...")

    # Check vLLM availability
    if USE_VLLM:
        from app.vllm_service import check_health
        health = await check_health()
        models_status["vllm_available"] = health.get("status") == "healthy"
        if models_status["vllm_available"]:
            logger.info(f"vLLM server available at {VLLM_URL}")
        else:
            logger.warning(f"vLLM server not available: {health}")

    # Check Mistral API
    from app.voxtral_api_service import is_available as api_available
    if api_available():
        logger.info("Mistral API fallback configured")

    # Optionally preload Whisper
    if PRELOAD_MODELS:
        logger.info("Preloading Whisper model...")
        try:
            from app.whisper_service import get_whisper_model
            get_whisper_model(DEFAULT_WHISPER_MODEL)
            models_status["whisper_loaded"] = True
            logger.info("Whisper model preloaded")
        except Exception as e:
            logger.warning(f"Failed to preload Whisper: {e}")

    logger.info(f"STT Service ready on port {PORT}")
    yield
    logger.info("Shutting down STT Service...")


# Create FastAPI app
app = FastAPI(
    title="ManaCore STT Service",
    description="Speech-to-Text API with Whisper (MLX), Voxtral (vLLM), and Mistral API",
    version="2.0.0",
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


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    from app.voxtral_api_service import is_available as api_available
    from app.vllm_service import check_health

    vllm_health = await check_health()

    return HealthResponse(
        status="healthy",
        whisper_loaded=models_status["whisper_loaded"],
        vllm_available=vllm_health.get("status") == "healthy",
        vllm_url=VLLM_URL if USE_VLLM else None,
        mistral_api_available=api_available(),
        models={
            "default_whisper": DEFAULT_WHISPER_MODEL,
        },
    )


@app.get("/models", response_model=ModelsResponse)
async def list_models():
    """List available models."""
    from app.whisper_service import AVAILABLE_MODELS as whisper_models
    from app.vllm_service import get_models

    vllm_models = await get_models()

    return ModelsResponse(
        whisper=whisper_models,
        voxtral_vllm=vllm_models,
        default_whisper=DEFAULT_WHISPER_MODEL,
    )


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_whisper(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form(None, description="Language code (auto-detect if not provided)"),
    model: Optional[str] = Form(None, description="Whisper model to use"),
):
    """
    Transcribe audio using Whisper (Lightning MLX).

    Best for: General transcription, many languages
    Supported formats: mp3, wav, m4a, flac, ogg, webm
    Max file size: 100MB
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed_extensions = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm", ".mp4"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {allowed_extensions}"
        )

    start_time = time.time()

    try:
        from app.whisper_service import transcribe_audio_bytes

        audio_bytes = await file.read()
        if len(audio_bytes) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")

        model_name = model or DEFAULT_WHISPER_MODEL

        result = await transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=file.filename,
            language=language,
            model_name=model_name,
        )

        models_status["whisper_loaded"] = True
        latency_ms = (time.time() - start_time) * 1000

        return TranscriptionResponse(
            text=result.text,
            language=result.language,
            model=f"whisper-{model_name}",
            latency_ms=latency_ms,
        )

    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe/voxtral", response_model=TranscriptionResponse)
async def transcribe_voxtral(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: str = Form("de", description="Language code"),
    use_realtime: bool = Form(False, description="Use Realtime 4B model for lower latency"),
):
    """
    Transcribe audio using Voxtral via vLLM server.

    Models:
    - Voxtral Mini 3B (default): Best quality
    - Voxtral Realtime 4B: Lower latency (<500ms)

    Falls back to Mistral API if vLLM is unavailable.

    Supported formats: mp3, wav, m4a, flac, ogg, webm
    Max file size: 100MB
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    from app.vllm_service import (
        SUPPORTED_LANGUAGES,
        is_available as vllm_available,
        transcribe_audio_bytes as vllm_transcribe,
        transcribe_with_realtime,
        check_health,
    )
    from app.voxtral_api_service import (
        is_available as api_available,
        transcribe_audio_bytes as api_transcribe,
    )

    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language}. Supported: {SUPPORTED_LANGUAGES}"
        )

    try:
        audio_bytes = await file.read()
        if len(audio_bytes) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")

        # Try vLLM first
        if USE_VLLM:
            health = await check_health()
            if health.get("status") == "healthy":
                logger.info("Using vLLM for Voxtral transcription")
                if use_realtime:
                    result = await transcribe_with_realtime(
                        audio_bytes=audio_bytes,
                        filename=file.filename,
                        language=language,
                    )
                else:
                    result = await vllm_transcribe(
                        audio_bytes=audio_bytes,
                        filename=file.filename,
                        language=language,
                    )

                return TranscriptionResponse(
                    text=result.text,
                    language=result.language,
                    model=result.model,
                    latency_ms=result.latency_ms,
                    duration_seconds=result.duration_seconds,
                )

        # Fallback to Mistral API
        if api_available():
            logger.info("Falling back to Mistral API")
            result = await api_transcribe(
                audio_bytes=audio_bytes,
                filename=file.filename,
                language=language,
            )

            return TranscriptionResponse(
                text=result.text,
                language=result.language,
                model=result.model,
                latency_ms=None,
                duration_seconds=result.duration_seconds,
            )

        raise HTTPException(
            status_code=503,
            detail="Voxtral not available. Start vLLM server or configure MISTRAL_API_KEY."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voxtral transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe/voxtral/api", response_model=TranscriptionResponse)
async def transcribe_voxtral_api(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form(None, description="Language code (auto-detect if not provided)"),
    diarization: bool = Form(False, description="Enable speaker diarization"),
):
    """
    Transcribe audio using Mistral's Voxtral API directly.

    Features:
    - Speaker diarization
    - Auto language detection
    - High quality (~4% WER)

    Requires MISTRAL_API_KEY environment variable.
    """
    from app.voxtral_api_service import is_available, transcribe_audio_bytes

    if not is_available():
        raise HTTPException(
            status_code=503,
            detail="Mistral API not configured. Set MISTRAL_API_KEY environment variable."
        )

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        audio_bytes = await file.read()
        if len(audio_bytes) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")

        result = await transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=file.filename,
            language=language,
            diarization=diarization,
        )

        return TranscriptionResponse(
            text=result.text,
            language=result.language,
            model=result.model,
            duration_seconds=result.duration_seconds,
        )

    except Exception as e:
        logger.error(f"Mistral API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe/auto", response_model=TranscriptionResponse)
async def transcribe_auto(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form(None, description="Language hint"),
    prefer: str = Form("whisper", description="Preferred: 'whisper' or 'voxtral'"),
):
    """
    Transcribe with automatic model selection and fallback.

    Fallback chain:
    1. Preferred model (whisper or voxtral)
    2. Alternative model
    3. Mistral API
    """
    if prefer == "voxtral":
        try:
            return await transcribe_voxtral(file, language or "de", False)
        except Exception as e:
            logger.warning(f"Voxtral failed, trying Whisper: {e}")
            await file.seek(0)
            try:
                return await transcribe_whisper(file, language, None)
            except Exception as e2:
                logger.warning(f"Whisper failed, trying API: {e2}")
                await file.seek(0)
                return await transcribe_voxtral_api(file, language, False)
    else:
        try:
            return await transcribe_whisper(file, language, None)
        except Exception as e:
            logger.warning(f"Whisper failed, trying Voxtral: {e}")
            await file.seek(0)
            try:
                return await transcribe_voxtral(file, language or "de", False)
            except Exception as e2:
                logger.warning(f"Voxtral failed, trying API: {e2}")
                await file.seek(0)
                return await transcribe_voxtral_api(file, language, False)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
    )
