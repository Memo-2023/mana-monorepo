"""
Whisper STT Service using Lightning Whisper MLX
Optimized for Apple Silicon (M1/M2/M3/M4)
"""

import os
import tempfile
import logging
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Lazy load to avoid import errors if not installed
_whisper_model = None


@dataclass
class TranscriptionResult:
    text: str
    language: Optional[str] = None
    duration: Optional[float] = None
    segments: Optional[list] = None


def get_whisper_model(model_name: str = "large-v3", batch_size: int = 12):
    """Get or create Whisper model instance (singleton pattern)."""
    global _whisper_model

    if _whisper_model is None:
        logger.info(f"Loading Whisper model: {model_name}")
        try:
            from lightning_whisper_mlx import LightningWhisperMLX
            _whisper_model = LightningWhisperMLX(
                model=model_name,
                batch_size=batch_size,
                quant=None  # Use full precision for best quality
            )
            logger.info(f"Whisper model loaded successfully: {model_name}")
        except ImportError as e:
            logger.error(f"Failed to import lightning_whisper_mlx: {e}")
            raise RuntimeError(
                "lightning-whisper-mlx not installed. "
                "Run: pip install lightning-whisper-mlx"
            )
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise

    return _whisper_model


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = None,
    model_name: str = "large-v3",
) -> TranscriptionResult:
    """
    Transcribe audio file using Lightning Whisper MLX.

    Args:
        audio_path: Path to audio file (mp3, wav, m4a, etc.)
        language: Optional language code (e.g., 'de', 'en'). Auto-detect if None.
        model_name: Whisper model to use

    Returns:
        TranscriptionResult with text and metadata
    """
    model = get_whisper_model(model_name)

    logger.info(f"Transcribing: {audio_path}")

    try:
        # Lightning Whisper MLX returns dict with 'text' key
        result = model.transcribe(
            audio_path=audio_path,
            language=language,
        )

        # Handle different return formats
        if isinstance(result, dict):
            text = result.get("text", "")
            segments = result.get("segments", [])
            detected_language = result.get("language", language)
        else:
            text = str(result)
            segments = []
            detected_language = language

        logger.info(f"Transcription complete: {len(text)} characters")

        return TranscriptionResult(
            text=text.strip(),
            language=detected_language,
            segments=segments,
        )

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    language: Optional[str] = None,
    model_name: str = "large-v3",
) -> TranscriptionResult:
    """
    Transcribe audio from bytes (for API uploads).

    Args:
        audio_bytes: Raw audio file bytes
        filename: Original filename (for extension detection)
        language: Optional language code
        model_name: Whisper model to use

    Returns:
        TranscriptionResult
    """
    # Get file extension
    ext = Path(filename).suffix or ".wav"

    # Write to temp file
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = transcribe_audio(
            audio_path=tmp_path,
            language=language,
            model_name=model_name,
        )
        return result
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# Available models for Lightning Whisper MLX
AVAILABLE_MODELS = [
    "tiny",
    "small",
    "base",
    "medium",
    "large",
    "large-v2",
    "large-v3",  # Recommended for Mac Mini
    "distil-small.en",
    "distil-medium.en",
    "distil-large-v2",
    "distil-large-v3",
]
