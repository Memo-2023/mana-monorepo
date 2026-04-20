"""Google Gemini provider for mana-llm (fallback when Ollama is unavailable)."""

import json
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any

from google import genai
from google.genai import types

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
    ToolSpec,
    Usage,
)

from .base import LLMProvider
from .errors import (
    ProviderAuthError,
    ProviderBlockedError,
    ProviderError,
    ProviderRateLimitError,
    ProviderTruncatedError,
)

logger = logging.getLogger(__name__)


def _build_gemini_tools(tools: list[ToolSpec] | None) -> list[types.Tool] | None:
    """Translate our ToolSpec list into Gemini ``types.Tool`` declarations."""
    if not tools:
        return None
    declarations: list[types.FunctionDeclaration] = []
    for t in tools:
        declarations.append(
            types.FunctionDeclaration(
                name=t.function.name,
                description=t.function.description,
                parameters=t.function.parameters or None,
            )
        )
    return [types.Tool(function_declarations=declarations)]


def _extract_tool_calls(candidate: Any) -> list[ToolCall] | None:
    """Pull any ``function_call`` parts off a candidate into ToolCalls.

    Gemini emits tool calls as ``content.parts[i].function_call`` with a
    ``FunctionCall(name, args)`` where ``args`` is a dict (not a JSON
    string). We normalise to OpenAI shape: arguments are JSON-encoded
    strings so downstream handlers can treat all providers the same.
    """
    if candidate is None:
        return None
    content = getattr(candidate, "content", None)
    parts = getattr(content, "parts", None) or []
    calls: list[ToolCall] = []
    for part in parts:
        fc = getattr(part, "function_call", None)
        if fc is None:
            continue
        name = getattr(fc, "name", None)
        if not name:
            continue
        args = getattr(fc, "args", None) or {}
        # Gemini's args are already dict-shaped; serialise to JSON string.
        try:
            arguments_json = json.dumps(dict(args), ensure_ascii=False)
        except (TypeError, ValueError):
            arguments_json = json.dumps({}, ensure_ascii=False)
        calls.append(
            ToolCall(
                id=f"call_{uuid.uuid4().hex[:12]}",
                function=ToolCallFunction(name=name, arguments=arguments_json),
            )
        )
    return calls or None


def _unwrap_gemini_response(
    response: Any, gemini_model: str
) -> tuple[str, list[ToolCall] | None, str]:
    """Validate a non-streaming Gemini response.

    Returns ``(text, tool_calls, finish_reason)``. Raises a structured
    ``ProviderError`` if the response was blocked, truncated, or
    otherwise produced no usable payload. ``response.text`` silently
    returns ``""`` on blocked responses — we refuse to propagate that.
    """
    candidates = getattr(response, "candidates", None) or []
    candidate = candidates[0] if candidates else None
    finish_reason = getattr(candidate, "finish_reason", None)
    # SDK sometimes exposes the enum name on `.name`, sometimes it's a string.
    finish_name = getattr(finish_reason, "name", None) or (
        str(finish_reason) if finish_reason is not None else None
    )
    # Strip the leading enum prefix if present (e.g. "FinishReason.SAFETY").
    if finish_name and "." in finish_name:
        finish_name = finish_name.rsplit(".", 1)[-1]

    text = response.text or ""
    tool_calls = _extract_tool_calls(candidate)

    if finish_name in {"SAFETY", "RECITATION", "PROHIBITED_CONTENT", "SPII", "BLOCKLIST"}:
        # Pull the first safety rating that actually blocked if present.
        ratings = getattr(candidate, "safety_ratings", None) or []
        blocked = [
            getattr(r, "category", None)
            for r in ratings
            if getattr(r, "blocked", False)
        ]
        detail = ", ".join(str(c) for c in blocked if c) or None
        logger.warning(
            "Gemini response blocked (model=%s, reason=%s, detail=%s)",
            gemini_model,
            finish_name,
            detail,
        )
        raise ProviderBlockedError(reason=finish_name, detail=detail)

    if finish_name == "MAX_TOKENS":
        logger.warning(
            "Gemini response truncated at max_tokens (model=%s)", gemini_model
        )
        raise ProviderTruncatedError(partial_text=text or None)

    if not text and not tool_calls and finish_name not in (None, "STOP"):
        # Unknown finish reason, nothing to return — surface instead of "".
        raise ProviderError(
            f"Gemini returned no content (finish_reason={finish_name})"
        )

    # Normalise the finish_reason to our OpenAI-compatible vocabulary.
    openai_finish = "stop"
    if tool_calls:
        openai_finish = "tool_calls"
    elif finish_name == "MAX_TOKENS":
        openai_finish = "length"
    return text, tool_calls, openai_finish


