from pydantic import BaseModel
from uuid import UUID
from datetime import date
from typing import List, Optional


class DailyUsage(BaseModel):
    date: date
    api_calls: int

    class Config:
        from_attributes = True


class MemberUsage(BaseModel):
    user_id: UUID
    full_name: str
    email: str
    api_calls: int
    percentage: float


class AnalyticsSummary(BaseModel):
    total_api_calls: int
    avg_calls_per_day: float
    peak_day: Optional[date] = None
    peak_calls: int
    active_members: int
    total_members: int


class AnalyticsResponse(BaseModel):
    summary: AnalyticsSummary
    daily_usage: List[DailyUsage]
    member_usage: List[MemberUsage]