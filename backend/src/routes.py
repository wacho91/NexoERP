from __future__ import annotations

import hashlib
import os
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError
from passlib.context import CryptContext
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .database import get_db
from .models import (
    AuditLog,
    InventoryMovement,
    Invoice,
    Product,
    RefreshToken,
    Sale,
    SaleItem,
    Store,
    User,
)
from .schemas import (
    AuditLogRead,
    InventoryMovementCreate,
    InventoryMovementRead,
    InvoiceRead,
    LoginRequest,
    LogoutRequest,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    RefreshRequest,
    SaleCreate,
    SaleRead,
    StoreCreate,
    StoreRead,
    StoreUpdate,
    Token,
    UserCreate,
    UserRead,
    UserUpdate,
)

router = APIRouter(prefix="/api/v1")
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "type": "refresh", "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _build_tokens(user: User) -> tuple[str, str]:
    access_token = create_access_token(
        {
            "sub": str(user.id),
            "store_id": str(user.store_id),
            "role": user.role,
        }
    )
    refresh_token = create_refresh_token(user.id)
    return access_token, refresh_token


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    try:
        user_id = UUID(str(payload.get("sub")))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


async def require_cashier_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "cashier"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges",
        )
    return current_user


async def require_accountant_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "accountant"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges",
        )
    return current_user


async def _get_store(db: AsyncSession, store_id: UUID) -> Store:
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if store is None:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


