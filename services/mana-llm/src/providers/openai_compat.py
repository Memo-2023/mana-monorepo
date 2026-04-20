"""OpenAI-compatible provider for OpenRouter, Groq, Together, etc."""

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

import httpx

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

logger = logging.getLogger(__name__)


def _tool_calls_from_openai(raw: list[dict[str, Any]] | None) -> list[ToolCall] | None:
    """Normalise an OpenAI-spec ``tool_calls`` array into our model shape."""
    if not raw:
        return None
    calls: list[ToolCall] = []
    for c in raw:
        fn = c.get("function") or {}
        name = fn.get("name")
        if not name:
            continue
        calls.append(
            ToolCall(
                id=c.get("id") or "",
                function=ToolCallFunction(
                    name=name,
                    arguments=fn.get("arguments") or "{}",
                ),
            )
        )
    return calls or None


class OpenAICompatProvider(LLMProvider):
    """OpenAI-compatible API provider (OpenRouter, Groq, Together, etc.)."""

    # OpenRouter/Groq/Together all expose tool_calls per the OpenAI spec;
    # individual models within those services may or may not support it,
    # but the request shape is uniform. The upstream returns a proper
    # error for unsupported models — no silent downgrade here.
    supports_tools = True

    def __init__(
        self,
        name: str,
        base_url: str,
        api_key: str,
        default_model: str | None = None,
        timeout: int = 120,
    ):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.default_model = default_model
        self.timeout = timeout
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    def _convert_messages(self, request: ChatCompletionRequest) -> list[dict[str, Any]]:
        """Convert internal message format to OpenAI format.

        The OpenAI chat-completions endpoint is the source of truth for
        this shape, so most fields pass through verbatim — including
        ``role='tool'`` messages with ``tool_call_id`` + ``content`` and
        assistant messages carrying ``tool_calls[]``.
        """
        messages: list[dict[str, Any]] = []
        for msg in request.messages:
            out: dict[str, Any] = {"role": msg.role}

            if msg.tool_call_id:
                out["tool_call_id"] = msg.tool_call_id

            if msg.tool_calls:
                out["tool_calls"] = [
                    {
                        "id": c.id,
                        "type": c.type,
                        "function": {
                            "name": c.function.name,
                            "arguments": c.function.arguments,
                        },
                    }
                    for c in msg.tool_calls
                ]

            if msg.content is None:
                # Assistant tool-call messages have null content per spec.
                out["content"] = None
            elif isinstance(msg.content, str):
                out["content"] = msg.content
            else:
                content_parts = []
                for part in msg.content:
                    if part.type == "text":
                        content_parts.append({"type": "text", "text": part.text})
                    elif part.type == "image_url":
                        content_parts.append(
                            {
                                "type": "image_url",
                                "image_url": {"url": part.image_url.url},
                            }
                        )
                out["content"] = content_parts

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

        # Add optional parameters
        if request.temperature is not None:
            payload["temperature"] = request.temperature
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens
        if request.top_p is not None:
            payload["top_p"] = request.top_p
        if request.frequency_penalty is not None:
            payload["frequency_penalty"] = request.frequency_penalty
        if request.presence_penalty is not None:
            payload["presence_penalty"] = request.presence_penalty
        if request.stop:
            payload["stop"] = request.stop
        if request.tools:
            payload["tools"] = [
                {"type": "function", "function": t.function.model_dump()}
                for t in request.tools
            ]
        if request.tool_choice is not None:
            payload["tool_choice"] = (
                request.tool_choice
                if isinstance(request.tool_choice, str)
                else request.tool_choice.model_dump()
            )

        logger.debug(f"{self.name} request: {model}, messages: {len(request.messages)}")

        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()

        return ChatCompletionResponse(
            id=data.get("id", ""),
            model=f"{self.name}/{model}",
            choices=[
                Choice(
                    index=choice.get("index", 0),
                    message=MessageResponse(
                        content=choice["message"].get("content"),
                        tool_calls=_tool_calls_from_openai(
                            choice["message"].get("tool_calls")
                        ),
                    ),
                    finish_reason=choice.get("finish_reason", "stop"),
                )
                for choice in data.get("choices", [])
            ],
            usage=Usage(
                prompt_tokens=data.get("usage", {}).get("prompt_tokens", 0),
                completion_tokens=data.get("usage", {}).get("completion_tokens", 0),
                total_tokens=data.get("usage", {}).get("total_tokens", 0),
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
        if request.temperature is not None:
            payload["temperature"] = request.temperature
        if request.max_tokens is not None:
            payload["max_tokens"] = request.max_tokens
        if request.top_p is not None:
            payload["top_p"] = request.top_p
        if request.frequency_penalty is not None:
            payload["frequency_penalty"] = request.frequency_penalty
        if request.presence_penalty is not None:
            payload["presence_penalty"] = request.presence_penalty
        if request.stop:
            payload["stop"] = request.stop
        if request.tools:
            payload["tools"] = [
                {"type": "function", "function": t.function.model_dump()}
                for t in request.tools
            ]
        if request.tool_choice is not None:
            payload["tool_choice"] = (
                request.tool_choice
                if isinstance(request.tool_choice, str)
                else request.tool_choice.model_dump()
            )

        logger.debug(f"{self.name} streaming request: {model}")

        async with self.client.stream("POST", "/chat/completions", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line or not line.startswith("data: "):
                    continue

                data_str = line[6:]  # Remove "data: " prefix

                if data_str == "[DONE]":
                    break

                try:
                    data = json.loads(data_str)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse stream line: {data_str}")
                    continue

                choices = data.get("choices", [])
                if not choices:
                    continue

                choice = choices[0]
                delta = choice.get("delta", {})

                yield ChatCompletionStreamResponse(
                    id=data.get("id", ""),
                    model=f"{self.name}/{model}",
                    choices=[
                        StreamChoice(
                            index=choice.get("index", 0),
                            delta=DeltaContent(
                                role=delta.get("role"),
                                content=delta.get("content"),
                                tool_calls=_tool_calls_from_openai(
                                    delta.get("tool_calls")
                                ),
                            ),
                            finish_reason=choice.get("finish_reason"),
                        )
                    ],
                )

    async def list_models(self) -> list[ModelInfo]:
        """List available models."""
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            data = response.json()

            models = []
            for model_data in data.get("data", []):
                model_id = model_data.get("id", "")
                models.append(
                    ModelInfo(
                        id=f"{self.name}/{model_id}",
                        owned_by=model_data.get("owned_by", self.name),
                    )
                )
            return models
        except httpx.HTTPError as e:
            logger.warning(f"Failed to list models from {self.name}: {e}")
            return []

    async def embeddings(
        self,
        request: EmbeddingRequest,
        model: str,
    ) -> EmbeddingResponse:
        """Generate embeddings for input text."""
        payload = {
            "model": model,
            "input": request.input,
        }

        response = await self.client.post("/embeddings", json=payload)
        response.raise_for_status()
        data = response.json()

        return EmbeddingResponse(
            data=[
                EmbeddingData(
                    index=item.get("index", i),
                    embedding=item.get("embedding", []),
                )
                for i, item in enumerate(data.get("data", []))
            ],
            model=f"{self.name}/{model}",
            usage=Usage(
                prompt_tokens=data.get("usage", {}).get("prompt_tokens", 0),
                total_tokens=data.get("usage", {}).get("total_tokens", 0),
            ),
        )

    async def health_check(self) -> dict[str, Any]:
        """Check provider health status."""
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            data = response.json()
            model_count = len(data.get("data", []))
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
