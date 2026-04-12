import uuid
from typing import Optional
from fastapi import Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.member import WorkspaceMember, MemberRole


class TenantContext:
    def __init__(self, workspace: Workspace, membership: WorkspaceMember, user: User):
        self.workspace = workspace
        self.membership = membership
        self.user = user
        self.role = membership.role


async def get_tenant_context(
    workspace_slug: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    # find workspace by slug
    result = await db.execute(
        select(Workspace).where(Workspace.slug == workspace_slug)
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # check user is a member of this workspace
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this workspace")

    return TenantContext(workspace=workspace, membership=membership, user=current_user)


def require_role(*roles: MemberRole):
    """Dependency factory — use this to gate routes by role."""
    async def check_role(ctx: TenantContext = Depends(get_tenant_context)):
        if ctx.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Requires one of these roles: {[r.value for r in roles]}"
            )
        return ctx
    return check_role