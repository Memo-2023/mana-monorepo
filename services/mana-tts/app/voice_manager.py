"""
Voice Manager for registering and managing custom voices.
Handles pre-defined voices from the voices/ directory and runtime-registered voices.
"""

import json
import logging
import os
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Base directory for voices
VOICES_DIR = Path(__file__).parent.parent / "voices"

# Registry file for custom voices
REGISTRY_FILE = VOICES_DIR / "registry.json"


@dataclass
class CustomVoice:
    """Custom voice registration."""

    id: str
    name: str
    description: str
    audio_path: str
    transcript: str
    created_at: str  # ISO format timestamp


class VoiceManager:
    """Manages custom voice registrations for F5-TTS."""

    def __init__(self, voices_dir: Path = VOICES_DIR):
        self.voices_dir = voices_dir
        self.registry_file = voices_dir / "registry.json"
        self._voices: dict[str, CustomVoice] = {}
        self._load_registry()
        self._scan_predefined_voices()

    def _load_registry(self) -> None:
        """Load voice registry from disk."""
        if not self.registry_file.exists():
            logger.info("No voice registry found, starting fresh")
            return

        try:
            with open(self.registry_file, "r") as f:
                data = json.load(f)

            for voice_id, voice_data in data.items():
                # Verify audio file exists
                if Path(voice_data["audio_path"]).exists():
                    self._voices[voice_id] = CustomVoice(**voice_data)
                else:
                    logger.warning(
                        f"Voice '{voice_id}' audio file not found: {voice_data['audio_path']}"
                    )

            logger.info(f"Loaded {len(self._voices)} custom voices from registry")

        except Exception as e:
            logger.error(f"Failed to load voice registry: {e}")

    def _save_registry(self) -> None:
        """Save voice registry to disk."""
        try:
            data = {
                voice_id: asdict(voice)
                for voice_id, voice in self._voices.items()
            }
            with open(self.registry_file, "w") as f:
                json.dump(data, f, indent=2)
            logger.info("Voice registry saved")
        except Exception as e:
            logger.error(f"Failed to save voice registry: {e}")

    def _scan_predefined_voices(self) -> None:
        """Scan voices directory for pre-defined voices."""
        if not self.voices_dir.exists():
            return

        # Look for voice directories with audio + transcript
        for voice_dir in self.voices_dir.iterdir():
            if not voice_dir.is_dir():
                continue

            voice_id = voice_dir.name
            if voice_id in self._voices:
                continue  # Already registered

            # Look for audio file
            audio_file = None
            for ext in [".wav", ".mp3", ".m4a", ".flac"]:
                candidate = voice_dir / f"reference{ext}"
                if candidate.exists():
                    audio_file = candidate
                    break

            # Look for transcript
            transcript_file = voice_dir / "transcript.txt"
            if not transcript_file.exists():
                continue

            if not audio_file:
                logger.warning(f"No reference audio found in {voice_dir}")
                continue

            # Load transcript
            try:
                transcript = transcript_file.read_text().strip()
            except Exception as e:
                logger.warning(f"Failed to read transcript for {voice_id}: {e}")
                continue

            # Load metadata if exists
            metadata_file = voice_dir / "metadata.json"
            name = voice_id
            description = f"Pre-defined voice: {voice_id}"

            if metadata_file.exists():
                try:
                    with open(metadata_file, "r") as f:
                        metadata = json.load(f)
                    name = metadata.get("name", name)
                    description = metadata.get("description", description)
                except Exception:
                    pass

            # Register pre-defined voice
            from datetime import datetime

            self._voices[voice_id] = CustomVoice(
                id=voice_id,
                name=name,
                description=description,
                audio_path=str(audio_file),
                transcript=transcript,
                created_at=datetime.now().isoformat(),
            )
            logger.info(f"Found pre-defined voice: {voice_id}")

    def register_voice(
        self,
        voice_id: str,
        name: str,
        description: str,
        audio_bytes: bytes,
        transcript: str,
        audio_extension: str = ".wav",
    ) -> CustomVoice:
        """
        Register a new custom voice.

        Args:
            voice_id: Unique voice identifier
            name: Display name
            description: Voice description
            audio_bytes: Reference audio data
            transcript: Transcript of the reference audio
            audio_extension: Audio file extension

        Returns:
            Registered CustomVoice

        Raises:
            ValueError: If voice_id already exists
        """
        if voice_id in self._voices:
            raise ValueError(f"Voice '{voice_id}' already exists")

        # Validate voice_id format
        if not voice_id.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Voice ID must be alphanumeric (with _ or -)")

        # Create voice directory
        voice_dir = self.voices_dir / voice_id
        voice_dir.mkdir(parents=True, exist_ok=True)

        # Save audio file
        audio_path = voice_dir / f"reference{audio_extension}"
        with open(audio_path, "wb") as f:
            f.write(audio_bytes)

        # Save transcript
        transcript_file = voice_dir / "transcript.txt"
        with open(transcript_file, "w") as f:
            f.write(transcript)

        # Create voice entry
        from datetime import datetime

        voice = CustomVoice(
            id=voice_id,
            name=name,
            description=description,
            audio_path=str(audio_path),
            transcript=transcript,
            created_at=datetime.now().isoformat(),
        )

        # Save metadata
        metadata_file = voice_dir / "metadata.json"
        with open(metadata_file, "w") as f:
            json.dump(
                {"name": name, "description": description},
                f,
                indent=2,
            )

        # Add to registry
        self._voices[voice_id] = voice
        self._save_registry()

        logger.info(f"Registered new voice: {voice_id}")
        return voice

    def get_voice(self, voice_id: str) -> Optional[CustomVoice]:
        """Get a voice by ID."""
        return self._voices.get(voice_id)

    def delete_voice(self, voice_id: str) -> bool:
        """
        Delete a custom voice.

        Args:
            voice_id: Voice to delete

        Returns:
            True if deleted, False if not found
        """
        if voice_id not in self._voices:
            return False

        voice = self._voices[voice_id]

        # Remove voice directory
        voice_dir = self.voices_dir / voice_id
        if voice_dir.exists():
            import shutil

            try:
                shutil.rmtree(voice_dir)
            except Exception as e:
                logger.error(f"Failed to delete voice directory: {e}")

        # Remove from registry
        del self._voices[voice_id]
        self._save_registry()

        logger.info(f"Deleted voice: {voice_id}")
        return True

    def list_voices(self) -> list[CustomVoice]:
        """List all registered custom voices."""
        return list(self._voices.values())

    def voice_exists(self, voice_id: str) -> bool:
        """Check if a voice exists."""
        return voice_id in self._voices


# Global singleton instance
_voice_manager: Optional[VoiceManager] = None


def get_voice_manager() -> VoiceManager:
    """Get the global VoiceManager instance."""
    global _voice_manager
    if _voice_manager is None:
        _voice_manager = VoiceManager()
    return _voice_manager
