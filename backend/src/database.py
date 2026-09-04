import os
from typing import AsyncGenerator
from dotenv import load_dotenv
load_dotenv()  

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# === LEER URL DESDE VARIABLES DE ENTORNO ===
DATABASE_URL = os.getenv("DATABASE_URL")

# Línea de debug para ver qué URL está usando en Render
print(f"DEBUG DATABASE: Conectando a -> {DATABASE_URL}")
# ============================================

SYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2") if DATABASE_URL else ""

async_engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
)

sync_engine = create_engine(
    SYNC_DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependencia de FastAPI para obtener una sesión asíncrona de base de datos."""
    async with AsyncSessionLocal() as session:
        yield session