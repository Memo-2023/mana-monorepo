"""Response models for OpenAI-compatible API."""

import time
import uuid
from typing import Literal

from pydantic import BaseModel, Field


class Usage(BaseModel):
    """Token usage information."""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class MessageResponse(BaseModel):
    """Response message from the model."""

    role: Literal["assistant"] = "assistant"
    content: str


class Choice(BaseModel):
    """A single completion choice."""

    index: int = 0
    message: MessageResponse
    finish_reason: Literal["stop", "length", "content_filter"] | None = "stop"


class ChatCompletionResponse(BaseModel):
    """Response from chat completions endpoint (non-streaming)."""

    id: str = Field(default_factory=lambda: f"chatcmpl-{uuid.uuid4().hex[:12]}")
    object: Literal["chat.completion"] = "chat.completion"
    created: int = Field(default_factory=lambda: int(time.time()))
    model: str
    choices: list[Choice]
    usage: Usage = Field(default_factory=Usage)


class DeltaContent(BaseModel):
    """Delta content for streaming responses."""

    role: Literal["assistant"] | None = None
    content: str | None = None


class StreamChoice(BaseModel):
    """A single streaming choice."""

    index: int = 0
    delta: DeltaContent
    finish_reason: Literal["stop", "length", "content_filter"] | None = None


class ChatCompletionStreamResponse(BaseModel):
    """Response chunk from chat completions endpoint (streaming)."""

    id: str = Field(default_factory=lambda: f"chatcmpl-{uuid.uuid4().hex[:12]}")
    object: Literal["chat.completion.chunk"] = "chat.completion.chunk"
    created: int = Field(default_factory=lambda: int(time.time()))
    model: str
    choices: list[StreamChoice]


class ModelInfo(BaseModel):
    """Information about a model."""

    id: str
    object: Literal["model"] = "model"
    created: int = Field(default_factory=lambda: int(time.time()))
    owned_by: str = "mana-llm"


class ModelsResponse(BaseModel):
    """Response from models endpoint."""

    object: Literal["list"] = "list"
    data: list[ModelInfo]


class EmbeddingData(BaseModel):
    """A single embedding result."""

    object: Literal["embedding"] = "embedding"
    index: int = 0
    embedding: list[float]


class EmbeddingResponse(BaseModel):
    """Response from embeddings endpoint."""

    object: Literal["list"] = "list"
    data: list[EmbeddingData]
    model: str
    usage: Usage = Field(default_factory=Usage)
