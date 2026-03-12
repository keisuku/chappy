from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.bot import Bot
from app.schemas.bot import BotCreate, BotResponse, BotUpdate

router = APIRouter(prefix="/bots", tags=["bots"])


@router.get("", response_model=list[BotResponse])
def list_bots(
    skip: int = 0,
    limit: int = 50,
    trading_style: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Bot)
    if trading_style:
        query = query.filter(Bot.trading_style == trading_style)
    return query.order_by(Bot.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{bot_id}", response_model=BotResponse)
def get_bot(bot_id: str, db: Session = Depends(get_db)):
    bot = db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


@router.post("", response_model=BotResponse, status_code=201)
def create_bot(data: BotCreate, db: Session = Depends(get_db)):
    # Check name uniqueness
    existing = db.query(Bot).filter(Bot.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Bot name already exists")

    bot = Bot(**data.model_dump())
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot


@router.patch("/{bot_id}", response_model=BotResponse)
def update_bot(bot_id: str, data: BotUpdate, db: Session = Depends(get_db)):
    bot = db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(bot, key, value)

    db.commit()
    db.refresh(bot)
    return bot


@router.delete("/{bot_id}", status_code=204)
def delete_bot(bot_id: str, db: Session = Depends(get_db)):
    bot = db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    db.delete(bot)
    db.commit()
