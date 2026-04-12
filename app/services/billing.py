import stripe
from app.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

PLAN_PRICE_MAP = {
    "pro": settings.STRIPE_PRO_PRICE_ID,
    "enterprise": settings.STRIPE_ENTERPRISE_PRICE_ID,
}


async def get_or_create_stripe_customer(
    workspace_id: str,
    workspace_name: str,
    user_email: str,
    existing_customer_id: str = None,
) -> str:
    """Returns a Stripe customer ID, creating one if needed."""
    if existing_customer_id:
        return existing_customer_id

    customer = stripe.Customer.create(
        email=user_email,
        name=workspace_name,
        metadata={"workspace_id": workspace_id},
    )
    return customer.id


async def create_checkout_session(
    customer_id: str,
    plan: str,
    workspace_slug: str,
    frontend_url: str,
) -> str:
    """Creates a Stripe checkout session and returns the URL."""
    price_id = PLAN_PRICE_MAP.get(plan)
    if not price_id:
        raise ValueError(f"No price configured for plan: {plan}")

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{frontend_url}/{workspace_slug}/billing?success=true",
        cancel_url=f"{frontend_url}/{workspace_slug}/billing?cancelled=true",
        metadata={"workspace_slug": workspace_slug},
    )
    return session.url


async def create_portal_session(
    customer_id: str,
    workspace_slug: str,
    frontend_url: str,
) -> str:
    """Creates a Stripe customer portal session and returns the URL."""
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{frontend_url}/{workspace_slug}/billing",
    )
    return session.url