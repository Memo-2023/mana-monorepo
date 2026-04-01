"""
Mana Video Generation - AI Video Generation Microservice

Provides video generation using LTX-Video via HuggingFace diffusers.
Optimized for NVIDIA RTX 3090 (CUDA).

API:
- POST /generate - Generate video from text prompt
- GET /health - Health check
- GET /models - Model information
- POST /unload - Free VRAM by unloading model
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .ltx_service import (
    generate_video,
    unload_pipeline,
    is_model_available,
    get_model_info,
    cleanup_video,
    cleanup_old_videos,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    DEFAULT_NUM_FRAMES,
    DEFAULT_FPS,
    DEFAULT_STEPS,
    DEFAULT_GUIDANCE_SCALE,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Configuration from environment
PORT = int(os.getenv("PORT", "3026"))
MAX_PROMPT_LENGTH = int(os.getenv("MAX_PROMPT_LENGTH", "2000"))
MIN_DIMENSION = int(os.getenv("MIN_DIMENSION", "256"))
MAX_DIMENSION = int(os.getenv("MAX_DIMENSION", "1280"))
MAX_FRAMES = int(os.getenv("MAX_FRAMES", "161"))  # ~6.4s at 25fps
MAX_STEPS = int(os.getenv("MAX_STEPS", "50"))
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://mana.how,https://picture.mana.how,https://chat.mana.how,http://localhost:5173",
).split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown."""
    logger.info(f"Starting Mana Video Generation service on port {PORT}")

    if is_model_available():
        info = get_model_info()
        logger.info(f"CUDA available: {info['gpu']} ({info['vram_gb']} GB VRAM)")
    else:
        logger.warning("CUDA not available - service will return errors until GPU is accessible")

    # Cleanup old videos on startup
    cleanup_old_videos(max_age_hours=24)

    yield

    # Unload model on shutdown
    await unload_pipeline()
    logger.info("Shutting down Mana Video Generation service")


