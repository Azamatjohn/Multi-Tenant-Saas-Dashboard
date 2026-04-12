import redis.asyncio as aioredis
from datetime import date
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings

redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)


class UsageTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # only track authenticated workspace routes
        path = request.url.path
        if "/workspaces/" in path and response.status_code < 400:
            # extract workspace slug from path
            # path format: /api/workspaces/{slug}/...
            parts = path.split("/")
            try:
                ws_idx = parts.index("workspaces")
                workspace_slug = parts[ws_idx + 1]
                today = date.today().isoformat()
                key = f"usage:{workspace_slug}:{today}"
                await redis_client.incr(key)
                # expire key after 2 days — Celery will flush it before then
                await redis_client.expire(key, 172800)
            except (ValueError, IndexError):
                pass

        return response


async def get_redis() -> aioredis.Redis:
    return redis_client