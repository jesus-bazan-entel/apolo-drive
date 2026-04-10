from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import auth, users, folders, files

settings = get_settings()

app = FastAPI(
    title="Apolo Drive API",
    description="File Server API con autenticación Supabase",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(folders.router)
app.include_router(files.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "apolo-drive"}
