"""
ManaCore STT API Service
Speech-to-Text with Whisper (MLX) and Voxtral

Run with: uvicorn app.main:app --host 0.0.0.0 --port 3020
"""

import os
import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
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


# Response models
class TranscriptionResponse(BaseModel):
    text: str
    language: Optional[str] = None
    model: str
    duration_seconds: Optional[float] = None


class HealthResponse(BaseModel):
    status: str
    whisper_loaded: bool
    voxtral_loaded: bool
    models: dict


class ModelsResponse(BaseModel):
    whisper: list
    voxtral: list
    default_whisper: str


# Track loaded models
models_status = {
    "whisper_loaded": False,
    "voxtral_loaded": False,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting ManaCore STT Service...")

    # Optionally preload models on startup
    if PRELOAD_MODELS:
        logger.info("Preloading models (PRELOAD_MODELS=true)...")
        try:
            from app.whisper_service import get_whisper_model
            get_whisper_model(DEFAULT_WHISPER_MODEL)
            models_status["whisper_loaded"] = True
            logger.info("Whisper model preloaded")
        except Exception as e:
            logger.warning(f"Failed to preload Whisper: {e}")

        try:
            from app.voxtral_service import get_voxtral_model
            get_voxtral_model()
            models_status["voxtral_loaded"] = True
            logger.info("Voxtral model preloaded")
        except Exception as e:
            logger.warning(f"Failed to preload Voxtral: {e}")
    else:
        logger.info("Models will be loaded on first request (lazy loading)")

    logger.info(f"STT Service ready on port {PORT}")
    yield
    logger.info("Shutting down STT Service...")


# Create FastAPI app
app = FastAPI(
    title="ManaCore STT Service",
    description="Speech-to-Text API with Whisper (MLX) and Voxtral",
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


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        whisper_loaded=models_status["whisper_loaded"],
        voxtral_loaded=models_status["voxtral_loaded"],
        models={
            "default_whisper": DEFAULT_WHISPER_MODEL,
        },
    )


@app.get("/models", response_model=ModelsResponse)
async def list_models():
    """List available models."""
    from app.whisper_service import AVAILABLE_MODELS as whisper_models
    from app.voxtral_service import SUPPORTED_LANGUAGES as voxtral_languages

    return ModelsResponse(
        whisper=whisper_models,
        voxtral=voxtral_languages,
        default_whisper=DEFAULT_WHISPER_MODEL,
    )


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_whisper(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form(
        None,
        description="Language code (e.g., 'de', 'en'). Auto-detect if not provided."
    ),
    model: str = Form(
        None,
        description="Whisper model to use (default: large-v3-turbo)"
    ),
):
    """
    Transcribe audio using Whisper (Lightning MLX).

    Supported formats: mp3, wav, m4a, flac, ogg, webm
    Max file size: 100MB
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_extensions = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm", ".mp4"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {allowed_extensions}"
        )

    try:
        from app.whisper_service import transcribe_audio_bytes

        # Read file
        audio_bytes = await file.read()

        # Check file size (100MB limit)
        if len(audio_bytes) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")

        # Use default model if not specified
        model_name = model or DEFAULT_WHISPER_MODEL

        # Transcribe
        result = await transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=file.filename,
            language=language,
            model_name=model_name,
        )

        models_status["whisper_loaded"] = True

        return TranscriptionResponse(
            text=result.text,
            language=result.language,
            model=f"whisper-{model_name}",
        )

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe/voxtral", response_model=TranscriptionResponse)
async def transcribe_voxtral(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: str = Form(
        "de",
        description="Language code (de, en, fr, es, pt, it, nl, hi)"
    ),
):
    """
    Transcribe audio using Voxtral Mini (Mistral AI).

    Best for: German, French, European languages
    Supported formats: mp3, wav, m4a, flac
    Max file size: 100MB
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate language
    from app.voxtral_service import SUPPORTED_LANGUAGES
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language}. Supported: {SUPPORTED_LANGUAGES}"
        )

    try:
        from app.voxtral_service import transcribe_audio_bytes

        audio_bytes = await file.read()

        if len(audio_bytes) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")

        result = await transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=file.filename,
            language=language,
        )

        models_status["voxtral_loaded"] = True

        return TranscriptionResponse(
            text=result.text,
            language=result.language,
            model=result.model,
        )

    except Exception as e:
        logger.error(f"Voxtral transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe/auto", response_model=TranscriptionResponse)
async def transcribe_auto(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form(
        None,
        description="Language hint (optional)"
    ),
    prefer: str = Form(
        "whisper",
        description="Preferred model: 'whisper' or 'voxtral'"
    ),
):
    """
    Transcribe audio with automatic model selection.

    - Uses Whisper by default (faster, more languages)
    - Falls back to Voxtral if Whisper fails
    """
    if prefer == "voxtral":
        # Try Voxtral first
        try:
            return await transcribe_voxtral(file, language or "de")
        except Exception as e:
            logger.warning(f"Voxtral failed, trying Whisper: {e}")
            # Reset file position
            await file.seek(0)
            return await transcribe_whisper(file, language, None)
    else:
        # Try Whisper first (default)
        try:
            return await transcribe_whisper(file, language, None)
        except Exception as e:
            logger.warning(f"Whisper failed, trying Voxtral: {e}")
            await file.seek(0)
            return await transcribe_voxtral(file, language or "de")


# Error handlers
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
