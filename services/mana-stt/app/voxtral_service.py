"""
Voxtral STT Service using Hugging Face Transformers
Mistral AI's Speech-to-Text model (Apache 2.0 License)
"""

import os
import tempfile
import logging
import base64
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Lazy load to avoid import errors
_voxtral_model = None
_voxtral_processor = None


@dataclass
class VoxtralTranscriptionResult:
    text: str
    language: Optional[str] = None
    model: str = "voxtral-mini"


def get_voxtral_model(model_name: str = "mistralai/Voxtral-Mini-3B-2507"):
    """
    Get or create Voxtral model instance.

    Note: Voxtral Mini (3B) is recommended for Mac Mini M4.
    Voxtral Small (24B) requires more VRAM.
    """
    global _voxtral_model, _voxtral_processor

    if _voxtral_model is None:
        logger.info(f"Loading Voxtral model: {model_name}")
        try:
            import torch
            from transformers import AutoModel, AutoProcessor

            # Determine device
            if torch.backends.mps.is_available():
                device = "mps"
                torch_dtype = torch.float16
            elif torch.cuda.is_available():
                device = "cuda"
                torch_dtype = torch.float16
            else:
                device = "cpu"
                torch_dtype = torch.float32

            logger.info(f"Using device: {device}")

            # Load processor
            _voxtral_processor = AutoProcessor.from_pretrained(
                model_name,
                trust_remote_code=True,
            )

            # Load model - Voxtral uses AutoModel, not AutoModelForSpeechSeq2Seq
            _voxtral_model = AutoModel.from_pretrained(
                model_name,
                torch_dtype=torch_dtype,
                device_map="auto" if device != "mps" else None,
                trust_remote_code=True,
            )

            # Move to MPS if available (device_map doesn't support MPS)
            if device == "mps":
                _voxtral_model = _voxtral_model.to(device)

            logger.info(f"Voxtral model loaded successfully on {device}")

        except ImportError as e:
            logger.error(f"Failed to import transformers: {e}")
            raise RuntimeError(
                "transformers not installed. "
                "Run: pip install transformers torch"
            )
        except Exception as e:
            logger.error(f"Failed to load Voxtral model: {e}")
            raise

    return _voxtral_model, _voxtral_processor


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = "de",
    model_name: str = "mistralai/Voxtral-Mini-3B-2507",
) -> VoxtralTranscriptionResult:
    """
    Transcribe audio file using Voxtral.

    Voxtral is a multimodal audio understanding model that can be prompted
    for transcription tasks.

    Args:
        audio_path: Path to audio file
        language: Target language for transcription
        model_name: Hugging Face model ID

    Returns:
        VoxtralTranscriptionResult with transcribed text
    """
    import torch
    import soundfile as sf
    import numpy as np

    model, processor = get_voxtral_model(model_name)

    logger.info(f"Transcribing with Voxtral: {audio_path}")

    try:
        # Load audio
        audio_array, sample_rate = sf.read(audio_path)

        # Convert stereo to mono if needed
        if len(audio_array.shape) > 1:
            audio_array = np.mean(audio_array, axis=1)

        # Resample to 24kHz (Voxtral's expected sample rate)
        target_sr = 24000
        if sample_rate != target_sr:
            from scipy import signal

            num_samples = int(len(audio_array) * target_sr / sample_rate)
            audio_array = signal.resample(audio_array, num_samples)
            sample_rate = target_sr

        # Language mapping for prompts
        lang_names = {
            "de": "German",
            "en": "English",
            "fr": "French",
            "es": "Spanish",
            "pt": "Portuguese",
            "it": "Italian",
            "nl": "Dutch",
            "hi": "Hindi",
        }
        lang_name = lang_names.get(language, "German")

        # Create transcription prompt
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "audio_url", "audio_url": {"url": f"data:audio/wav;base64,PLACEHOLDER"}},
                    {"type": "text", "text": f"Transcribe this audio in {lang_name}. Only output the transcription, nothing else."},
                ],
            }
        ]

        # Apply chat template and process inputs
        prompt = processor.apply_chat_template(messages, tokenize=False)

        # Process audio with the processor
        inputs = processor(
            text=prompt,
            audios=[audio_array],
            sampling_rate=sample_rate,
            return_tensors="pt",
        )

        # Move to same device as model
        device = next(model.parameters()).device
        inputs = {k: v.to(device) if hasattr(v, 'to') else v for k, v in inputs.items()}

        # Generate transcription
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=512,
                do_sample=False,
            )

        # Decode only the generated tokens (exclude input)
        input_len = inputs.get("input_ids", inputs.get("input_features")).shape[-1]
        text = processor.batch_decode(
            generated_ids[:, input_len:],
            skip_special_tokens=True,
        )[0]

        logger.info(f"Voxtral transcription complete: {len(text)} characters")

        return VoxtralTranscriptionResult(
            text=text.strip(),
            language=language,
            model="voxtral-mini",
        )

    except Exception as e:
        logger.error(f"Voxtral transcription failed: {e}")
        raise


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    language: Optional[str] = "de",
    model_name: str = "mistralai/Voxtral-Mini-3B-2507",
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


# Supported languages by Voxtral
SUPPORTED_LANGUAGES = [
    "en",  # English
    "de",  # German
    "fr",  # French
    "es",  # Spanish
    "pt",  # Portuguese
    "it",  # Italian
    "nl",  # Dutch
    "hi",  # Hindi
]
