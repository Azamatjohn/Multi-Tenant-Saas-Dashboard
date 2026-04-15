import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog


async def log_action(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    action: str,
    resource: str,
    detail: str = None,
):
    """Write an audit log entry. Call this after any significant action."""
    entry = AuditLog(
        id=uuid.uuid4(),
        workspace_id=workspace_id,
        user_id=user_id,
        action=action,
        resource=resource,
        detail=detail,
    )
    db.add(entry)
    # don't commit here — let the caller's transaction handle it


ACTIONS = {
    "member_invited": "member_invited",
    "member_removed": "member_removed",
    "member_role_changed": "member_role_changed",
    "invite_accepted": "invite_accepted",
    "workspace_updated": "workspace_updated",
    "plan_upgraded": "plan_upgraded",
    "plan_cancelled": "plan_cancelled",
}