def _lookup_tool_name(messages: list[Any], tool_call_id: str | None) -> str | None:
    """Find the tool name for a given ``tool_call_id``.

    OpenAI's tool-message carries only the id; the matching name lives
    on the preceding assistant message's ``tool_calls[]``. We scan from
    the end (most recent assistant turn) backwards.
    """
    if not tool_call_id:
        return None
    for m in reversed(messages):
        if m.role != "assistant" or not m.tool_calls:
            continue
        for call in m.tool_calls:
            if call.id == tool_call_id:
                return call.function.name
    return None


def _wrap_gemini_call_error(err: Exception, gemini_model: str) -> ProviderError:
    """Translate a raw Google SDK exception into a structured ProviderError.

    The SDK uses google.genai.errors.* but we avoid importing them at
    top level to keep the provider optional. String-match the class
    name instead.
    """
    cls_name = type(err).__name__
    msg = str(err) or cls_name
    if "Auth" in cls_name or "PermissionDenied" in cls_name or "Unauthenticated" in cls_name:
        return ProviderAuthError(f"Gemini auth failed for {gemini_model}: {msg}")
    if "ResourceExhausted" in cls_name or "RateLimit" in cls_name or "429" in msg:
        return ProviderRateLimitError(f"Gemini rate-limited for {gemini_model}: {msg}")
    return ProviderError(f"Gemini call failed for {gemini_model}: {msg}")

# Model mapping: Ollama model → Google Gemini equivalent
OLLAMA_TO_GEMINI: dict[str, str] = {
    "gemma3:4b": "gemini-2.5-flash",
    "gemma3:12b": "gemini-2.5-flash",
    "gemma3:27b": "gemini-2.5-pro",
    "llava:7b": "gemini-2.5-flash",  # Gemini has native vision
    "qwen3-vl:4b": "gemini-2.5-flash",  # vision fallback
    "qwen2.5-coder:7b": "gemini-2.5-flash",
    "qwen2.5-coder:14b": "gemini-2.5-pro",
    "phi3.5:latest": "gemini-2.5-flash",
    "ministral-3:3b": "gemini-2.5-flash",
    "deepseek-ocr:latest": "gemini-2.5-flash",
}


