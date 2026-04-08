"""
Mana Image Generation - AI Image Generation Microservice

Provides image generation using FLUX.2 klein 4B model via flux2.c.
Optimized for Apple Silicon (MPS acceleration).

API:
- POST /generate - Generate image from text prompt
- GET /health - Health check
- GET /models - Model information
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

from .flux_service import (
    generate_image,
    is_flux_available,
    get_flux_info,
    cleanup_image,
    cleanup_old_images,
    DEFAULT_STEPS,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Configuration from environment
PORT = int(os.getenv("PORT", "3025"))
MAX_PROMPT_LENGTH = int(os.getenv("MAX_PROMPT_LENGTH", "2000"))
MIN_DIMENSION = int(os.getenv("MIN_DIMENSION", "256"))
MAX_DIMENSION = int(os.getenv("MAX_DIMENSION", "2048"))
MAX_STEPS = int(os.getenv("MAX_STEPS", "8"))
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://mana.how,https://picture.mana.how,https://chat.mana.how,http://localhost:5173",
).split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown."""
    logger.info(f"Starting Mana Image Generation service on port {PORT}")

    # Check flux2.c availability
    if is_flux_available():
        info = get_flux_info()
        logger.info(f"flux2.c available: {info['model_name']}")
    else:
        logger.warning("flux2.c not available - service will return errors until installed")

    # Cleanup old images on startup
    cleanup_old_images(max_age_hours=24)

    yield

    logger.info("Shutting down Mana Image Generation service")


# Create FastAPI app
app = FastAPI(
    title="Mana Image Generation",
    description="AI image generation service using FLUX.2 klein 4B",
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
    """Request for image generation."""

    prompt: str = Field(
        ...,
        description="Text prompt for image generation",
        min_length=1,
        max_length=2000,
    )
    width: int = Field(
        DEFAULT_WIDTH,
        ge=256,
        le=2048,
        description="Image width in pixels",
    )
    height: int = Field(
        DEFAULT_HEIGHT,
        ge=256,
        le=2048,
        description="Image height in pixels",
    )
    steps: int = Field(
        DEFAULT_STEPS,
        ge=1,
        le=8,
        description="Number of sampling steps (FLUX.2 klein optimized for 4)",
    )
    seed: Optional[int] = Field(
        None,
        ge=-1,
        description="Random seed (-1 or None for random)",
    )
    output_format: str = Field(
        "png",
        description="Output format (png, jpg)",
    )


class GenerateResponse(BaseModel):
    """Response for image generation."""

    success: bool
    image_url: str
    prompt: str
    width: int
    height: int
    steps: int
    seed: int
    generation_time: float


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    service: str
    flux_available: bool


class ModelsResponse(BaseModel):
    """Available models response."""

    flux: dict


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: str


# ============================================================================
# Health & Info Endpoints
# ============================================================================


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check service health and flux2.c availability."""
    return HealthResponse(
        status="healthy" if is_flux_available() else "degraded",
        service="mana-image-gen",
        flux_available=is_flux_available(),
    )


@app.get("/models", response_model=ModelsResponse)
async def get_models():
    """Get information about available models."""
    return ModelsResponse(flux=get_flux_info())


# ============================================================================
# Image Generation Endpoints
# ============================================================================


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Generate an image from a text prompt using FLUX.2 klein.

    The model is optimized for 4 sampling steps and produces high-quality
    images in sub-second time on Apple Silicon.
    """
    # Validate prompt
    if len(request.prompt) > MAX_PROMPT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH} characters",
        )

    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # Validate dimensions
    if request.width < MIN_DIMENSION or request.width > MAX_DIMENSION:
        raise HTTPException(
            status_code=400,
            detail=f"Width must be between {MIN_DIMENSION} and {MAX_DIMENSION}",
        )

    if request.height < MIN_DIMENSION or request.height > MAX_DIMENSION:
        raise HTTPException(
            status_code=400,
            detail=f"Height must be between {MIN_DIMENSION} and {MAX_DIMENSION}",
        )

    # Validate steps
    if request.steps > MAX_STEPS:
        raise HTTPException(
            status_code=400,
            detail=f"Steps must be at most {MAX_STEPS} (FLUX.2 klein is optimized for 4)",
        )

    # Validate output format
    output_format = request.output_format.lower()
    if output_format not in ("png", "jpg", "jpeg"):
        raise HTTPException(
            status_code=400,
            detail="Output format must be 'png' or 'jpg'",
        )

    if output_format == "jpeg":
        output_format = "jpg"

    # Check flux availability
    if not is_flux_available():
        raise HTTPException(
            status_code=503,
            detail="Image generation service not available. flux2.c not installed.",
        )

    try:
        # Generate image
        result = await generate_image(
            prompt=request.prompt,
            width=request.width,
            height=request.height,
            steps=request.steps,
            seed=request.seed,
            output_format=output_format,
        )

        # Build image URL (relative path for now)
        image_filename = Path(result.image_path).name
        image_url = f"/images/{image_filename}"

        return GenerateResponse(
            success=True,
            image_url=image_url,
            prompt=result.prompt,
            width=result.width,
            height=result.height,
            steps=result.steps,
            seed=result.seed,
            generation_time=result.generation_time,
        )

    except RuntimeError as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {e}")


@app.get("/images/{filename}")
async def get_image(filename: str):
    """Serve a generated image."""
    from .flux_service import OUTPUT_DIR

    # Security: only allow specific extensions and no path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    allowed_extensions = {".png", ".jpg", ".jpeg"}
    ext = Path(filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")

    image_path = OUTPUT_DIR / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    media_type = "image/png" if ext == ".png" else "image/jpeg"
    return FileResponse(image_path, media_type=media_type)


@app.delete("/images/{filename}")
async def delete_image(filename: str):
    """Delete a generated image."""
    from .flux_service import OUTPUT_DIR

    # Security: only allow specific extensions and no path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    image_path = OUTPUT_DIR / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    if cleanup_image(str(image_path)):
        return {"success": True, "message": f"Image {filename} deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete image")


# ============================================================================
# Maintenance Endpoints
# ============================================================================


@app.post("/cleanup")
async def cleanup_images(max_age_hours: int = 24):
    """Clean up old generated images."""
    cleaned = cleanup_old_images(max_age_hours)
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
