from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import engine
from app.models import *  # noqa
from app.routers import auth, workspaces, members, billing


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()

app = FastAPI(title="SaaS Platform API", version="0.1.0", lifespan=lifespan)

app.include_router(auth.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(billing.router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}