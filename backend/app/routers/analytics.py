from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.middleware.tenant import get_tenant_context, TenantContext
from app.models.analytics import UsageRecord
from app.models.member import WorkspaceMember
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsResponse, AnalyticsSummary,
    DailyUsage, MemberUsage
)

router = APIRouter(tags=["analytics"])


@router.get("/workspaces/{workspace_slug}/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    days: int = Query(default=30, ge=7, le=90),
):
    workspace_id = ctx.workspace.id
    start_date = date.today() - timedelta(days=days)

    # daily usage records
    result = await db.execute(
        select(UsageRecord)
        .where(
            and_(
                UsageRecord.workspace_id == workspace_id,
                UsageRecord.date >= start_date,
            )
        )
        .order_by(UsageRecord.date.asc())
    )
    records = result.scalars().all()

    daily_usage = [
        DailyUsage(date=r.date, api_calls=r.api_calls)
        for r in records
    ]

    # summary stats
    total_calls = sum(r.api_calls for r in records)
    avg_calls = round(total_calls / days, 1) if days > 0 else 0
    peak_record = max(records, key=lambda r: r.api_calls) if records else None

    # member count
    member_result = await db.execute(
        select(func.count(WorkspaceMember.id))
        .where(WorkspaceMember.workspace_id == workspace_id)
    )
    total_members = member_result.scalar() or 0

    # active members — members who joined before today (simple proxy for now)
    active_members = total_members

    summary = AnalyticsSummary(
        total_api_calls=total_calls,
        avg_calls_per_day=avg_calls,
        peak_day=peak_record.date if peak_record else None,
        peak_calls=peak_record.api_calls if peak_record else 0,
        active_members=active_members,
        total_members=total_members,
    )

    # member usage breakdown — placeholder until per-member tracking added
    member_result = await db.execute(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .join(User, WorkspaceMember.user_id == User.id)
    )
    memberships = member_result.scalars().all()

    member_usage = []
    for m in memberships:
        result = await db.execute(select(User).where(User.id == m.user_id))
        user = result.scalar_one_or_none()
        if user:
            member_usage.append(MemberUsage(
                user_id=user.id,
                full_name=user.full_name,
                email=user.email,
                api_calls=0,
                percentage=0.0,
            ))

    return AnalyticsResponse(
        summary=summary,
        daily_usage=daily_usage,
        member_usage=member_usage,
    )