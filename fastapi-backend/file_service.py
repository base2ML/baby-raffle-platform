"""
File upload and management service
Handles image uploads for slideshow and other media assets
"""
import os
import uuid
import aiofiles
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
from PIL import Image, ImageOps
from io import BytesIO
from fastapi import HTTPException, status, UploadFile

from database import db_manager
from models import (
    FileUploadResponse, SlideshowImageCreate, SlideshowImageResponse,
    FileRecord
)

logger = logging.getLogger(__name__)

# File upload configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB default
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
THUMBNAIL_SIZE = (300, 300)
LARGE_SIZE = (1200, 1200)

class FileService:
    """Service for handling file uploads and media management"""
    
    def __init__(self):
        self.upload_dir = Path(UPLOAD_DIR)
        self.upload_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        (self.upload_dir / "images").mkdir(exist_ok=True)
        (self.upload_dir / "thumbnails").mkdir(exist_ok=True)
        (self.upload_dir / "large").mkdir(exist_ok=True)
    
    def _get_file_path(self, tenant_id: str, filename: str, size: str = "original") -> Path:
        """Generate file path based on tenant and size"""
        if size == "thumbnail":
            return self.upload_dir / "thumbnails" / tenant_id / filename
        elif size == "large":
            return self.upload_dir / "large" / tenant_id / filename
        else:
            return self.upload_dir / "images" / tenant_id / filename
    
    def _get_file_url(self, tenant_id: str, filename: str, size: str = "original") -> str:
        """Generate public URL for file"""
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        if size == "thumbnail":
            return f"{base_url}/files/thumbnails/{tenant_id}/{filename}"
        elif size == "large":
            return f"{base_url}/files/large/{tenant_id}/{filename}"
        else:
            return f"{base_url}/files/images/{tenant_id}/{filename}"
    
    def _validate_image(self, file: UploadFile) -> None:
        """Validate uploaded image file"""
        # Check content type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Check file size (this is approximate from headers)
        if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
            )
    
    async def _create_thumbnails(self, original_path: Path, tenant_id: str, filename: str):
        """Create thumbnail and large versions of image"""
        try:
            with Image.open(original_path) as img:
                # Fix orientation based on EXIF data
                img = ImageOps.exif_transpose(img)
                
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Create thumbnail
                thumbnail_path = self._get_file_path(tenant_id, filename, "thumbnail")
                thumbnail_path.parent.mkdir(parents=True, exist_ok=True)
                
                img_thumbnail = img.copy()
                img_thumbnail.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                img_thumbnail.save(thumbnail_path, "JPEG", quality=85, optimize=True)
                
                # Create large version if original is bigger
                if img.width > LARGE_SIZE[0] or img.height > LARGE_SIZE[1]:
                    large_path = self._get_file_path(tenant_id, filename, "large")
                    large_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    img_large = img.copy()
                    img_large.thumbnail(LARGE_SIZE, Image.Resampling.LANCZOS)
                    img_large.save(large_path, "JPEG", quality=90, optimize=True)
                
                logger.info(f"Created thumbnails for {filename}")
                
        except Exception as e:
            logger.error(f"Failed to create thumbnails for {filename}: {e}")
            # Don't raise exception - thumbnails are optional
    
    async def upload_image(
        self, 
        file: UploadFile, 
        tenant_id: str
    ) -> FileUploadResponse:
        """Upload and process image file"""
        try:
            # Validate file
            self._validate_image(file)
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = Path(file.filename).suffix.lower()
            if not file_extension:
                file_extension = ".jpg"  # Default extension
            
            filename = f"{file_id}{file_extension}"
            
            # Create tenant directory
            file_path = self._get_file_path(tenant_id, filename)
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Read and validate file content
            content = await file.read()
            file_size = len(content)
            
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
                )
            
            # Save original file
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            # Create thumbnails asynchronously
            await self._create_thumbnails(file_path, tenant_id, filename)
            
            # Store file record in database
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    INSERT INTO files (
                        id, tenant_id, filename, original_filename, 
                        file_path, url, size, content_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                file_id, tenant_id, filename, file.filename,
                str(file_path), self._get_file_url(tenant_id, filename),
                file_size, file.content_type
                )
                await conn.commit()
            
            logger.info(f"Uploaded image {filename} for tenant {tenant_id}")
            
            return FileUploadResponse(
                id=file_id,
                filename=filename,
                original_filename=file.filename,
                url=self._get_file_url(tenant_id, filename),
                size=file_size,
                content_type=file.content_type,
                created_at=datetime.utcnow()
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to upload image: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image"
            )
    
    async def get_file_info(self, file_id: str, tenant_id: str) -> Optional[FileRecord]:
        """Get file information"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.fetchone("""
                    SELECT * FROM files 
                    WHERE id = ? AND tenant_id = ?
                """, file_id, tenant_id)
                
                return FileRecord(result) if result else None
                
        except Exception as e:
            logger.error(f"Failed to get file info: {e}")
            return None
    
    async def delete_file(self, file_id: str, tenant_id: str) -> bool:
        """Delete file and all its variants"""
        try:
            # Get file info
            file_record = await self.get_file_info(file_id, tenant_id)
            if not file_record:
                return False
            
            # Delete physical files
            original_path = self._get_file_path(tenant_id, file_record.filename)
            thumbnail_path = self._get_file_path(tenant_id, file_record.filename, "thumbnail")
            large_path = self._get_file_path(tenant_id, file_record.filename, "large")
            
            for file_path in [original_path, thumbnail_path, large_path]:
                if file_path.exists():
                    file_path.unlink()
            
            # Delete from database
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    DELETE FROM files WHERE id = ? AND tenant_id = ?
                """, file_id, tenant_id)
                
                # Also delete slideshow entries
                await conn.execute("""
                    DELETE FROM slideshow_images 
                    WHERE file_id = ? AND tenant_id = ?
                """, file_id, tenant_id)
                
                await conn.commit()
            
            logger.info(f"Deleted file {file_id} for tenant {tenant_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            return False
    
    async def add_to_slideshow(
        self, 
        file_id: str, 
        tenant_id: str, 
        slideshow_data: SlideshowImageCreate
    ) -> SlideshowImageResponse:
        """Add image to slideshow"""
        try:
            # Verify file exists
            file_record = await self.get_file_info(file_id, tenant_id)
            if not file_record:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File not found"
                )
            
            # Add to slideshow
            slideshow_id = str(uuid.uuid4())
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    INSERT INTO slideshow_images (
                        id, tenant_id, file_id, title, caption, 
                        display_order, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                slideshow_id, tenant_id, file_id, slideshow_data.title,
                slideshow_data.caption, slideshow_data.display_order,
                slideshow_data.is_active
                )
                await conn.commit()
            
            return SlideshowImageResponse(
                id=slideshow_id,
                tenant_id=tenant_id,
                file_id=file_id,
                title=slideshow_data.title,
                caption=slideshow_data.caption,
                display_order=slideshow_data.display_order,
                is_active=slideshow_data.is_active,
                url=file_record.url,
                created_at=datetime.utcnow()
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to add image to slideshow: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add image to slideshow"
            )
    
    async def get_slideshow_images(self, tenant_id: str) -> List[SlideshowImageResponse]:
        """Get all slideshow images for tenant"""
        try:
            async with db_manager.get_connection() as conn:
                results = await conn.fetch("""
                    SELECT si.*, f.url, f.filename
                    FROM slideshow_images si
                    JOIN files f ON si.file_id = f.id
                    WHERE si.tenant_id = ? AND si.is_active = 1
                    ORDER BY si.display_order, si.created_at
                """, tenant_id)
                
                return [
                    SlideshowImageResponse(
                        id=str(result['id']),
                        tenant_id=str(result['tenant_id']),
                        file_id=str(result['file_id']),
                        title=result['title'],
                        caption=result['caption'],
                        display_order=result['display_order'],
                        is_active=bool(result['is_active']),
                        url=result['url'],
                        created_at=result['created_at']
                    ) for result in results
                ]
                
        except Exception as e:
            logger.error(f"Failed to get slideshow images: {e}")
            return []
    
    async def update_slideshow_image(
        self, 
        slideshow_id: str, 
        tenant_id: str, 
        update_data: SlideshowImageCreate
    ) -> Optional[SlideshowImageResponse]:
        """Update slideshow image"""
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute("""
                    UPDATE slideshow_images 
                    SET title = ?, caption = ?, display_order = ?, 
                        is_active = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND tenant_id = ?
                """,
                update_data.title, update_data.caption, update_data.display_order,
                update_data.is_active, slideshow_id, tenant_id
                )
                await conn.commit()
                
                # Get updated record
                result = await conn.fetchone("""
                    SELECT si.*, f.url
                    FROM slideshow_images si
                    JOIN files f ON si.file_id = f.id
                    WHERE si.id = ? AND si.tenant_id = ?
                """, slideshow_id, tenant_id)
                
                if result:
                    return SlideshowImageResponse(
                        id=str(result['id']),
                        tenant_id=str(result['tenant_id']),
                        file_id=str(result['file_id']),
                        title=result['title'],
                        caption=result['caption'],
                        display_order=result['display_order'],
                        is_active=bool(result['is_active']),
                        url=result['url'],
                        created_at=result['created_at']
                    )
                
                return None
                
        except Exception as e:
            logger.error(f"Failed to update slideshow image: {e}")
            return None
    
    async def remove_from_slideshow(self, slideshow_id: str, tenant_id: str) -> bool:
        """Remove image from slideshow (keep file)"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.execute("""
                    DELETE FROM slideshow_images 
                    WHERE id = ? AND tenant_id = ?
                """, slideshow_id, tenant_id)
                await conn.commit()
                
                # Check if any rows were affected
                return result.rowcount > 0 if hasattr(result, 'rowcount') else True
                
        except Exception as e:
            logger.error(f"Failed to remove image from slideshow: {e}")
            return False
    
    async def get_tenant_files(
        self, 
        tenant_id: str, 
        limit: int = 50,
        offset: int = 0
    ) -> List[FileRecord]:
        """Get all files for tenant with pagination"""
        try:
            async with db_manager.get_connection() as conn:
                results = await conn.fetch("""
                    SELECT * FROM files 
                    WHERE tenant_id = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """, tenant_id, limit, offset)
                
                return [FileRecord(result) for result in results]
                
        except Exception as e:
            logger.error(f"Failed to get tenant files: {e}")
            return []

# Global service instance
file_service = FileService()