class GoogleProvider(LLMProvider):
    """Google Gemini API provider."""

    name = "google"
    # Gemini 2.x supports OpenAI-style function calling across all listed models.
    supports_tools = True

    def __init__(self, api_key: str, default_model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.default_model = default_model
        self.client = genai.Client(api_key=api_key)

    def map_model(self, ollama_model: str) -> str:
        """Map an Ollama model name to a Google Gemini equivalent."""
        return OLLAMA_TO_GEMINI.get(ollama_model, self.default_model)

    def _convert_messages(
        self, request: ChatCompletionRequest
    ) -> tuple[str | None, list[types.Content]]:
        """Convert OpenAI-format messages to Google Gemini format.

        Returns (system_instruction, contents). Handles text, multimodal
        image content, assistant messages carrying ``tool_calls``, and
        ``tool`` result messages (mapped to Gemini ``function_response``
        parts — Gemini has no ``tool`` role, function responses ride on
        a ``user`` turn).
        """
        system_instruction: str | None = None
        contents: list[types.Content] = []

        for msg in request.messages:
            if msg.role == "system":
                if isinstance(msg.content, str):
                    system_instruction = msg.content
                continue

            # Tool result message → function_response Part on a user turn.
            if msg.role == "tool":
                # The content is the stringified tool result. We also need
                # a tool name — the OpenAI spec carries it on the matching
                # assistant tool_call, keyed by tool_call_id. We don't
                # track that back-reference here, so we pull the name
                # from the preceding assistant message's tool_calls.
                name = _lookup_tool_name(request.messages, msg.tool_call_id)
                if not name:
                    continue  # orphan tool message — skip silently
                payload: Any
                if isinstance(msg.content, str):
                    try:
                        payload = json.loads(msg.content)
                        if not isinstance(payload, dict):
                            payload = {"result": payload}
                    except (TypeError, ValueError):
                        payload = {"result": msg.content}
                else:
                    payload = {"result": ""}
                contents.append(
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_function_response(
                                name=name, response=payload
                            )
                        ],
                    )
                )
                continue

            role = "user" if msg.role == "user" else "model"
            parts: list[types.Part] = []

            if msg.role == "assistant" and msg.tool_calls:
                for call in msg.tool_calls:
                    try:
                        args_obj = json.loads(call.function.arguments or "{}")
                    except (TypeError, ValueError):
                        args_obj = {}
                    parts.append(
                        types.Part(
                            function_call=types.FunctionCall(
                                name=call.function.name, args=args_obj
                            )
                        )
                    )

            if msg.content is not None:
                if isinstance(msg.content, str):
                    parts.append(types.Part.from_text(text=msg.content))
                else:
                    for part in msg.content:
                        if part.type == "text":
                            parts.append(types.Part.from_text(text=part.text))
                        elif part.type == "image_url" and part.image_url:
                            url = part.image_url.url
                            if url.startswith("data:"):
                                header, b64_data = url.split(",", 1)
                                mime_type = header.split(":")[1].split(";")[0]
                                import base64

                                image_bytes = base64.b64decode(b64_data)
                                parts.append(
                                    types.Part.from_bytes(
                                        data=image_bytes, mime_type=mime_type
                                    )
                                )
                            else:
                                parts.append(
                                    types.Part.from_uri(
                                        file_uri=url, mime_type="image/jpeg"
                                    )
                                )

            if parts:
                contents.append(types.Content(role=role, parts=parts))

        return system_instruction, contents

    async def chat_completion(
        self,
        request: ChatCompletionRequest,
        model: str,
    ) -> ChatCompletionResponse:
        """Generate a chat completion via Google Gemini."""
        gemini_model = self.map_model(model) if model in OLLAMA_TO_GEMINI else model
        system_instruction, contents = self._convert_messages(request)

        config: dict[str, Any] = {}
        if request.temperature is not None:
            config["temperature"] = request.temperature
        if request.max_tokens is not None:
            config["max_output_tokens"] = request.max_tokens
        if request.top_p is not None:
            config["top_p"] = request.top_p
        if request.stop:
            stop_seqs = request.stop if isinstance(request.stop, list) else [request.stop]
            config["stop_sequences"] = stop_seqs

        gemini_tools = _build_gemini_tools(request.tools)
        if gemini_tools:
            config["tools"] = gemini_tools

        gen_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            **config,
        )

        logger.debug(f"Google Gemini request: {gemini_model}, messages: {len(contents)}")

        try:
            response = await self.client.aio.models.generate_content(
                model=gemini_model,
                contents=contents,
                config=gen_config,
            )
        except ProviderError:
            raise
        except Exception as err:
            raise _wrap_gemini_call_error(err, gemini_model) from err

        content, tool_calls, finish_reason = _unwrap_gemini_response(
            response, gemini_model
        )
        usage_meta = response.usage_metadata

        return ChatCompletionResponse(
            model=f"google/{gemini_model}",
            choices=[
                Choice(
                    index=0,
                    message=MessageResponse(
                        content=content or None,
                        tool_calls=tool_calls,
                    ),
                    finish_reason=finish_reason,
                )
            ],
            usage=Usage(
                prompt_tokens=usage_meta.prompt_token_count if usage_meta else 0,
                completion_tokens=usage_meta.candidates_token_count if usage_meta else 0,
                total_tokens=usage_meta.total_token_count if usage_meta else 0,
            ),
        )

    async def chat_completion_stream(
        self,
        request: ChatCompletionRequest,
        model: str,
    ) -> AsyncIterator[ChatCompletionStreamResponse]:
        """Generate a streaming chat completion via Google Gemini."""
        gemini_model = self.map_model(model) if model in OLLAMA_TO_GEMINI else model
        system_instruction, contents = self._convert_messages(request)

        config: dict[str, Any] = {}
        if request.temperature is not None:
            config["temperature"] = request.temperature
        if request.max_tokens is not None:
            config["max_output_tokens"] = request.max_tokens
        if request.top_p is not None:
            config["top_p"] = request.top_p

        gemini_tools = _build_gemini_tools(request.tools)
        if gemini_tools:
            config["tools"] = gemini_tools

        gen_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            **config,
        )

        # First chunk with role
        yield ChatCompletionStreamResponse(
            model=f"google/{gemini_model}",
            choices=[
                StreamChoice(
                    delta=DeltaContent(role="assistant"),
                    finish_reason=None,
                )
            ],
        )

        last_chunk: Any = None
        emitted_any_text = False
        try:
            stream = await self.client.aio.models.generate_content_stream(
                model=gemini_model,
                contents=contents,
                config=gen_config,
            )
        except Exception as err:
            raise _wrap_gemini_call_error(err, gemini_model) from err

        async for chunk in stream:
            last_chunk = chunk
            text = chunk.text
            if text:
                emitted_any_text = True
                yield ChatCompletionStreamResponse(
                    model=f"google/{gemini_model}",
                    choices=[
                        StreamChoice(
                            delta=DeltaContent(content=text),
                            finish_reason=None,
                        )
                    ],
                )

        # Post-stream check: if the stream ended without emitting any text,
        # surface the structured reason instead of quietly closing with an
        # empty "stop". Matches _unwrap_gemini_response semantics. We
        # discard the return value here — the streaming path produces its
        # content chunk-by-chunk above, so we only need this call for its
        # side-effect of raising on SAFETY / RECITATION / MAX_TOKENS.
        if not emitted_any_text and last_chunk is not None:
            _unwrap_gemini_response(last_chunk, gemini_model)

        # Final chunk
        yield ChatCompletionStreamResponse(
            model=f"google/{gemini_model}",
            choices=[
                StreamChoice(
                    delta=DeltaContent(),
                    finish_reason="stop",
                )
            ],
        )

    async def list_models(self) -> list[ModelInfo]:
        """List available Google Gemini models."""
        # Return a static list of commonly used models
        return [
            ModelInfo(id="google/gemini-2.5-flash", owned_by="google"),
            ModelInfo(id="google/gemini-2.5-pro", owned_by="google"),
        ]

    async def embeddings(
        self,
        request: EmbeddingRequest,
        model: str,
    ) -> EmbeddingResponse:
        """Generate embeddings via Google Gemini."""
        inputs = request.input if isinstance(request.input, list) else [request.input]

        result = await self.client.aio.models.embed_content(
            model="text-embedding-004",
            contents=inputs,
        )

        return EmbeddingResponse(
            data=[
                EmbeddingData(index=i, embedding=emb.values)
                for i, emb in enumerate(result.embeddings)
            ],
            model="google/text-embedding-004",
            usage=Usage(
                prompt_tokens=sum(len(t.split()) for t in inputs),
                total_tokens=sum(len(t.split()) for t in inputs),
            ),
        )

    async def health_check(self) -> dict[str, Any]:
        """Check Google API health."""
        try:
            # Quick test: list models
            response = await self.client.aio.models.list(config={"page_size": 1})
            return {
                "status": "healthy",
                "provider": "google",
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": "google",
                "error": str(e),
            }

    async def close(self) -> None:
        """No cleanup needed for Google client."""
        pass
