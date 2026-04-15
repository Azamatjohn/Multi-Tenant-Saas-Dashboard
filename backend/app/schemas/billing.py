from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from app.models.billing import PlanName, SubscriptionStatus


class SubscriptionResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    plan: PlanName
    status: SubscriptionStatus
    current_period_end: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    plan: PlanName  # "pro" or "enterprise"


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str