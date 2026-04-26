"""Main FastAPI application for mana-llm service."""

import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sse_starlette.sse import EventSourceResponse

from src.aliases import AliasRegistry
from src.api_auth import ApiKeyMiddleware
from src.config import settings
from src.health import ProviderHealthCache
from src.health_probe import HealthProbe, make_http_probe
from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ModelInfo,
    ModelsResponse,
)
from src.providers import ProviderRouter
from src.providers.errors import ProviderError
from src.streaming import stream_chat_completion
from src.utils.cache import close_redis
from src.utils.metrics import get_metrics, record_llm_error, record_llm_request

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global service singletons
router: ProviderRouter | None = None
health_cache: ProviderHealthCache | None = None
health_probe: HealthProbe | None = None
alias_registry: AliasRegistry | None = None


def _build_provider_probes(
    providers: dict[str, Any],
) -> dict[str, Any]:
    """Wire each configured provider to a cheap HTTP probe."""
    probes: dict[str, Any] = {}

    if "ollama" in providers:
        probes["ollama"] = make_http_probe(f"{settings.ollama_url}/api/tags")
    if "openrouter" in providers:
        probes["openrouter"] = make_http_probe(
            f"{settings.openrouter_base_url}/models",
            headers={"Authorization": f"Bearer {settings.openrouter_api_key}"},
        )
    if "groq" in providers:
        probes["groq"] = make_http_probe(
            f"{settings.groq_base_url}/models",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
        )
    if "together" in providers:
        probes["together"] = make_http_probe(
            f"{settings.together_base_url}/models",
            headers={"Authorization": f"Bearer {settings.together_api_key}"},
        )
    # Google: skipped — google-genai SDK is opaque enough that a probe
    # would amount to a real API call. Treat as healthy by default; the
    # router's call-site fallback will mark it unhealthy on real errors.
    return probes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: load aliases, spin up router + health probe."""
    global router, health_cache, health_probe, alias_registry

    logger.info("Starting mana-llm service...")

    aliases_path = Path(__file__).resolve().parent.parent / "aliases.yaml"
    alias_registry = AliasRegistry(aliases_path)
    logger.info("Loaded %d aliases from %s", len(alias_registry.list_aliases()), aliases_path)

    health_cache = ProviderHealthCache()
    router = ProviderRouter(aliases=alias_registry, health_cache=health_cache)
    logger.info("Initialized providers: %s", list(router.providers))

    health_probe = HealthProbe(health_cache, _build_provider_probes(router.providers))
    await health_probe.start()

    yield

    logger.info("Shutting down mana-llm service...")
    if health_probe is not None:
        await health_probe.stop()
    if router is not None:
        await router.close()
    await close_redis()


# Create FastAPI app
app = FastAPI(
    title="mana-llm",
    description="Central LLM abstraction service for Ollama and OpenAI-compatible APIs",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ApiKeyMiddleware)


# Health endpoint
@app.get("/health")
async def health_check() -> dict[str, Any]:
    """Check service health and provider status."""
    if router is None:
        return {"status": "unhealthy", "error": "Router not initialized"}

    provider_health = await router.health_check()
    return {
        "status": provider_health["status"],
        "service": "mana-llm",
        "version": "0.1.0",
        "providers": provider_health["providers"],
    }


# Metrics endpoint
@app.get("/metrics")
async def metrics() -> Response:
    """Prometheus metrics endpoint."""
    return Response(content=get_metrics(), media_type="text/plain")


# Models endpoints
@app.get("/v1/models", response_model=ModelsResponse)
async def list_models() -> ModelsResponse:
    """List all available models from all providers."""
    if router is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    models = await router.list_models()
    return ModelsResponse(data=models)


@app.get("/v1/models/{model_id:path}")
async def get_model(model_id: str) -> ModelInfo:
    """Get specific model information."""
    if router is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    model = await router.get_model(model_id)
    if model is None:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")

    return model


# Chat completions endpoint
@app.post("/v1/chat/completions", response_model=None)
async def chat_completions(
    request: ChatCompletionRequest,
    http_request: Request,
) -> ChatCompletionResponse | EventSourceResponse:
    """
    Create a chat completion.

    Supports both streaming (SSE) and non-streaming responses based on the
    `stream` parameter in the request body.
    """
    if router is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    # Parse provider and model for metrics
    model_parts = request.model.split("/", 1)
    provider = model_parts[0] if len(model_parts) > 1 else "ollama"
    model = model_parts[1] if len(model_parts) > 1 else request.model

    start_time = time.time()

    try:
        if request.stream:
            # Streaming response via SSE
            logger.info(f"Streaming chat completion: {request.model}")

            async def generate():
                async for chunk in stream_chat_completion(router, request):
                    yield chunk

            record_llm_request(provider, model, streaming=True)

            return EventSourceResponse(
                generate(),
                media_type="text/event-stream",
            )
        else:
            # Non-streaming response
            logger.info(f"Chat completion: {request.model}")
            response = await router.chat_completion(request)

            # Record metrics
            latency = time.time() - start_time
            record_llm_request(
                provider=provider,
                model=model,
                streaming=False,
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                latency=latency,
            )

            return response

    except ValueError as e:
        logger.error(f"Invalid request: {e}")
        record_llm_error(provider, model, "invalid_request")
        raise HTTPException(status_code=400, detail=str(e))
    except ProviderError as e:
        logger.warning(
            f"Provider error on {provider}/{model}: kind={e.kind} detail={e}"
        )
        record_llm_error(provider, model, e.kind)
        raise HTTPException(
            status_code=e.http_status,
            detail={"kind": e.kind, "message": str(e)},
        )
    except Exception as e:
        logger.error(f"Chat completion failed: {e}")
        record_llm_error(provider, model, "server_error")
        raise HTTPException(status_code=500, detail=str(e))


# Embeddings endpoint
@app.post("/v1/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest) -> EmbeddingResponse:
    """Create embeddings for the input text."""
    if router is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    # Parse provider and model for metrics
    model_parts = request.model.split("/", 1)
    provider = model_parts[0] if len(model_parts) > 1 else "ollama"
    model = model_parts[1] if len(model_parts) > 1 else request.model

    start_time = time.time()

    try:
        logger.info(f"Creating embeddings: {request.model}")
        response = await router.embeddings(request)

        latency = time.time() - start_time
        record_llm_request(
            provider=provider,
            model=model,
            streaming=False,
            prompt_tokens=response.usage.prompt_tokens,
            latency=latency,
        )

        return response

    except ValueError as e:
        logger.error(f"Invalid embedding request: {e}")
        record_llm_error(provider, model, "invalid_request")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Embeddings failed: {e}")
        record_llm_error(provider, model, "server_error")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level=settings.log_level,
    )
