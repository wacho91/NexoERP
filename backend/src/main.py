from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database import async_engine, sync_engine
from src import routes  # noqa: F401
from src import models  # <-- Importante: importamos los modelos

@asynccontextmanager
async def lifespan(app: FastAPI):
    # === CREAR LAS TABLAS EN SUPABASE AL ARRANCAR ===
    # Usamos el engine síncrono para crear las tablas, es más seguro con PostgreSQL
    from sqlalchemy import inspect
    def run_sync():
        models.Base.metadata.create_all(sync_engine)
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, run_sync)
    print("DEBUG: Tablas creadas/verificadas en Supabase.")
    # =================================================
    
    yield
    
    # Cerramos la conexión al apagar el servidor
    await async_engine.dispose()

app = FastAPI(
    title="NexoERP API",
    description="Backend para el SaaS ERP Multi-tenant",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite a Vercel conectarse
    allow_credentials=False,  
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "NexoERP API"}