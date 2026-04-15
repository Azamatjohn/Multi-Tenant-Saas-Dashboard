import uuid
from datetime import date as date_type, datetime
from sqlalchemy import Date, DateTime, Integer, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    api_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("workspace_id", "date", name="uq_usage_workspace_date"),
    )