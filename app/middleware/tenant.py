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

from app.models.billing import Subscription, PlanName, SubscriptionStatus



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









PLAN_LIMITS = {
    PlanName.starter: {"members": 3, "api_calls": 10_000},
    PlanName.pro: {"members": 20, "api_calls": 500_000},
    PlanName.enterprise: {"members": 999, "api_calls": 10_000_000},
}


async def get_workspace_plan(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
) -> PlanName:
    """Returns the current plan for the workspace."""
    from sqlalchemy import select
    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == ctx.workspace.id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription or subscription.status == SubscriptionStatus.cancelled:
        return PlanName.starter

    return subscription.plan


def require_plan(*plans: PlanName):
    """Gate a route to specific plans only."""
    async def check_plan(plan: PlanName = Depends(get_workspace_plan)):
        if plan not in plans:
            raise HTTPException(
                status_code=402,
                detail=f"This feature requires one of these plans: {[p.value for p in plans]}"
            )
        return plan
    return check_plan


# @router.get("/some-pro-feature")
# async def pro_feature(
#     plan = Depends(require_plan(PlanName.pro, PlanName.enterprise))
# ):
