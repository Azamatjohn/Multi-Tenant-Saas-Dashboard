import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.middleware.tenant import get_tenant_context, require_role, TenantContext
from app.models.member import MemberRole
from app.models.billing import Subscription, PlanName, SubscriptionStatus
from app.schemas.billing import (
    SubscriptionResponse, CheckoutRequest,
    CheckoutResponse, PortalResponse
)
from app.services.billing import (
    get_or_create_stripe_customer,
    create_checkout_session,
    create_portal_session,
)

router = APIRouter(tags=["billing"])


@router.get("/workspaces/{workspace_slug}/billing", response_model=SubscriptionResponse)
async def get_subscription(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == ctx.workspace.id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return subscription


@router.post("/workspaces/{workspace_slug}/billing/checkout", response_model=CheckoutResponse)
async def create_checkout(
    payload: CheckoutRequest,
    ctx: TenantContext = Depends(require_role(MemberRole.owner)),
    db: AsyncSession = Depends(get_db),
):
    if payload.plan == PlanName.starter:
        raise HTTPException(status_code=400, detail="Starter plan is free, no checkout needed")

    # get current subscription
    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == ctx.workspace.id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # get or create stripe customer
    customer_id = await get_or_create_stripe_customer(
        workspace_id=str(ctx.workspace.id),
        workspace_name=ctx.workspace.name,
        user_email=ctx.user.email,
        existing_customer_id=subscription.stripe_customer_id,
    )

    # save customer id if new
    if not subscription.stripe_customer_id:
        subscription.stripe_customer_id = customer_id
        await db.commit()

    checkout_url = await create_checkout_session(
        customer_id=customer_id,
        plan=payload.plan.value,
        workspace_slug=ctx.workspace.slug,
        frontend_url=settings.FRONTEND_URL,
    )

    return CheckoutResponse(checkout_url=checkout_url)


@router.post("/workspaces/{workspace_slug}/billing/portal", response_model=PortalResponse)
async def get_portal(
    ctx: TenantContext = Depends(require_role(MemberRole.owner)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == ctx.workspace.id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription or not subscription.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No billing account found. Please subscribe to a plan first."
        )

    portal_url = await create_portal_session(
        customer_id=subscription.stripe_customer_id,
        workspace_slug=ctx.workspace.slug,
        frontend_url=settings.FRONTEND_URL,
    )

    return PortalResponse(portal_url=portal_url)


@router.post("/webhooks/stripe", include_in_schema=False)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # handle subscription events
    if event["type"] == "checkout.session.completed":
        await _handle_checkout_completed(event["data"]["object"], db)

    elif event["type"] == "customer.subscription.updated":
        await _handle_subscription_updated(event["data"]["object"], db)

    elif event["type"] == "customer.subscription.deleted":
        await _handle_subscription_deleted(event["data"]["object"], db)

    elif event["type"] == "invoice.payment_failed":
        await _handle_payment_failed(event["data"]["object"], db)

    return {"received": True}






async def _handle_checkout_completed(session, db: AsyncSession):
    """Called when a user completes checkout — activate their subscription."""
    customer_id = session.customer
    stripe_subscription_id = session.subscription
    workspace_slug = getattr(session.metadata, 'workspace_slug', None) if session.metadata else None

    if not workspace_slug:
        print("No workspace_slug in metadata, skipping")
        return

    from app.models.workspace import Workspace
    result = await db.execute(
        select(Workspace).where(Workspace.slug == workspace_slug)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        print(f"Workspace not found: {workspace_slug}")
        return

    result = await db.execute(
        select(Subscription).where(Subscription.workspace_id == workspace.id)
    )
    subscription = result.scalar_one_or_none()
    if not subscription:
        return

    stripe_sub = stripe.Subscription.retrieve(stripe_subscription_id)
    price_id = stripe_sub.items.data[0].price.id

    plan = PlanName.starter
    if price_id == settings.STRIPE_PRO_PRICE_ID:
        plan = PlanName.pro
    elif price_id == settings.STRIPE_ENTERPRISE_PRICE_ID:
        plan = PlanName.enterprise

    subscription.plan = plan
    subscription.status = SubscriptionStatus.active
    subscription.stripe_customer_id = customer_id
    subscription.stripe_subscription_id = stripe_subscription_id

    import datetime
    subscription.current_period_end = datetime.datetime.fromtimestamp(
        stripe_sub.current_period_end,
        tz=datetime.timezone.utc
    )

    await db.commit()
    print(f"Subscription activated: {workspace_slug} → {plan.value}")


async def _handle_subscription_updated(stripe_sub, db: AsyncSession):
    stripe_subscription_id = stripe_sub.id

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == stripe_subscription_id
        )
    )
    subscription = result.scalar_one_or_none()
    if not subscription:
        return

    status_map = {
        "active": SubscriptionStatus.active,
        "trialing": SubscriptionStatus.trialing,
        "past_due": SubscriptionStatus.past_due,
        "canceled": SubscriptionStatus.cancelled,
    }
    subscription.status = status_map.get(stripe_sub.status, SubscriptionStatus.active)

    import datetime
    subscription.current_period_end = datetime.datetime.fromtimestamp(
        stripe_sub.current_period_end,
        tz=datetime.timezone.utc
    )
    await db.commit()


async def _handle_subscription_deleted(stripe_sub, db: AsyncSession):
    stripe_subscription_id = stripe_sub.id

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == stripe_subscription_id
        )
    )
    subscription = result.scalar_one_or_none()
    if not subscription:
        return

    subscription.plan = PlanName.starter
    subscription.status = SubscriptionStatus.cancelled
    subscription.stripe_subscription_id = None
    await db.commit()
    print("Subscription cancelled — downgraded to starter")


async def _handle_payment_failed(invoice, db: AsyncSession):
    customer_id = invoice.customer

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_customer_id == customer_id
        )
    )
    subscription = result.scalar_one_or_none()
    if not subscription:
        return

    subscription.status = SubscriptionStatus.past_due
    await db.commit()
    print("Payment failed — marked as past_due")