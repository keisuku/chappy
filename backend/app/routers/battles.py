import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.engine.battle import run_battle, tick_log_to_json
from app.models.battle import Battle
from app.models.bot import Bot
from app.schemas.battle import (
    BattleCreate,
    BattleDetailResponse,
    BattleListResponse,
    BattleResponse,
    LeaderboardEntry,
    TickEntry,
)

router = APIRouter(prefix="/battles", tags=["battles"])

# Experience per battle
XP_WIN = 100
XP_LOSS = 30
XP_PER_LEVEL = 500


def _level_up(bot: Bot) -> None:
    """Check and apply level-ups."""
    while bot.experience >= XP_PER_LEVEL * bot.level:
        bot.experience -= XP_PER_LEVEL * bot.level
        bot.level += 1
        # Rank promotion
        if bot.level >= 20 and bot.rank < "S":
            bot.rank = "S"
        elif bot.level >= 10 and bot.rank < "A":
            bot.rank = "A"
        elif bot.level >= 5 and bot.rank < "B":
            bot.rank = "B"


@router.post("", response_model=BattleDetailResponse, status_code=201)
def execute_battle(data: BattleCreate, db: Session = Depends(get_db)):
    left_bot = db.get(Bot, data.left_bot_id)
    right_bot = db.get(Bot, data.right_bot_id)

    if not left_bot:
        raise HTTPException(status_code=404, detail=f"Left bot not found: {data.left_bot_id}")
    if not right_bot:
        raise HTTPException(status_code=404, detail=f"Right bot not found: {data.right_bot_id}")
    if data.left_bot_id == data.right_bot_id:
        raise HTTPException(status_code=400, detail="A bot cannot battle itself")

    # Run the battle engine
    result = run_battle(
        left_bot_id=left_bot.id,
        left_style=left_bot.trading_style,
        right_bot_id=right_bot.id,
        right_style=right_bot.trading_style,
        seed=data.seed,
    )

    # Store battle record
    battle = Battle(
        left_bot_id=left_bot.id,
        right_bot_id=right_bot.id,
        winner_bot_id=result.winner_bot_id,
        status="completed",
        left_pnl=result.left_pnl,
        right_pnl=result.right_pnl,
        left_trades=result.left_trades,
        right_trades=result.right_trades,
        left_max_drawdown=result.left_max_drawdown,
        right_max_drawdown=result.right_max_drawdown,
        total_ticks=result.total_ticks,
        max_stage=result.max_stage,
        seed=result.seed,
        tick_log=tick_log_to_json(result.tick_log),
    )
    db.add(battle)

    # Update bot stats + evolution
    if result.winner_bot_id == left_bot.id:
        left_bot.win_count += 1
        left_bot.experience += XP_WIN
        right_bot.loss_count += 1
        right_bot.experience += XP_LOSS
    elif result.winner_bot_id == right_bot.id:
        right_bot.win_count += 1
        right_bot.experience += XP_WIN
        left_bot.loss_count += 1
        left_bot.experience += XP_LOSS
    else:
        # Draw
        left_bot.experience += XP_LOSS
        right_bot.experience += XP_LOSS

    left_bot.total_pnl += result.left_pnl
    right_bot.total_pnl += result.right_pnl

    _level_up(left_bot)
    _level_up(right_bot)

    db.commit()
    db.refresh(battle)

    return BattleDetailResponse(
        id=battle.id,
        left_bot_id=battle.left_bot_id,
        right_bot_id=battle.right_bot_id,
        winner_bot_id=battle.winner_bot_id,
        status=battle.status,
        left_pnl=battle.left_pnl,
        right_pnl=battle.right_pnl,
        left_trades=battle.left_trades,
        right_trades=battle.right_trades,
        left_max_drawdown=battle.left_max_drawdown,
        right_max_drawdown=battle.right_max_drawdown,
        total_ticks=battle.total_ticks,
        max_stage=battle.max_stage,
        seed=battle.seed,
        created_at=battle.created_at,
        tick_log=[TickEntry(**t) for t in json.loads(battle.tick_log)],
    )


@router.get("", response_model=BattleListResponse)
def list_battles(
    skip: int = 0,
    limit: int = 20,
    bot_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Battle).filter(Battle.status == "completed")
    if bot_id:
        query = query.filter((Battle.left_bot_id == bot_id) | (Battle.right_bot_id == bot_id))

    total = query.count()
    battles = query.order_by(Battle.created_at.desc()).offset(skip).limit(limit).all()
    return BattleListResponse(battles=battles, total=total)


@router.get("/{battle_id}", response_model=BattleDetailResponse)
def get_battle(battle_id: str, db: Session = Depends(get_db)):
    battle = db.get(Battle, battle_id)
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    tick_log = json.loads(battle.tick_log) if battle.tick_log else []
    return BattleDetailResponse(
        id=battle.id,
        left_bot_id=battle.left_bot_id,
        right_bot_id=battle.right_bot_id,
        winner_bot_id=battle.winner_bot_id,
        status=battle.status,
        left_pnl=battle.left_pnl,
        right_pnl=battle.right_pnl,
        left_trades=battle.left_trades,
        right_trades=battle.right_trades,
        left_max_drawdown=battle.left_max_drawdown,
        right_max_drawdown=battle.right_max_drawdown,
        total_ticks=battle.total_ticks,
        max_stage=battle.max_stage,
        seed=battle.seed,
        created_at=battle.created_at,
        tick_log=[TickEntry(**t) for t in tick_log],
    )


@router.get("/leaderboard/top", response_model=list[LeaderboardEntry])
def leaderboard(limit: int = Query(default=10, le=50), db: Session = Depends(get_db)):
    bots = db.query(Bot).filter((Bot.win_count + Bot.loss_count) > 0).all()

    entries = []
    for bot in bots:
        total = bot.win_count + bot.loss_count
        entries.append(
            LeaderboardEntry(
                bot_id=bot.id,
                bot_name=bot.name,
                win_count=bot.win_count,
                loss_count=bot.loss_count,
                win_rate=round(bot.win_count / total, 3) if total > 0 else 0,
                total_pnl=bot.total_pnl,
                level=bot.level,
                rank=bot.rank,
            )
        )

    entries.sort(key=lambda e: (-e.win_rate, -e.total_pnl))
    return entries[:limit]
