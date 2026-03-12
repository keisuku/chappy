from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import battles, bots

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cryptarena API",
    description="AI trading battle game — bot management, battle execution, and result storage",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bots.router, prefix="/api/v1")
app.include_router(battles.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "game": "cryptarena"}
