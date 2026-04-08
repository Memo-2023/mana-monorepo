"""
Kokoro TTS Service for fast preset voice synthesis.
CUDA version using kokoro PyTorch package.
"""

import logging
from dataclasses import dataclass
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Global singleton for lazy initialization
_kokoro_pipeline = None

# Default model
DEFAULT_KOKORO_MODEL = "hexgrad/Kokoro-82M"

# Available Kokoro voices (American Female/Male, British Female/Male)
KOKORO_VOICES = {
    # American Female voices
    "af_heart": "American Female - Heart (warm, emotional)",
    "af_alloy": "American Female - Alloy (neutral, professional)",
    "af_aoede": "American Female - Aoede (clear, articulate)",
    "af_bella": "American Female - Bella (friendly, approachable)",
    "af_jessica": "American Female - Jessica (confident, clear)",
    "af_kore": "American Female - Kore (calm, measured)",
    "af_nicole": "American Female - Nicole (bright, energetic)",
    "af_nova": "American Female - Nova (modern, dynamic)",
    "af_river": "American Female - River (smooth, flowing)",
    "af_sarah": "American Female - Sarah (warm, conversational)",
    "af_sky": "American Female - Sky (light, airy)",
    # American Male voices
    "am_adam": "American Male - Adam (deep, authoritative)",
    "am_echo": "American Male - Echo (resonant, clear)",
    "am_eric": "American Male - Eric (professional, neutral)",
    "am_fenrir": "American Male - Fenrir (strong, commanding)",
    "am_liam": "American Male - Liam (friendly, casual)",
    "am_michael": "American Male - Michael (warm, trustworthy)",
    "am_onyx": "American Male - Onyx (deep, smooth)",
    "am_puck": "American Male - Puck (playful, light)",
    # British Female voices
    "bf_alice": "British Female - Alice (refined, elegant)",
    "bf_emma": "British Female - Emma (clear, professional)",
    "bf_isabella": "British Female - Isabella (sophisticated, warm)",
    "bf_lily": "British Female - Lily (soft, gentle)",
    # British Male voices
    "bm_daniel": "British Male - Daniel (classic, authoritative)",
    "bm_fable": "British Male - Fable (storyteller, expressive)",
    "bm_george": "British Male - George (traditional, clear)",
    "bm_lewis": "British Male - Lewis (modern, approachable)",
}

DEFAULT_VOICE = "af_heart"


@dataclass
class KokoroResult:
    """Result from Kokoro TTS synthesis."""

    audio: np.ndarray
    sample_rate: int
    voice: str
    duration: float


def get_kokoro_model(model_name: str = DEFAULT_KOKORO_MODEL):
    """Get or create Kokoro pipeline instance (singleton pattern)."""
    global _kokoro_pipeline

    if _kokoro_pipeline is not None:
        return _kokoro_pipeline

    logger.info(f"Loading Kokoro model: {model_name}")

    try:
        from kokoro import KPipeline

        _kokoro_pipeline = KPipeline(lang_code="a")  # 'a' for American English
        logger.info("Kokoro pipeline loaded successfully")
        return _kokoro_pipeline

    except ImportError as e:
        logger.error(f"Failed to import kokoro: {e}")
        raise RuntimeError(
            "kokoro not installed. Run: pip install kokoro"
        )
    except Exception as e:
        logger.error(f"Failed to load Kokoro model: {e}")
        raise


def is_kokoro_loaded() -> bool:
    """Check if Kokoro model is currently loaded."""
    return _kokoro_pipeline is not None


def get_available_voices() -> dict[str, str]:
    """Get dictionary of available Kokoro voices."""
    return KOKORO_VOICES.copy()


async def synthesize_kokoro(
    text: str,
    voice: str = DEFAULT_VOICE,
    speed: float = 1.0,
    model_name: str = DEFAULT_KOKORO_MODEL,
) -> KokoroResult:
    """
    Synthesize speech using Kokoro TTS.

    Args:
        text: Text to synthesize
        voice: Voice ID from KOKORO_VOICES
        speed: Speech speed multiplier (0.5-2.0)
        model_name: Model identifier

    Returns:
        KokoroResult with audio data
    """
    # Validate voice
    if voice not in KOKORO_VOICES:
        logger.warning(f"Unknown voice '{voice}', using default '{DEFAULT_VOICE}'")
        voice = DEFAULT_VOICE

    # Clamp speed to valid range
    speed = max(0.5, min(2.0, speed))

    # Get model
    pipeline = get_kokoro_model(model_name)

    logger.info(f"Synthesizing with Kokoro: voice={voice}, speed={speed}, text_length={len(text)}")

    try:
        # Generate audio using kokoro pipeline
        audio_chunks = []
        sample_rate = 24000  # Kokoro default

        for result in pipeline(text, voice=voice, speed=speed):
            # result is a KPipelineResult with .audio (tensor) and .graphemes/.phonemes
            audio_np = result.audio.numpy()
            audio_chunks.append(audio_np)

        # Concatenate all chunks
        if audio_chunks:
            full_audio = np.concatenate(audio_chunks)
        else:
            raise RuntimeError("No audio generated")

        # Calculate duration from audio length
        total_duration = len(full_audio) / sample_rate

        logger.info(f"Kokoro synthesis complete: duration={total_duration:.2f}s")

        return KokoroResult(
            audio=full_audio,
            sample_rate=sample_rate,
            voice=voice,
            duration=total_duration,
        )

    except Exception as e:
        logger.error(f"Kokoro synthesis failed: {e}")
        raise RuntimeError(f"TTS synthesis failed: {e}")
