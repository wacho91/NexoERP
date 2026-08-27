from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    store_id: str
    role: str
    type: str
    exp: int


# ---------------------------------------------------------------------------
# Stores
# ---------------------------------------------------------------------------
class StoreBase(ORMModel):
    name: str = Field(..., max_length=200)
    legal_name: Optional[str] = Field(None, max_length=200)
    tax_id: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    currency: str = Field("USD", min_length=3, max_length=3)
    logo_url: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)


class StoreCreate(StoreBase):
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=6)
    admin_full_name: str = Field(..., min_length=1, max_length=200)


class StoreUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    legal_name: Optional[str] = Field(None, max_length=200)
    tax_id: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    logo_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class StoreRead(StoreBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
UserRole = Literal["admin", "cashier", "viewer", "accountant"]


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., max_length=200)
    role: UserRole = "cashier"


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    full_name: Optional[str] = Field(None, max_length=200)
    role: Optional[UserRole] = None
    active: Optional[bool] = None


class UserRead(BaseModel):
    id: UUID
    store_id: UUID
    email: EmailStr
    full_name: str
    role: str
    active: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
class ProductBase(ORMModel):
    sku: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    price: Decimal = Field(..., ge=0)
    cost: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: int = Field(0, ge=0)
    min_stock: int = Field(0, ge=0)
    image_url: Optional[str] = None
    active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    cost: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    min_stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    active: Optional[bool] = None


class ProductRead(ProductBase):
    id: UUID
    store_id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Sales
# ---------------------------------------------------------------------------
class SaleItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)


class SaleCreate(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=200)
    customer_tax_id: Optional[str] = Field(None, max_length=50)
    payment_method: Literal["cash", "card", "transfer", "mixed"] = "cash"
    tax_rate: Decimal = Field(Decimal("0"), ge=0, le=100)
    generate_invoice: bool = True
    items: List[SaleItemCreate] = Field(..., min_length=1)


class SaleItemRead(ORMModel):
    id: UUID
    sale_id: UUID
    product_id: UUID
    store_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: Optional[ProductRead] = None


class SaleRead(ORMModel):
    id: UUID
    store_id: UUID
    user_id: UUID
    number: int
    customer_name: Optional[str]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    payment_method: str
    status: str
    created_at: datetime
    updated_at: datetime
    sale_items: List[SaleItemRead] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Inventory Movements
# ---------------------------------------------------------------------------
class InventoryMovementCreate(BaseModel):
    product_id: UUID
    type: Literal["initial", "purchase", "return", "adjustment"]
    quantity: int
    reason: Optional[str] = None

    @model_validator(mode="after")
    def validate_quantity(self) -> "InventoryMovementCreate":
        if self.type in ("initial", "purchase", "return") and self.quantity <= 0:
            raise ValueError("quantity must be positive for this movement type")
        if self.type == "adjustment" and self.quantity == 0:
            raise ValueError("adjustment quantity must not be zero")
        return self


class InventoryMovementRead(ORMModel):
    id: UUID
    store_id: UUID
    product_id: UUID
    sale_id: Optional[UUID]
    type: str
    quantity: int
    stock_before: int
    stock_after: int
    reason: Optional[str]
    created_by: Optional[UUID]
    created_at: datetime


# ---------------------------------------------------------------------------
# Invoices
# ---------------------------------------------------------------------------
class InvoiceRead(ORMModel):
    id: UUID
    store_id: UUID
    sale_id: UUID
    invoice_number: int
    customer_name: Optional[str]
    customer_tax_id: Optional[str]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    pdf_url: Optional[str]
    issued_at: datetime
    created_at: datetime


# ---------------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------------
class AuditLogRead(ORMModel):
    id: UUID
    store_id: UUID
    user_id: Optional[UUID]
    action: str
    entity_type: str
    entity_id: Optional[UUID]
    details: Dict[str, Any]
    created_at: datetime
