"""
Voxtral API Service - Mistral Cloud API Fallback
Uses Mistral's hosted Voxtral Mini Transcribe V2 when local service is overloaded.

Features:
- Speaker diarization
- Word-level timestamps
- Context biasing for domain-specific terms
- 13 language support
"""

import os
import logging
import tempfile
from pathlib import Path
from typing import Optional, Literal
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Lazy load client
_mistral_client = None

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
DEFAULT_MODEL = "voxtral-mini-latest"  # voxtral-mini-2602


@dataclass
class Speaker:
    """Speaker information from diarization."""
    id: str
    start: float
    end: float


@dataclass
class WordTimestamp:
    """Word-level timestamp."""
    word: str
    start: float
    end: float


@dataclass
class SegmentTimestamp:
    """Segment-level timestamp."""
    text: str
    start: float
    end: float
    speaker: Optional[str] = None


@dataclass
class VoxtralApiResult:
    """Result from Voxtral API transcription."""
    text: str
    language: Optional[str] = None
    model: str = "voxtral-api"
    duration_seconds: Optional[float] = None
    words: list[WordTimestamp] = field(default_factory=list)
    segments: list[SegmentTimestamp] = field(default_factory=list)
    speakers: list[Speaker] = field(default_factory=list)


def get_mistral_client():
    """Get or create Mistral client instance."""
    global _mistral_client

    if _mistral_client is None:
        if not MISTRAL_API_KEY:
            raise RuntimeError(
                "MISTRAL_API_KEY environment variable not set. "
                "Get your API key at https://console.mistral.ai/"
            )

        try:
            from mistralai import Mistral
            _mistral_client = Mistral(api_key=MISTRAL_API_KEY)
            logger.info("Mistral API client initialized")
        except ImportError:
            raise RuntimeError(
                "mistralai package not installed. "
                "Run: pip install mistralai"
            )

    return _mistral_client


def is_available() -> bool:
    """Check if Mistral API is configured and available."""
    return bool(MISTRAL_API_KEY)


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    language: Optional[str] = None,
    timestamp_granularity: Optional[Literal["word", "segment"]] = None,
    diarization: bool = False,
    context_bias: Optional[list[str]] = None,
) -> VoxtralApiResult:
    """
    Transcribe audio using Mistral's Voxtral API.

    Args:
        audio_bytes: Raw audio bytes
        filename: Original filename (for extension detection)
        language: Language code (de, en, fr, etc.) - auto-detect if None
        timestamp_granularity: "word" or "segment" for timestamps
        diarization: Enable speaker diarization
        context_bias: List of domain-specific terms to improve accuracy (max 100)

    Returns:
        VoxtralApiResult with transcription and optional metadata
    """
    client = get_mistral_client()

    logger.info(f"Transcribing via Mistral API: {filename} ({len(audio_bytes)} bytes)")

    try:
        # Build request parameters
        request_params = {
            "model": DEFAULT_MODEL,
            "file": {
                "content": audio_bytes,
                "file_name": filename,
            },
        }

        # Language and timestamps are mutually exclusive in current API
        if language and not timestamp_granularity:
            request_params["language"] = language

        if timestamp_granularity:
            request_params["timestamp_granularities"] = [timestamp_granularity]

        if diarization:
            request_params["diarization"] = True

        if context_bias:
            # API accepts comma-separated string, max 100 terms
            bias_terms = context_bias[:100]
            request_params["context_bias"] = ",".join(bias_terms)

        # Make API call
        response = client.audio.transcriptions.complete(**request_params)

        # Parse response
        result = VoxtralApiResult(
            text=response.text,
            language=getattr(response, "language", language),
            model=f"voxtral-api-{DEFAULT_MODEL}",
            duration_seconds=getattr(response, "duration", None),
        )

        # Parse word timestamps if present
        if hasattr(response, "words") and response.words:
            result.words = [
                WordTimestamp(
                    word=w.word,
                    start=w.start,
                    end=w.end,
                )
                for w in response.words
            ]

        # Parse segment timestamps if present
        if hasattr(response, "segments") and response.segments:
            result.segments = [
                SegmentTimestamp(
                    text=s.text,
                    start=s.start,
                    end=s.end,
                    speaker=getattr(s, "speaker", None),
                )
                for s in response.segments
            ]

        # Parse speakers if diarization enabled
        if hasattr(response, "speakers") and response.speakers:
            result.speakers = [
                Speaker(
                    id=sp.id,
                    start=sp.start,
                    end=sp.end,
                )
                for sp in response.speakers
            ]

        logger.info(f"Mistral API transcription complete: {len(result.text)} characters")
        return result

    except Exception as e:
        logger.error(f"Mistral API transcription failed: {e}")
        raise


# Supported languages by Voxtral API (13 languages)
SUPPORTED_LANGUAGES = [
    "en",  # English
    "zh",  # Chinese
    "hi",  # Hindi
    "es",  # Spanish
    "ar",  # Arabic
    "fr",  # French
    "pt",  # Portuguese
    "ru",  # Russian
    "de",  # German
    "ja",  # Japanese
    "ko",  # Korean
    "it",  # Italian
    "nl",  # Dutch
]
