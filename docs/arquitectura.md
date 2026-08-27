# Arquitectura de NexoERP

**Versión:** 1.0  
**Estado:** Aprobado  
**Fecha:** 2025-01-01  

---

## 1. Resumen Ejecutivo

NexoERP es un ERP SaaS multi-tenant simplificado para PYMES. Cubre inventario con imágenes, punto de venta (POS), facturación PDF y métricas en tiempo real. El aislamiento de datos se garantiza mediante un identificador `store_id` presente en todas las tablas y en el token JWT.

La arquitectura sigue los principios de **Clean Architecture** y **Arquitectura Hexagonal**, separando la lógica de negocio de los frameworks y la infraestructura. El backend expone una API REST en FastAPI, el frontend es una SPA en React/Vite.

---

## 2. Principios de Arquitectura

1. **Independencia del framework** – FastAPI y SQLAlchemy son detalles de infraestructura; la lógica de negocio vive en `domain` y `application`.
2. **Multi-tenancy por `store_id`** – Toda operación de datos filtra por el `store_id` extraído del JWT. Nunca se confía en el cliente.
3. **Separación de responsabilidades** – Cada capa tiene un rol único y dependencias dirigidas hacia adentro (regla de dependencia).
4. **API primero** – El frontend consume exclusivamente la API REST; no hay acceso directo a la base de datos.
5. **Escalabilidad horizontal** – El backend es stateless y puede replicarse. Los recursos compartidos (PostgreSQL, storage de imágenes) son externalizables.
6. **Seguridad por defecto** – JWT firmado, contraseñas con hash, validación de entrada con Pydantic, CORS restringido y guardado de imágenes mediante URLs firmadas.

---

## 3. Vista de Contenedores (C4 Model)
