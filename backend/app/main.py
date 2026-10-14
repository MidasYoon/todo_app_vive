import json
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .db import connect, init_db
from .rules import check_new_card

CARD_COLUMNS = "id, title, description, status"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


def error_response(status_code, errors):
    """오류 응답 (API-SPEC.md "오류 응답")"""
    return JSONResponse(status_code=status_code, content={"errors": errors})


@app.exception_handler(sqlite3.Error)
async def storage_error_handler(request: Request, exc: sqlite3.Error):
    """저장소에서 읽거나 쓰지 못함: 500 storage_error"""
    return error_response(500, [{"field": None, "kind": "storage_error"}])


@app.get("/api/cards")
def list_cards():
    """카드 목록 (API-SPEC.md "목록 보기"). 순서는 A-05, created_at은 돌려주지 않습니다."""
    conn = connect()
    try:
        rows = conn.execute(
            f"SELECT {CARD_COLUMNS} FROM cards ORDER BY created_at DESC, id DESC"
        ).fetchall()
    finally:
        conn.close()
    return [dict(row) for row in rows]


@app.post("/api/cards")
async def create_card(request: Request):
    """카드 만들기 (API-SPEC.md "카드 만들기")"""
    try:
        body = json.loads(await request.body())
    except ValueError:
        return error_response(422, [{"field": None, "kind": "invalid_value"}])  # A-08

    values, errors = check_new_card(body)
    if errors:
        return error_response(422, errors)

    created_at = datetime.now(timezone.utc).isoformat(timespec="microseconds")  # M-11
    conn = connect()
    try:
        with conn:
            cursor = conn.execute(
                "INSERT INTO cards (title, description, status, created_at)"
                " VALUES (?, ?, 'todo', ?)",
                (values["title"], values["description"], created_at),
            )
        row = conn.execute(
            f"SELECT {CARD_COLUMNS} FROM cards WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    finally:
        conn.close()
    return JSONResponse(status_code=201, content=dict(row))
