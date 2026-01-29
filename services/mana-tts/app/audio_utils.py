"""
Audio conversion utilities for the TTS service.
Handles format conversion between WAV and MP3.
"""

import io
import logging
import tempfile
from pathlib import Path
from typing import Optional

import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)

# Supported output formats
SUPPORTED_FORMATS = ["wav", "mp3"]
DEFAULT_FORMAT = "wav"
DEFAULT_SAMPLE_RATE = 24000


def audio_to_wav_bytes(
    audio_data: np.ndarray,
    sample_rate: int = DEFAULT_SAMPLE_RATE,
) -> bytes:
    """
    Convert numpy audio array to WAV bytes.

    Args:
        audio_data: Audio samples as numpy array
        sample_rate: Sample rate in Hz

    Returns:
        WAV file as bytes
    """
    buffer = io.BytesIO()
    sf.write(buffer, audio_data, sample_rate, format="WAV")
    buffer.seek(0)
    return buffer.read()


def audio_to_mp3_bytes(
    audio_data: np.ndarray,
    sample_rate: int = DEFAULT_SAMPLE_RATE,
    bitrate: str = "192k",
) -> bytes:
    """
    Convert numpy audio array to MP3 bytes.
    Requires ffmpeg to be installed.

    Args:
        audio_data: Audio samples as numpy array
        sample_rate: Sample rate in Hz
        bitrate: MP3 bitrate (e.g., "128k", "192k", "320k")

    Returns:
        MP3 file as bytes
    """
    try:
        from pydub import AudioSegment
    except ImportError:
        logger.error("pydub not installed, falling back to WAV")
        return audio_to_wav_bytes(audio_data, sample_rate)

    # First convert to WAV
    wav_bytes = audio_to_wav_bytes(audio_data, sample_rate)

    # Then convert to MP3 using pydub
    try:
        audio_segment = AudioSegment.from_wav(io.BytesIO(wav_bytes))
        buffer = io.BytesIO()
        audio_segment.export(buffer, format="mp3", bitrate=bitrate)
        buffer.seek(0)
        return buffer.read()
    except Exception as e:
        logger.error(f"MP3 conversion failed: {e}, falling back to WAV")
        return wav_bytes


def convert_audio(
    audio_data: np.ndarray,
    sample_rate: int = DEFAULT_SAMPLE_RATE,
    output_format: str = DEFAULT_FORMAT,
) -> tuple[bytes, str]:
    """
    Convert audio data to the specified format.

    Args:
        audio_data: Audio samples as numpy array
        sample_rate: Sample rate in Hz
        output_format: Output format ("wav" or "mp3")

    Returns:
        Tuple of (audio bytes, content type)
    """
    output_format = output_format.lower()

    if output_format not in SUPPORTED_FORMATS:
        logger.warning(f"Unsupported format '{output_format}', using WAV")
        output_format = "wav"

    if output_format == "mp3":
        return audio_to_mp3_bytes(audio_data, sample_rate), "audio/mpeg"
    else:
        return audio_to_wav_bytes(audio_data, sample_rate), "audio/wav"


def get_content_type(format: str) -> str:
    """Get MIME content type for audio format."""
    content_types = {
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
    }
    return content_types.get(format.lower(), "audio/wav")


def load_reference_audio(
    file_path: str | Path,
) -> tuple[np.ndarray, int]:
    """
    Load reference audio file for voice cloning.

    Args:
        file_path: Path to the audio file

    Returns:
        Tuple of (audio data as numpy array, sample rate)
    """
    audio_data, sample_rate = sf.read(file_path)

    # Convert to mono if stereo
    if len(audio_data.shape) > 1:
        audio_data = np.mean(audio_data, axis=1)

    return audio_data, sample_rate


def resample_audio(
    audio_data: np.ndarray,
    original_sr: int,
    target_sr: int = DEFAULT_SAMPLE_RATE,
) -> np.ndarray:
    """
    Resample audio to target sample rate.

    Args:
        audio_data: Audio samples as numpy array
        original_sr: Original sample rate
        target_sr: Target sample rate

    Returns:
        Resampled audio data
    """
    if original_sr == target_sr:
        return audio_data

    from scipy import signal

    # Calculate resampling ratio
    num_samples = int(len(audio_data) * target_sr / original_sr)
    resampled = signal.resample(audio_data, num_samples)

    return resampled.astype(np.float32)


def normalize_audio(
    audio_data: np.ndarray,
    target_db: float = -3.0,
) -> np.ndarray:
    """
    Normalize audio to target dB level.

    Args:
        audio_data: Audio samples as numpy array
        target_db: Target peak level in dB

    Returns:
        Normalized audio data
    """
    # Calculate current peak
    peak = np.max(np.abs(audio_data))

    if peak == 0:
        return audio_data

    # Calculate target peak from dB
    target_peak = 10 ** (target_db / 20)

    # Apply gain
    gain = target_peak / peak
    return audio_data * gain


def save_temp_audio(
    audio_bytes: bytes,
    suffix: str = ".wav",
) -> str:
    """
    Save audio bytes to a temporary file.

    Args:
        audio_bytes: Audio data as bytes
        suffix: File extension

    Returns:
        Path to temporary file
    """
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        return tmp.name


def cleanup_temp_file(file_path: str) -> None:
    """
    Clean up a temporary file.

    Args:
        file_path: Path to the file to delete
    """
    try:
        Path(file_path).unlink()
    except Exception:
        pass  # Silent cleanup failure
