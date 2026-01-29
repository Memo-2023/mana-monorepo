"""
FLUX.2 klein Image Generation Service

Uses flux2.c (Pure C implementation) for image generation.
Optimized for Apple Silicon with MPS acceleration.
"""

import asyncio
import logging
import os
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Configuration
FLUX_BINARY = os.getenv("FLUX_BINARY", os.path.expanduser("~/flux2/flux"))
FLUX_MODEL_DIR = os.getenv("FLUX_MODEL_DIR", os.path.expanduser("~/flux2/model"))
DEFAULT_STEPS = int(os.getenv("DEFAULT_STEPS", "4"))
DEFAULT_WIDTH = int(os.getenv("DEFAULT_WIDTH", "1024"))
DEFAULT_HEIGHT = int(os.getenv("DEFAULT_HEIGHT", "1024"))
DEFAULT_SEED = int(os.getenv("DEFAULT_SEED", "-1"))  # -1 = random
GENERATION_TIMEOUT = int(os.getenv("GENERATION_TIMEOUT", "300"))  # seconds (first load takes ~90s)

# Output directory for generated images
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "/tmp/mana-image-gen"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class GenerationResult:
    """Result of image generation."""

    image_path: str
    prompt: str
    width: int
    height: int
    steps: int
    seed: int
    generation_time: float


def is_flux_available() -> bool:
    """Check if flux2.c binary and model are available."""
    binary_exists = Path(FLUX_BINARY).exists()
    model_exists = Path(FLUX_MODEL_DIR).exists()
    return binary_exists and model_exists


def get_flux_info() -> dict:
    """Get information about the flux installation."""
    return {
        "binary": FLUX_BINARY,
        "binary_exists": Path(FLUX_BINARY).exists(),
        "model_dir": FLUX_MODEL_DIR,
        "model_exists": Path(FLUX_MODEL_DIR).exists(),
        "model_name": "FLUX.2-klein-4B",
        "parameters": "4 billion",
        "license": "Apache 2.0",
        "default_steps": DEFAULT_STEPS,
        "default_resolution": f"{DEFAULT_WIDTH}x{DEFAULT_HEIGHT}",
    }


async def generate_image(
    prompt: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    steps: int = DEFAULT_STEPS,
    seed: Optional[int] = None,
    output_format: str = "png",
) -> GenerationResult:
    """
    Generate an image using FLUX.2 klein via flux2.c.

    Args:
        prompt: Text prompt for image generation
        width: Image width (default 1024)
        height: Image height (default 1024)
        steps: Number of sampling steps (default 4)
        seed: Random seed (-1 for random)
        output_format: Output format (png, jpg)

    Returns:
        GenerationResult with image path and metadata

    Raises:
        RuntimeError: If flux2.c is not available or generation fails
    """
    if not is_flux_available():
        raise RuntimeError(
            f"flux2.c not available. Binary: {FLUX_BINARY}, Model: {FLUX_MODEL_DIR}"
        )

    # Generate unique output filename
    image_id = str(uuid.uuid4())[:8]
    output_path = OUTPUT_DIR / f"{image_id}.{output_format}"

    # Use provided seed or generate random
    actual_seed = seed if seed is not None and seed >= 0 else -1

    # Build flux2.c command
    cmd = [
        FLUX_BINARY,
        "-d", FLUX_MODEL_DIR,
        "-p", prompt,
        "-o", str(output_path),
        "-W", str(width),
        "-H", str(height),
        "-s", str(steps),
    ]

    if actual_seed >= 0:
        cmd.extend(["-S", str(actual_seed)])

    logger.info(f"Running flux2.c: {' '.join(cmd[:6])}...")

    import time
    start_time = time.time()

    try:
        # Run flux2.c as subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=GENERATION_TIMEOUT,
        )

        generation_time = time.time() - start_time

        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(f"flux2.c failed: {error_msg}")
            raise RuntimeError(f"Image generation failed: {error_msg}")

        # Verify output file exists
        if not output_path.exists():
            raise RuntimeError("Image generation completed but output file not found")

        # Parse seed from output if random
        parsed_seed = actual_seed
        if stdout:
            output_text = stdout.decode()
            # flux2.c outputs "seed: 12345" when using random seed
            for line in output_text.split("\n"):
                if line.startswith("seed:"):
                    try:
                        parsed_seed = int(line.split(":")[1].strip())
                    except (ValueError, IndexError):
                        pass

        logger.info(
            f"Image generated: {output_path} ({width}x{height}, {steps} steps, {generation_time:.2f}s)"
        )

        return GenerationResult(
            image_path=str(output_path),
            prompt=prompt,
            width=width,
            height=height,
            steps=steps,
            seed=parsed_seed,
            generation_time=generation_time,
        )

    except asyncio.TimeoutError:
        logger.error(f"Image generation timed out after {GENERATION_TIMEOUT}s")
        raise RuntimeError(f"Generation timed out after {GENERATION_TIMEOUT} seconds")
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        raise


def cleanup_image(image_path: str) -> bool:
    """Delete a generated image file."""
    try:
        path = Path(image_path)
        if path.exists() and path.parent == OUTPUT_DIR:
            path.unlink()
            return True
    except Exception as e:
        logger.warning(f"Failed to cleanup image {image_path}: {e}")
    return False


def cleanup_old_images(max_age_hours: int = 24) -> int:
    """Clean up images older than max_age_hours."""
    import time

    cleaned = 0
    cutoff = time.time() - (max_age_hours * 3600)

    try:
        for file in OUTPUT_DIR.iterdir():
            if file.is_file() and file.stat().st_mtime < cutoff:
                file.unlink()
                cleaned += 1
    except Exception as e:
        logger.warning(f"Cleanup error: {e}")

    if cleaned > 0:
        logger.info(f"Cleaned up {cleaned} old images")

    return cleaned
