"""Main FastAPI application for mana-llm service."""

import asyncio
import logging
import signal
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sse_starlette.sse import EventSourceResponse

from src.aliases import AliasConfigError, AliasRegistry
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
from src.utils.metrics import (
    get_metrics,
    record_llm_error,
    record_llm_request,
    set_provider_healthy,
)

#: Header carrying the concrete provider/model that actually served a
#: non-streaming response — useful for token-cost accounting on the
#: caller side, since `mana/long-form` could resolve to ollama, groq,
#: or claude depending on which providers were healthy at request time.
RESOLVED_MODEL_HEADER = "X-Mana-LLM-Resolved"

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


def _on_health_change(provider: str, healthy: bool) -> None:
    """Mirror health-cache transitions into the Prometheus gauge."""
    set_provider_healthy(provider, healthy)


def _install_sighup_reload(loop: asyncio.AbstractEventLoop) -> None:
    """Reload ``aliases.yaml`` when the process receives SIGHUP.

    Reload errors keep the previous good state in memory (see
    AliasRegistry.reload). SIGHUP isn't available on Windows; we just
    log and skip in that case.
    """

    def handler() -> None:
        if alias_registry is None:
            return
        try:
            alias_registry.reload()
        except AliasConfigError as e:
            logger.error("alias reload rejected, keeping previous state: %s", e)

    try:
        loop.add_signal_handler(signal.SIGHUP, handler)
    except (NotImplementedError, AttributeError, RuntimeError):
        # NotImplementedError on Windows; RuntimeError when the loop is
        # not running in the main thread (TestClient does this).
        logger.info("SIGHUP reload not available in this context — skipping")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: load aliases, spin up router + health probe."""
    global router, health_cache, health_probe, alias_registry

    logger.info("Starting mana-llm service...")

    aliases_path = Path(__file__).resolve().parent.parent / "aliases.yaml"
    alias_registry = AliasRegistry(aliases_path)
    logger.info("Loaded %d aliases from %s", len(alias_registry.list_aliases()), aliases_path)

    health_cache = ProviderHealthCache()
    health_cache.add_listener(_on_health_change)
    router = ProviderRouter(aliases=alias_registry, health_cache=health_cache)
    logger.info("Initialized providers: %s", list(router.providers))

    # Initial gauge values so dashboards render before the first probe
    # transition fires the listener.
    for provider_name in router.providers:
        set_provider_healthy(provider_name, True)

    health_probe = HealthProbe(health_cache, _build_provider_probes(router.providers))
    await health_probe.start()

    _install_sighup_reload(asyncio.get_running_loop())

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


# ----- Alias / health debug endpoints (M4) ---------------------------------


@app.get("/v1/aliases")
async def list_aliases() -> dict[str, Any]:
    """Inspect the alias registry — what each ``mana/<class>`` resolves to.

    Useful for debugging "which model actually answered my request" and
    for confirming SIGHUP reloads picked up edits to ``aliases.yaml``.
    """
    if alias_registry is None:
        raise HTTPException(status_code=503, detail="Service not ready")
    return {
        "default": alias_registry.default_alias,
        "aliases": [
            {
                "name": a.name,
                "description": a.description,
                "chain": list(a.chain),
            }
            for a in alias_registry.list_aliases()
        ],
    }


@app.get("/v1/health")
async def detailed_health() -> dict[str, Any]:
    """Full per-provider liveness snapshot.

    Includes the failure counter, last error, and the unhealthy-until
    backoff timestamp — info the original ``/health`` endpoint hides.
    """
    if router is None:
        raise HTTPException(status_code=503, detail="Service not ready")
    return await router.health_check()


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

    # The request's `model` field is what the caller asked for — could be
    # `mana/long-form`, `ollama/gemma3:4b`, or even bare `gemma3:4b`. For
    # error-path metrics we use that value (it's what the caller will
    # search for); for success-path metrics we use the resolved provider
    # so token-cost / latency attribute to the model that actually ran.
    requested_provider, requested_model = _split_model(request.model)

    start_time = time.time()

    try:
        if request.stream:
            # Streaming response via SSE
            logger.info(f"Streaming chat completion: {request.model}")

            async def generate():
                async for chunk in stream_chat_completion(router, request):
                    yield chunk

            # Streaming metrics: we don't yet know which provider answered
            # at request-record time. Each chunk's `model` field carries
            # the resolved name; per-token latency is harder to attribute
            # cleanly so we skip it for streams.
            record_llm_request(requested_provider, requested_model, streaming=True)

            return EventSourceResponse(
                generate(),
                media_type="text/event-stream",
            )
        else:
            # Non-streaming response
            logger.info(f"Chat completion: {request.model}")
            response = await router.chat_completion(request)

            resolved_provider, resolved_model = _split_model(response.model)
            latency = time.time() - start_time
            record_llm_request(
                provider=resolved_provider,
                model=resolved_model,
                streaming=False,
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                latency=latency,
            )

            # `response.model` is the concrete provider/model the chain
            # actually resolved to. Surface it via header so the caller
            # can attribute token cost to the right model even when the
            # request used an alias.
            return JSONResponse(
                content=response.model_dump(),
                headers={RESOLVED_MODEL_HEADER: response.model},
            )

    except ValueError as e:
        logger.error(f"Invalid request: {e}")
        record_llm_error(requested_provider, requested_model, "invalid_request")
        raise HTTPException(status_code=400, detail=str(e))
    except ProviderError as e:
        logger.warning(
            f"Provider error on {requested_provider}/{requested_model}: "
            f"kind={e.kind} detail={e}"
        )
        record_llm_error(requested_provider, requested_model, e.kind)
        raise HTTPException(
            status_code=e.http_status,
            detail={"kind": e.kind, "message": str(e)},
        )
    except Exception as e:
        logger.error(f"Chat completion failed: {e}")
        record_llm_error(requested_provider, requested_model, "server_error")
        raise HTTPException(status_code=500, detail=str(e))


# Embeddings endpoint
@app.post("/v1/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest) -> EmbeddingResponse:
    """Create embeddings for the input text."""
    if router is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    provider, model = _split_model(request.model)

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


def _split_model(model: str) -> tuple[str, str]:
    """Split a ``provider/model`` string for metric labelling.

    Bare names with no slash default to ``ollama`` to match the legacy
    OpenAI-style behaviour. Aliases (``mana/...``) keep their namespace
    in the metrics — that's intentional, so request-side counters tell
    you what callers ASKED for, while the resolved-side counters
    (``mana_llm_alias_resolved_total``) tell you what they GOT.
    """
    if "/" in model:
        provider, _, name = model.partition("/")
        return provider.lower(), name
    return "ollama", model


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level=settings.log_level,
    )
