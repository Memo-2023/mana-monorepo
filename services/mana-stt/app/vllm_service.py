"""
vLLM Voxtral Service - Proxy to vLLM server for Voxtral transcription

vLLM provides optimized inference for Voxtral models with an OpenAI-compatible API.
This service proxies requests to the vLLM server.

Requirements:
- vLLM server running on VLLM_URL (default: http://localhost:8100)
- Model loaded: Voxtral-Mini-3B-2507 or Voxtral-Mini-4B-Realtime-2602
"""

import os
import logging
import time
import tempfile
import httpx
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# vLLM server configuration
VLLM_URL = os.getenv("VLLM_URL", "http://localhost:8100")
VLLM_TIMEOUT = int(os.getenv("VLLM_TIMEOUT", "300"))  # 5 minutes for long audio

# Model IDs
VOXTRAL_3B = "mistralai/Voxtral-Mini-3B-2507"
VOXTRAL_4B_REALTIME = "mistralai/Voxtral-Mini-4B-Realtime-2602"


@dataclass
class VllmTranscriptionResult:
    text: str
    language: Optional[str] = None
    model: str = "voxtral-vllm"
    latency_ms: Optional[float] = None
    duration_seconds: Optional[float] = None


async def check_health() -> dict:
    """Check if vLLM server is healthy."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{VLLM_URL}/health")
            if response.status_code == 200:
                return {"status": "healthy", "url": VLLM_URL}
            return {"status": "unhealthy", "url": VLLM_URL, "code": response.status_code}
    except Exception as e:
        return {"status": "unavailable", "url": VLLM_URL, "error": str(e)}


async def get_models() -> list:
    """Get available models from vLLM server."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{VLLM_URL}/v1/models")
            if response.status_code == 200:
                data = response.json()
                return [m["id"] for m in data.get("data", [])]
            return []
    except Exception:
        return []


def is_available() -> bool:
    """Check if vLLM server is configured."""
    return bool(VLLM_URL)


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    language: Optional[str] = "de",
    model: Optional[str] = None,
) -> VllmTranscriptionResult:
    """
    Transcribe audio using vLLM Voxtral server.

    Args:
        audio_bytes: Raw audio bytes
        filename: Original filename (for format detection)
        language: Language code (de, en, fr, etc.)
        model: Model to use (defaults to Voxtral-Mini-3B-2507)

    Returns:
        VllmTranscriptionResult with transcription
    """
    start_time = time.time()
    model_id = model or VOXTRAL_3B

    logger.info(f"Transcribing via vLLM: {filename} ({len(audio_bytes)} bytes)")

    # Save to temp file (vLLM API accepts file uploads)
    ext = Path(filename).suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        async with httpx.AsyncClient(timeout=VLLM_TIMEOUT) as client:
            # Use OpenAI-compatible transcription endpoint
            with open(tmp_path, "rb") as f:
                files = {"file": (filename, f, "audio/wav")}
                data = {
                    "model": model_id,
                    "language": language or "de",
                    "response_format": "json",
                    "temperature": 0.0,  # Deterministic for transcription
                }

                response = await client.post(
                    f"{VLLM_URL}/v1/audio/transcriptions",
                    files=files,
                    data=data,
                )

            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"vLLM error: {response.status_code} - {error_detail}")
                raise RuntimeError(f"vLLM transcription failed: {error_detail}")

            result = response.json()
            text = result.get("text", "")
            duration = result.get("duration")

            latency_ms = (time.time() - start_time) * 1000
            logger.info(f"vLLM transcription complete: {len(text)} chars in {latency_ms:.0f}ms")

            return VllmTranscriptionResult(
                text=text.strip(),
                language=language,
                model=f"vllm-{model_id.split('/')[-1]}",
                latency_ms=latency_ms,
                duration_seconds=duration,
            )

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


async def transcribe_with_realtime(
    audio_bytes: bytes,
    filename: str,
    language: Optional[str] = "de",
) -> VllmTranscriptionResult:
    """
    Transcribe using Voxtral 4B Realtime model.

    Optimized for low latency (<500ms).
    """
    return await transcribe_audio_bytes(
        audio_bytes=audio_bytes,
        filename=filename,
        language=language,
        model=VOXTRAL_4B_REALTIME,
    )


# Supported languages (same as Voxtral)
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
