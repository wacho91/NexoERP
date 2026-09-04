🏢 NexoERP - SaaS ERP Multi-tenant para PYMES
NexoERP es una plataforma de software de nivel Enterprise diseñada para digitalizar y optimizar la gestión de inventarios, ventas y facturación de pequeñas y medianas empresas (PYMES). Construido con una arquitectura multi-tenant, permite que múltiples tiendas (ferreterías, boutiques, farmacias) operen en la misma instancia de forma aislada y segura.

🚀 Características Principales
Arquitectura Multi-tenant (SaaS): Aislamiento de datos seguro por store_id. Cada tienda tiene su propio inventario, ventas y usuarios.
Gestión de Inventario Avanzada (Kardex): Control de productos con SKU, códigos de barras, categorías personalizables y alertas de stock mínimo.
Punto de Venta (POS) Rápido: Interfiz optimizada para cajeros con buscador en tiempo real, carrito lateral y cálculo automático de totales e IVA.
Descuento Automático de Stock: Al finalizar una venta en el POS, el inventario se descuenta automáticamente en la base de datos.
Facturación Electrónica: Generación de documentos fiscales con un diseño limpio y listo para imprimir/descargar en PDF.
Dashboard y Reportes en Tiempo Real: Gráficos interactivos de tendencia de ventas, productos más vendidos y niveles de stock actuales.
Control de Roles (RBAC): Autenticación con JWT y permisos diferenciados para Administradores, Cajeros y Contadores.
🎨 Experiencia de Usuario (UX/UI)
"Splash Screen" Premium: Pantallas de carga fluidas con el branding de la aplicación al cambiar entre módulos, eliminando las pantallas en blanco.
Paginación Inteligente: Tablas y grids limitados a 6-8 elementos por página para una navegación cómoda.
Diseño Responsive: Interfaz adaptable a escritorio, tablet y móvil, con soporte de Modo Oscuro.
🛠️ Stack Tecnológico
Backend: Python, FastAPI (Arquitectura Asíncrona), SQLAlchemy, JWT, Pydantic.
Frontend: React, Vite, Tailwind CSS, React Router, Recharts, Axios.
Base de Datos: PostgreSQL (Gestionado en la nube con Supabase).
Arquitectura: REST API desacoplada (Headless), lista para consumirse desde cualquier cliente web o móvil futuro.
⚙️ Variables de Entorno
Para ejecutar este proyecto en local, necesitarás configurar las siguientes variables de entorno:

Backend (backend/.env)

DATABASE_URL=postgresql+asyncpg://postgres:TU_CONTRASEÑA@db.TU_PROYECTO.supabase.co:5432/postgresJWT_SECRET=tu_secreto_super_seguro
Frontend (frontend/src/api/apiClient.js)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

🏁 Instalación Local
Clonar el repositorio:
git clone https://github.com/wacho91/NexoERP.git
cd NexoERP

Levantar el Backend:
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

Levantar el Frontend
cd frontend
npm install
npm run dev
