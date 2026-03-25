from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

from backend.database import init_db
from backend.routers import auth, albums, photos

BASE_DIR = Path(__file__).parent.parent

app = FastAPI(title="网络相册平台", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(albums.router)
app.include_router(photos.router)

# Serve frontend static files
FRONTEND_DIR = BASE_DIR / "frontend"
STATIC_DIR = FRONTEND_DIR / "static"
TEMPLATES_DIR = FRONTEND_DIR / "templates"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.on_event("startup")
async def startup():
    await init_db()


# Catch-all: serve index.html for SPA routing
@app.get("/share/{token}")
async def share_page(token: str):
    index = TEMPLATES_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {"message": "Frontend not found"}


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Try to serve specific template
    if full_path == "" or full_path == "/":
        page = TEMPLATES_DIR / "index.html"
    else:
        page = TEMPLATES_DIR / f"{full_path}.html"
        if not page.exists():
            page = TEMPLATES_DIR / "index.html"

    if page.exists():
        return FileResponse(str(page))
    return {"message": "Page not found"}
