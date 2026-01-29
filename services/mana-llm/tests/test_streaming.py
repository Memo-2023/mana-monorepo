"""Streaming tests."""

import pytest

from src.models import ChatCompletionStreamResponse, DeltaContent, StreamChoice


class TestStreamingModels:
    """Test streaming response models."""

    def test_stream_response_serialization(self):
        """Test streaming response serializes correctly."""
        response = ChatCompletionStreamResponse(
            id="test-id",
            model="ollama/gemma3:4b",
            choices=[
                StreamChoice(
                    delta=DeltaContent(content="Hello"),
                )
            ],
        )

        data = response.model_dump(exclude_none=True)
        assert data["id"] == "test-id"
        assert data["model"] == "ollama/gemma3:4b"
        assert data["choices"][0]["delta"]["content"] == "Hello"

    def test_stream_response_with_role(self):
        """Test first chunk with role."""
        response = ChatCompletionStreamResponse(
            id="test-id",
            model="ollama/gemma3:4b",
            choices=[
                StreamChoice(
                    delta=DeltaContent(role="assistant"),
                )
            ],
        )

        data = response.model_dump(exclude_none=True)
        assert data["choices"][0]["delta"]["role"] == "assistant"

    def test_stream_response_with_finish_reason(self):
        """Test final chunk with finish_reason."""
        response = ChatCompletionStreamResponse(
            id="test-id",
            model="ollama/gemma3:4b",
            choices=[
                StreamChoice(
                    delta=DeltaContent(),
                    finish_reason="stop",
                )
            ],
        )

        data = response.model_dump(exclude_none=True)
        assert data["choices"][0]["finish_reason"] == "stop"
