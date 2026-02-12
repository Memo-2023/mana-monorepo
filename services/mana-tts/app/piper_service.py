"""
German TTS Service - Piper TTS (local, fast) with Edge TTS fallback.

Primary: Piper TTS - 100% local, DSGVO-konform, very fast
Fallback: Edge TTS - Cloud-based (Microsoft), high quality but sends data externally
"""

import logging
import tempfile
import os
import asyncio
from dataclasses import dataclass
from typing import Optional
from pathlib import Path
import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)

# Paths for Piper models
PIPER_VOICES_DIR = Path(__file__).parent.parent / "piper_voices"

# Available German voices
PIPER_VOICES = {
    # === LOCAL PIPER VOICES (Primary - 100% local) ===
    "de_thorsten": {
        "type": "piper",
        "model": "thorsten_medium.onnx",
        "name": "Thorsten",
        "description": "Deutsche Männerstimme (lokal, schnell)",
        "language": "de",
        "gender": "male",
        "local": True,
    },
    # === EDGE TTS VOICES (Fallback - Cloud) ===
    "de_katja": {
        "type": "edge",
        "edge_voice": "de-DE-KatjaNeural",
        "name": "Katja",
        "description": "Deutsche Frauenstimme (Cloud)",
        "language": "de",
        "gender": "female",
        "local": False,
    },
    "de_conrad": {
        "type": "edge",
        "edge_voice": "de-DE-ConradNeural",
        "name": "Conrad",
        "description": "Deutsche Männerstimme (Cloud)",
        "language": "de",
        "gender": "male",
        "local": False,
    },
    "de_amala": {
        "type": "edge",
        "edge_voice": "de-DE-AmalaNeural",
        "name": "Amala",
        "description": "Deutsche Frauenstimme jung (Cloud)",
        "language": "de",
        "gender": "female",
        "local": False,
    },
    "de_florian": {
        "type": "edge",
        "edge_voice": "de-DE-FlorianNeural",
        "name": "Florian",
        "description": "Deutsche Männerstimme jung (Cloud)",
        "language": "de",
        "gender": "male",
        "local": False,
    },
    # Legacy alias - maps to local Thorsten
    "de_anna": {
        "type": "piper",
        "model": "thorsten_medium.onnx",
        "name": "Anna (→ Thorsten)",
        "description": "Alias für Thorsten (lokal)",
        "language": "de",
        "gender": "male",
        "local": True,
    },
}

DEFAULT_PIPER_VOICE = "de_thorsten"

# Cached Piper voice instance
_piper_voice = None
_piper_available = None
_edge_available = None


def _get_piper_model_path(model_name: str) -> Path:
    """Get full path to a Piper model."""
    return PIPER_VOICES_DIR / model_name


def check_piper_available() -> bool:
    """Check if Piper TTS is available."""
    global _piper_available
    if _piper_available is not None:
        return _piper_available

    try:
        from piper import PiperVoice
        model_path = _get_piper_model_path("thorsten_medium.onnx")
        if model_path.exists():
            _piper_available = True
            logger.info(f"Piper TTS available with model: {model_path}")
        else:
            _piper_available = False
            logger.warning(f"Piper model not found: {model_path}")
    except ImportError as e:
        _piper_available = False
        logger.warning(f"Piper TTS not installed: {e}")

    return _piper_available


def _check_edge_available() -> bool:
    """Check if Edge TTS is available."""
    global _edge_available
    if _edge_available is not None:
        return _edge_available

    try:
        import edge_tts
        _edge_available = True
        logger.info("Edge TTS available as fallback")
    except ImportError:
        _edge_available = False
        logger.warning("Edge TTS not installed")

    return _edge_available


def is_piper_loaded() -> bool:
    """Check if any TTS is available."""
    return check_piper_available() or _check_edge_available()


def _get_piper_voice():
    """Get or create cached Piper voice instance."""
    global _piper_voice
    if _piper_voice is not None:
        return _piper_voice

    if not check_piper_available():
        return None

    try:
        from piper import PiperVoice
        model_path = _get_piper_model_path("thorsten_medium.onnx")
        config_path = _get_piper_model_path("thorsten_medium.onnx.json")

        logger.info(f"Loading Piper voice from {model_path}")
        _piper_voice = PiperVoice.load(str(model_path), str(config_path))
        logger.info("Piper voice loaded successfully")
        return _piper_voice
    except Exception as e:
        logger.error(f"Failed to load Piper voice: {e}")
        return None


@dataclass
class PiperSynthesisResult:
    """Result of TTS synthesis."""
    audio: np.ndarray
    sample_rate: int
    duration: float
    voice: str


async def _synthesize_with_piper(
    text: str,
    length_scale: float = 1.0,
) -> PiperSynthesisResult:
    """Synthesize using local Piper TTS."""
    voice = _get_piper_voice()
    if voice is None:
        raise RuntimeError("Piper voice not available")

    logger.debug(f"Piper synthesizing: \"{text[:50]}...\"")

    # Piper uses length_scale directly (1.0 = normal, >1 = slower)
    # Run in thread pool to not block async
    loop = asyncio.get_event_loop()

    def _synth():
        audio_data = []
        for audio_chunk in voice.synthesize_stream_raw(text, length_scale=length_scale):
            audio_data.append(audio_chunk)
        return b"".join(audio_data)

    audio_bytes = await loop.run_in_executor(None, _synth)

    # Convert to numpy (16-bit PCM)
    audio = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    sample_rate = voice.config.sample_rate

    duration = len(audio) / sample_rate
    logger.debug(f"Piper synthesis complete: {duration:.2f}s, {sample_rate}Hz")

    return PiperSynthesisResult(
        audio=audio,
        sample_rate=sample_rate,
        duration=duration,
        voice="de_thorsten",
    )


