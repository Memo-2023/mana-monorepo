"""
LTX-Video Service

Uses LTX-Video 0.9.x via HuggingFace diffusers for fast video generation.
Optimized for NVIDIA GPUs (CUDA).
"""

import asyncio
import logging
import os
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Configuration
MODEL_ID = os.getenv("LTX_MODEL_ID", "Lightricks/LTX-Video")
DEFAULT_WIDTH = int(os.getenv("DEFAULT_WIDTH", "704"))
DEFAULT_HEIGHT = int(os.getenv("DEFAULT_HEIGHT", "480"))
DEFAULT_NUM_FRAMES = int(os.getenv("DEFAULT_NUM_FRAMES", "81"))  # ~3.2s at 25fps
DEFAULT_FPS = int(os.getenv("DEFAULT_FPS", "25"))
DEFAULT_STEPS = int(os.getenv("DEFAULT_STEPS", "30"))
DEFAULT_GUIDANCE_SCALE = float(os.getenv("DEFAULT_GUIDANCE_SCALE", "7.5"))
GENERATION_TIMEOUT = int(os.getenv("GENERATION_TIMEOUT", "600"))  # seconds
DEVICE = os.getenv("DEVICE", "cuda")

# Output directory for generated videos
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "/tmp/mana-video-gen"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Pipeline singleton (lazy loaded)
_pipeline = None
_pipeline_lock = asyncio.Lock()


@dataclass
class GenerationResult:
    """Result of video generation."""

    video_path: str
    prompt: str
    width: int
    height: int
    num_frames: int
    fps: int
    steps: int
    seed: int
    generation_time: float


def is_model_available() -> bool:
    """Check if the model can be loaded (CUDA available + diffusers installed)."""
    try:
        import torch

        return torch.cuda.is_available()
    except ImportError:
        return False


def get_model_info() -> dict:
    """Get information about the LTX-Video model."""
    try:
        import torch

        gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "N/A"
        vram_gb = (
            round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1)
            if torch.cuda.is_available()
            else 0
        )
    except ImportError:
        gpu_name = "N/A"
        vram_gb = 0

    return {
        "model_id": MODEL_ID,
        "model_name": "LTX-Video",
        "parameters": "~2B",
        "license": "Lightricks Open License (commercial OK)",
        "cuda_available": is_model_available(),
        "gpu": gpu_name,
        "vram_gb": vram_gb,
        "default_resolution": f"{DEFAULT_WIDTH}x{DEFAULT_HEIGHT}",
        "default_frames": DEFAULT_NUM_FRAMES,
        "default_fps": DEFAULT_FPS,
        "default_steps": DEFAULT_STEPS,
        "pipeline_loaded": _pipeline is not None,
    }


async def _load_pipeline():
    """Load the LTX-Video pipeline (lazy, thread-safe)."""
    global _pipeline

    async with _pipeline_lock:
        if _pipeline is not None:
            return _pipeline

        logger.info(f"Loading LTX-Video pipeline from {MODEL_ID}...")
        load_start = time.time()

        def _load():
            import torch
            from diffusers import LTXPipeline

            pipe = LTXPipeline.from_pretrained(
                MODEL_ID,
                torch_dtype=torch.bfloat16,
            )
            pipe.to(DEVICE)
            # Enable memory optimizations
            pipe.enable_model_cpu_offload()
            return pipe

        loop = asyncio.get_event_loop()
        _pipeline = await loop.run_in_executor(None, _load)

        load_time = time.time() - load_start
        logger.info(f"LTX-Video pipeline loaded in {load_time:.1f}s")
        return _pipeline


async def unload_pipeline():
    """Unload pipeline to free VRAM."""
    global _pipeline

    async with _pipeline_lock:
        if _pipeline is not None:
            import torch

            del _pipeline
            _pipeline = None
            torch.cuda.empty_cache()
            logger.info("LTX-Video pipeline unloaded, VRAM freed")


async def generate_video(
    prompt: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    num_frames: int = DEFAULT_NUM_FRAMES,
    fps: int = DEFAULT_FPS,
    steps: int = DEFAULT_STEPS,
    guidance_scale: float = DEFAULT_GUIDANCE_SCALE,
    seed: Optional[int] = None,
    negative_prompt: str = "",
) -> GenerationResult:
    """
    Generate a video from a text prompt using LTX-Video.

    Args:
        prompt: Text prompt for video generation
        width: Video width (default 704)
        height: Video height (default 480)
        num_frames: Number of frames (default 81 = ~3.2s at 25fps)
        fps: Frames per second for output (default 25)
        steps: Number of inference steps (default 30)
        guidance_scale: CFG scale (default 7.5)
        seed: Random seed (None for random)
        negative_prompt: Negative prompt

    Returns:
        GenerationResult with video path and metadata

    Raises:
        RuntimeError: If model not available or generation fails
    """
    if not is_model_available():
        raise RuntimeError("CUDA not available - cannot generate video")

    pipe = await _load_pipeline()

    video_id = str(uuid.uuid4())[:8]
    output_path = OUTPUT_DIR / f"{video_id}.mp4"

    import torch

    actual_seed = seed if seed is not None else torch.randint(0, 2**32, (1,)).item()
    generator = torch.Generator(device="cpu").manual_seed(actual_seed)

    logger.info(
        f"Generating video: {width}x{height}, {num_frames} frames, {steps} steps, seed={actual_seed}"
    )

    start_time = time.time()

    def _generate():
        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt or None,
            width=width,
            height=height,
            num_frames=num_frames,
            num_inference_steps=steps,
            guidance_scale=guidance_scale,
            generator=generator,
        )
        return result

    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, _generate),
            timeout=GENERATION_TIMEOUT,
        )

        generation_time = time.time() - start_time

        # Export to MP4
        from diffusers.utils import export_to_video

        export_to_video(result.frames[0], str(output_path), fps=fps)

        if not output_path.exists():
            raise RuntimeError("Video generation completed but output file not found")

        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        duration_s = num_frames / fps

        logger.info(
            f"Video generated: {output_path} ({width}x{height}, {duration_s:.1f}s, "
            f"{file_size_mb:.1f}MB, took {generation_time:.1f}s)"
        )

        return GenerationResult(
            video_path=str(output_path),
            prompt=prompt,
            width=width,
            height=height,
            num_frames=num_frames,
            fps=fps,
            steps=steps,
            seed=actual_seed,
            generation_time=generation_time,
        )

    except asyncio.TimeoutError:
        logger.error(f"Video generation timed out after {GENERATION_TIMEOUT}s")
        raise RuntimeError(f"Generation timed out after {GENERATION_TIMEOUT} seconds")
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        raise


def cleanup_video(video_path: str) -> bool:
    """Delete a generated video file."""
    try:
        path = Path(video_path)
        if path.exists() and path.parent == OUTPUT_DIR:
            path.unlink()
            return True
    except Exception as e:
        logger.warning(f"Failed to cleanup video {video_path}: {e}")
    return False


def cleanup_old_videos(max_age_hours: int = 24) -> int:
    """Clean up videos older than max_age_hours."""
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
        logger.info(f"Cleaned up {cleaned} old videos")

    return cleaned
