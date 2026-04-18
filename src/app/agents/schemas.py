"""Pydantic schemas shared by the research agents."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class ProductVariant(BaseModel):
    id: int
    title: str
    option1: Optional[str] = None
    option2: Optional[str] = None
    option3: Optional[str] = None
    price: Optional[str] = None
    available: bool = False


class Product(BaseModel):
    retailer_id: str
    retailer_name: str
    source_id: int
    handle: str
    title: str
    vendor: Optional[str] = None
    product_type: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    url: HttpUrl
    image_url: Optional[HttpUrl] = None
    price: Optional[str] = None
    currency: str = "USD"
    available_sizes: list[str] = Field(default_factory=list)
    variants: list[ProductVariant] = Field(default_factory=list)


class Citation(BaseModel):
    title: str
    url: HttpUrl


class TrendTheme(BaseModel):
    name: str
    summary: str
    key_silhouettes: list[str] = Field(default_factory=list)
    key_colors: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)


class TrendBrief(BaseModel):
    query: str
    themes: list[TrendTheme]
    notes: Optional[str] = None


class BoardItem(BaseModel):
    product: Product
    rationale: str
    theme: Optional[str] = None


class ProductBoard(BaseModel):
    query: str
    retailer_ids: list[str]
    items: list[BoardItem]
