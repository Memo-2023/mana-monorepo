"""
WhisperX STT Service using faster-whisper + pyannote (CUDA)
Optimized for NVIDIA GPUs (RTX 3090 etc.)

Features:
- Word-level timestamps via forced alignment
- Speaker diarization via pyannote.audio
- Segment-level timestamps with speaker labels
- VAD filtering for silence removal

Requires HuggingFace token for pyannote models:
  export HF_TOKEN=hf_xxx
  # Accept terms at: https://huggingface.co/pyannote/speaker-diarization-3.1
"""

import os
import tempfile
import logging
import time
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Lazy-loaded singletons
_whisper_model = None
_align_model = None
_align_metadata = None
_diarize_pipeline = None

HF_TOKEN = os.getenv("HF_TOKEN")
DEFAULT_MODEL = os.getenv("WHISPER_MODEL", "large-v3")
DEVICE = os.getenv("WHISPER_DEVICE", "cuda")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16")
BATCH_SIZE = int(os.getenv("WHISPERX_BATCH_SIZE", "16"))


@dataclass
class WordInfo:
    """Word with timestamp."""
    word: str
    start: float
    end: float
    score: float = 0.0
    speaker: Optional[str] = None


@dataclass
class SegmentInfo:
    """Segment with speaker and word-level detail."""
    start: float
    end: float
    text: str
    speaker: Optional[str] = None
    words: list[WordInfo] = field(default_factory=list)


@dataclass
class Utterance:
    """Speaker utterance in Memoro-compatible format."""
    speaker: int
    text: str
    offset: int  # milliseconds
    duration: int  # milliseconds


@dataclass
class WhisperXResult:
    """Rich transcription result with alignment and diarization."""
    text: str
    language: Optional[str] = None
    duration_seconds: Optional[float] = None
    segments: list[SegmentInfo] = field(default_factory=list)
    utterances: list[Utterance] = field(default_factory=list)
    speakers: dict[str, str] = field(default_factory=dict)
    speaker_map: dict[str, int] = field(default_factory=dict)
    languages: list[str] = field(default_factory=list)
    primary_language: Optional[str] = None
    words: list[WordInfo] = field(default_factory=list)


def get_whisper_model(model_name: str = None):
    """Load faster-whisper model (singleton)."""
    global _whisper_model
    model_name = model_name or DEFAULT_MODEL

    if _whisper_model is None:
        logger.info(f"Loading WhisperX model: {model_name} on {DEVICE} ({COMPUTE_TYPE})")
        try:
            import whisperx

            _whisper_model = whisperx.load_model(
                model_name,
                device=DEVICE,
                compute_type=COMPUTE_TYPE,
            )
            logger.info(f"WhisperX model loaded: {model_name}")
        except ImportError:
            raise RuntimeError(
                "whisperx not installed. "
                "Run: pip install whisperx"
            )

    return _whisper_model


def get_align_model(language_code: str):
    """Load alignment model for a specific language (cached per language)."""
    global _align_model, _align_metadata

    try:
        import whisperx

        _align_model, _align_metadata = whisperx.load_align_model(
            language_code=language_code,
            device=DEVICE,
        )
        logger.info(f"Alignment model loaded for language: {language_code}")
        return _align_model, _align_metadata
    except Exception as e:
        logger.warning(f"Failed to load alignment model for {language_code}: {e}")
        return None, None


def get_diarize_pipeline():
    """Load pyannote speaker diarization pipeline (singleton)."""
    global _diarize_pipeline

    if _diarize_pipeline is None:
        if not HF_TOKEN:
            logger.warning("HF_TOKEN not set — diarization disabled")
            return None

        try:
            import whisperx

            _diarize_pipeline = whisperx.DiarizationPipeline(
                use_auth_token=HF_TOKEN,
                device=DEVICE,
            )
            logger.info("Diarization pipeline loaded")
        except Exception as e:
            logger.warning(f"Failed to load diarization pipeline: {e}")
            return None

    return _diarize_pipeline


