"""Server-Sent Events (SSE) response handling."""

import json
import logging
from collections.abc import AsyncIterator

from src.models import ChatCompletionRequest, ChatCompletionStreamResponse
from src.providers import ProviderRouter
from src.providers.errors import ProviderError

logger = logging.getLogger(__name__)


async def stream_chat_completion(
    router: ProviderRouter,
    request: ChatCompletionRequest,
) -> AsyncIterator[dict]:
    """
    Stream chat completion responses for SSE.

    Yields dicts that EventSourceResponse will serialize as:
        data: {"choices":[{"delta":{"content":"Hello"}}]}
        data: [DONE]
    """
    try:
        async for chunk in router.chat_completion_stream(request):
            # Yield dict for EventSourceResponse to serialize
            yield {"data": json.dumps(chunk.model_dump(exclude_none=True))}

        # Send final [DONE] marker
        yield {"data": "[DONE]"}

    except ProviderError as e:
        logger.warning(f"Streaming provider error: kind={e.kind} detail={e}")
        error_data = {
            "error": {
                "message": str(e),
                "type": e.kind,
            }
        }
        yield {"data": json.dumps(error_data)}
        yield {"data": "[DONE]"}
    except Exception as e:
        logger.error(f"Streaming error: {e}")
        error_data = {
            "error": {
                "message": str(e),
                "type": "server_error",
            }
        }
        yield {"data": json.dumps(error_data)}
        yield {"data": "[DONE]"}
