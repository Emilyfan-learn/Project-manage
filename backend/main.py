"""
FastAPI main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
    print(f"Frontend path: {settings.frontend_build_path}")
    print(f"Frontend exists: {settings.frontend_build_path.exists()}")

    # Create database schema if it doesn't exist
    create_database_schema()


@app.get("/api")
async def api_root():
    """
    API root endpoint
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

# Serve frontend static files
if settings.frontend_build_path.exists():
    # Mount static assets
    app.mount("/assets", StaticFiles(directory=str(settings.frontend_build_path / "assets")), name="assets")

    # Serve index.html for root and all other non-API routes
    @app.get("/")
    async def serve_frontend():
        return FileResponse(str(settings.frontend_build_path / "index.html"))

    # Catch-all route for SPA - serve index.html for any unmatched routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't serve index.html for API routes
        if full_path.startswith("api/") or full_path.startswith("health"):
            return {"error": "Not found"}

        file_path = settings.frontend_build_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(settings.frontend_build_path / "index.html"))

    print("✓ Frontend static files enabled")
else:
    @app.get("/")
    async def root():
        return {
            "app_name": settings.app_name,
            "version": settings.app_version,
            "message": "Project Tracker API is running",
            "note": "Frontend not found. Build frontend with: cd frontend && npm run build"
        }
    print("⚠ Frontend not found at:", settings.frontend_build_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
