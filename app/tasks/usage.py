import asyncio
import uuid
from datetime import date, datetime, timezone
from app.worker import celery_app


@celery_app.task(name="app.tasks.usage.flush_usage_to_db")
def flush_usage_to_db():
    """Reads all usage counters from Redis and writes them to Postgres."""
    asyncio.run(_flush())


async def _flush():
    import redis.asyncio as aioredis
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from sqlalchemy import select
    from sqlalchemy.dialects.postgresql import insert
    from app.config import settings
    from app.models.analytics import UsageRecord
    from app.models.workspace import Workspace

    engine = create_async_engine(settings.DATABASE_URL)
    AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

    # find all usage keys: usage:{workspace_slug}:{date}
    keys = await redis_client.keys("usage:*")

    if not keys:
        print("No usage keys found in Redis")
        await engine.dispose()
        return

    async with AsyncSession() as db:
        for key in keys:
            try:
                parts = key.split(":")
                if len(parts) != 3:
                    continue

                _, workspace_slug, date_str = parts
                call_count = await redis_client.getdel(key)

                if not call_count:
                    continue

                # resolve workspace slug to ID
                result = await db.execute(
                    select(Workspace).where(Workspace.slug == workspace_slug)
                )
                workspace = result.scalar_one_or_none()
                if not workspace:
                    continue

                usage_date = date.fromisoformat(date_str)

                # upsert — add to existing count or create new record
                stmt = insert(UsageRecord).values(
                    id=uuid.uuid4(),
                    workspace_id=workspace.id,
                    date=usage_date,
                    api_calls=int(call_count),
                ).on_conflict_do_update(
                    constraint="uq_usage_workspace_date",
                    set_={"api_calls": UsageRecord.api_calls + int(call_count)}
                )
                await db.execute(stmt)

            except Exception as e:
                print(f"Error flushing key {key}: {e}")

        await db.commit()

    await redis_client.aclose()
    await engine.dispose()
    print(f"Flushed {len(keys)} usage keys to database")