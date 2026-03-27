"""
Whisper STT Service using faster-whisper (CUDA)
Optimized for NVIDIA GPUs (RTX 3090 etc.)

Drop-in replacement for whisper_service.py (MLX version).
Uses faster-whisper with CTranslate2 for GPU-accelerated inference.
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


def get_whisper_model(model_name: str = "large-v3", **kwargs):
    """Get or create Whisper model instance (singleton pattern)."""
    global _whisper_model

    if _whisper_model is None:
        logger.info(f"Loading Whisper model: {model_name}")
        try:
            from faster_whisper import WhisperModel

            # Use CUDA with float16 for RTX 3090
            compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "float16")
            device = os.getenv("WHISPER_DEVICE", "cuda")

            _whisper_model = WhisperModel(
                model_name,
                device=device,
                compute_type=compute_type,
            )
            logger.info(f"Whisper model loaded: {model_name} on {device} ({compute_type})")
        except ImportError as e:
            logger.error(f"Failed to import faster_whisper: {e}")
            raise RuntimeError(
                "faster-whisper not installed. "
                "Run: pip install faster-whisper"
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
    Transcribe audio file using faster-whisper (CUDA).

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
        segments, info = model.transcribe(
            audio_path,
            language=language,
            beam_size=5,
            vad_filter=True,  # Filter out silence
        )

        # Collect all segments
        all_segments = []
        full_text_parts = []
        for segment in segments:
            full_text_parts.append(segment.text)
            all_segments.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
            })

        text = " ".join(full_text_parts)
        detected_language = info.language if info else language

        logger.info(f"Transcription complete: {len(text)} characters, language={detected_language}")

        return TranscriptionResult(
            text=text.strip(),
            language=detected_language,
            duration=info.duration if info else None,
            segments=all_segments,
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


# Available models for faster-whisper
AVAILABLE_MODELS = [
    "tiny",
    "tiny.en",
    "base",
    "base.en",
    "small",
    "small.en",
    "medium",
    "medium.en",
    "large-v1",
    "large-v2",
    "large-v3",
    "large-v3-turbo",
    "distil-large-v2",
    "distil-large-v3",
]
