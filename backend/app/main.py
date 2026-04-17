from fastapi import FastAPI, Request, status, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.database import engine
from app.models import *  # noqa
from app.routers import auth, workspaces, members, billing, analytics, user
from app.middleware.usage import UsageTrackingMiddleware

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text


from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(title="SaaS Platform API", version="0.1.0", lifespan=lifespan)



app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(UsageTrackingMiddleware)


# consistent validation error format
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " → ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Validation failed", "details": errors},
    )


# catch-all for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )


app.include_router(auth.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

app.include_router(user.router, prefix="/api")



@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    try:
        import redis.asyncio as aioredis
        from app.config import settings
        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.aclose()
        redis_status = "ok"
    except Exception:
        redis_status = "error"

    overall = "ok" if db_status == "ok" and redis_status == "ok" else "degraded"

    return {
        "status": overall,
        "dependencies": {
            "database": db_status,
            "redis": redis_status,
        }
    }



# add this AFTER app = FastAPI(...) and BEFORE other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://frontend-eight-eta-36.vercel.app"
                   ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)