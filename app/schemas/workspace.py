from pydantic import BaseModel, field_validator
from uuid import UUID
from typing import Optional
from datetime import datetime
import re


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkspaceUpdateRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v):
        if v and not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError("Slug can only contain lowercase letters, numbers, and hyphens")
        return v
