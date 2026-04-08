"""
Whisper STT Service using WhisperX (CUDA)
Provides: transcription, word-level timestamps, speaker diarization.

WhisperX pipeline:
1. faster-whisper for transcription
2. wav2vec2 for forced alignment (precise word timestamps)
3. pyannote-audio for speaker diarization
"""

import os
import tempfile
import logging
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Lazy load
_whisperx_model = None
_align_model = None
_align_metadata = None
_diarize_pipeline = None

# Config
HF_TOKEN = os.getenv("HF_TOKEN", "")

# VRAM management — unload after 10 min idle (STT uses ~3GB)
from app.vram_manager import VramManager
_vram = VramManager(
    idle_timeout=int(os.getenv("VRAM_IDLE_TIMEOUT", "600")),
    service_name="mana-stt",
)


def unload_models():
    """Unload all WhisperX models from GPU to free VRAM."""
    global _whisperx_model, _align_model, _align_metadata, _diarize_pipeline
    import torch

    if _whisperx_model is not None:
        del _whisperx_model
        _whisperx_model = None
    if _align_model is not None:
        del _align_model
        _align_model = None
        _align_metadata = None
    if _diarize_pipeline is not None:
        del _diarize_pipeline
        _diarize_pipeline = None

    torch.cuda.empty_cache()
    _vram.mark_unloaded()
    logger.info("WhisperX models unloaded, VRAM freed")


@dataclass
class WordSegment:
    word: str
    start: float
    end: float
    score: Optional[float] = None
    speaker: Optional[str] = None


@dataclass
class TranscriptionResult:
    text: str
    language: Optional[str] = None
    duration: Optional[float] = None
    segments: Optional[list] = None
    words: Optional[list[WordSegment]] = field(default_factory=list)
    speakers: Optional[list[str]] = field(default_factory=list)


def get_whisper_model(model_name: str = "large-v3", **kwargs):
    """Get or create WhisperX model instance (singleton)."""
    global _whisperx_model

    if _whisperx_model is not None:
        return _whisperx_model

    logger.info(f"Loading WhisperX model: {model_name}")
    try:
        import whisperx

        device = os.getenv("WHISPER_DEVICE", "cuda")
        compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "float16")

        default_language = os.getenv("WHISPER_DEFAULT_LANGUAGE", "de")
        _whisperx_model = whisperx.load_model(
            model_name,
            device=device,
            compute_type=compute_type,
            language=default_language,
        )
        logger.info(f"WhisperX model loaded: {model_name} on {device} ({compute_type})")
        _vram.mark_loaded()
    except ImportError as e:
        logger.error(f"Failed to import whisperx: {e}")
        raise RuntimeError("whisperx not installed. Run: pip install whisperx")
    except Exception as e:
        logger.error(f"Failed to load WhisperX model: {e}")
        raise

    return _whisperx_model


def _get_align_model(language: str, device: str = "cuda"):
    """Get or create alignment model for a language."""
    global _align_model, _align_metadata

    import whisperx

    # Reload if language changed (alignment models are language-specific)
    if _align_model is None:
        logger.info(f"Loading alignment model for language: {language}")
        _align_model, _align_metadata = whisperx.load_align_model(
            language_code=language,
            device=device,
        )
        logger.info("Alignment model loaded")

    return _align_model, _align_metadata


