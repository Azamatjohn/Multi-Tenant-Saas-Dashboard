from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.member import MemberRole
from typing import Optional


class MemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    workspace_id: UUID
    role: MemberRole
    joined_at: datetime
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None

    class Config:
        from_attributes = True


class MemberRoleUpdateRequest(BaseModel):
    role: MemberRole


class InviteRequest(BaseModel):
    email: str
    role: MemberRole = MemberRole.member


class InviteResponse(BaseModel):
    id: UUID
    email: str
    role: MemberRole
    expires_at: datetime
    is_accepted: bool

    class Config:
        from_attributes = True