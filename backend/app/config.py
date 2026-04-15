from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SYNC_DATABASE_URL: str
    SECRET_KEY: str
    REDIS_URL: str = "redis://localhost:6379"
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_PRICE_ID: str = ""
    STRIPE_ENTERPRISE_PRICE_ID: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    RESEND_API_KEY: str = ""
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()