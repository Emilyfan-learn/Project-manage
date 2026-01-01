"""
API routes for Backup management
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from typing import Optional
from pydantic import BaseModel
from backend.services.backup_service import BackupService

router = APIRouter()
backup_service = BackupService()


class BackupCreateRequest(BaseModel):
    """Request model for creating backup"""
    description: Optional[str] = None


class BackupRestoreRequest(BaseModel):
    """Request model for restoring backup"""
    filename: str


@router.post("/create")
async def create_backup(request: BackupCreateRequest):
    """
    Create a new database backup

    - **description**: Optional description for this backup
    """
    try:
        backup_info = backup_service.create_backup(description=request.description)
        return {
            "success": True,
            "message": "Backup created successfully",
            "backup": backup_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")


@router.get("/list")
async def list_backups():
    """
    List all available backups

    Returns list of backups sorted by creation date (newest first)
    """
    try:
        backups = backup_service.list_backups()
        return {
            "success": True,
            "count": len(backups),
            "backups": backups
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")


@router.get("/download/{filename}")
async def download_backup(filename: str):
    """
    Download a backup file

    - **filename**: Name of the backup file to download
    """
    try:
        backup_path = backup_service.get_backup(filename)

        if not backup_path:
            raise HTTPException(status_code=404, detail="Backup not found")

        return FileResponse(
            path=str(backup_path),
            filename=filename,
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download backup: {str(e)}")


@router.delete("/delete/{filename}")
async def delete_backup(filename: str):
    """
    Delete a backup file

    - **filename**: Name of the backup file to delete
    """
    try:
        success = backup_service.delete_backup(filename)

        if not success:
            raise HTTPException(status_code=404, detail="Backup not found")

        return {
            "success": True,
            "message": "Backup deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete backup: {str(e)}")


@router.post("/restore")
async def restore_backup(request: BackupRestoreRequest):
    """
    Restore database from a backup

    **WARNING**: This will replace the current database!
    A backup of the current database will be created automatically before restore.

    - **filename**: Name of the backup file to restore from
    """
    try:
        success = backup_service.restore_backup(request.filename)

        if not success:
            raise HTTPException(status_code=404, detail="Backup not found")

        return {
            "success": True,
            "message": "Database restored successfully from backup"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restore backup: {str(e)}")


@router.get("/stats")
async def get_database_stats():
    """
    Get current database statistics

    Returns information about database size and table counts
    """
    try:
        stats = backup_service.get_database_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.post("/cleanup")
async def cleanup_old_backups(keep_count: int = Query(10, ge=1, le=100)):
    """
    Clean up old backups, keeping only the most recent N backups

    - **keep_count**: Number of recent backups to keep (default: 10)
    """
    try:
        deleted_count = backup_service.cleanup_old_backups(keep_count=keep_count)
        return {
            "success": True,
            "message": f"Cleaned up {deleted_count} old backup(s)",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup backups: {str(e)}")
