"""
Configuration settings for the Project Tracker application
"""
from pathlib import Path
import os


class Settings:
    """Application settings"""

    # Application Info
    app_name: str = "Project Tracker"
    app_version: str = "2.0.0"

    # Server Settings
    host: str = "127.0.0.1"
    port: int = 8000

    # Database Settings
    database_url: str = "sqlite+aiosqlite:///./data/project_tracking.db"
    database_path: Path = Path(os.getenv("DATABASE_PATH", "./data/project_tracking.db"))

    # Backup Settings
    backup_base_path: Path = Path("./data/backups")
    backup_daily_retention_days: int = 30
    backup_weekly_retention_weeks: int = 12

    # Frontend Settings
    frontend_build_path: Path = Path("./frontend/dist")

    # CORS Settings
    cors_origins: list = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",  # Vite dev server
    ]

    class Config:
        env_file = ".env"
        case_sensitive = False


# Create global settings instance
settings = Settings()
