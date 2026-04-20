"""Pydantic models for OpenAI-compatible API."""

from .requests import (
    ChatCompletionRequest,
    EmbeddingRequest,
    FunctionSpec,
    Message,
    ToolChoice,
    ToolSpec,
)
from .responses import (
    ChatCompletionResponse,
    ChatCompletionStreamResponse,
    Choice,
    DeltaContent,
    EmbeddingData,
    EmbeddingResponse,
    MessageResponse,
    ModelInfo,
    ModelsResponse,
    StreamChoice,
    ToolCall,
    ToolCallFunction,
    Usage,
)

__all__ = [
    "ChatCompletionRequest",
    "ChatCompletionResponse",
    "ChatCompletionStreamResponse",
    "Choice",
    "DeltaContent",
    "EmbeddingData",
    "EmbeddingRequest",
    "EmbeddingResponse",
    "FunctionSpec",
    "Message",
    "MessageResponse",
    "ModelInfo",
    "ModelsResponse",
    "StreamChoice",
    "ToolCall",
    "ToolCallFunction",
    "ToolChoice",
    "ToolSpec",
    "Usage",
]