async def _synthesize_with_edge(
    text: str,
    edge_voice: str,
    length_scale: float = 1.0,
) -> PiperSynthesisResult:
    """Synthesize using Edge TTS (cloud fallback)."""
    import edge_tts

    logger.debug(f"Edge TTS synthesizing: \"{text[:50]}...\" with voice={edge_voice}")

    # Convert length_scale to rate string
    rate_percent = int((1.0 / length_scale - 1.0) * 100)
    rate_str = f"{rate_percent:+d}%"

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
        tmp_path = tmp_file.name

    try:
        communicate = edge_tts.Communicate(text, edge_voice, rate=rate_str)
        await communicate.save(tmp_path)

        audio, sample_rate = sf.read(tmp_path)

        if len(audio.shape) > 1:
            audio = audio.mean(axis=1)

        audio = audio.astype(np.float32)
        duration = len(audio) / sample_rate

        logger.debug(f"Edge TTS synthesis complete: {duration:.2f}s, {sample_rate}Hz")

        return PiperSynthesisResult(
            audio=audio,
            sample_rate=sample_rate,
            duration=duration,
            voice=edge_voice,
        )
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


async def synthesize_piper(
    text: str,
    voice: str = DEFAULT_PIPER_VOICE,
    length_scale: float = 1.0,
) -> PiperSynthesisResult:
    """
    Synthesize speech - uses local Piper if available, falls back to Edge TTS.

    Args:
        text: Text to synthesize
        voice: Voice ID (e.g., "de_thorsten", "de_katja")
        length_scale: Speed control (1.0 = normal, >1 = slower, <1 = faster)

    Returns:
        PiperSynthesisResult with audio data
    """
    if not text.strip():
        raise ValueError("Text cannot be empty")

    # Get voice config
    if voice not in PIPER_VOICES:
        logger.warning(f"Unknown voice: {voice}, using default {DEFAULT_PIPER_VOICE}")
        voice = DEFAULT_PIPER_VOICE

    voice_config = PIPER_VOICES[voice]
    voice_type = voice_config.get("type", "piper")

    # Try local Piper first for piper-type voices
    if voice_type == "piper" and check_piper_available():
        try:
            return await _synthesize_with_piper(text, length_scale)
        except Exception as e:
            logger.warning(f"Piper synthesis failed, trying Edge fallback: {e}")

    # Use Edge TTS for edge-type voices or as fallback
    if _check_edge_available():
        edge_voice = voice_config.get("edge_voice", "de-DE-ConradNeural")
        if voice_type == "piper":
            # Fallback: use Conrad for male voices
            edge_voice = "de-DE-ConradNeural"
        return await _synthesize_with_edge(text, edge_voice, length_scale)

    raise RuntimeError("No TTS backend available (neither Piper nor Edge TTS)")


def list_piper_voices() -> list[dict]:
    """List all available German voices."""
    voices = []
    piper_available = check_piper_available()
    edge_available = _check_edge_available()

    for voice_id, config in PIPER_VOICES.items():
        # Skip legacy alias
        if voice_id == "de_anna":
            continue

        voice_type = config.get("type", "piper")
        is_available = (voice_type == "piper" and piper_available) or \
                       (voice_type == "edge" and edge_available)

        voices.append({
            "id": voice_id,
            "name": config["name"],
            "description": config["description"],
            "language": config["language"],
            "gender": config.get("gender", "unknown"),
            "local": config.get("local", False),
            "installed": is_available,
            "loaded": is_available,
        })

    # Sort: local voices first
    voices.sort(key=lambda v: (not v["local"], v["id"]))

    return voices


def get_piper_voice(voice_id: str) -> Optional[dict]:
    """Get voice configuration by ID."""
    if voice_id not in PIPER_VOICES:
        return None

    config = PIPER_VOICES[voice_id]
    voice_type = config.get("type", "piper")
    piper_available = check_piper_available()
    edge_available = _check_edge_available()

    is_available = (voice_type == "piper" and piper_available) or \
                   (voice_type == "edge" and edge_available)

    return {
        "id": voice_id,
        "name": config["name"],
        "description": config["description"],
        "language": config["language"],
        "gender": config.get("gender", "unknown"),
        "local": config.get("local", False),
        "installed": is_available,
        "loaded": is_available,
    }


async def download_piper_voice(voice_id: str) -> bool:
    """Check if voice is available."""
    if voice_id not in PIPER_VOICES:
        return False

    config = PIPER_VOICES[voice_id]
    voice_type = config.get("type", "piper")

    if voice_type == "piper":
        return check_piper_available()
    elif voice_type == "edge":
        return _check_edge_available()

    return False