async def _get_user_in_store(db: AsyncSession, user_id: UUID, store_id: UUID) -> User:
    result = await db.execute(
        select(User).where(User.id == user_id, User.store_id == store_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def _get_product_in_store(db: AsyncSession, product_id: UUID, store_id: UUID) -> Product:
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.store_id == store_id)
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def _get_sale_in_store(db: AsyncSession, sale_id: UUID, store_id: UUID) -> Sale:
    result = await db.execute(
        select(Sale)
        .options(selectinload(Sale.sale_items).selectinload(SaleItem.product))
        .where(Sale.id == sale_id, Sale.store_id == store_id)
    )
    sale = result.scalar_one_or_none()
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


def _log_audit(
    db: AsyncSession,
    current_user: User,
    action: str,
    entity_type: str,
    entity_id: Optional[UUID],
    details: Optional[dict] = None,
) -> None:
    db.add(
        AuditLog(
            store_id=current_user.store_id,
            user_id=current_user.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
        )
    )


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@router.post("/auth/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(func.lower(User.email) == payload.email.lower())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    user.last_login_at = datetime.now(timezone.utc)
    access_token, refresh_token = _build_tokens(user)

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=get_token_hash(refresh_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not persist login",
        )

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/auth/refresh", response_model=Token)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = get_token_hash(payload.refresh_token)

    result = await db.execute(
        select(RefreshToken)
        .options(selectinload(RefreshToken.user))
        .where(RefreshToken.token_hash == token_hash)
    )
    token_row = result.scalar_one_or_none()

    if (
        token_row is None
        or token_row.revoked_at is not None
        or token_row.expires_at <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = token_row.user
    if not user or not user.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    token_row.revoked_at = datetime.now(timezone.utc)
    access_token, new_refresh_token = _build_tokens(user)

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=get_token_hash(new_refresh_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )

    await db.commit()

    return Token(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token_hash = get_token_hash(payload.refresh_token)

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == current_user.id,
        )
    )
    token_row = result.scalar_one_or_none()

    if token_row is not None:
        token_row.revoked_at = datetime.now(timezone.utc)
        await db.commit()

    return None


@router.get("/auth/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------------------------------------------------------------------------
# Store routes
# ---------------------------------------------------------------------------
@router.post("/stores", response_model=StoreRead, status_code=status.HTTP_201_CREATED)
async def create_store(payload: StoreCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(func.lower(User.email) == payload.admin_email.lower())
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    store_data = payload.model_dump(
        exclude={"admin_email", "admin_password", "admin_full_name"}
    )
    store = Store(**store_data)
    db.add(store)

    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Store could not be created",
        )

    admin_user = User(
        store_id=store.id,
        email=payload.admin_email.lower(),
        hashed_password=hash_password(payload.admin_password),
        full_name=payload.admin_full_name,
        role="admin",
    )
    db.add(admin_user)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    await db.refresh(store)
    return store


@router.get("/stores/me", response_model=StoreRead)
async def get_my_store(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_store(db, current_user.store_id)


@router.get("/stores/{store_id}", response_model=StoreRead)
async def get_store(
    store_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this store is not allowed",
        )
    return await _get_store(db, store_id)


@router.patch("/stores/{store_id}", response_model=StoreRead)
async def update_store(
    store_id: UUID,
    payload: StoreUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this store is not allowed",
        )

    store = await _get_store(db, store_id)
    data = payload.model_dump(exclude_unset=True)

    for field, value in data.items():
        if field == "settings" and value is None:
            value = {}
        setattr(store, field, value)

    await db.commit()
    await db.refresh(store)
    return store


# ---------------------------------------------------------------------------
# User routes
# ---------------------------------------------------------------------------
@router.get("/users", response_model=list[UserRead])
async def list_users(
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.store_id == current_user.store_id)

    if search:
        stmt = stmt.where(
            or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    stmt = stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    email = payload.email.lower()

    result = await db.execute(
        select(User).where(func.lower(User.email) == email)
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        store_id=current_user.store_id,
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    await db.flush()

    _log_audit(
        db,
        current_user,
        "create_user",
        "user",
        user.id,
        {"email": email, "role": payload.role},
    )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    await db.refresh(user)
    return user


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_user_in_store(db, user_id, current_user.store_id)


@router.patch("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user_in_store(db, user_id, current_user.store_id)

    if current_user.id != user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile",
        )

    data = payload.model_dump(exclude_unset=True)

    if "password" in data:
        data["hashed_password"] = hash_password(data.pop("password"))

    if current_user.id == user.id and current_user.role != "admin":
        data.pop("role", None)
        data.pop("active", None)

    for field, value in data.items():
        if field == "email" and value is not None:
            value = value.lower()
        setattr(user, field, value)

    _log_audit(
        db,
        current_user,
        "update_user",
        "user",
        user.id,
        {"fields": list(data.keys())},
    )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    user = await _get_user_in_store(db, user_id, current_user.store_id)
    user.active = False

    _log_audit(db, current_user, "deactivate_user", "user", user.id)

    await db.commit()
    return None


# ---------------------------------------------------------------------------
# Product routes
# ---------------------------------------------------------------------------
@router.get("/products", response_model=list[ProductRead])
async def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    active: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).where(Product.store_id == current_user.store_id)

    if search:
        stmt = stmt.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.barcode.ilike(f"%{search}%"),
            )
        )

    if category:
        stmt = stmt.where(Product.category == category)

    if active is not None:
        stmt = stmt.where(Product.active == active)

    stmt = stmt.order_by(Product.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: User = Depends(require_cashier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    data = payload.model_dump()
    product = Product(store_id=current_user.store_id, **data)

    db.add(product)
    await db.flush()

    if product.stock_quantity > 0:
        db.add(
            InventoryMovement(
                store_id=current_user.store_id,
                product_id=product.id,
                type="initial",
                quantity=product.stock_quantity,
                stock_before=0,
                stock_after=product.stock_quantity,
                reason="Initial stock",
                created_by=current_user.id,
            )
        )

    _log_audit(
        db,
        current_user,
        "create_product",
        "product",
        product.id,
        {"sku": product.sku},
    )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product could not be created (duplicate SKU?)",
        )

    await db.refresh(product)
    return product


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_product_in_store(db, product_id, current_user.store_id)


@router.patch("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    current_user: User = Depends(require_cashier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    product = await _get_product_in_store(db, product_id, current_user.store_id)
    data = payload.model_dump(exclude_unset=True)
    old_stock = product.stock_quantity

    if "stock_quantity" in data:
        new_stock = data["stock_quantity"]
        if new_stock is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="stock_quantity cannot be null",
            )
        if new_stock < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="stock_quantity cannot be negative",
            )

        if new_stock != old_stock:
            db.add(
                InventoryMovement(
                    store_id=current_user.store_id,
                    product_id=product.id,
                    type="adjustment",
                    quantity=new_stock - old_stock,
                    stock_before=old_stock,
                    stock_after=new_stock,
                    reason="Stock adjusted via product update",
                    created_by=current_user.id,
                )
            )

    for field, value in data.items():
        setattr(product, field, value)

    _log_audit(
        db,
        current_user,
        "update_product",
        "product",
        product.id,
        {"fields": list(data.keys())},
    )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product could not be updated (duplicate SKU?)",
        )

    await db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    product = await _get_product_in_store(db, product_id, current_user.store_id)
    product.active = False

    _log_audit(db, current_user, "deactivate_product", "product", product.id)

    await db.commit()
    return None


# ---------------------------------------------------------------------------
# Sale routes
# ---------------------------------------------------------------------------
@router.get("/sales", response_model=list[SaleRead])
async def list_sales(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Sale)
        .options(selectinload(Sale.sale_items).selectinload(SaleItem.product))
        .where(Sale.store_id == current_user.store_id)
        .order_by(Sale.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(stmt)
    return result.scalars().unique().all()


@router.post("/sales", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
async def create_sale(
    payload: SaleCreate,
    current_user: User = Depends(require_cashier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sale must contain at least one item",
        )

    if payload.tax_rate < 0 or payload.tax_rate > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="tax_rate must be between 0 and 100",
        )

    store_id = current_user.store_id

    result = await db.execute(
        select(func.coalesce(func.max(Sale.number), 0)).where(Sale.store_id == store_id)
    )
    sale_number = int(result.scalar() or 0) + 1

    sale = Sale(
        store_id=store_id,
        user_id=current_user.id,
        number=sale_number,
        customer_name=payload.customer_name,
        subtotal=Decimal("0"),
        tax=Decimal("0"),
        total=Decimal("0"),
        payment_method=payload.payment_method,
        status="completed",
    )
    db.add(sale)
    await db.flush()

    subtotal = Decimal("0")

    for item in payload.items:
        product_result = await db.execute(
            select(Product)
            .where(Product.id == item.product_id, Product.store_id == store_id)
            .with_for_update()
        )
        product = product_result.scalar_one_or_none()

        if not product or not product.active:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found or inactive",
            )

        if product.stock_quantity < item.quantity:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for product {product.name} "
                    f"(available: {product.stock_quantity})"
                ),
            )

        old_stock = product.stock_quantity
        product.stock_quantity = old_stock - item.quantity

        unit_price = product.price
        line_subtotal = (unit_price * item.quantity).quantize(Decimal("0.01"))
        subtotal += line_subtotal

        db.add(
            SaleItem(
                sale_id=sale.id,
                store_id=store_id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=unit_price,
                subtotal=line_subtotal,
            )
        )

        db.add(
            InventoryMovement(
                store_id=store_id,
                product_id=product.id,
                sale_id=sale.id,
                type="sale",
                quantity=-item.quantity,
                stock_before=old_stock,
                stock_after=product.stock_quantity,
                reason=f"Sale {sale_number}",
                created_by=current_user.id,
            )
        )

    sale.subtotal = subtotal.quantize(Decimal("0.01"))
    sale.tax = (sale.subtotal * payload.tax_rate / Decimal("100")).quantize(Decimal("0.01"))
    sale.total = sale.subtotal + sale.tax

    if payload.generate_invoice:
        result = await db.execute(
            select(func.coalesce(func.max(Invoice.invoice_number), 0)).where(
                Invoice.store_id == store_id
            )
        )
        invoice_number = int(result.scalar() or 0) + 1

        db.add(
            Invoice(
                store_id=store_id,
                sale_id=sale.id,
                invoice_number=invoice_number,
                customer_name=payload.customer_name,
                customer_tax_id=payload.customer_tax_id,
                subtotal=sale.subtotal,
                tax=sale.tax,
                total=sale.total,
            )
        )

    _log_audit(
        db,
        current_user,
        "create_sale",
        "sale",
        sale.id,
        {"number": sale_number, "total": str(sale.total)},
    )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create sale",
        )

    result = await db.execute(
        select(Sale)
        .options(selectinload(Sale.sale_items).selectinload(SaleItem.product))
        .where(Sale.id == sale.id)
    )
    return result.scalar_one()


