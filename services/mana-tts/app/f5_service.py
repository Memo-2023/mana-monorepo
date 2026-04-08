"""
F5-TTS Service for voice cloning synthesis.
CUDA version using f5-tts PyTorch package.
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
_f5_api = None

# Default model
DEFAULT_F5_MODEL = os.getenv("F5_MODEL", "F5-TTS")

# Default generation parameters
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
    """Get or create F5-TTS API instance (singleton pattern)."""
    global _f5_api

    if _f5_api is not None:
        return _f5_api

    logger.info(f"Loading F5-TTS model: {model_name}")

    try:
        from f5_tts.api import F5TTS

        _f5_api = F5TTS(model_type="F5-TTS")
        logger.info("F5-TTS model loaded successfully (CUDA)")
        return _f5_api

    except ImportError as e:
        logger.error(f"Failed to import f5_tts: {e}")
        raise RuntimeError(
            "f5-tts not installed. Run: pip install f5-tts"
        )
    except Exception as e:
        logger.error(f"Failed to load F5-TTS model: {e}")
        raise


def is_f5_loaded() -> bool:
    """Check if F5-TTS model is currently loaded."""
    return _f5_api is not None


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
        model_name: Model identifier

    Returns:
        F5Result with audio data
    """
    import asyncio

    api = get_f5_model(model_name)

    logger.info(
        f"Synthesizing with F5-TTS: text_length={len(text)}, "
        f"ref_audio={reference_audio_path}, steps={steps}"
    )

    try:
        # F5-TTS API infer method (runs synchronously, offload to thread)
        loop = asyncio.get_event_loop()

        def _generate():
            wav, sr, _ = api.infer(
                ref_file=reference_audio_path,
                ref_text=reference_text,
                gen_text=text,
                nfe_step=steps,
                cfg_strength=cfg_strength,
                sway_sampling_coeff=sway_coef,
                speed=speed,
            )
            return wav, sr

        audio, sample_rate = await loop.run_in_executor(None, _generate)

        # Convert to numpy if needed
        if not isinstance(audio, np.ndarray):
            audio = np.array(audio, dtype=np.float32)

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
    """Synthesize speech using F5-TTS with reference audio as bytes."""
    with tempfile.NamedTemporaryFile(suffix=audio_extension, delete=False) as tmp:
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
        try:
            Path(tmp_path).unlink()
        except Exception:
            pass


def estimate_duration(text: str, speed: float = 1.0) -> float:
    """Estimate audio duration from text."""
    words = len(text) / 5
    minutes = words / 150
    seconds = minutes * 60
    return seconds / speed
