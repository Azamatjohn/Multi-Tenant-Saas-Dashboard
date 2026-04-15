import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Enum as SAEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from typing import Optional
import enum

class PlanName(str, enum.Enum):
    starter = "starter"
    pro = "pro"
    enterprise = "enterprise"

class SubscriptionStatus(str, enum.Enum):
    active = "active"
    trialing = "trialing"
    past_due = "past_due"
    cancelled = "cancelled"

class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan: Mapped[PlanName] = mapped_column(SAEnum(PlanName), nullable=False, default=PlanName.starter)
    status: Mapped[SubscriptionStatus] = mapped_column(SAEnum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.trialing)
    # stripe IDs — you'll need these to talk to Stripe in Phase 4
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace: Mapped["Workspace"] = relationship(back_populates="subscription")