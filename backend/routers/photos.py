from __future__ import annotations
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend.models.photo import Photo
from backend.models.album import Album
from backend.models.user import User
from backend.utils.auth import get_current_user
from backend.utils.storage import (
    get_upload_path, generate_filename, is_allowed_file, MAX_FILE_SIZE
)

router = APIRouter(prefix="/api/photos", tags=["photos"])


class PhotoOut(BaseModel):
    id: int
    filename: str
    original_name: str
    file_size: int | None = None
    width: int | None = None
    height: int | None = None
    album_id: int
    created_at: str

    class Config:
        from_attributes = True


@router.post("/upload", response_model=List[PhotoOut], status_code=201)
async def upload_photos(
    album_id: int = Form(...),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify album ownership
    result = await db.execute(
        select(Album).where(Album.id == album_id, Album.owner_id == current_user.id)
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="相册不存在")

    uploaded = []
    for file in files:
        if not is_allowed_file(file.filename or ""):
            raise HTTPException(status_code=400, detail=f"不支持的文件格式: {file.filename}")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"文件过大（最大 20MB）: {file.filename}")

        new_filename = generate_filename(file.filename or "photo.jpg")
        file_path = get_upload_path(new_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        # Get image dimensions
        width, height = None, None
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(content))
            width, height = img.size
        except Exception:
            pass

        photo = Photo(
            filename=new_filename,
            original_name=file.filename or "photo.jpg",
            file_size=len(content),
            mime_type=file.content_type,
            width=width,
            height=height,
            album_id=album_id,
            uploader_id=current_user.id,
        )
        db.add(photo)
        uploaded.append(photo)

    await db.commit()
    for p in uploaded:
        await db.refresh(p)

    return [
        {
            "id": p.id,
            "filename": p.filename,
            "original_name": p.original_name,
            "file_size": p.file_size,
            "width": p.width,
            "height": p.height,
            "album_id": p.album_id,
            "created_at": p.created_at.isoformat(),
        }
        for p in uploaded
    ]


@router.get("/{photo_id}/image")
async def get_photo_image(
    photo_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Serve photo file — public access for shared albums."""
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="图片不存在")

    file_path = get_upload_path(photo.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="图片文件不存在")

    return FileResponse(
        file_path,
        media_type=photo.mime_type or "image/jpeg",
        filename=photo.original_name,
    )


@router.delete("/{photo_id}", status_code=204)
async def delete_photo(
    photo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Photo).where(Photo.id == photo_id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="图片不存在")

    # Verify ownership via album
    album_result = await db.execute(
        select(Album).where(Album.id == photo.album_id, Album.owner_id == current_user.id)
    )
    if not album_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="无权删除此图片")

    file_path = get_upload_path(photo.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.delete(photo)
    await db.commit()