def _build_utterances(segments: list[SegmentInfo]) -> tuple[list[Utterance], dict[str, str], dict[str, int]]:
    """
    Build Memoro-compatible utterances from diarized segments.
    Groups consecutive segments by the same speaker.
    """
    if not segments:
        return [], {}, {}

    # Collect unique speakers
    speaker_labels = sorted(set(
        s.speaker for s in segments if s.speaker is not None
    ))
    speaker_map: dict[str, int] = {}
    speakers: dict[str, str] = {}
    for idx, label in enumerate(speaker_labels):
        speaker_map[label] = idx
        speakers[str(idx)] = label

    # Merge consecutive segments with the same speaker
    utterances: list[Utterance] = []
    current_speaker = None
    current_text_parts: list[str] = []
    current_start = 0.0
    current_end = 0.0

    for seg in segments:
        sp = seg.speaker or "SPEAKER_00"
        if sp != current_speaker:
            # Flush previous
            if current_speaker is not None and current_text_parts:
                utterances.append(Utterance(
                    speaker=speaker_map.get(current_speaker, 0),
                    text=" ".join(current_text_parts).strip(),
                    offset=int(current_start * 1000),
                    duration=int((current_end - current_start) * 1000),
                ))
            current_speaker = sp
            current_text_parts = [seg.text]
            current_start = seg.start
            current_end = seg.end
        else:
            current_text_parts.append(seg.text)
            current_end = seg.end

    # Flush last
    if current_speaker is not None and current_text_parts:
        utterances.append(Utterance(
            speaker=speaker_map.get(current_speaker, 0),
            text=" ".join(current_text_parts).strip(),
            offset=int(current_start * 1000),
            duration=int((current_end - current_start) * 1000),
        ))

    return utterances, speakers, speaker_map


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = None,
    model_name: Optional[str] = None,
    enable_diarization: bool = True,
    enable_alignment: bool = True,
    min_speakers: Optional[int] = None,
    max_speakers: Optional[int] = None,
) -> WhisperXResult:
    """
    Transcribe audio with WhisperX: alignment + diarization.

    Args:
        audio_path: Path to audio file
        language: Language code (e.g., 'de', 'en'). Auto-detect if None.
        model_name: Whisper model to use
        enable_diarization: Run speaker diarization
        enable_alignment: Run forced word alignment
        min_speakers: Minimum expected speakers (hint for diarization)
        max_speakers: Maximum expected speakers (hint for diarization)

    Returns:
        WhisperXResult with full transcription, segments, utterances, speakers
    """
    import whisperx

    start_time = time.time()

    # 1. Load audio
    audio = whisperx.load_audio(audio_path)
    audio_duration = len(audio) / 16000  # whisperx resamples to 16kHz

    # 2. Transcribe with faster-whisper
    model = get_whisper_model(model_name)
    transcribe_result = model.transcribe(
        audio,
        batch_size=BATCH_SIZE,
        language=language,
    )

    detected_language = transcribe_result.get("language", language or "en")
    raw_segments = transcribe_result.get("segments", [])

    logger.info(
        f"Transcription: {len(raw_segments)} segments, "
        f"language={detected_language}, "
        f"duration={audio_duration:.1f}s"
    )

    # 3. Forced alignment (word-level timestamps)
    if enable_alignment and raw_segments:
        align_model, align_metadata = get_align_model(detected_language)
        if align_model is not None:
            try:
                transcribe_result = whisperx.align(
                    raw_segments,
                    align_model,
                    align_metadata,
                    audio,
                    DEVICE,
                    return_char_alignments=False,
                )
                raw_segments = transcribe_result.get("segments", raw_segments)
                logger.info("Word alignment complete")
            except Exception as e:
                logger.warning(f"Alignment failed, using segment-level timestamps: {e}")

    # 4. Speaker diarization
    if enable_diarization:
        diarize_pipeline = get_diarize_pipeline()
        if diarize_pipeline is not None:
            try:
                diarize_kwargs = {}
                if min_speakers is not None:
                    diarize_kwargs["min_speakers"] = min_speakers
                if max_speakers is not None:
                    diarize_kwargs["max_speakers"] = max_speakers

                diarize_segments = diarize_pipeline(
                    audio_path,
                    **diarize_kwargs,
                )
                transcribe_result = whisperx.assign_word_speakers(
                    diarize_segments, transcribe_result
                )
                raw_segments = transcribe_result.get("segments", raw_segments)
                logger.info("Diarization complete")
            except Exception as e:
                logger.warning(f"Diarization failed: {e}")

    # 5. Build structured result
    segments: list[SegmentInfo] = []
    all_words: list[WordInfo] = []
    full_text_parts: list[str] = []

    for seg in raw_segments:
        seg_words: list[WordInfo] = []
        for w in seg.get("words", []):
            wi = WordInfo(
                word=w.get("word", ""),
                start=w.get("start", 0.0),
                end=w.get("end", 0.0),
                score=w.get("score", 0.0),
                speaker=w.get("speaker"),
            )
            seg_words.append(wi)
            all_words.append(wi)

        segment = SegmentInfo(
            start=seg.get("start", 0.0),
            end=seg.get("end", 0.0),
            text=seg.get("text", "").strip(),
            speaker=seg.get("speaker"),
            words=seg_words,
        )
        segments.append(segment)
        full_text_parts.append(segment.text)

    full_text = " ".join(full_text_parts)

    # 6. Build utterances (Memoro-compatible)
    utterances, speakers, speaker_map = _build_utterances(segments)

    latency = time.time() - start_time
    logger.info(f"WhisperX complete in {latency:.1f}s: {len(full_text)} chars, {len(speakers)} speakers")

    return WhisperXResult(
        text=full_text,
        language=detected_language,
        duration_seconds=audio_duration,
        segments=segments,
        utterances=utterances,
        speakers=speakers,
        speaker_map=speaker_map,
        languages=[detected_language] if detected_language else [],
        primary_language=detected_language,
        words=all_words,
    )


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    language: Optional[str] = None,
    model_name: Optional[str] = None,
    enable_diarization: bool = True,
    enable_alignment: bool = True,
    min_speakers: Optional[int] = None,
    max_speakers: Optional[int] = None,
) -> WhisperXResult:
    """
    Transcribe audio from bytes (for API uploads).

    Args:
        audio_bytes: Raw audio file bytes
        filename: Original filename (for extension detection)
        language: Optional language code
        model_name: Whisper model to use
        enable_diarization: Run speaker diarization
        enable_alignment: Run forced word alignment
        min_speakers: Min expected speakers
        max_speakers: Max expected speakers

    Returns:
        WhisperXResult with full transcription data
    """
    ext = Path(filename).suffix or ".wav"

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        return transcribe_audio(
            audio_path=tmp_path,
            language=language,
            model_name=model_name,
            enable_diarization=enable_diarization,
            enable_alignment=enable_alignment,
            min_speakers=min_speakers,
            max_speakers=max_speakers,
        )
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def is_available() -> bool:
    """Check if WhisperX dependencies are installed."""
    try:
        import whisperx
        return True
    except ImportError:
        return False


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
