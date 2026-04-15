from pydantic import BaseModel, EmailStr, field_validator
import re
from uuid import UUID


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    workspace_name: str
    workspace_slug: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("workspace_slug")
    @classmethod
    def slug_format(cls, v):
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError("Slug can only contain lowercase letters, numbers, and hyphens")
        return v


@field_validator("full_name")
@classmethod
def full_name_valid(cls, v):
    v = v.strip()
    if len(v) < 2:
        raise ValueError("Full name must be at least 2 characters")
    if len(v) > 100:
        raise ValueError("Full name must be under 100 characters")
    return v

@field_validator("workspace_name")
@classmethod
def workspace_name_valid(cls, v):
    v = v.strip()
    if len(v) < 2:
        raise ValueError("Workspace name must be at least 2 characters")
    if len(v) > 50:
        raise ValueError("Workspace name must be under 50 characters")
    return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"



class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str

    class Config:
        from_attributes = True