@router.get("/sales/{sale_id}", response_model=SaleRead)
async def get_sale(
    sale_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_sale_in_store(db, sale_id, current_user.store_id)


@router.post(
    "/sales/{sale_id}/invoice",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_invoice_for_sale(
    sale_id: UUID,
    current_user: User = Depends(require_accountant_or_admin),
    db: AsyncSession = Depends(get_db),
):
    sale = await _get_sale_in_store(db, sale_id, current_user.store_id)

    if sale.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice can only be generated for completed sales",
        )

    existing = await db.execute(select(Invoice).where(Invoice.sale_id == sale_id))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invoice already exists for this sale",
        )

    result = await db.execute(
        select(func.coalesce(func.max(Invoice.invoice_number), 0)).where(
            Invoice.store_id == current_user.store_id
        )
    )
    invoice_number = int(result.scalar() or 0) + 1

    invoice = Invoice(
        store_id=current_user.store_id,
        sale_id=sale.id,
        invoice_number=invoice_number,
        customer_name=sale.customer_name,
        subtotal=sale.subtotal,
        tax=sale.tax,
        total=sale.total,
    )
    db.add(invoice)
    await db.flush()

    _log_audit(
        db,
        current_user,
        "generate_invoice",
        "invoice",
        invoice.id,
        {"sale_id": str(sale.id), "number": invoice_number},
    )

    await db.commit()
    await db.refresh(invoice)
    return invoice


