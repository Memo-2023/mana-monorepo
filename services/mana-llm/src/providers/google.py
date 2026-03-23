"""Google Gemini provider for mana-llm (fallback when Ollama is unavailable)."""

import logging
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
    Usage,
)

from .base import LLMProvider

logger = logging.getLogger(__name__)

# Model mapping: Ollama model → Google Gemini equivalent
OLLAMA_TO_GEMINI: dict[str, str] = {
    "gemma3:4b": "gemini-2.0-flash",
    "gemma3:12b": "gemini-2.0-flash",
    "gemma3:27b": "gemini-2.5-pro",
    "llava:7b": "gemini-2.0-flash",  # Gemini has native vision
    "qwen3-vl:4b": "gemini-2.0-flash",  # vision fallback
    "qwen2.5-coder:7b": "gemini-2.0-flash",
    "qwen2.5-coder:14b": "gemini-2.5-pro",
    "phi3.5:latest": "gemini-2.0-flash",
    "ministral-3:3b": "gemini-2.0-flash",
    "deepseek-ocr:latest": "gemini-2.0-flash",
}


class GoogleProvider(LLMProvider):
    """Google Gemini API provider."""

    name = "google"

    def __init__(self, api_key: str, default_model: str = "gemini-2.0-flash"):
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

        Returns (system_instruction, contents).
        """
        system_instruction: str | None = None
        contents: list[types.Content] = []

        for msg in request.messages:
            if msg.role == "system":
                # Gemini uses system_instruction separately
                if isinstance(msg.content, str):
                    system_instruction = msg.content
                continue

            role = "user" if msg.role == "user" else "model"

            if isinstance(msg.content, str):
                contents.append(types.Content(role=role, parts=[types.Part.from_text(msg.content)]))
            else:
                # Multimodal content
                parts: list[types.Part] = []
                for part in msg.content:
                    if part.type == "text":
                        parts.append(types.Part.from_text(part.text))
                    elif part.type == "image_url" and part.image_url:
                        url = part.image_url.url
                        if url.startswith("data:"):
                            # Parse data URI: data:image/jpeg;base64,<data>
                            header, b64_data = url.split(",", 1)
                            mime_type = header.split(":")[1].split(";")[0]
                            import base64

                            image_bytes = base64.b64decode(b64_data)
                            parts.append(
                                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                            )
                        else:
                            # URL-based image - use as URI
                            parts.append(types.Part.from_uri(file_uri=url, mime_type="image/jpeg"))
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

        gen_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            **config,
        )

        logger.debug(f"Google Gemini request: {gemini_model}, messages: {len(contents)}")

        response = await self.client.aio.models.generate_content(
            model=gemini_model,
            contents=contents,
            config=gen_config,
        )

        content = response.text or ""
        usage_meta = response.usage_metadata

        return ChatCompletionResponse(
            model=f"google/{gemini_model}",
            choices=[
                Choice(
                    index=0,
                    message=MessageResponse(content=content),
                    finish_reason="stop",
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

        async for chunk in await self.client.aio.models.generate_content_stream(
            model=gemini_model,
            contents=contents,
            config=gen_config,
        ):
            text = chunk.text
            if text:
                yield ChatCompletionStreamResponse(
                    model=f"google/{gemini_model}",
                    choices=[
                        StreamChoice(
                            delta=DeltaContent(content=text),
                            finish_reason=None,
                        )
                    ],
                )

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
            ModelInfo(id="google/gemini-2.0-flash", owned_by="google"),
            ModelInfo(id="google/gemini-2.5-pro", owned_by="google"),
            ModelInfo(id="google/gemini-2.5-flash", owned_by="google"),
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
