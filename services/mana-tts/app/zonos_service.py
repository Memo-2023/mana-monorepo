"""
Zonos TTS — Expressive multilingual speech synthesis by Zyphra.

Trained on 200k hours of speech data with explicit German support.
Fine-grained control over pitch, speaking rate, and emotions.

Model: Zyphra/Zonos-v0.1-transformer (HuggingFace)
VRAM: ~5 GB (fits comfortably on RTX 3090)
"""

import logging
import asyncio
import os
from dataclasses import dataclass
from typing import Optional

import numpy as np

# Disable torch.compile (requires MSVC cl.exe on Windows which we don't have)
os.environ["TORCHDYNAMO_DISABLE"] = "1"

logger = logging.getLogger(__name__)

# Lazy-loaded model state
_model = None
_loaded = False

MODEL_ID = "Zyphra/Zonos-v0.1-transformer"
SAMPLE_RATE = 44100  # Zonos outputs 44.1 kHz audio

# Emotion presets for the interview context
EMOTION_PRESETS = {
    "neutral": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0],  # neutral dominant
    "friendly": [0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5],  # happiness + neutral
    "warm": [0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7],  # slight warmth
    "curious": [0.2, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7],  # interested
}

DEFAULT_EMOTION = "friendly"


@dataclass
class ZonosResult:
    audio: np.ndarray
    sample_rate: int
    duration: float
    emotion: str


def is_zonos_loaded() -> bool:
    return _loaded


def get_zonos_model():
    """Load the Zonos model (lazy, first call only)."""
    global _model, _loaded

    if _loaded:
        return _model

    logger.info(f"Loading Zonos model: {MODEL_ID}")

    try:
        import torch

        # Zonos provides its own loader
        # Try the official zonos package first, fall back to transformers
        try:
            from zonos.model import Zonos

            _model = Zonos.from_pretrained(MODEL_ID, device="cuda")
        except ImportError:
            # If zonos package not installed, use transformers
            logger.info("zonos package not found, trying transformers loading")
            from transformers import AutoModel

            _model = AutoModel.from_pretrained(
                MODEL_ID,
                torch_dtype=torch.float32,
                trust_remote_code=True,
            ).to("cuda")

        _loaded = True
        logger.info("Zonos model loaded successfully")
        return _model

    except Exception as e:
        logger.error(f"Failed to load Zonos model: {e}")
        raise RuntimeError(f"Failed to load Zonos model: {e}")


def unload_zonos():
    """Free VRAM by unloading the model."""
    global _model, _loaded
    import torch

    if _model is not None:
        del _model
        _model = None
    _loaded = False
    torch.cuda.empty_cache()
    logger.info("Zonos model unloaded")


async def synthesize_zonos(
    text: str,
    language: str = "de",
    emotion: str = DEFAULT_EMOTION,
    speaking_rate: float = 13.0,
    pitch_std: float = 20.0,
    speaker_audio: Optional[bytes] = None,
) -> ZonosResult:
    """
    Synthesize speech using Zonos TTS.

    Args:
        text: Text to synthesize
        language: Language code (default: 'de' for German)
        emotion: Emotion preset name or custom emotion vector
        speaking_rate: Speaking rate in phonemes/sec (default 13.0, range ~8-20)
        pitch_std: Pitch variation in Hz (default 20.0, range ~5-50)
        speaker_audio: Optional reference audio bytes for voice cloning

    Returns ZonosResult with audio as numpy float32 array.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        _synthesize_sync,
        text,
        language,
        emotion,
        speaking_rate,
        pitch_std,
        speaker_audio,
    )


def _synthesize_sync(
    text: str,
    language: str,
    emotion: str,
    speaking_rate: float,
    pitch_std: float,
    speaker_audio: Optional[bytes],
) -> ZonosResult:
    """Synchronous synthesis (runs in thread pool)."""
    import torch
    from zonos.conditioning import make_cond_dict

    model = get_zonos_model()

    # Resolve emotion preset
    emotion_values = EMOTION_PRESETS.get(emotion, EMOTION_PRESETS["friendly"])

    # Build speaker embedding if reference audio provided
    speaker_embedding = None
    if speaker_audio:
        speaker_embedding = _embed_speaker(speaker_audio, model)

    # Map language codes: Zonos expects espeak language codes like 'de' or 'en-us'
    lang_map = {"de": "de", "en": "en-us", "fr": "fr-fr", "es": "es", "it": "it"}
    espeak_lang = lang_map.get(language, language)

    # Build conditioning using Zonos's own helper
    cond = make_cond_dict(
        text=text,
        language=espeak_lang,
        emotion=emotion_values,
        speaking_rate=speaking_rate,
        pitch_std=pitch_std,
        speaker=speaker_embedding,
    )

    # Generate
    with torch.no_grad():
        conditioning = model.prepare_conditioning(cond)
        codes = model.generate(conditioning)
        audio = model.autoencoder.decode(codes).squeeze().cpu().numpy()

    audio = audio.astype(np.float32)
    duration = len(audio) / SAMPLE_RATE

    return ZonosResult(
        audio=audio,
        sample_rate=SAMPLE_RATE,
        duration=duration,
        emotion=emotion,
    )


def _embed_speaker(audio_bytes: bytes, model) -> "torch.Tensor":
    """Create speaker embedding from reference audio bytes."""
    import torch
    import io
    import soundfile as sf

    audio_data, sr = sf.read(io.BytesIO(audio_bytes))

    if len(audio_data.shape) > 1:
        audio_data = audio_data.mean(axis=1)  # mono

    audio_tensor = torch.tensor(audio_data, dtype=torch.float32, device="cuda").unsqueeze(0)

    return model.make_speaker_embedding(audio_tensor, sr)
