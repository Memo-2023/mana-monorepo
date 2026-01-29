"""Server-Sent Events (SSE) response handling."""

import json
import logging
from collections.abc import AsyncIterator

from src.models import ChatCompletionRequest, ChatCompletionStreamResponse
from src.providers import ProviderRouter

logger = logging.getLogger(__name__)


async def stream_chat_completion(
    router: ProviderRouter,
    request: ChatCompletionRequest,
) -> AsyncIterator[str]:
    """
    Stream chat completion responses as SSE data lines.

    Yields strings in SSE format:
        data: {"choices":[{"delta":{"content":"Hello"}}]}
        data: [DONE]
    """
    try:
        async for chunk in router.chat_completion_stream(request):
            # Convert to OpenAI-compatible SSE format
            data = chunk.model_dump(exclude_none=True)
            yield f"data: {json.dumps(data)}\n\n"

        # Send final [DONE] marker
        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Streaming error: {e}")
        # Send error as SSE event
        error_data = {
            "error": {
                "message": str(e),
                "type": "server_error",
            }
        }
        yield f"data: {json.dumps(error_data)}\n\n"
        yield "data: [DONE]\n\n"
