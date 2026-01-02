"""
FastAPI main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from backend.config import settings
from backend.init_db import create_database_schema

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Lightweight project tracking and management system",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """
    Initialize database on startup
    """
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"Server: http://{settings.host}:{settings.port}")

    # Create database schema if it doesn't exist
    create_database_schema()


@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "message": "Project Tracker API is running",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "database": str(settings.database_path.exists()),
    }


# Import and include routers
from backend.routers import wbs, projects, pending, issues, dependencies, backup
from backend.routers import settings as settings_router

app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(wbs.router, prefix="/api/wbs", tags=["WBS"])
app.include_router(pending.router, prefix="/api/pending", tags=["Pending Items"])
app.include_router(issues.router, prefix="/api/issues", tags=["Issue Tracking"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])

# CSV router - no external dependencies, always available
from backend.routers import csv_router
app.include_router(csv_router.router, prefix="/api/csv", tags=["CSV Import/Export"])
print("✓ CSV import/export functionality enabled")

# Excel router is optional - only include if openpyxl is available
try:
    from backend.routers import excel
    app.include_router(excel.router, prefix="/api/excel", tags=["Excel Import/Export"])
    print("✓ Excel import/export functionality enabled (optional)")
except ImportError:
    print("ℹ Excel import/export disabled (use CSV instead)")

app.include_router(dependencies.router, prefix="/api/dependencies", tags=["Dependencies"])
app.include_router(backup.router, prefix="/api/backup", tags=["Backup"])

# TODO: Add other routers
# from backend.routers import reports, gantt, notifications
# app.include_router(pending.router, prefix="/api/pending", tags=["pending"])
# app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
# app.include_router(gantt.router, prefix="/api/gantt", tags=["gantt"])
# app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])

# Serve frontend static files (after build)
if settings.frontend_build_path.exists():
    app.mount("/", StaticFiles(directory=str(settings.frontend_build_path), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