# Create FastAPI app
app = FastAPI(
    title="Mana Video Generation",
    description="AI video generation service using LTX-Video",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request/Response Models
# ============================================================================


class GenerateRequest(BaseModel):
    """Request for video generation."""

    prompt: str = Field(
        ...,
        description="Text prompt for video generation",
        min_length=1,
        max_length=2000,
    )
    negative_prompt: str = Field(
        "",
        description="Negative prompt (what to avoid)",
        max_length=1000,
    )
    width: int = Field(
        DEFAULT_WIDTH,
        ge=256,
        le=1280,
        description="Video width in pixels (must be divisible by 32)",
    )
    height: int = Field(
        DEFAULT_HEIGHT,
        ge=256,
        le=1280,
        description="Video height in pixels (must be divisible by 32)",
    )
    num_frames: int = Field(
        DEFAULT_NUM_FRAMES,
        ge=9,
        le=161,
        description="Number of frames (81 = ~3.2s at 25fps)",
    )
    fps: int = Field(
        DEFAULT_FPS,
        ge=8,
        le=30,
        description="Frames per second for output video",
    )
    steps: int = Field(
        DEFAULT_STEPS,
        ge=1,
        le=50,
        description="Number of inference steps",
    )
    guidance_scale: float = Field(
        DEFAULT_GUIDANCE_SCALE,
        ge=1.0,
        le=20.0,
        description="Classifier-free guidance scale",
    )
    seed: Optional[int] = Field(
        None,
        ge=0,
        description="Random seed (None for random)",
    )


class GenerateResponse(BaseModel):
    """Response for video generation."""

    success: bool
    video_url: str
    prompt: str
    width: int
    height: int
    num_frames: int
    fps: int
    duration: float
    steps: int
    seed: int
    generation_time: float


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    service: str
    cuda_available: bool
    gpu: str


class ModelsResponse(BaseModel):
    """Available models response."""

    ltx_video: dict


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: str


# ============================================================================
# Health & Info Endpoints
# ============================================================================


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check service health and CUDA availability."""
    info = get_model_info()
    return HealthResponse(
        status="healthy" if is_model_available() else "degraded",
        service="mana-video-gen",
        cuda_available=info["cuda_available"],
        gpu=info["gpu"],
    )


@app.get("/models", response_model=ModelsResponse)
async def get_models():
    """Get information about available models."""
    return ModelsResponse(ltx_video=get_model_info())


# ============================================================================
# Video Generation Endpoints
# ============================================================================


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Generate a video from a text prompt using LTX-Video.

    LTX-Video generates 480p video clips in 10-30 seconds on RTX 3090.
    The model is loaded on first request and stays in VRAM until /unload.
    """
    # Validate prompt
    if len(request.prompt) > MAX_PROMPT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH} characters",
        )

    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # Validate dimensions are divisible by 32 (required by VAE)
    if request.width % 32 != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Width must be divisible by 32 (got {request.width})",
        )
    if request.height % 32 != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Height must be divisible by 32 (got {request.height})",
        )

    # Validate frames
    if request.num_frames > MAX_FRAMES:
        raise HTTPException(
            status_code=400,
            detail=f"num_frames must be at most {MAX_FRAMES}",
        )

    # Validate steps
    if request.steps > MAX_STEPS:
        raise HTTPException(
            status_code=400,
            detail=f"Steps must be at most {MAX_STEPS}",
        )

    # Check CUDA availability
    if not is_model_available():
        raise HTTPException(
            status_code=503,
            detail="Video generation service not available. CUDA not detected.",
        )

    try:
        result = await generate_video(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width,
            height=request.height,
            num_frames=request.num_frames,
            fps=request.fps,
            steps=request.steps,
            guidance_scale=request.guidance_scale,
            seed=request.seed,
        )

        video_filename = Path(result.video_path).name
        video_url = f"/videos/{video_filename}"

        return GenerateResponse(
            success=True,
            video_url=video_url,
            prompt=result.prompt,
            width=result.width,
            height=result.height,
            num_frames=result.num_frames,
            fps=result.fps,
            duration=round(result.num_frames / result.fps, 2),
            steps=result.steps,
            seed=result.seed,
            generation_time=round(result.generation_time, 2),
        )

    except RuntimeError as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Video generation failed: {e}")


@app.get("/videos/{filename}")
async def get_video(filename: str):
    """Serve a generated video."""
    from .ltx_service import OUTPUT_DIR

    # Security: only allow specific extensions and no path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    allowed_extensions = {".mp4", ".webm"}
    ext = Path(filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")

    video_path = OUTPUT_DIR / filename
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")

    media_type = "video/mp4" if ext == ".mp4" else "video/webm"
    return FileResponse(video_path, media_type=media_type)


@app.delete("/videos/{filename}")
async def delete_video(filename: str):
    """Delete a generated video."""
    from .ltx_service import OUTPUT_DIR

    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    video_path = OUTPUT_DIR / filename
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")

    if cleanup_video(str(video_path)):
        return {"success": True, "message": f"Video {filename} deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete video")


# ============================================================================
# VRAM Management Endpoints
# ============================================================================


@app.post("/unload")
async def unload_model():
    """Unload the model from VRAM to free memory for other services."""
    await unload_pipeline()
    return {"success": True, "message": "Model unloaded, VRAM freed"}


# ============================================================================
# Maintenance Endpoints
# ============================================================================


@app.post("/cleanup")
async def cleanup_videos(max_age_hours: int = 24):
    """Clean up old generated videos."""
    cleaned = cleanup_old_videos(max_age_hours)
    return {"success": True, "cleaned": cleaned}


# ============================================================================
# Error Handler
# ============================================================================


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}")
    return Response(
        content=f'{{"error": "Internal server error", "detail": "{str(exc)}"}}',
        status_code=500,
        media_type="application/json",
    )


# ============================================================================
# Main
# ============================================================================


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
