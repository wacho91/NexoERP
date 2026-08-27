from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database import async_engine  # <--- Cambiado a async_engine
from src import routes  # noqa: F401

@asynccontextmanager
async def lifespan(app: FastAPI):
    # El motor de SQLAlchemy se conecta solo, solo necesitamos yield
    yield
    # Cerramos la conexión al apagar el servidor
    await async_engine.dispose()

app = FastAPI(
    title="NexoERP API",
    description="Backend para el SaaS ERP Multi-tenant",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuración CORS para permitir la conexión con el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción ponemos el link de Vercel aquí
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluimos todas las rutas creadas por los agentes
app.include_router(routes.router)

@app.get("/", tags=["Health"])
async def root():
    """Endpoint de prueba para saber si el servidor está vivo."""
    return {"status": "ok", "service": "NexoERP API"}