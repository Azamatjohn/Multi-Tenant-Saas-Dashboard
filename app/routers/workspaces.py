from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.tenant import get_tenant_context, require_role, TenantContext
from app.models.member import MemberRole
from app.schemas.workspace import WorkspaceResponse, WorkspaceUpdateRequest

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