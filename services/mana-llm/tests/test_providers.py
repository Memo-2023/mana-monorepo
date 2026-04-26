"""Provider tests."""

from pathlib import Path

import pytest

from src.aliases import AliasRegistry
from src.health import ProviderHealthCache
from src.models import ChatCompletionRequest, EmbeddingRequest, Message
from src.providers import OllamaProvider, OpenAICompatProvider, ProviderRouter


@pytest.fixture
def shipped_aliases() -> AliasRegistry:
    """The repo's real aliases.yaml — same one production uses."""
    return AliasRegistry(Path(__file__).resolve().parents[1] / "aliases.yaml")


@pytest.fixture
def router(shipped_aliases: AliasRegistry) -> ProviderRouter:
    return ProviderRouter(aliases=shipped_aliases, health_cache=ProviderHealthCache())


class TestProviderRouter:
    """Tests for the helpers exposed by the router."""

    def test_parse_model_with_provider(self, router: ProviderRouter) -> None:
        provider, model = router._parse_model("ollama/gemma3:4b")
        assert provider == "ollama"
        assert model == "gemma3:4b"

    def test_parse_model_without_provider(self, router: ProviderRouter) -> None:
        # Bare names default to Ollama for OpenAI-style compat.
        provider, model = router._parse_model("gemma3:4b")
        assert provider == "ollama"
        assert model == "gemma3:4b"

    def test_parse_model_openrouter(self, router: ProviderRouter) -> None:
        provider, model = router._parse_model("openrouter/meta-llama/llama-3.1-8b-instruct")
        assert provider == "openrouter"
        assert model == "meta-llama/llama-3.1-8b-instruct"

    @pytest.mark.asyncio
    async def test_embeddings_unknown_provider_raises(self, router: ProviderRouter) -> None:
        # Embeddings don't go through the alias/fallback pipeline — they
        # hit the requested provider directly. Asking for an unconfigured
        # one is a config error and must raise loudly.
        with pytest.raises(ValueError, match="not available"):
            await router.embeddings(
                EmbeddingRequest(model="bogus_provider/x", input="hi")
            )


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
