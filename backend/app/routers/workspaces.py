import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.tenant import get_tenant_context, require_role, TenantContext
from app.models import Workspace
from app.models.member import MemberRole
from app.schemas.workspace import WorkspaceResponse, WorkspaceUpdateRequest

from app.models.audit import AuditLog
from app.middleware.tenant import require_role
from app.models.member import MemberRole
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.dependencies import get_current_user
from app.models.user import User






router = APIRouter(prefix="/workspaces/{workspace_slug}", tags=["workspaces"])


@router.get("", response_model=WorkspaceResponse)
async def get_workspace(ctx: TenantContext = Depends(get_tenant_context)):
    return ctx.workspace


@router.patch("", response_model=WorkspaceResponse)
async def update_workspace(
    payload: WorkspaceUpdateRequest,
    ctx: TenantContext = Depends(require_role(MemberRole.owner, MemberRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    workspace = ctx.workspace

    if payload.name:
        workspace.name = payload.name

    if payload.slug:
        # check slug not taken by another workspace
        result = await db.execute(
            select(type(workspace)).where(
                type(workspace).slug == payload.slug,
                type(workspace).id != workspace.id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Slug already taken")
        workspace.slug = payload.slug

    await db.commit()
    await db.refresh(workspace)
    return workspace



class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    action: str
    resource: str
    detail: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/audit", response_model=List[AuditLogResponse])
async def get_audit_logs(
    ctx: TenantContext = Depends(require_role(MemberRole.owner, MemberRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.workspace_id == ctx.workspace.id)
        .order_by(AuditLog.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()
