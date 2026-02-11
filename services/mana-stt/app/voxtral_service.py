"""
Voxtral STT Service using Hugging Face Transformers
Mistral AI's Speech-to-Text model (Apache 2.0 License)

Uses VoxtralForConditionalGeneration with apply_transcription_request
as per official HuggingFace documentation.
"""

import os
import tempfile
import logging
import time
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Lazy load to avoid import errors
_voxtral_model = None
_voxtral_processor = None
_model_name = None

# Default model
DEFAULT_MODEL = "mistralai/Voxtral-Mini-3B-2507"


@dataclass
class VoxtralTranscriptionResult:
    text: str
    language: Optional[str] = None
    model: str = "voxtral-mini-3b"
    latency_ms: Optional[float] = None


def get_voxtral_model(model_name: str = DEFAULT_MODEL):
    """
    Get or create Voxtral model instance.

    Uses VoxtralForConditionalGeneration (the correct class for Voxtral).
    """
    global _voxtral_model, _voxtral_processor, _model_name

    # Reload if different model requested
    if _voxtral_model is not None and _model_name != model_name:
        logger.info(f"Switching model from {_model_name} to {model_name}")
        _voxtral_model = None
        _voxtral_processor = None

    if _voxtral_model is None:
        logger.info(f"Loading Voxtral model: {model_name}")
        try:
            import torch
            from transformers import VoxtralForConditionalGeneration, AutoProcessor

            # Determine device and dtype
            if torch.backends.mps.is_available():
                device = "mps"
                # MPS works better with float16
                torch_dtype = torch.float16
            elif torch.cuda.is_available():
                device = "cuda"
                torch_dtype = torch.bfloat16
            else:
                device = "cpu"
                torch_dtype = torch.float32

            logger.info(f"Using device: {device}, dtype: {torch_dtype}")

            # Load processor
            _voxtral_processor = AutoProcessor.from_pretrained(model_name)

            # Load model with VoxtralForConditionalGeneration
            if device == "mps":
                # MPS doesn't support device_map, load to CPU first then move
                _voxtral_model = VoxtralForConditionalGeneration.from_pretrained(
                    model_name,
                    torch_dtype=torch_dtype,
                )
                _voxtral_model = _voxtral_model.to(device)
            else:
                _voxtral_model = VoxtralForConditionalGeneration.from_pretrained(
                    model_name,
                    torch_dtype=torch_dtype,
                    device_map=device,
                )

            _model_name = model_name
            logger.info(f"Voxtral model loaded successfully on {device}")

        except ImportError as e:
            logger.error(f"Failed to import transformers: {e}")
            raise RuntimeError(
                "transformers >= 4.54.0 required. "
                "Run: pip install --upgrade transformers"
            )
        except Exception as e:
            logger.error(f"Failed to load Voxtral model: {e}")
            raise

    return _voxtral_model, _voxtral_processor


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = "de",
    model_name: str = DEFAULT_MODEL,
) -> VoxtralTranscriptionResult:
    """
    Transcribe audio file using Voxtral.

    Uses the official apply_transcription_request method.

    Args:
        audio_path: Path to audio file
        language: Language code (de, en, fr, etc.)
        model_name: Hugging Face model ID

    Returns:
        VoxtralTranscriptionResult with transcribed text
    """
    import torch

    model, processor = get_voxtral_model(model_name)
    device = next(model.parameters()).device
    dtype = next(model.parameters()).dtype

    logger.info(f"Transcribing with Voxtral: {audio_path}")
    start_time = time.time()

    try:
        # Use apply_transcription_request (official method)
        # This handles audio loading and preprocessing internally
        inputs = processor.apply_transcription_request(
            language=language or "en",
            audio=audio_path,
            model_id=model_name,
        )

        # Move inputs to device and dtype
        inputs = inputs.to(device, dtype=dtype)

        # Generate transcription
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=500,
                do_sample=False,
            )

        # Decode - skip input tokens
        input_len = inputs.input_ids.shape[1]
        decoded = processor.batch_decode(
            outputs[:, input_len:],
            skip_special_tokens=True,
        )

        text = decoded[0] if decoded else ""
        latency_ms = (time.time() - start_time) * 1000

        logger.info(f"Voxtral transcription complete: {len(text)} chars in {latency_ms:.0f}ms")

        return VoxtralTranscriptionResult(
            text=text.strip(),
            language=language,
            model=model_name.split("/")[-1],
            latency_ms=latency_ms,
        )

    except Exception as e:
        logger.error(f"Voxtral transcription failed: {e}")
        raise


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    language: Optional[str] = "de",
    model_name: str = DEFAULT_MODEL,
) -> VoxtralTranscriptionResult:
    """
    Transcribe audio from bytes (for API uploads).
    """
    ext = Path(filename).suffix or ".wav"

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
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def unload_model():
    """Unload model to free memory."""
    global _voxtral_model, _voxtral_processor, _model_name

    if _voxtral_model is not None:
        del _voxtral_model
        del _voxtral_processor
        _voxtral_model = None
        _voxtral_processor = None
        _model_name = None

        import gc
        gc.collect()

        try:
            import torch
            if torch.backends.mps.is_available():
                torch.mps.empty_cache()
            elif torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass

        logger.info("Voxtral model unloaded")


def is_loaded() -> bool:
    """Check if model is currently loaded."""
    return _voxtral_model is not None


def get_loaded_model_name() -> Optional[str]:
    """Get name of currently loaded model."""
    return _model_name


# Supported languages (13 languages as per Mistral docs)
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

# Available models
AVAILABLE_MODELS = [
    {
        "id": "voxtral-mini-3b",
        "name": "Voxtral-Mini-3B-2507",
        "huggingface_id": "mistralai/Voxtral-Mini-3B-2507",
        "params": "3B",
        "vram": "~6GB",
        "description": "Balanced quality and speed for local deployment",
    },
]
