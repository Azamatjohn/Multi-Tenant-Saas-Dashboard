import resend
from app.config import settings

resend.api_key = settings.RESEND_API_KEY


async def send_invite_email(
    to_email: str,
    workspace_name: str,
    invited_by_name: str,
    role: str,
    invite_url: str,
):
    """Send a workspace invitation email."""
    try:
        resend.Emails.send({
            "from": "NexusHQ <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"You've been invited to join {workspace_name} on NexusHQ",
            "html": f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

    <!-- Header -->
    <div style="background:#0f172a;padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;letter-spacing:-0.5px;">NexusHQ</h1>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="color:#0f172a;font-size:20px;font-weight:600;margin:0 0 8px;">
        You've been invited
      </h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
        <strong style="color:#0f172a;">{invited_by_name}</strong> has invited you to join
        <strong style="color:#0f172a;">{workspace_name}</strong> as a
        <strong style="color:#0f172a;">{role}</strong>.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="{invite_url}"
           style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:500;">
          Accept invitation
        </a>
      </div>

      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
        Or copy this link into your browser:<br>
        <a href="{invite_url}" style="color:#64748b;word-break:break-all;">{invite_url}</a>
      </p>

      <div style="border-top:1px solid #e2e8f0;margin-top:32px;padding-top:24px;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          This invite expires in 7 days. If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
            """,
        })
        print(f"Invite email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send invite email: {e}")