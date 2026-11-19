"""DBへの接続"""

from sqlalchemy import Engine
from sqlmodel import create_engine


def create_db_engine(database_url: str) -> Engine:
    # 接続が切れていたら使う前に張り直す
    return create_engine(database_url, pool_pre_ping=True)
