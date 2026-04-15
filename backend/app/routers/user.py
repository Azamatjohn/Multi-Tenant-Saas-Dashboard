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