import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_current_user

from app.middleware.rate_limit import limiter
from fastapi import APIRouter, Depends, HTTPException, status, Request


from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.member import WorkspaceMember, MemberRole
from app.models.billing import Subscription, PlanName, SubscriptionStatus
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest,
    TokenResponse, UserResponse
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # check email not already taken
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # check workspace slug not taken
    result = await db.execute(select(Workspace).where(Workspace.slug == payload.workspace_slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Workspace slug already taken")

    # create user
    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()  # get user.id without committing yet

    # create workspace
    workspace = Workspace(
        id=uuid.uuid4(),
        name=payload.workspace_name,
        slug=payload.workspace_slug,
    )
    db.add(workspace)
    await db.flush()

    # make the registering user the owner
    membership = WorkspaceMember(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        user_id=user.id,
        role=MemberRole.owner,
    )
    db.add(membership)

    # create a starter subscription for the workspace
    subscription = Subscription(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        plan=PlanName.starter,
        status=SubscriptionStatus.trialing,
    )
    db.add(subscription)

    await db.commit()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # find user by email
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_data = decode_token(payload.refresh_token)

    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = token_data.get("sub")

    # verify user still exists
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # issue fresh pair of tokens
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user



