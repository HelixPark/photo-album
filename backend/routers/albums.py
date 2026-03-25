from __future__ import annotations
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from backend.database import get_db
from backend.models.album import Album
from backend.models.photo import Photo
from backend.models.user import User
from backend.utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/albums", tags=["albums"])


class AlbumCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = False


class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    cover_photo_id: Optional[int] = None


class PhotoOut(BaseModel):
    id: int
    filename: str
    original_name: str
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True


class AlbumOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_public: bool
    share_token: Optional[str] = None
    cover_photo_id: Optional[int] = None
    owner_id: int
    created_at: str
    updated_at: str
    photo_count: int = 0
    cover_url: Optional[str] = None

    class Config:
        from_attributes = True


class AlbumDetail(AlbumOut):
    photos: List[PhotoOut] = []


def album_to_out(album: Album) -> dict:
    photos = album.photos if album.photos else []
    cover_url = None
    if album.cover_photo_id:
        cover_url = f"/api/photos/{album.cover_photo_id}/image"
    elif photos:
        cover_url = f"/api/photos/{photos[0].id}/image"

    return {
        "id": album.id,
        "title": album.title,
        "description": album.description,
        "is_public": album.is_public,
        "share_token": album.share_token,
        "cover_photo_id": album.cover_photo_id,
        "owner_id": album.owner_id,
        "created_at": album.created_at.isoformat(),
        "updated_at": album.updated_at.isoformat() if album.updated_at else album.created_at.isoformat(),
        "photo_count": len(photos),
        "cover_url": cover_url,
    }


@router.get("", response_model=List[AlbumOut])
async def list_albums(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Album)
        .where(Album.owner_id == current_user.id)
        .options(selectinload(Album.photos))
        .order_by(Album.created_at.desc())
    )
    albums = result.scalars().all()
    return [album_to_out(a) for a in albums]


@router.post("", response_model=AlbumOut, status_code=201)
async def create_album(
    data: AlbumCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    album = Album(
        title=data.title,
        description=data.description,
        is_public=data.is_public,
        owner_id=current_user.id,
        share_token=secrets.token_urlsafe(32) if data.is_public else None,
    )
    db.add(album)
    await db.commit()
    await db.refresh(album)
    # Load photos relationship
    result = await db.execute(
        select(Album).where(Album.id == album.id).options(selectinload(Album.photos))
    )
    album = result.scalar_one()
    return album_to_out(album)


@router.get("/{album_id}", response_model=AlbumDetail)
async def get_album(
    album_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Album)
        .where(Album.id == album_id, Album.owner_id == current_user.id)
        .options(selectinload(Album.photos))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="相册不存在")

    base = album_to_out(album)
    base["photos"] = [
        {
            "id": p.id,
            "filename": p.filename,
            "original_name": p.original_name,
            "width": p.width,
            "height": p.height,
            "created_at": p.created_at.isoformat(),
        }
        for p in album.photos
    ]
    return base


@router.put("/{album_id}", response_model=AlbumOut)
async def update_album(
    album_id: int,
    data: AlbumUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Album)
        .where(Album.id == album_id, Album.owner_id == current_user.id)
        .options(selectinload(Album.photos))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="相册不存在")

    from datetime import datetime
    if data.title is not None:
        album.title = data.title
    if data.description is not None:
        album.description = data.description
    if data.is_public is not None:
        album.is_public = data.is_public
        if data.is_public and not album.share_token:
            album.share_token = secrets.token_urlsafe(32)
        elif not data.is_public:
            album.share_token = None
    if data.cover_photo_id is not None:
        album.cover_photo_id = data.cover_photo_id
    album.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(album)
    result = await db.execute(
        select(Album).where(Album.id == album.id).options(selectinload(Album.photos))
    )
    album = result.scalar_one()
    return album_to_out(album)


@router.delete("/{album_id}", status_code=204)
async def delete_album(
    album_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import os
    result = await db.execute(
        select(Album)
        .where(Album.id == album_id, Album.owner_id == current_user.id)
        .options(selectinload(Album.photos))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="相册不存在")

    # Delete photo files
    from backend.utils.storage import get_upload_path
    for photo in album.photos:
        file_path = get_upload_path(photo.filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    await db.delete(album)
    await db.commit()


@router.post("/{album_id}/share", response_model=AlbumOut)
async def toggle_share(
    album_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Album)
        .where(Album.id == album_id, Album.owner_id == current_user.id)
        .options(selectinload(Album.photos))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="相册不存在")

    if album.is_public:
        album.is_public = False
        album.share_token = None
    else:
        album.is_public = True
        album.share_token = secrets.token_urlsafe(32)

    await db.commit()
    await db.refresh(album)
    result = await db.execute(
        select(Album).where(Album.id == album.id).options(selectinload(Album.photos))
    )
    album = result.scalar_one()
    return album_to_out(album)


@router.get("/shared/{token}", response_model=AlbumDetail)
async def get_shared_album(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Album)
        .where(Album.share_token == token, Album.is_public == True)
        .options(selectinload(Album.photos))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="分享链接无效或相册已设为私密")

    base = album_to_out(album)
    base["photos"] = [
        {
            "id": p.id,
            "filename": p.filename,
            "original_name": p.original_name,
            "width": p.width,
            "height": p.height,
            "created_at": p.created_at.isoformat(),
        }
        for p in album.photos
    ]
    return base
