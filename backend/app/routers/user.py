from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.member import WorkspaceMember
from app.schemas.workspace import WorkspaceResponse
from typing import List


from app.models.invite import Invite
from datetime import datetime, timezone
from sqlalchemy import select
from fastapi import HTTPException

from app.models.audit import AuditLog
from app.models.workspace import Workspace

router = APIRouter(tags=["user"])


@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def list_my_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == current_user.id)
    )
    workspaces = result.scalars().all()
    return workspaces




@router.get("/invites/{token}/info")
async def get_invite_info(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    from app.models.workspace import Workspace
    result = await db.execute(
        select(Invite).where(
            Invite.token == token,
            Invite.is_accepted == False,
        )
    )
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already accepted")

    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite has expired")

    from app.models.workspace import Workspace
    result = await db.execute(
        select(Workspace).where(Workspace.id == invite.workspace_id)
    )
    workspace = result.scalar_one_or_none()

    return {
        "email": invite.email,
        "role": invite.role.value,
        "workspace_name": workspace.name if workspace else "",
        "workspace_slug": workspace.slug if workspace else "",
    }


@router.get("/workspaces/{workspace_slug}/notifications")
async def get_notifications(
    workspace_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    result = await db.execute(
        select(Workspace).where(Workspace.slug == workspace_slug)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.workspace_id == workspace.id)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    )
    logs = result.scalars().all()

    return [
        {
            "id": str(log.id),
            "action": log.action,
            "detail": log.detail,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]