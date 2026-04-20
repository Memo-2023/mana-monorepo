"""Request models for OpenAI-compatible API."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class TextContent(BaseModel):
    """Text content in a message."""

    type: Literal["text"] = "text"
    text: str


class ImageUrl(BaseModel):
    """Image URL reference."""

    url: str  # Can be http(s):// or data:image/...;base64,...


class ImageContent(BaseModel):
    """Image content in a message."""

    type: Literal["image_url"] = "image_url"
    image_url: ImageUrl


MessageContent = str | list[TextContent | ImageContent]


class ToolCallFunction(BaseModel):
    """The function portion of a tool_call on an assistant message."""

    name: str
    # Arguments are passed as a JSON string (OpenAI spec). Providers may
    # emit structured args natively; the adapter serialises them here.
    arguments: str


class ToolCall(BaseModel):
    """A tool invocation the assistant decided to make."""

    id: str
    type: Literal["function"] = "function"
    function: ToolCallFunction


class Message(BaseModel):
    """A single message in the conversation.

    `tool` messages carry the result of a previously-requested tool call
    back into the context; they must reference the originating call via
    ``tool_call_id``. Assistant messages may contain either plain
    ``content`` or ``tool_calls`` (or both, though providers typically
    only emit one at a time).
    """

    role: Literal["system", "user", "assistant", "tool"]
    content: MessageContent | None = None
    tool_call_id: str | None = None
    tool_calls: list[ToolCall] | None = None


class FunctionSpec(BaseModel):
    """OpenAI-style function declaration."""

    name: str
    description: str
    # JSON Schema for the function's parameters. Kept as a dict here to
    # stay loose; providers translate it to their native shape.
    parameters: dict[str, Any] = Field(default_factory=dict)


class ToolSpec(BaseModel):
    """A tool the model may call. Only ``function`` tools are supported."""

    type: Literal["function"] = "function"
    function: FunctionSpec


class ToolChoiceFunction(BaseModel):
    """Force-pick a specific function for ``tool_choice``."""

    type: Literal["function"] = "function"
    function: dict[str, str]  # {"name": "tool_name"}


ToolChoice = Literal["auto", "none", "required"] | ToolChoiceFunction


class ResponseFormat(BaseModel):
    """OpenAI structured-output response_format hint.

    Two shapes are accepted:
      - {"type": "json_object"}             — free-form JSON
      - {"type": "json_schema",
         "json_schema": {"name": "...", "schema": {...}, "strict": bool}}
        — schema-constrained JSON; passed through to providers that
          support it (e.g. Ollama 0.5+ via its native `format` field).
    """

    type: Literal["json_object", "json_schema"]
    json_schema: dict[str, Any] | None = None


class ChatCompletionRequest(BaseModel):
    """Request body for chat completions endpoint."""

    model: str = Field(..., description="Model identifier in format 'provider/model' or just 'model'")
    messages: list[Message] = Field(..., min_length=1)
    stream: bool = False
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, gt=0)
    top_p: float | None = Field(default=None, ge=0.0, le=1.0)
    frequency_penalty: float | None = Field(default=None, ge=-2.0, le=2.0)
    presence_penalty: float | None = Field(default=None, ge=-2.0, le=2.0)
    stop: str | list[str] | None = None
    response_format: ResponseFormat | None = None
    tools: list[ToolSpec] | None = None
    tool_choice: ToolChoice | None = None


class EmbeddingRequest(BaseModel):
    """Request body for embeddings endpoint."""

    model: str = Field(..., description="Model identifier")
    input: str | list[str] = Field(..., description="Text(s) to embed")
    encoding_format: Literal["float", "base64"] = "float"
