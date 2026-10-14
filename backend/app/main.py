from contextlib import asynccontextmanager

from fastapi import FastAPI

from .db import connect, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/api/cards")
def list_cards():
    """카드 목록 (API-SPEC.md "목록 보기"). 순서는 A-05, created_at은 돌려주지 않습니다."""
    conn = connect()
    try:
        rows = conn.execute(
            "SELECT id, title, description, status FROM cards"
            " ORDER BY created_at DESC, id DESC"
        ).fetchall()
    finally:
        conn.close()
    return [dict(row) for row in rows]
