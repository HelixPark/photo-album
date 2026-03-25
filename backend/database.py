from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 支持通过环境变量配置数据库路径（Railway 持久化卷）
_db_path_env = os.environ.get("DB_PATH")
if _db_path_env:
    DB_PATH = _db_path_env
    # 确保父目录存在
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
else:
    DB_PATH = os.path.join(BASE_DIR, "photo_album.db")

engine = create_async_engine(f"sqlite+aiosqlite:///{DB_PATH}", echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    from backend.models.user import User
    from backend.models.album import Album
    from backend.models.photo import Photo
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
