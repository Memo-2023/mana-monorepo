"""Provider tests."""

import pytest

from src.models import ChatCompletionRequest, Message
from src.providers import OllamaProvider, OpenAICompatProvider, ProviderRouter


class TestProviderRouter:
    """Test provider routing logic."""

    def test_parse_model_with_provider(self):
        """Test model parsing with provider prefix."""
        router = ProviderRouter()

        provider, model = router._parse_model("ollama/gemma3:4b")
        assert provider == "ollama"
        assert model == "gemma3:4b"

    def test_parse_model_without_provider(self):
        """Test model parsing without provider prefix (defaults to ollama)."""
        router = ProviderRouter()

        provider, model = router._parse_model("gemma3:4b")
        assert provider == "ollama"
        assert model == "gemma3:4b"

    def test_parse_model_openrouter(self):
        """Test model parsing for OpenRouter."""
        router = ProviderRouter()

        provider, model = router._parse_model("openrouter/meta-llama/llama-3.1-8b-instruct")
        assert provider == "openrouter"
        assert model == "meta-llama/llama-3.1-8b-instruct"

    def test_get_invalid_provider(self):
        """Test getting invalid provider raises error."""
        router = ProviderRouter()

        with pytest.raises(ValueError, match="not available"):
            router._get_provider("invalid_provider")


class TestOllamaProvider:
    """Test Ollama provider."""

    def test_convert_simple_messages(self):
        """Test converting simple text messages."""
        provider = OllamaProvider()
        request = ChatCompletionRequest(
            model="gemma3:4b",
            messages=[
                Message(role="user", content="Hello"),
            ],
        )

        messages = provider._convert_messages(request)
        assert len(messages) == 1
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "Hello"

    def test_convert_multimodal_messages(self):
        """Test converting multimodal messages."""
        provider = OllamaProvider()
        request = ChatCompletionRequest(
            model="llava:7b",
            messages=[
                Message(
                    role="user",
                    content=[
                        {"type": "text", "text": "What's in this image?"},
                        {
                            "type": "image_url",
                            "image_url": {"url": "data:image/png;base64,iVBORw0KGgo="},
                        },
                    ],
                ),
            ],
        )

        messages = provider._convert_messages(request)
        assert len(messages) == 1
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "What's in this image?"
        assert "images" in messages[0]
        assert len(messages[0]["images"]) == 1


class TestOpenAICompatProvider:
    """Test OpenAI-compatible provider."""

    def test_convert_simple_messages(self):
        """Test converting simple text messages."""
        provider = OpenAICompatProvider(
            name="test",
            base_url="http://localhost",
            api_key="test-key",
        )

        request = ChatCompletionRequest(
            model="test-model",
            messages=[
                Message(role="system", content="You are helpful."),
                Message(role="user", content="Hello"),
            ],
        )

        messages = provider._convert_messages(request)
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[0]["content"] == "You are helpful."
        assert messages[1]["role"] == "user"
        assert messages[1]["content"] == "Hello"
