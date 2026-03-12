"""Seed the database with the 13 roster characters."""

import json
from pathlib import Path

from app.database import Base, SessionLocal, engine
from app.models.bot import Bot
from app.models.battle import Battle  # noqa: F401 — ensure table is created

ROSTER_PATH = Path(__file__).resolve().parent.parent.parent / "characters" / "roster.json"

# Map roster trading styles to engine-supported styles
STYLE_MAP = {
    "momentum": "momentum",
    "mean_reversion": "mean_reversion",
    "high_frequency": "high_frequency",
    "event_driven": "momentum",  # fallback
    "arbitrage": "mean_reversion",  # fallback
    "contrarian": "mean_reversion",  # fallback
}


def seed_bots():
    Base.metadata.create_all(bind=engine)
    with open(ROSTER_PATH) as f:
        roster = json.load(f)

    db = SessionLocal()
    created = 0
    try:
        for char in roster:
            existing = db.query(Bot).filter(Bot.name == char["name"]).first()
            if existing:
                continue
            bot = Bot(
                id=char["id"],
                name=char["name"],
                name_ja=char.get("name_ja", ""),
                trading_style=STYLE_MAP.get(char["trading_style"], "momentum"),
                archetype=char.get("archetype", "commander"),
                philosophy=char.get("philosophy", ""),
                primary_color=char.get("primary_color", "#00d4ff"),
                region=char.get("region", "Unknown"),
                rank=char.get("rank", "C"),
            )
            db.add(bot)
            created += 1
        db.commit()
        print(f"Seeded {created} bots ({len(roster) - created} already existed)")
    finally:
        db.close()


if __name__ == "__main__":
    seed_bots()
