"""Ollama provider implementation."""

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

import httpx

from src.config import settings
from src.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionStreamResponse,
    Choice,
    DeltaContent,
    EmbeddingData,
    EmbeddingRequest,
    EmbeddingResponse,
    MessageResponse,
    ModelInfo,
    StreamChoice,
    ToolCall,
    ToolCallFunction,
    Usage,
)

from .base import LLMProvider

# Ollama emits tool_calls under /api/chat as:
#   {"message":{"content":"", "tool_calls":[{"function":{"name":"x","arguments":{...}}}]}}
# Arguments arrive as a dict — we normalise to a JSON string to match
# the OpenAI-spec shape our downstream code expects.

# Ollama models known to support tool-calling reliably (as of 0.3+).
# Everything else: we still pass `tools` to the API (it ignores them on
# incompatible models), but the assistant response will be plain text.
# A shared-ai-level capability check rejects these cases before the call.
TOOL_CAPABLE_OLLAMA_PATTERNS: tuple[str, ...] = (
    "llama3.1",
    "llama3.2",
    "llama3.3",
    "qwen2.5",
    "qwen3",
    "mistral",
    "mixtral",
    "command-r",
    "firefunction",
)

logger = logging.getLogger(__name__)


def _safe_parse_args(raw: str | None) -> dict[str, Any]:
    """Best-effort parse of a JSON-encoded arguments string."""
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except (TypeError, ValueError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _tool_calls_from_ollama(raw: list[dict[str, Any]] | None) -> list[ToolCall] | None:
    """Normalise Ollama's tool_calls into our ToolCall model."""
    if not raw:
        return None
    import uuid

    calls: list[ToolCall] = []
    for idx, c in enumerate(raw):
        fn = c.get("function") or {}
        name = fn.get("name")
        if not name:
            continue
        args = fn.get("arguments")
        if isinstance(args, dict):
            arguments_json = json.dumps(args, ensure_ascii=False)
        elif isinstance(args, str):
            arguments_json = args
        else:
            arguments_json = "{}"
        calls.append(
            ToolCall(
                id=c.get("id") or f"call_{uuid.uuid4().hex[:12]}",
                function=ToolCallFunction(name=name, arguments=arguments_json),
            )
        )
    return calls or None


def _strip_json_fences(content: str) -> str:
    """Strip ```json ... ``` markdown fences from a string if present.

    Some Ollama vision models still wrap structured-output responses in
    a markdown code block even when `format` is set. Downstream parsers
    (Vercel AI SDK generateObject, manual JSON.parse) expect clean JSON,
    so we normalize the response here at the proxy boundary.
    """
    s = content.strip()
    if s.startswith("```"):
        # Drop the opening fence (```json or ``` plus any language tag)
        first_newline = s.find("\n")
        if first_newline != -1:
            s = s[first_newline + 1 :]
        # Drop the closing fence
        if s.endswith("```"):
            s = s[:-3]
        s = s.strip()
    return s


class OllamaProvider(LLMProvider):
    """Ollama LLM provider."""

    name = "ollama"
    supports_tools = True

    def model_supports_tools(self, model: str) -> bool:
        """Narrow tool capability to models trained for function calling.

        Ollama accepts the ``tools`` payload even for incompatible models
        but silently drops it — the assistant just replies in prose. We
        reject those requests upfront so callers get a clear error.
        """
        lower = model.lower()
        return any(pattern in lower for pattern in TOOL_CAPABLE_OLLAMA_PATTERNS)

    def __init__(self, base_url: str | None = None, timeout: int | None = None):
        self.base_url = (base_url or settings.ollama_url).rstrip("/")
        self.timeout = timeout or settings.ollama_timeout
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout),
            )
        return self._client

    def _convert_messages(self, request: ChatCompletionRequest) -> list[dict[str, Any]]:
        """Convert OpenAI message format to Ollama format.

        Ollama's ``/api/chat`` uses the OpenAI shape for assistant
        ``tool_calls`` and ``tool`` result messages (with args as objects
        rather than JSON strings on output — input still accepts JSON
        strings), so we largely pass them through.
        """
        messages: list[dict[str, Any]] = []
        for msg in request.messages:
            out: dict[str, Any] = {"role": msg.role}

            if msg.tool_calls:
                out["tool_calls"] = [
                    {
                        "function": {
                            "name": c.function.name,
                            # Ollama accepts either stringified JSON or
                            # already-parsed objects; send parsed for
                            # better compatibility with older models.
                            "arguments": _safe_parse_args(c.function.arguments),
                        }
                    }
                    for c in msg.tool_calls
                ]

            if msg.content is None:
                out["content"] = ""
            elif isinstance(msg.content, str):
                out["content"] = msg.content
            else:
                text_parts: list[str] = []
                images: list[str] = []
                for part in msg.content:
                    if part.type == "text":
                        text_parts.append(part.text)
                    elif part.type == "image_url":
                        url = part.image_url.url
                        if url.startswith("data:"):
                            base64_data = url.split(",", 1)[1] if "," in url else url
                            images.append(base64_data)
                        else:
                            logger.warning(
                                "HTTP image URLs not supported, skipping: %s...",
                                url[:50],
                            )
                out["content"] = " ".join(text_parts)
                if images:
                    out["images"] = images

            messages.append(out)
        return messages

    async def chat_completion(
        self,
        request: ChatCompletionRequest,
        model: str,
    ) -> ChatCompletionResponse:
        """Generate a chat completion (non-streaming)."""
        payload: dict[str, Any] = {
            "model": model,
            "messages": self._convert_messages(request),
            "stream": False,
        }

        # Pass through structured-output requests to Ollama's native
        # `format` field. Ollama supports either `"json"` (free-form
        # JSON object) or a full JSON schema dict. The OpenAI-style
        # response_format the consumer sends maps as follows:
        #   - {"type": "json_object"}            → "json"
        #   - {"type": "json_schema", "json_schema": {"schema": {...}}}
        #     → the schema dict (Ollama 0.5+ supports full schemas)
        # Without this, Ollama wraps JSON in ```json ... ``` markdown
        # fences, which breaks downstream strict parsers like the AI SDK
        # generateObject() helper.
        if request.response_format is not None:
            rf = request.response_format
            if rf.type == "json_object":
                payload["format"] = "json"
            elif rf.type == "json_schema" and rf.json_schema is not None:
                # rf.json_schema is the OpenAI envelope:
                #   {"name": "...", "schema": {...}, "strict": true}
                # Ollama wants just the inner schema dict.
                inner = rf.json_schema.get("schema")
                payload["format"] = inner if inner is not None else "json"
            else:
                payload["format"] = "json"

        # Add optional parameters
        options: dict[str, Any] = {}
        if request.temperature is not None:
            options["temperature"] = request.temperature
        if request.top_p is not None:
            options["top_p"] = request.top_p
        if request.max_tokens is not None:
            options["num_predict"] = request.max_tokens
        if request.stop:
            options["stop"] = request.stop if isinstance(request.stop, list) else [request.stop]

        if options:
            payload["options"] = options

        if request.tools:
            payload["tools"] = [
                {"type": "function", "function": t.function.model_dump()}
                for t in request.tools
            ]

        logger.debug(f"Ollama request: {model}, messages: {len(request.messages)}")

        response = await self.client.post("/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()

        message = data.get("message", {})
        tool_calls = _tool_calls_from_ollama(message.get("tool_calls"))
        # Defensive fence-stripping: even with `format` set, some older
        # Ollama versions still emit ```json ... ``` wrappers for vision
        # models. Strip them so strict downstream parsers see clean JSON.
        raw_content = message.get("content", "") or ""
        content = _strip_json_fences(raw_content) if raw_content else ""

        finish_reason = "tool_calls" if tool_calls else (
            "stop" if data.get("done") else None
        )

        return ChatCompletionResponse(
            model=f"ollama/{model}",
            choices=[
                Choice(
                    message=MessageResponse(
                        content=content or None,
                        tool_calls=tool_calls,
                    ),
                    finish_reason=finish_reason,
                )
            ],
            usage=Usage(
                prompt_tokens=data.get("prompt_eval_count", 0),
                completion_tokens=data.get("eval_count", 0),
                total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            ),
        )

    async def chat_completion_stream(
        self,
        request: ChatCompletionRequest,
        model: str,
    ) -> AsyncIterator[ChatCompletionStreamResponse]:
        """Generate a chat completion (streaming)."""
        payload: dict[str, Any] = {
            "model": model,
            "messages": self._convert_messages(request),
            "stream": True,
        }

        # Add optional parameters
        options: dict[str, Any] = {}
        if request.temperature is not None:
            options["temperature"] = request.temperature
        if request.top_p is not None:
            options["top_p"] = request.top_p
        if request.max_tokens is not None:
            options["num_predict"] = request.max_tokens
        if request.stop:
            options["stop"] = request.stop if isinstance(request.stop, list) else [request.stop]

        if options:
            payload["options"] = options

        if request.tools:
            payload["tools"] = [
                {"type": "function", "function": t.function.model_dump()}
                for t in request.tools
            ]

        logger.debug(f"Ollama streaming request: {model}")

        response_id = f"chatcmpl-{model[:8]}"
        first_chunk = True

        async with self.client.stream("POST", "/api/chat", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue

                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse Ollama response line: {line}")
                    continue

                # First chunk includes role
                if first_chunk:
                    yield ChatCompletionStreamResponse(
                        id=response_id,
                        model=f"ollama/{model}",
                        choices=[
                            StreamChoice(
                                delta=DeltaContent(role="assistant"),
                            )
                        ],
                    )
                    first_chunk = False

                # Content chunks
                content = data.get("message", {}).get("content", "")
                if content:
                    yield ChatCompletionStreamResponse(
                        id=response_id,
                        model=f"ollama/{model}",
                        choices=[
                            StreamChoice(
                                delta=DeltaContent(content=content),
                            )
                        ],
                    )

                # Final chunk with finish_reason
                if data.get("done"):
                    yield ChatCompletionStreamResponse(
                        id=response_id,
                        model=f"ollama/{model}",
                        choices=[
                            StreamChoice(
                                delta=DeltaContent(),
                                finish_reason="stop",
                            )
                        ],
                    )

    async def list_models(self) -> list[ModelInfo]:
        """List available Ollama models."""
        response = await self.client.get("/api/tags")
        response.raise_for_status()
        data = response.json()

        models = []
        for model_data in data.get("models", []):
            name = model_data.get("name", "")
            # Parse modified_at datetime string to Unix timestamp
            created = None
            if modified_at := model_data.get("modified_at"):
                try:
                    from datetime import datetime
                    # Handle ISO format with timezone
                    dt = datetime.fromisoformat(modified_at.replace("Z", "+00:00"))
                    created = int(dt.timestamp())
                except (ValueError, TypeError):
                    pass
            models.append(
                ModelInfo(
                    id=f"ollama/{name}",
                    owned_by="ollama",
                    created=created,
                )
            )
        return models

    async def embeddings(
        self,
        request: EmbeddingRequest,
        model: str,
    ) -> EmbeddingResponse:
        """Generate embeddings for input text."""
        inputs = request.input if isinstance(request.input, list) else [request.input]
        embeddings_data = []

        for i, text in enumerate(inputs):
            response = await self.client.post(
                "/api/embeddings",
                json={"model": model, "prompt": text},
            )
            response.raise_for_status()
            data = response.json()

            embeddings_data.append(
                EmbeddingData(
                    index=i,
                    embedding=data.get("embedding", []),
                )
            )

        return EmbeddingResponse(
            data=embeddings_data,
            model=f"ollama/{model}",
            usage=Usage(
                prompt_tokens=sum(len(text.split()) for text in inputs),  # Approximate
                total_tokens=sum(len(text.split()) for text in inputs),
            ),
        )

    async def health_check(self) -> dict[str, Any]:
        """Check Ollama health status."""
        try:
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            data = response.json()
            model_count = len(data.get("models", []))
            return {
                "status": "healthy",
                "provider": self.name,
                "url": self.base_url,
                "models_available": model_count,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": self.name,
                "url": self.base_url,
                "error": str(e),
            }

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
