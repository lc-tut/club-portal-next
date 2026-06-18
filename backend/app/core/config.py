from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://clubportal:clubportal@localhost:5432/clubportal"
    allowed_email_domains: list[str] = ["edu.teu.ac.jp"]
    google_client_id: str = ""
    google_client_secret: str = ""
    session_secret_key: str = "change-me"
    upload_dir: str = "/data/uploads"
    max_upload_size_bytes: int = 10 * 1024 * 1024


settings = Settings()
