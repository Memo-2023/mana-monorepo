"""
F5-TTS Service for voice cloning synthesis.
Uses f5-tts-mlx optimized for Apple Silicon.
"""

import logging
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Global singleton for lazy initialization
_f5_model = None
_f5_model_name = None

# Default model
DEFAULT_F5_MODEL = os.getenv("F5_MODEL", "lucasnewman/f5-tts-mlx")

# Default generation parameters
DEFAULT_DURATION = 10.0  # seconds
DEFAULT_STEPS = 32
DEFAULT_CFG_STRENGTH = 2.0
DEFAULT_SWAY_COEF = -1.0
DEFAULT_SPEED = 1.0


@dataclass
class F5Result:
    """Result from F5-TTS synthesis."""

    audio: np.ndarray
    sample_rate: int
    duration: float
    voice_id: Optional[str] = None


def get_f5_model(model_name: str = DEFAULT_F5_MODEL):
    """
    Get or create F5-TTS model instance (singleton pattern).

    Args:
        model_name: HuggingFace model identifier

    Returns:
        F5TTS model instance
    """
    global _f5_model, _f5_model_name

    # Return existing model if same model name
    if _f5_model is not None and _f5_model_name == model_name:
        return _f5_model

    logger.info(f"Loading F5-TTS model: {model_name}")

    try:
        from f5_tts_mlx import F5TTS

        _f5_model = F5TTS(model_name=model_name)
        _f5_model_name = model_name
        logger.info("F5-TTS model loaded successfully")
        return _f5_model

    except ImportError as e:
        logger.error(f"Failed to import f5_tts_mlx: {e}")
        raise RuntimeError(
            "f5-tts-mlx not installed. Run: pip install f5-tts-mlx"
        )
    except Exception as e:
        logger.error(f"Failed to load F5-TTS model: {e}")
        raise


def is_f5_loaded() -> bool:
    """Check if F5-TTS model is currently loaded."""
    return _f5_model is not None


async def synthesize_f5(
    text: str,
    reference_audio_path: str,
    reference_text: str,
    duration: Optional[float] = None,
    steps: int = DEFAULT_STEPS,
    cfg_strength: float = DEFAULT_CFG_STRENGTH,
    sway_coef: float = DEFAULT_SWAY_COEF,
    speed: float = DEFAULT_SPEED,
    model_name: str = DEFAULT_F5_MODEL,
) -> F5Result:
    """
    Synthesize speech using F5-TTS with voice cloning.

    Args:
        text: Text to synthesize
        reference_audio_path: Path to reference audio file
        reference_text: Transcript of the reference audio
        duration: Target duration in seconds (auto-calculated if None)
        steps: Number of diffusion steps
        cfg_strength: Classifier-free guidance strength
        sway_coef: Sway sampling coefficient
        speed: Speech speed multiplier
        model_name: HuggingFace model identifier

    Returns:
        F5Result with audio data
    """
    # Get model
    model = get_f5_model(model_name)

    logger.info(
        f"Synthesizing with F5-TTS: text_length={len(text)}, "
        f"ref_audio={reference_audio_path}, steps={steps}"
    )

    try:
        # Generate audio
        audio, sample_rate = model.generate(
            text=text,
            ref_audio_path=reference_audio_path,
            ref_audio_text=reference_text,
            duration=duration,
            steps=steps,
            cfg_strength=cfg_strength,
            sway_coef=sway_coef,
            speed=speed,
        )

        # Calculate duration
        audio_duration = len(audio) / sample_rate

        logger.info(f"F5-TTS synthesis complete: duration={audio_duration:.2f}s")

        return F5Result(
            audio=audio,
            sample_rate=sample_rate,
            duration=audio_duration,
        )

    except Exception as e:
        logger.error(f"F5-TTS synthesis failed: {e}")
        raise RuntimeError(f"Voice cloning synthesis failed: {e}")


async def synthesize_f5_from_bytes(
    text: str,
    reference_audio_bytes: bytes,
    reference_text: str,
    audio_extension: str = ".wav",
    **kwargs,
) -> F5Result:
    """
    Synthesize speech using F5-TTS with reference audio as bytes.

    Args:
        text: Text to synthesize
        reference_audio_bytes: Reference audio as bytes
        reference_text: Transcript of the reference audio
        audio_extension: File extension for temp file
        **kwargs: Additional arguments passed to synthesize_f5

    Returns:
        F5Result with audio data
    """
    # Save reference audio to temp file
    with tempfile.NamedTemporaryFile(
        suffix=audio_extension,
        delete=False,
    ) as tmp:
        tmp.write(reference_audio_bytes)
        tmp_path = tmp.name

    try:
        result = await synthesize_f5(
            text=text,
            reference_audio_path=tmp_path,
            reference_text=reference_text,
            **kwargs,
        )
        return result
    finally:
        # Clean up temp file
        try:
            Path(tmp_path).unlink()
        except Exception:
            pass


def estimate_duration(text: str, speed: float = 1.0) -> float:
    """
    Estimate audio duration from text.

    Args:
        text: Text to synthesize
        speed: Speech speed multiplier

    Returns:
        Estimated duration in seconds
    """
    # Rough estimate: ~150 words per minute at normal speed
    # Average word length: ~5 characters
    words = len(text) / 5
    minutes = words / 150
    seconds = minutes * 60
    return seconds / speed
