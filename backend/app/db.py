import sqlite3
from pathlib import Path

# SQLite 파일 위치 (DATA-MODEL.md "저장 위치")
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "cards.db"

# 카드 표 (DATA-MODEL.md "카드", "저장소 표")
CREATE_CARDS_TABLE = """
CREATE TABLE IF NOT EXISTS cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  created_at  TEXT NOT NULL
)
"""


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """SQLite 파일과 카드 표를 만듭니다. 이미 있으면 그대로 둡니다."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = connect()
    try:
        with conn:
            conn.execute(CREATE_CARDS_TABLE)
    finally:
        conn.close()
