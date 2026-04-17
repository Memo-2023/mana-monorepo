"""
Orpheus TTS — High-quality German speech synthesis.

Uses the Orpheus-TTS model with German finetune for natural-sounding
interview question generation. Not optimized for real-time — quality first.

Model: Kartoffel_Orpheus-3B_german_natural-v0.1 (HuggingFace)
VRAM: ~8 GB (fits comfortably on RTX 3090 alongside other models)
"""

import logging
import asyncio
from dataclasses import dataclass
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Lazy-loaded model state
_model = None
_tokenizer = None
_loaded = False

MODEL_ID = "Vishalshendge3198/orpheus-3b-tts-german-emotional-merged"
SAMPLE_RATE = 24000

# Available voices (Orpheus built-in speaker tags)
ORPHEUS_VOICES = {
    "tara": "Female, warm and clear (default)",
    "leah": "Female, soft and friendly",
    "jess": "Female, energetic",
    "leo": "Male, calm and professional",
    "dan": "Male, deep and warm",
    "mia": "Female, young and bright",
    "zac": "Male, confident",
    "emma": "Female, neutral",
}

DEFAULT_VOICE = "tara"


@dataclass
class OrpheusResult:
    audio: np.ndarray
    sample_rate: int
    duration: float
    voice: str


def is_orpheus_loaded() -> bool:
    return _loaded


def get_orpheus_model():
    """Load the Orpheus German model (lazy, first call only)."""
    global _model, _tokenizer, _loaded

    if _loaded:
        return _model, _tokenizer

    logger.info(f"Loading Orpheus German model: {MODEL_ID}")

    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch

        _tokenizer = AutoTokenizer.from_pretrained(
            MODEL_ID,
            trust_remote_code=True,
        )
        _model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat16,
            device_map="cuda",
            trust_remote_code=True,
        )
        _model.eval()
        _loaded = True
        logger.info("Orpheus German model loaded successfully")
        return _model, _tokenizer

    except Exception as e:
        logger.error(f"Failed to load Orpheus model: {e}")
        raise RuntimeError(f"Failed to load Orpheus model: {e}")


def unload_orpheus():
    """Free VRAM by unloading the model."""
    global _model, _tokenizer, _loaded
    import torch

    if _model is not None:
        del _model
        _model = None
    if _tokenizer is not None:
        del _tokenizer
        _tokenizer = None
    _loaded = False
    torch.cuda.empty_cache()
    logger.info("Orpheus model unloaded")


async def synthesize_orpheus(
    text: str,
    voice: str = DEFAULT_VOICE,
    temperature: float = 0.6,
    top_p: float = 0.95,
    max_new_tokens: int = 4096,
) -> OrpheusResult:
    """
    Synthesize German speech using Orpheus TTS.

    Returns OrpheusResult with audio as numpy float32 array.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        _synthesize_sync,
        text,
        voice,
        temperature,
        top_p,
        max_new_tokens,
    )


def _synthesize_sync(
    text: str,
    voice: str,
    temperature: float,
    top_p: float,
    max_new_tokens: int,
) -> OrpheusResult:
    """Synchronous synthesis (runs in thread pool)."""
    import torch

    model, tokenizer = get_orpheus_model()

    # Orpheus uses a specific prompt format with speaker tags
    prompt = f"<|speaker:{voice}|>{text}"

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
        )

    # Extract audio tokens (model-specific decoding)
    audio_tokens = outputs[0][inputs["input_ids"].shape[1]:]

    # Decode audio tokens to waveform
    # Orpheus uses a SNAC-based codec — tokens map to audio via the model's decode method
    if hasattr(model, "decode_audio"):
        audio_np = model.decode_audio(audio_tokens).cpu().numpy().flatten()
    else:
        # Fallback: use the tokenizer's decode if model doesn't have decode_audio
        # This handles different Orpheus model versions
        audio_np = _decode_orpheus_tokens(audio_tokens, model)

    duration = len(audio_np) / SAMPLE_RATE

    return OrpheusResult(
        audio=audio_np,
        sample_rate=SAMPLE_RATE,
        duration=duration,
        voice=voice,
    )


def _decode_orpheus_tokens(tokens, model) -> np.ndarray:
    """
    Decode Orpheus audio tokens using SNAC codec.

    Orpheus generates special audio tokens that need to be decoded
    through the SNAC vocoder to produce the final waveform.
    """
    import torch

    try:
        from snac import SNAC

        snac = SNAC.from_pretrained("hubertsiuzdak/snac_24khz").to(model.device)

        # Filter to audio-only tokens (above text vocab range)
        audio_token_ids = tokens[tokens >= 128256].tolist()

        if not audio_token_ids:
            logger.warning("No audio tokens generated")
            return np.zeros(SAMPLE_RATE, dtype=np.float32)  # 1s silence

        # Orpheus interleaves 3 codebook levels: [c1, c2, c3, c1, c2, c3, ...]
        # Redistribute into separate codebook tensors
        codes_0, codes_1, codes_2 = [], [], []
        for i, token_id in enumerate(audio_token_ids):
            # Offset tokens back to codebook range
            code = token_id - 128256
            level = i % 3
            if level == 0:
                codes_0.append(code)
            elif level == 1:
                codes_1.append(code)
            else:
                codes_2.append(code)

        # Trim to equal lengths
        min_len = min(len(codes_0), len(codes_1), len(codes_2))
        if min_len == 0:
            return np.zeros(SAMPLE_RATE, dtype=np.float32)

        codes = [
            torch.tensor(codes_0[:min_len], device=model.device).unsqueeze(0),
            torch.tensor(codes_1[:min_len], device=model.device).unsqueeze(0),
            torch.tensor(codes_2[:min_len], device=model.device).unsqueeze(0),
        ]

        with torch.no_grad():
            audio = snac.decode(codes).squeeze().cpu().numpy()

        return audio.astype(np.float32)

    except ImportError:
        logger.error("snac package not installed — pip install snac")
        raise RuntimeError("snac package required for Orpheus audio decoding")
