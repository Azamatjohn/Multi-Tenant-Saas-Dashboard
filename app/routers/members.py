import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.middleware.tenant import get_tenant_context, require_role, TenantContext
from app.models.member import WorkspaceMember, MemberRole
from app.models.invite import Invite
from app.models.user import User
from app.schemas.member import (
    MemberResponse, MemberRoleUpdateRequest,
    InviteRequest, InviteResponse
)

router = APIRouter(prefix="/workspaces/{workspace_slug}", tags=["members"])


@router.get("/members", response_model=List[MemberResponse])
async def list_members(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == ctx.workspace.id)
        .options(joinedload(WorkspaceMember.user))
    )
    memberships = result.scalars().all()

    response = []
    for m in memberships:
        response.append(MemberResponse(
            id=m.id,
            user_id=m.user_id,
            workspace_id=m.workspace_id,
            role=m.role,
            joined_at=m.joined_at,
            user_email=m.user.email,
            user_full_name=m.user.full_name,
        ))
    return response


@router.patch("/members/{member_id}/role", response_model=MemberResponse)
async def update_member_role(
    member_id: uuid.UUID,
    payload: MemberRoleUpdateRequest,
    ctx: TenantContext = Depends(require_role(MemberRole.owner, MemberRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceMember)
        .where(
            WorkspaceMember.id == member_id,
            WorkspaceMember.workspace_id == ctx.workspace.id,
        )
        .options(joinedload(WorkspaceMember.user))
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # prevent demoting the owner
    if member.role == MemberRole.owner:
        raise HTTPException(status_code=403, detail="Cannot change the owner's role")

    member.role = payload.role
    await db.commit()
    await db.refresh(member)

    return MemberResponse(
        id=member.id,
        user_id=member.user_id,
        workspace_id=member.workspace_id,
        role=member.role,
        joined_at=member.joined_at,
        user_email=member.user.email,
        user_full_name=member.user.full_name,
    )


@router.delete("/members/{member_id}", status_code=204)
async def remove_member(
    member_id: uuid.UUID,
    ctx: TenantContext = Depends(require_role(MemberRole.owner, MemberRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.id == member_id,
            WorkspaceMember.workspace_id == ctx.workspace.id,
        )
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.role == MemberRole.owner:
        raise HTTPException(status_code=403, detail="Cannot remove the workspace owner")

    await db.delete(member)
    await db.commit()


@router.post("/invites", response_model=InviteResponse, status_code=201)
async def create_invite(
    payload: InviteRequest,
    ctx: TenantContext = Depends(require_role(MemberRole.owner, MemberRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    # check not already a member
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        result = await db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == ctx.workspace.id,
                WorkspaceMember.user_id == existing_user.id,
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User is already a member")

    # check no pending invite for this email
    result = await db.execute(
        select(Invite).where(
            Invite.workspace_id == ctx.workspace.id,
            Invite.email == payload.email,
            Invite.is_accepted == False,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invite already sent to this email")

    invite = Invite(
        id=uuid.uuid4(),
        workspace_id=ctx.workspace.id,
        invited_by_id=ctx.user.id,
        email=payload.email,
        role=payload.role,
        token=secrets.token_urlsafe(32),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)

    # in Phase 5 we'll send a real email here
    # for now print the invite link so you can test it
    print(f"\n INVITE LINK: http://localhost:3000/invite/{invite.token}\n")

    return invite


@router.get("/invites", response_model=List[InviteResponse])
async def list_invites(
    ctx: TenantContext = Depends(require_role(MemberRole.owner, MemberRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invite).where(
            Invite.workspace_id == ctx.workspace.id,
            Invite.is_accepted == False,
        )
    )
    return result.scalars().all()


@router.post("/invites/{token}/accept", status_code=200)
async def accept_invite(
    token: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
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

    if invite.email != ctx.user.email:
        raise HTTPException(status_code=403, detail="This invite was sent to a different email")

    # add as member
    membership = WorkspaceMember(
        id=uuid.uuid4(),
        workspace_id=invite.workspace_id,
        user_id=ctx.user.id,
        role=invite.role,
    )
    db.add(membership)

    invite.is_accepted = True
    await db.commit()

    return {"message": "Successfully joined workspace"}