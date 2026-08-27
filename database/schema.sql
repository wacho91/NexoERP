-- ============================================================
-- NexoERP - Esquema de Base de Datos PostgreSQL
-- Versión: 1.0
-- Descripción: SaaS ERP multi-tenant para PYMES.
-- Aislamiento por store_id en todas las tablas operativas.
-- Motor: PostgreSQL 15+ (compatible con Supabase)
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;        -- emails case-insensitive

-- ============================================================
-- TABLA: stores
-- Representa un tenant / tienda / empresa.
-- ============================================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    tax_id VARCHAR(50),
    email CITEXT,
    phone VARCHAR(50),
    address TEXT,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    logo_url TEXT,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: users
-- Usuarios del sistema. Cada usuario pertenece a una tienda.
-- Rol: admin, cashier, viewer, accountant.
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    email CITEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'cashier'
        CHECK (role IN ('admin', 'cashier', 'viewer', 'accountant')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: products
-- Catálogo de productos / inventario.
-- stock_quantity es un campo denormalizado para consultas rápidas.
-- El histórico exacto se encuentra en inventory_movements.
-- ============================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    cost NUMERIC(10, 2) CHECK (cost >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_products_store_sku UNIQUE (store_id, sku)
);

-- ============================================================
-- TABLA: sales
-- Cabecera de venta (POS y ventas normales).
-- number es un correlativo por tienda.
-- ============================================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    number INTEGER NOT NULL,
    customer_name VARCHAR(200),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN ('cash', 'card', 'transfer', 'mixed')),
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('completed', 'refunded', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_sales_store_number UNIQUE (store_id, number)
);

-- ============================================================
-- TABLA: sale_items
-- Detalle / líneas de la venta.
-- store_id es redundante para consultas rápidas y RLS.
-- ============================================================
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- ============================================================
-- TABLA: inventory_movements
-- Auditoría de stock: inicial, compra, venta, devolución, ajuste.
-- ============================================================
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('initial', 'purchase', 'sale', 'return', 'adjustment')),
    quantity INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: invoices
-- Factura asociada a una venta. Una venta puede tener 0 o 1 factura.
-- PDF generado se referencia en pdf_url.
-- ============================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL UNIQUE REFERENCES sales(id) ON DELETE CASCADE,
    invoice_number INTEGER NOT NULL,
    customer_name VARCHAR(200),
    customer_tax_id VARCHAR(50),
    subtotal NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    pdf_url TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_invoices_store_number UNIQUE (store_id, invoice_number)
);

-- ============================================================
-- TABLA: refresh_tokens
-- Almacena el hash de tokens de refresco JWT.
-- ============================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: audit_log
-- Registro de operaciones críticas: ventas, ajustes de inventario, etc.
-- entity_type y entity_id permiten rastrear cualquier recurso.
-- ============================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- Optimizados para multi-tenancy y consultas frecuentes.
-- ============================================================

-- users
CREATE INDEX idx_users_store_id ON users(store_id);

-- products
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_store_created ON products(store_id, created_at DESC);

-- sales
CREATE INDEX idx_sales_store_created ON sales(store_id, created_at DESC);
CREATE INDEX idx_sales_user_id ON sales(user_id);

-- sale_items
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_sale_items_store_product ON sale_items(store_id, product_id);

-- inventory_movements
CREATE INDEX idx_inventory_movements_store_product
    ON inventory_movements(store_id, product_id, created_at DESC);
CREATE INDEX idx_inventory_movements_sale_id ON inventory_movements(sale_id);

-- invoices
CREATE INDEX idx_invoices_store_created ON invoices(store_id, created_at DESC);
CREATE INDEX idx_invoices_sale_id ON invoices(sale_id);

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- audit_log
CREATE INDEX idx_audit_log_store_created ON audit_log(store_id, created_at DESC);

-- ============================================================
-- TRIGGERS: actualización automática de updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Defensa en profundidad. El backend usa service_role y puede
-- configurar `app.store_id` con SET LOCAL en cada transacción.
-- ============================================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento por store_id
-- (Las políticas para refresh_tokens usan user_id.)

CREATE POLICY tenant_isolation ON stores
    FOR ALL
    USING (id::text = current_setting('app.store_id', true))
    WITH CHECK (id::text = current_setting('app.store_id', true));

CREATE POLICY tenant_isolation ON users
    FOR ALL
    USING (store_id::text = current_setting('app.store_id', true))
    WITH CHECK (store_id::text = current_setting('app.store_id', true));

CREATE POLICY tenant_isolation ON products
    FOR ALL
    USING (store_id::text = current_setting('app.store_id', true))
    WITH CHECK (store_id::text = current_setting('app.store_id', true));

CREATE POLICY tenant_isolation ON sales
    FOR ALL
    USING (store_id::text = current_setting('app.store_id', true))
    WITH CHECK (store_id::text = current_setting('app.store_id', true));

CREATE POLICY tenant_isolation ON sale_items
    FOR ALL
    USING (store_id::text = current_setting('app.store_id', true))
    WITH CHECK (store_id::text = current_setting('app.store_id', true));

CREATE POLICY tenant_isolation ON inventory_movements
    FOR ALL
    USING (store_id::text = current_setting('app.store_id', true))
    WITH CHECK (store_id::text = current_setting('app.store_id', true));

CREATE POLICY tenant_isolation ON invoices
    FOR ALL
    USING (store_id::text = current_setting('app.store_id', true))
    WITH CHECK (store_id::text = current_setting('app.store_id', true));

CREATE POLICY user_own_refresh_tokens ON refresh_tokens
    FOR ALL
    USING (user_id::text = current_setting('app.user_id', true))
    WITH CHECK (user_id::text = current_setting('app.user_id', true));

CREATE POLICY tenant_isolation ON audit_log
    FOR ALL
    USING (store_id::text = current_setting('app.store_id', true))
    WITH CHECK (store_id::text = current_setting('app.store_id', true));
