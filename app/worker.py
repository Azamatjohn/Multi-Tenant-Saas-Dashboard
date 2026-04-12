from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "saas_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.usage"],  # explicit import instead of autodiscover
)

celery_app.conf.timezone = "UTC"

celery_app.conf.beat_schedule = {
    "flush-usage-every-hour": {
        "task": "app.tasks.usage.flush_usage_to_db",
        "schedule": crontab(minute=0),
    },
}