def _get_diarize_pipeline(device: str = "cuda"):
    """Get or create speaker diarization pipeline."""
    global _diarize_pipeline

    if _diarize_pipeline is not None:
        return _diarize_pipeline

    import torch
    from pyannote.audio import Pipeline

    token = HF_TOKEN or os.getenv("HUGGING_FACE_HUB_TOKEN", "")
    if not token:
        logger.warning("No HF_TOKEN set — speaker diarization may fail for gated models")

    logger.info("Loading speaker diarization pipeline (pyannote)...")
    _diarize_pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        token=token,
    )
    _diarize_pipeline.to(torch.device(device))
    logger.info("Diarization pipeline loaded")
    return _diarize_pipeline


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = None,
    model_name: str = "large-v3",
    align: bool = True,
    diarize: bool = False,
    min_speakers: Optional[int] = None,
    max_speakers: Optional[int] = None,
) -> TranscriptionResult:
    """
    Transcribe audio using WhisperX with optional alignment and diarization.

    Args:
        audio_path: Path to audio file
        language: Language code (auto-detect if None)
        model_name: Whisper model to use
        align: Enable word-level timestamp alignment
        diarize: Enable speaker diarization
        min_speakers: Minimum expected speakers (helps diarization)
        max_speakers: Maximum expected speakers

    Returns:
        TranscriptionResult with text, word timestamps, and speaker info
    """
    import whisperx

    device = os.getenv("WHISPER_DEVICE", "cuda")
    model = get_whisper_model(model_name)

    logger.info(f"Transcribing: {audio_path} (align={align}, diarize={diarize})")

    # Check and unload if idle, then reload
    _vram.check_and_unload(unload_models)
    _vram.touch()

    # Step 1: Load audio
    audio = whisperx.load_audio(audio_path)

    # Step 2: Transcribe with faster-whisper
    transcribe_kwargs = {"batch_size": 16}
    if language:
        transcribe_kwargs["language"] = language
    result = model.transcribe(audio, **transcribe_kwargs)
    detected_language = result.get("language", language or "en")

    # Step 3: Align (word-level timestamps)
    if align and result["segments"]:
        try:
            align_model, metadata = _get_align_model(detected_language, device)
            result = whisperx.align(
                result["segments"],
                align_model,
                metadata,
                audio,
                device,
                return_char_alignments=False,
            )
            logger.info("Word alignment complete")
        except Exception as e:
            logger.warning(f"Alignment failed (continuing without): {e}")

    # Step 4: Diarize (speaker identification)
    if diarize:
        try:
            import torch
            import torchaudio

            diarize_pipe = _get_diarize_pipeline(device)

            # pyannote needs waveform as tensor, not the whisperx audio array
            waveform = torch.from_numpy(audio).unsqueeze(0).float()
            diarize_input = {"waveform": waveform, "sample_rate": 16000}

            diarize_kwargs = {}
            if min_speakers is not None:
                diarize_kwargs["min_speakers"] = min_speakers
            if max_speakers is not None:
                diarize_kwargs["max_speakers"] = max_speakers

            diarize_output = diarize_pipe(diarize_input, **diarize_kwargs)

            # pyannote 4.x returns DiarizeOutput, extract the Annotation
            if hasattr(diarize_output, "speaker_diarization"):
                diarize_annotation = diarize_output.speaker_diarization
            else:
                diarize_annotation = diarize_output

            # Convert pyannote output to DataFrame for whisperx
            import pandas as pd
            diarize_rows = []
            for turn, _, speaker in diarize_annotation.itertracks(yield_label=True):
                diarize_rows.append({
                    "start": turn.start,
                    "end": turn.end,
                    "speaker": speaker,
                })

            diarize_df = pd.DataFrame(diarize_rows)
            result = whisperx.assign_word_speakers(diarize_df, result)
            logger.info("Speaker diarization complete")
        except Exception as e:
            logger.warning(f"Diarization failed (continuing without): {e}")
            import traceback
            traceback.print_exc()

    # Build response
    segments = result.get("segments", [])
    full_text_parts = []
    all_words = []
    speaker_set = set()

    for seg in segments:
        full_text_parts.append(seg.get("text", ""))
        speaker = seg.get("speaker")
        if speaker:
            speaker_set.add(speaker)

        for word_info in seg.get("words", []):
            all_words.append(WordSegment(
                word=word_info.get("word", ""),
                start=word_info.get("start", 0.0),
                end=word_info.get("end", 0.0),
                score=word_info.get("score"),
                speaker=word_info.get("speaker", speaker),
            ))

    text = " ".join(full_text_parts)

    _vram.touch()
    logger.info(
        f"Transcription complete: {len(text)} chars, "
        f"{len(all_words)} words, {len(speaker_set)} speakers"
    )

    return TranscriptionResult(
        text=text.strip(),
        language=detected_language,
        segments=[{
            "start": s.get("start", 0),
            "end": s.get("end", 0),
            "text": s.get("text", ""),
            "speaker": s.get("speaker"),
        } for s in segments],
        words=all_words,
        speakers=sorted(speaker_set),
    )


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    language: Optional[str] = None,
    model_name: str = "large-v3",
    align: bool = True,
    diarize: bool = False,
    min_speakers: Optional[int] = None,
    max_speakers: Optional[int] = None,
) -> TranscriptionResult:
    """Transcribe audio from bytes (for API uploads)."""
    import asyncio

    ext = Path(filename).suffix or ".wav"

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        # Run in thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: transcribe_audio(
                audio_path=tmp_path,
                language=language,
                model_name=model_name,
                align=align,
                diarize=diarize,
                min_speakers=min_speakers,
                max_speakers=max_speakers,
            ),
        )
        return result
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# Available models
AVAILABLE_MODELS = [
    "tiny",
    "tiny.en",
    "base",
    "base.en",
    "small",
    "small.en",
    "medium",
    "medium.en",
    "large-v1",
    "large-v2",
    "large-v3",
    "large-v3-turbo",
    "distil-large-v2",
    "distil-large-v3",
]