# ---------------------------------------------------------------------------
# Inventory movement routes
# ---------------------------------------------------------------------------
@router.get("/inventory-movements", response_model=list[InventoryMovementRead])
async def list_inventory_movements(
    product_id: Optional[UUID] = None,
    movement_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(InventoryMovement).where(
        InventoryMovement.store_id == current_user.store_id
    )

    if product_id is not None:
        stmt = stmt.where(InventoryMovement.product_id == product_id)

    if movement_type is not None:
        stmt = stmt.where(InventoryMovement.type == movement_type)

    stmt = stmt.order_by(InventoryMovement.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/inventory-movements",
    response_model=InventoryMovementRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_inventory_movement(
    payload: InventoryMovementCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .where(Product.id == payload.product_id, Product.store_id == current_user.store_id)
        .with_for_update()
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    old_stock = product.stock_quantity
    new_stock = old_stock + payload.quantity

    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock cannot be negative",
        )

    product.stock_quantity = new_stock

    movement = InventoryMovement(
        store_id=current_user.store_id,
        product_id=payload.product_id,
        type=payload.type,
        quantity=payload.quantity,
        stock_before=old_stock,
        stock_after=new_stock,
        reason=payload.reason,
        created_by=current_user.id,
    )
    db.add(movement)
    await db.flush()

    _log_audit(
        db,
        current_user,
        "create_inventory_movement",
        "inventory_movement",
        movement.id,
        {
            "product_id": str(payload.product_id),
            "type": payload.type,
            "quantity": payload.quantity,
        },
    )

    await db.commit()
    await db.refresh(movement)
    return movement


# ---------------------------------------------------------------------------
# Invoice routes
# ---------------------------------------------------------------------------
@router.get("/invoices", response_model=list[InvoiceRead])
async def list_invoices(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Invoice)
        .where(Invoice.store_id == current_user.store_id)
        .order_by(Invoice.issued_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/invoices/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(
            Invoice.id == invoice_id,
            Invoice.store_id == current_user.store_id,
        )
    )
    invoice = result.scalar_one_or_none()

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return invoice


# ---------------------------------------------------------------------------
# Audit log routes
# ---------------------------------------------------------------------------
@router.get("/audit-logs", response_model=list[AuditLogRead])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AuditLog)
        .where(AuditLog.store_id == current_user.store_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
