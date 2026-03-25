import os
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent

# 支持通过环境变量配置上传目录（Railway 持久化卷挂载点）
# 本地开发默认用项目根目录下的 uploads/
_upload_dir_env = os.environ.get("UPLOAD_DIR")
if _upload_dir_env:
    UPLOAD_DIR = Path(_upload_dir_env)
else:
    UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_upload_path(filename: str) -> str:
    return str(UPLOAD_DIR / filename)


def generate_filename(original_name: str) -> str:
    ext = Path(original_name).suffix.lower()
    return f"{uuid.uuid4().hex}{ext}"


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".heic"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


def is_allowed_file(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS
