from fastapi import FastAPI, HTTPException, Depends, Query, status, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal, Dict, Any
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Boolean, Text, ForeignKey, Float, JSON, Date
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from datetime import datetime
import uuid
import os
import qrcode
from fpdf import FPDF
from sqlalchemy.sql import func
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import shutil
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.types import JSON as SAJSON
from enum import Enum



app = FastAPI(title="PRK Tech India")

# Base URL for the application
BASE_URL = "https://server.prktechindia.in"

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins for development
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8080",
        "https://server.prktechindia.in"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Models ---

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    email = Column(String, unique=True, index=True)
    phone_no = Column(String)
    password = Column(String)
    user_id = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_role = Column(String)
    user_type = Column(String)
    property_id = Column(String)
    status = Column(String, default="pending")


# Pydantic schemas for DailyTaskChecklist
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DailyTaskChecklistBase(BaseModel):
    sl_no: int
    check_point: str
    action_required: str
    standard: str
    frequency: Literal['Daily', 'Monthly', 'Hourly', 'Weekly', '2 Times in a week']
    user_required: bool
    property_id: str

class DailyTaskChecklistCreate(DailyTaskChecklistBase):
    pass

class DailyTaskChecklistUpdate(BaseModel):
    sl_no: Optional[int] = None
    check_point: Optional[str] = None
    action_required: Optional[str] = None
    standard: Optional[str] = None
    frequency: Optional[Literal['Daily', 'Monthly', 'Hourly', 'Weekly', '2 Times in a week']] = None
    user_required: Optional[bool] = None
    property_id: Optional[str] = None

class DailyTaskChecklistResponse(DailyTaskChecklistBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


class DailyTaskChecklistBase(BaseModel):
    sl_no: int
    check_point: str
    action_required: str
    standard: str
    frequency: Literal['Daily', 'Monthly', 'Hourly', 'Weekly', '2 Times in a week']
    user_required: bool
    property_id: str

class DailyTaskChecklistCreate(DailyTaskChecklistBase):
    pass

class DailyTaskChecklistUpdate(BaseModel):
    sl_no: Optional[int] = None
    check_point: Optional[str] = None
    action_required: Optional[str] = None
    standard: Optional[str] = None
    frequency: Optional[Literal['Daily', 'Monthly', 'Hourly', 'Weekly', '2 Times in a week']] = None
    user_required: Optional[bool] = None
    property_id: Optional[str] = None

class DailyTaskChecklistResponse(DailyTaskChecklistBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Define Asset class BEFORE Property to avoid circular dependency
class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    property_id = Column(String, ForeignKey("properties.id"))
    asset_category = Column(String)
    asset_name = Column(String)
    tag_number = Column(String, unique=True)
    additional_info = Column(Text, nullable=True)
    location = Column(String)
    vendor_name = Column(String)
    purchase_date = Column(DateTime)
    asset_cost = Column(Float)
    warranty_date = Column(DateTime, nullable=True)
    depreciation_value = Column(Float)  # Depreciation in percent
    qr_code_url = Column(String)
    
    # Relationship
    property = relationship("Property", back_populates="assets")

class Inventory(Base):
    __tablename__ = "inventories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    property_id = Column(String, ForeignKey("properties.id"))
    stock_name = Column(String)
    department = Column(String)
    stock_id = Column(String, unique=True)
    inventory_subledger = Column(String)
    units = Column(Integer)
    units_of_measurement = Column(String)
    date_of_purchase = Column(DateTime)
    custodian = Column(String)
    location = Column(String)
    opening_balance = Column(Integer)
    issued = Column(Integer)
    closing_balance = Column(Integer)
    description = Column(Text, nullable=True)
    qr_code_url = Column(String, nullable=True)
    
    # Relationship
    property = relationship("Property", back_populates="inventories")

class Property(Base):
    __tablename__ = "properties"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    title = Column(String)
    description = Column(String)
    logo_base64 = Column(Text, nullable=True)  # New field for base64 logo
    created_time = Column(DateTime, default=datetime.utcnow)
    updated_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    wtp_phases = relationship("WTP", back_populates="property")
    stp_phases = relationship("STP", back_populates="property")
    swimming_pools = relationship("SwimmingPool", back_populates="property", cascade="all, delete-orphan")
    diesel_generators = relationship("DieselGenerator", back_populates="property", cascade="all, delete-orphan")
    electricity_consumptions = relationship("ElectricityConsumption", back_populates="property", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="property", cascade="all, delete-orphan")
    inventories = relationship("Inventory", back_populates="property", cascade="all, delete-orphan")

# --- Staff Category Model ---
class StaffCategoryModel(Base):
    __tablename__ = "staff_categories"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    user_ids = Column(String, nullable=True)  # Comma-separated user_ids for now
    created_at = Column(DateTime, default=datetime.utcnow)
    property_id = Column(String, nullable=False)

class ActivityModel(Base):
    __tablename__ = "activities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    user_role = Column(String(100))
    user_type = Column(String(100))
    total_tasks = Column(Integer, default=0)
    active_tasks = Column(Integer, default=0)
    default_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)  # Added property_id field
    
    # Relationship with tasks
    tasks = relationship("TaskModel", back_populates="activity", cascade="all, delete-orphan")

class TaskModel(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    reset_time = Column(DateTime)
    reset_after = Column(Integer)  # duration in hours
    activity_id = Column(String, ForeignKey("activities.id"), nullable=False)
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)  # Added property_id field
    total = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    completed = Column(Boolean, default=False)
    default = Column(Boolean, default=False)
    opening_time = Column(DateTime)
    closing_time = Column(DateTime)
    comment = Column(Text)
    
    # Relationship with activity
    activity = relationship("ActivityModel", back_populates="tasks")

class DailyTaskChecklist(Base):
    __tablename__ = "daily_task_checklists"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sl_no = Column(Integer)
    check_point = Column(String)
    action_required = Column(String)
    standard = Column(String)
    frequency = Column(String)
    user_required = Column(Boolean, default=False)
    property_id = Column(String, ForeignKey("properties.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# --- Schemas ---

# Pydantic models for request/response

# Pydantic models for request/response
class PropertyBase(BaseModel):
    name: str
    title: str
    description: Optional[str] = None
    logo_base64: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    id: str
    created_time: datetime
    updated_time: datetime
    
    class Config:
        orm_mode = True

class InventoryBase(BaseModel):
    property_id: str
    stock_name: str
    department: str
    stock_id: str
    inventory_subledger: str
    units: int
    units_of_measurement: str
    date_of_purchase: datetime
    custodian: str
    location: str
    opening_balance: int
    issued: int
    closing_balance: int
    description: Optional[str] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    stock_name: Optional[str] = None
    department: Optional[str] = None
    inventory_subledger: Optional[str] = None
    units: Optional[int] = None
    units_of_measurement: Optional[str] = None
    date_of_purchase: Optional[datetime] = None
    custodian: Optional[str] = None
    location: Optional[str] = None
    opening_balance: Optional[int] = None
    issued: Optional[int] = None
    closing_balance: Optional[int] = None
    description: Optional[str] = None

class InventoryResponse(InventoryBase):
    id: str
    created_at: datetime
    updated_at: datetime
    qr_code_url: Optional[str] = None
    
    class Config:
        orm_mode = True

class AssetBase(BaseModel):
    asset_category: str
    asset_name: str
    tag_number: str
    additional_info: Optional[str] = None
    location: str
    vendor_name: str
    purchase_date: datetime
    asset_cost: float
    warranty_date: Optional[datetime] = None
    depreciation_value: float
    
class AssetCreate(AssetBase):
    property_id: str

class AssetUpdate(BaseModel):
    asset_category: Optional[str] = None
    asset_name: Optional[str] = None
    tag_number: Optional[str] = None
    additional_info: Optional[str] = None
    location: Optional[str] = None
    vendor_name: Optional[str] = None
    purchase_date: Optional[datetime] = None
    asset_cost: Optional[float] = None
    warranty_date: Optional[datetime] = None
    depreciation_value: Optional[float] = None

class AssetResponse(AssetBase):
    id: str
    created_at: datetime
    updated_at: datetime
    property_id: str
    qr_code_url: str
    
    class Config:
        orm_mode = True
class SignupSchema(BaseModel):
    name: str
    email: str
    phone_no: str
    password: str
    user_role: str
    user_type: str
    property_id: str

class LoginSchema(BaseModel):
    email: str
    password: str

class ProfileSchema(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone_no: Optional[str] = None
    user_role: Optional[str] = None
    user_type: Optional[str] = None
    property_id: Optional[str] = None
    status: Optional[str] = "active"

    class Config:
        from_attributes = True

class PropertyCreate(BaseModel):
    name: str
    title: str
    description: Optional[str] = None
    logo_base64: Optional[str] = None  # New field for base64 logo

class PropertyOut(PropertyCreate):
    id: str

    class Config:
        from_attributes = True

# --- Staff Category Schemas ---
class StaffCategoryBase(BaseModel):
    title: str
    user_ids: Optional[List[str]] = []
    property_id: str

class StaffCategoryCreate(StaffCategoryBase):
    pass

class StaffCategoryUpdate(BaseModel):
    title: Optional[str] = None
    user_ids: Optional[List[str]] = None
    property_id: Optional[str] = None

class StaffCategoryResponse(StaffCategoryBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    reset_time: Optional[datetime] = None
    reset_after: Optional[int] = None  # hours
    total: Optional[int] = 0
    active: Optional[bool] = True
    completed: Optional[bool] = False
    default: Optional[bool] = False
    opening_time: Optional[datetime] = None
    closing_time: Optional[datetime] = None
    comment: Optional[str] = None
    property_id: str  # Added property_id field

class TaskCreate(TaskBase):
    activity_id: str

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    reset_time: Optional[datetime] = None
    reset_after: Optional[int] = None
    total: Optional[int] = None
    active: Optional[bool] = None
    completed: Optional[bool] = None
    default: Optional[bool] = None
    opening_time: Optional[datetime] = None
    closing_time: Optional[datetime] = None
    comment: Optional[str] = None
    property_id: Optional[str] = None  # Added property_id field

class TaskResponse(TaskBase):
    id: str
    created_at: datetime
    updated_at: datetime
    activity_id: str
    
    class Config:
        from_attributes = True

class ActivityBase(BaseModel):
    name: str
    description: Optional[str] = None
    user_role: Optional[str] = None
    user_type: Optional[str] = None
    total_tasks: Optional[int] = 0
    active_tasks: Optional[int] = 0
    default_tasks: Optional[int] = 0
    completed_tasks: Optional[int] = 0
    property_id: str  # Added property_id field

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    user_role: Optional[str] = None
    user_type: Optional[str] = None
    property_id: Optional[str] = None  # Added property_id field

class ActivityResponse(ActivityBase):
    id: str
    created_at: datetime
    updated_at: datetime
    tasks: List[TaskResponse] = []
    
    class Config:
        from_attributes = True

# Database Models
class WaterSource(Base):
    __tablename__ = "water_sources"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False)  # BWSSB, Tanker, Borewell
    location = Column(String)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    property_id = Column(String, nullable=False)
    
    # Track all update timestamps as string
    update_history = Column(Text, default="")
    
    # Relationship with water readings
    readings = relationship("WaterReading", back_populates="water_source", cascade="all, delete-orphan")

class WaterReading(Base):
    __tablename__ = "water_readings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    water_source_id = Column(String, ForeignKey("water_sources.id"))
    reading_type = Column(String, nullable=False)  # intake, yield, supply
    value = Column(Float, nullable=False)
    unit = Column(String, default="KL")  # KL, Nos, etc.
    reading_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    property_id = Column(String, nullable=False)
    
    # Track all update timestamps as string
    update_history = Column(Text, default="")
    
    water_source = relationship("WaterSource", back_populates="readings")

class SwimmingPool(Base):
    __tablename__ = "swimming_pools"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    ph_value = Column(Float, nullable=True)
    chlorine_value = Column(Float, nullable=True)
    ph_updated_at = Column(DateTime, nullable=True)
    chlorine_updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    property = relationship("Property", back_populates="swimming_pools")


class DieselGenerator(Base):
    __tablename__ = "diesel_generators"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)  # DG-1, DG-2, etc.
    capacity = Column(String, nullable=True)  # e.g., 750 KVA
    running_hours = Column(Float, default=0)
    diesel_balance = Column(Float, default=0)  # in liters
    diesel_capacity = Column(Float, default=0)  # total capacity in liters
    kwh_units = Column(Float, default=0)
    battery_voltage = Column(Float, nullable=True)
    voltage_line_to_line = Column(Float, nullable=True)
    voltage_line_to_neutral = Column(Float, nullable=True)
    frequency = Column(Float, nullable=True)
    oil_pressure = Column(Float, nullable=True)  # in psi
    rpm = Column(Integer, nullable=True)
    coolant_temperature = Column(Float, nullable=True)  # in °C
    diesel_topup = Column(Float, default=0)  # in liters
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    property = relationship("Property", back_populates="diesel_generators")


class ElectricityConsumption(Base):
    __tablename__ = "electricity_consumptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    block_name = Column(String, nullable=False)  # Block-C, Block-D, etc.
    reference_number = Column(String, nullable=True)  # RR: number
    reading = Column(Float, default=0)  # in kWh
    consumption_type = Column(String, nullable=False)  # "Block" or "STP"
    phase = Column(String, nullable=True)  # For STP: Phase-1, Phase-2, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    property = relationship("Property", back_populates="electricity_consumptions")


class DieselStock(Base):
    __tablename__ = "diesel_stocks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    purchase_amount = Column(Float, default=0)  # in liters
    total_stock = Column(Float, default=0)  # in liters
    capacity = Column(Float, default=0)  # total capacity in liters
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    property = relationship("Property")

# Create tables
Base.metadata.create_all(bind=engine)

os.makedirs("assets/pdf", exist_ok=True)
os.makedirs("assets/qr", exist_ok=True)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for API
class WaterSourceCreate(BaseModel):
    name: str
    source_type: str
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    property_id: str

class WaterSourceUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    property_id: Optional[str] = None

class WaterSourceResponse(BaseModel):
    id: str
    name: str
    source_type: str
    location: Optional[str]
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    update_history: str
    property_id: str

    class Config:
        from_attributes = True

class WaterReadingCreate(BaseModel):
    water_source_id: str
    reading_type: str
    value: float
    unit: str = "KL"
    reading_date: Optional[datetime] = None
    property_id: str

class WaterReadingUpdate(BaseModel):
    reading_type: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    reading_date: Optional[datetime] = None
    property_id: Optional[str] = None

class WaterReadingResponse(BaseModel):
    id: str
    water_source_id: str
    reading_type: str
    value: float
    unit: str
    reading_date: datetime
    created_at: datetime
    updated_at: datetime
    update_history: str
    property_id: str

    class Config:
        from_attributes = True

def update_history_string(existing_history: str, db_object) -> str:
    """Update the history string with new timestamp"""
    current_time = datetime.utcnow().isoformat()
    if existing_history:
        return f"{existing_history},{current_time}"
    return current_time


class WTP(Base):
    __tablename__ = "wtp"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id"))
    phase_name = Column(String)
    created_time = Column(DateTime, default=datetime.utcnow)
    updated_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Sump Levels
    raw_sump_level = Column(Float, nullable=True)
    treated_water_sump_level = Column(Float, nullable=True)
    
    # Water Quality
    raw_water_hardness = Column(Float, nullable=True)
    treated_water_hardness_morning = Column(Float, nullable=True)
    treated_water_hardness_evening = Column(Float, nullable=True)
    
    # Meter Readings
    treated_water_meter = Column(Float, nullable=True)
    energy_consumption = Column(Float, nullable=True)
    
    # Salt Usage
    salt_todays_usage = Column(Integer, nullable=True)
    salt_stock = Column(Integer, nullable=True)
    
    # Additional parameters
    ph_level = Column(Float, nullable=True)
    chlorine_level = Column(Float, nullable=True)
    turbidity = Column(Float, nullable=True)
    
    property = relationship("Property", back_populates="wtp_phases")

class STP(Base):
    __tablename__ = "stp"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id"))
    phase_name = Column(String)
    created_time = Column(DateTime, default=datetime.utcnow)
    updated_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Water Quality
    tank1_mlss = Column(Float, nullable=True)
    tank2_mlss = Column(Float, nullable=True)
    ph_level = Column(Float, nullable=True)
    chlorine_level = Column(Float, nullable=True)
    smell = Column(String, nullable=True)
    
    # Meter Readings
    energy_consumption = Column(Float, nullable=True)
    raw_sewage_flow = Column(Float, nullable=True)
    treated_water_flow = Column(Float, nullable=True)
    
    # Tank Levels
    raw_sewage_tank_level = Column(Float, nullable=True)
    filter_feed_tank_level = Column(Float, nullable=True)
    flush_water_tank_level = Column(Float, nullable=True)
    
    # Air Quality
    air_smell = Column(String, nullable=True)
    
    # Additional parameters
    bod_inlet = Column(Float, nullable=True)
    bod_outlet = Column(Float, nullable=True)
    cod_inlet = Column(Float, nullable=True)
    cod_outlet = Column(Float, nullable=True)
    
    property = relationship("Property", back_populates="stp_phases")

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for requests/responses
class PropertyCreate(BaseModel):
    name: str
    title: str
    description: str
    logo_base64: Optional[str] = None

class PropertyResponse(BaseModel):
    id: str
    name: str
    title: str
    description: str
    logo_base64: Optional[str] = None
    created_time: datetime
    updated_time: datetime

class WTPCreate(BaseModel):
    property_id: str
    phase_name: str
    raw_sump_level: Optional[float] = None
    treated_water_sump_level: Optional[float] = None
    raw_water_hardness: Optional[float] = None
    treated_water_hardness_morning: Optional[float] = None
    treated_water_hardness_evening: Optional[float] = None
    treated_water_meter: Optional[float] = None
    energy_consumption: Optional[float] = None
    salt_todays_usage: Optional[int] = None
    salt_stock: Optional[int] = None
    ph_level: Optional[float] = None
    chlorine_level: Optional[float] = None
    turbidity: Optional[float] = None

class WTPUpdate(BaseModel):
    phase_name: Optional[str] = None
    raw_sump_level: Optional[float] = None
    treated_water_sump_level: Optional[float] = None
    raw_water_hardness: Optional[float] = None
    treated_water_hardness_morning: Optional[float] = None
    treated_water_hardness_evening: Optional[float] = None
    treated_water_meter: Optional[float] = None
    energy_consumption: Optional[float] = None
    salt_todays_usage: Optional[int] = None
    salt_stock: Optional[int] = None
    ph_level: Optional[float] = None
    chlorine_level: Optional[float] = None
    turbidity: Optional[float] = None

class WTPResponse(BaseModel):
    id: str
    property_id: str
    phase_name: str
    raw_sump_level: Optional[float]
    treated_water_sump_level: Optional[float]
    raw_water_hardness: Optional[float]
    treated_water_hardness_morning: Optional[float]
    treated_water_hardness_evening: Optional[float]
    treated_water_meter: Optional[float]
    energy_consumption: Optional[float]
    salt_todays_usage: Optional[int]
    salt_stock: Optional[int]
    ph_level: Optional[float]
    chlorine_level: Optional[float]
    turbidity: Optional[float]
    created_time: datetime
    updated_time: datetime

class STPCreate(BaseModel):
    property_id: str
    phase_name: str
    tank1_mlss: Optional[float] = None
    tank2_mlss: Optional[float] = None
    ph_level: Optional[float] = None
    chlorine_level: Optional[float] = None
    smell: Optional[str] = None
    energy_consumption: Optional[float] = None
    raw_sewage_flow: Optional[float] = None
    treated_water_flow: Optional[float] = None
    raw_sewage_tank_level: Optional[float] = None
    filter_feed_tank_level: Optional[float] = None
    flush_water_tank_level: Optional[float] = None
    air_smell: Optional[str] = None
    bod_inlet: Optional[float] = None
    bod_outlet: Optional[float] = None
    cod_inlet: Optional[float] = None
    cod_outlet: Optional[float] = None

class STPUpdate(BaseModel):
    phase_name: Optional[str] = None
    tank1_mlss: Optional[float] = None
    tank2_mlss: Optional[float] = None
    ph_level: Optional[float] = None
    chlorine_level: Optional[float] = None
    smell: Optional[str] = None
    energy_consumption: Optional[float] = None
    raw_sewage_flow: Optional[float] = None
    treated_water_flow: Optional[float] = None
    raw_sewage_tank_level: Optional[float] = None
    filter_feed_tank_level: Optional[float] = None
    flush_water_tank_level: Optional[float] = None
    air_smell: Optional[str] = None
    bod_inlet: Optional[float] = None
    bod_outlet: Optional[float] = None
    cod_inlet: Optional[float] = None
    cod_outlet: Optional[float] = None

class STPResponse(BaseModel):
    id: str
    property_id: str
    phase_name: str
    tank1_mlss: Optional[float]
    tank2_mlss: Optional[float]
    ph_level: Optional[float]
    chlorine_level: Optional[float]
    smell: Optional[str]
    energy_consumption: Optional[float]
    raw_sewage_flow: Optional[float]
    treated_water_flow: Optional[float]
    raw_sewage_tank_level: Optional[float]
    filter_feed_tank_level: Optional[float]
    flush_water_tank_level: Optional[float]
    air_smell: Optional[str]
    bod_inlet: Optional[float]
    bod_outlet: Optional[float]
    cod_inlet: Optional[float]
    cod_outlet: Optional[float]
    created_time: datetime
    updated_time: datetime


class PropertyBase(BaseModel):
    name: str
    title: str
    description: Optional[str] = None
    logo_base64: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    logo_base64: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Swimming Pool Models
class SwimmingPoolBase(BaseModel):
    property_id: str
    ph_value: Optional[float] = None
    chlorine_value: Optional[float] = None


class SwimmingPoolCreate(SwimmingPoolBase):
    pass


class SwimmingPoolUpdate(BaseModel):
    ph_value: Optional[float] = None
    chlorine_value: Optional[float] = None


class SwimmingPoolResponse(SwimmingPoolBase):
    id: str
    ph_updated_at: Optional[datetime] = None
    chlorine_updated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Diesel Generator Models
class DieselGeneratorBase(BaseModel):
    property_id: str
    name: str
    capacity: Optional[str] = None
    running_hours: float = 0
    diesel_balance: float = 0
    diesel_capacity: float = 0
    kwh_units: float = 0
    battery_voltage: Optional[float] = None
    voltage_line_to_line: Optional[float] = None
    voltage_line_to_neutral: Optional[float] = None
    frequency: Optional[float] = None
    oil_pressure: Optional[float] = None
    rpm: Optional[int] = None
    coolant_temperature: Optional[float] = None
    diesel_topup: float = 0


class DieselGeneratorCreate(DieselGeneratorBase):
    pass


class DieselGeneratorUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[str] = None
    running_hours: Optional[float] = None
    diesel_balance: Optional[float] = None
    diesel_capacity: Optional[float] = None
    kwh_units: Optional[float] = None
    battery_voltage: Optional[float] = None
    voltage_line_to_line: Optional[float] = None
    voltage_line_to_neutral: Optional[float] = None
    frequency: Optional[float] = None
    oil_pressure: Optional[float] = None
    rpm: Optional[int] = None
    coolant_temperature: Optional[float] = None
    diesel_topup: Optional[float] = None


class DieselGeneratorResponse(DieselGeneratorBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Electricity Consumption Models
class ElectricityConsumptionBase(BaseModel):
    property_id: str
    block_name: str
    reference_number: Optional[str] = None
    reading: float = 0
    consumption_type: str  # "Block" or "STP"
    phase: Optional[str] = None


class ElectricityConsumptionCreate(ElectricityConsumptionBase):
    pass


class ElectricityConsumptionUpdate(BaseModel):
    block_name: Optional[str] = None
    reference_number: Optional[str] = None
    reading: Optional[float] = None
    consumption_type: Optional[str] = None
    phase: Optional[str] = None


class ElectricityConsumptionResponse(ElectricityConsumptionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Diesel Stock Models
class DieselStockBase(BaseModel):
    property_id: str
    purchase_amount: float = 0
    total_stock: float = 0
    capacity: float = 0


class DieselStockCreate(DieselStockBase):
    pass


class DieselStockUpdate(BaseModel):
    purchase_amount: Optional[float] = None
    total_stock: Optional[float] = None
    capacity: Optional[float] = None


class DieselStockResponse(DieselStockBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# --- Dependency ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Auth Routes ---

@app.post("/signup", tags=["Auth"])
def signup(data: SignupSchema, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = str(uuid.uuid4())  # Generate user_id
        user = User(
            name=data.name,
            email=data.email,
            phone_no=data.phone_no,
            password=data.password,
            user_id=user_id,  # Use the generated user_id
            user_role=data.user_role,
            user_type=data.user_type,
            property_id=data.property_id,
            status="pending"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"message": "User created", "user_id": user.user_id, "status": user.status}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.post("/login", tags=["Auth"])
def login(data: LoginSchema, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == data.email, User.password == data.password).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = str(uuid.uuid4())  # Simulated token
        return {
            "user_id": user.user_id, 
            "token": token, 
            "status": user.status,
            "property_id": user.property_id,
            "user_role": user.user_role,
            "user_type": user.user_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")

# --- Property User Management Routes ---
@app.post("/create-property-user", tags=["Property Users"])
def create_property_user(user_data: dict, db: Session = Depends(get_db)):
    try:
        # Generate unique user_id and email
        user_id = str(uuid.uuid4())
        email = f"{user_data['name'].lower().replace(' ', '.')}@{user_data['property_id']}.prktech.com"
        
        # Create new user
        new_user = User(
            id=str(uuid.uuid4()),
            name=user_data['name'],
            email=email,
            phone_no=user_data.get('phone_no', ''),
            password=user_data['password'],
            user_id=user_id,
            user_role=user_data.get('user_role', 'user'),
            user_type=user_data.get('user_type', 'property_user'),
            property_id=user_data['property_id'],
            status='active'
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "message": "Property user created successfully",
            "user_id": user_id,
            "email": email,
            "password": user_data['password'],
            "property_id": user_data['property_id']
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating property user: {str(e)}")

@app.get("/property-users/{property_id}", tags=["Property Users"])
def get_property_users(property_id: str, db: Session = Depends(get_db)):
    try:
        users = db.query(User).filter(
            User.property_id == property_id,
            User.user_type == 'property_user'
        ).all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching property users: {str(e)}")

@app.get("/properties/{property_id}/users", tags=["Property Users"])
def get_all_property_users(property_id: str, db: Session = Depends(get_db)):
    try:
        users = db.query(User).filter(
            User.property_id == property_id
        ).all()
        
        # Convert to response format
        user_list = []
        for user in users:
            user_list.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone_no": user.phone_no,
                "user_role": user.user_role,
                "user_type": user.user_type,
                "property_id": user.property_id,
                "status": user.status,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })
        
        return user_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching property users: {str(e)}")

# --- Profile Routes ---
@app.get("/profile", response_model=List[ProfileSchema], tags=["Profile"])
def get_all_profiles(db: Session = Depends(get_db)):
    try:
        return db.query(User).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profiles: {str(e)}")

@app.get("/profile/{user_id}", tags=["Profile"])
def get_profile(user_id: str, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Profile not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@app.post("/profile", tags=["Profile"])
def create_profile(profile: ProfileSchema, db: Session = Depends(get_db)):
    try:
        # This endpoint should not be needed if using signup
        # But if you want to create a profile directly, generate a new user_id
        user_data = profile.dict(exclude_unset=True)
        if not user_data.get('user_id'):
            user_data['user_id'] = str(uuid.uuid4())  # Generate new user_id if not provided
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.user_id == user_data['user_id']).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this user_id already exists")
        
        user = User(**user_data)
        user.id = str(uuid.uuid4())  # Generate primary key
        user.created_at = datetime.utcnow()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating profile: {str(e)}")

@app.put("/profile/{user_id}", tags=["Profile"])
def update_profile(user_id: str, profile: ProfileSchema, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        for key, value in profile.dict(exclude_unset=True).items():
            setattr(user, key, value)
        db.commit()
        return {"message": "Profile updated"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

@app.delete("/profile/{user_id}", tags=["Profile"])
def delete_profile(user_id: str, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        return {"message": "User deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")

@app.patch("/profile/{user_id}/activate", tags=["Profile"])
def activate_user(user_id: str, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.status = "active"
        db.commit()
        db.refresh(user)
        return {
            "message": "User activated successfully",
            "user_id": user.user_id,
            "status": user.status
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error activating user: {str(e)}")

@app.get("/profile/property/{property_id}", response_model=List[ProfileSchema], tags=["Profile"])
def get_profiles_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Get all users with a specific property_id
    """
    try:
        users = db.query(User).filter(User.property_id == property_id).all()
        if not users:
            raise HTTPException(status_code=404, detail="No users found for this property")
        return users
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profiles by property: {str(e)}")

# --- Property CRUD Routes ---

@app.post("/properties", response_model=PropertyOut, tags=["Property"])
def create_property(data: PropertyCreate, db: Session = Depends(get_db)):
    try:
        prop = Property(**data.dict())
        db.add(prop)
        db.commit()
        db.refresh(prop)
        return prop
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating property: {str(e)}")

@app.get("/properties", response_model=List[PropertyOut], tags=["Property"])
def get_all_properties(db: Session = Depends(get_db)):
    try:
        return db.query(Property).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching properties: {str(e)}")

@app.get("/properties/{id}", response_model=PropertyOut, tags=["Property"])
def get_property_by_id(id: str, db: Session = Depends(get_db)):
    try:
        prop = db.query(Property).filter(Property.id == id).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        return prop
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching property: {str(e)}")

@app.put("/properties/{id}", response_model=PropertyOut, tags=["Property"])
def update_property(id: str, data: PropertyCreate, db: Session = Depends(get_db)):
    try:
        prop = db.query(Property).filter(Property.id == id).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        for key, value in data.dict().items():
            setattr(prop, key, value)
        db.commit()
        db.refresh(prop)
        return prop
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating property: {str(e)}")

@app.delete("/properties/{id}", tags=["Property"])
def delete_property(id: str, db: Session = Depends(get_db)):
    try:
        prop = db.query(Property).filter(Property.id == id).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        db.delete(prop)
        db.commit()
        return {"message": f"Property {id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting property: {str(e)}")

# --- Staff Category CRUD Routes ---

@app.post("/staff-categories", response_model=StaffCategoryResponse, tags=["Staff Category"])
def create_staff_category(data: StaffCategoryCreate, db: Session = Depends(get_db)):
    try:
        user_ids_str = ",".join(data.user_ids) if data.user_ids else None
        staff_cat = StaffCategoryModel(
            title=data.title,
            user_ids=user_ids_str,
            property_id=data.property_id
        )
        db.add(staff_cat)
        db.commit()
        db.refresh(staff_cat)
        return StaffCategoryResponse(
            id=staff_cat.id,
            title=staff_cat.title,
            user_ids=staff_cat.user_ids.split(",") if staff_cat.user_ids else [],
            property_id=staff_cat.property_id,
            created_at=staff_cat.created_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating staff category: {str(e)}")

@app.get("/staff-categories", response_model=List[StaffCategoryResponse], tags=["Staff Category"])
def get_all_staff_categories(db: Session = Depends(get_db)):
    try:
        cats = db.query(StaffCategoryModel).all()
        return [
            StaffCategoryResponse(
                id=c.id,
                title=c.title,
                user_ids=c.user_ids.split(",") if c.user_ids else [],
                property_id=c.property_id,
                created_at=c.created_at
            ) for c in cats
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching staff categories: {str(e)}")

@app.get("/staff-categories/{id}", response_model=StaffCategoryResponse, tags=["Staff Category"])
def get_staff_category(id: str, db: Session = Depends(get_db)):
    try:
        c = db.query(StaffCategoryModel).filter(StaffCategoryModel.id == id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Staff category not found")
        return StaffCategoryResponse(
            id=c.id,
            title=c.title,
            user_ids=c.user_ids.split(",") if c.user_ids else [],
            property_id=c.property_id,
            created_at=c.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching staff category: {str(e)}")

@app.put("/staff-categories/{id}", response_model=StaffCategoryResponse, tags=["Staff Category"])
def update_staff_category(id: str, data: StaffCategoryUpdate, db: Session = Depends(get_db)):
    try:
        cat = db.query(StaffCategoryModel).filter(StaffCategoryModel.id == id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Staff category not found")
        update_data = data.dict(exclude_unset=True)
        if "user_ids" in update_data and update_data["user_ids"] is not None:
            update_data["user_ids"] = ",".join(update_data["user_ids"])
        for key, value in update_data.items():
            setattr(cat, key, value)
        db.commit()
        db.refresh(cat)
        return StaffCategoryResponse(
            id=cat.id,
            title=cat.title,
            user_ids=cat.user_ids.split(",") if cat.user_ids else [],
            property_id=cat.property_id,
            created_at=cat.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating staff category: {str(e)}")

@app.delete("/staff-categories/{id}", tags=["Staff Category"])
def delete_staff_category(id: str, db: Session = Depends(get_db)):
    try:
        cat = db.query(StaffCategoryModel).filter(StaffCategoryModel.id == id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Staff category not found")
        db.delete(cat)
        db.commit()
        return {"message": f"Staff category {id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting staff category: {str(e)}")

# --- Activity CRUD Routes ---

@app.post("/activities", response_model=ActivityResponse, tags=["Activity"])
def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    """Create a new activity"""
    try:
        # Check if property exists
        property = db.query(Property).filter(Property.id == activity.property_id).first()
        if not property:
            raise HTTPException(status_code=404, detail="Property not found")
            
        db_activity = ActivityModel(**activity.dict())
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)
        return db_activity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating activity: {str(e)}")

@app.get("/activities", response_model=List[ActivityResponse], tags=["Activity"])
def read_activities(
    skip: int = 0, 
    limit: int = 100, 
    property_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all activities with their tasks"""
    try:
        query = db.query(ActivityModel)
        if property_id:
            query = query.filter(ActivityModel.property_id == property_id)
        activities = query.offset(skip).limit(limit).all()
        return activities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activities: {str(e)}")

@app.get("/activities/{activity_id}", response_model=ActivityResponse, tags=["Activity"])
def read_activity(activity_id: str, db: Session = Depends(get_db)):
    """Get a specific activity by ID"""
    try:
        activity = db.query(ActivityModel).filter(ActivityModel.id == activity_id).first()
        if activity is None:
            raise HTTPException(status_code=404, detail="Activity not found")
        return activity
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity: {str(e)}")

@app.put("/activities/{activity_id}", response_model=ActivityResponse, tags=["Activity"])
def update_activity(activity_id: str, activity_update: ActivityUpdate, db: Session = Depends(get_db)):
    """Update an existing activity"""
    try:
        activity = db.query(ActivityModel).filter(ActivityModel.id == activity_id).first()
        if activity is None:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        # If property_id is being updated, verify it exists
        if activity_update.property_id:
            property = db.query(Property).filter(Property.id == activity_update.property_id).first()
            if not property:
                raise HTTPException(status_code=404, detail="Property not found")
        
        update_data = activity_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(activity, field, value)
        
        activity.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(activity)
        return activity
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating activity: {str(e)}")

@app.delete("/activities/{activity_id}", tags=["Activity"])
def delete_activity(activity_id: str, db: Session = Depends(get_db)):
    """Delete an activity and all its tasks"""
    try:
        activity = db.query(ActivityModel).filter(ActivityModel.id == activity_id).first()
        if activity is None:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        db.delete(activity)
        db.commit()
        return {"message": "Activity deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting activity: {str(e)}")

# --- Utility function to update activity task counts ---
def update_activity_task_counts(db: Session, activity_id: str):
    activity = db.query(ActivityModel).filter(ActivityModel.id == activity_id).first()
    if not activity:
        return
    tasks = db.query(TaskModel).filter(TaskModel.activity_id == activity_id).all()
    activity.total_tasks = len(tasks)
    activity.active_tasks = sum(1 for t in tasks if t.active)
    activity.default_tasks = sum(1 for t in tasks if t.default)
    activity.completed_tasks = sum(1 for t in tasks if t.completed)
    db.commit()
    db.refresh(activity)

# --- Task CRUD Routes ---

@app.post("/tasks", response_model=TaskResponse, tags=["Task"])
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task for an activity"""
    try:
        # Check if property exists
        property = db.query(Property).filter(Property.id == task.property_id).first()
        if not property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check if activity exists
        activity = db.query(ActivityModel).filter(ActivityModel.id == task.activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        db_task = TaskModel(**task.dict())
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        update_activity_task_counts(db, task.activity_id)
        return db_task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@app.get("/tasks", response_model=List[TaskResponse], tags=["Task"])
def read_tasks(
    skip: int = 0, 
    limit: int = 100, 
    property_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TaskModel)
    if property_id:
        query = query.filter(TaskModel.property_id == property_id)
    return query.offset(skip).limit(limit).all()

@app.get("/tasks/{task_id}", response_model=TaskResponse, tags=["Task"])
def read_task(task_id: str, db: Session = Depends(get_db)):
    """Get a specific task by ID"""
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching task: {str(e)}")

@app.get("/activities/{activity_id}/tasks", response_model=List[TaskResponse], tags=["Task"])
def read_activity_tasks(
    activity_id: str, 
    skip: int = 0, 
    limit: int = 100,
    property_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TaskModel).filter(TaskModel.activity_id == activity_id)
    if property_id:
        query = query.filter(TaskModel.property_id == property_id)
    return query.offset(skip).limit(limit).all()

@app.put("/tasks/{task_id}", response_model=TaskResponse, tags=["Task"])
def update_task(task_id: str, task_update: TaskUpdate, db: Session = Depends(get_db)):
    """Update an existing task"""
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        update_activity_task_counts(db, task.activity_id)
        return task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")

@app.delete("/tasks/{task_id}", tags=["Task"])
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task"""
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        activity_id = task.activity_id
        db.delete(task)
        db.commit()
        update_activity_task_counts(db, activity_id)
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")

# --- Utility endpoints ---

@app.patch("/tasks/{task_id}/complete", tags=["Task"])
def complete_task(task_id: str, db: Session = Depends(get_db)):
    """Mark a task as completed"""
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task.completed = True
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return {"message": "Task marked as completed", "task": task}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error completing task: {str(e)}")

@app.patch("/tasks/{task_id}/activate", tags=["Task"])
def activate_task(task_id: str, db: Session = Depends(get_db)):
    """Activate/Deactivate a task"""
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task.active = not task.active
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return {"message": f"Task {'activated' if task.active else 'deactivated'}", "task": task}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error toggling task activation: {str(e)}")

@app.patch("/tasks/{task_id}/reset", tags=["Task"])
def reset_task(task_id: str, db: Session = Depends(get_db)):
    """Reset a task (mark as not completed and update reset time)"""
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task.completed = False
        task.reset_time = datetime.utcnow()
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return {"message": "Task reset successfully", "task": task}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting task: {str(e)}")

# Water Source CRUD Operations
@app.post("/water-sources/", response_model=WaterSourceResponse, tags=["Water Source"])
def create_water_source(water_source: WaterSourceCreate, db: Session = Depends(get_db)):
    db_water_source = WaterSource(**water_source.dict())
    db_water_source.update_history = update_history_string("", db_water_source)
    db.add(db_water_source)
    db.commit()
    db.refresh(db_water_source)
    return db_water_source

@app.get("/water-sources/", response_model=List[WaterSourceResponse], tags=["Water Source"])
def get_water_sources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    source_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    property_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WaterSource)
    
    if source_type:
        query = query.filter(WaterSource.source_type == source_type)
    if is_active is not None:
        query = query.filter(WaterSource.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()

@app.get("/water-sources/{water_source_id}", response_model=WaterSourceResponse, tags=["Water Source"])
def get_water_source(water_source_id: str, db: Session = Depends(get_db)):
    water_source = db.query(WaterSource).filter(WaterSource.id == water_source_id).first()
    if not water_source:
        raise HTTPException(status_code=404, detail="Water source not found")
    if water_source.property_id != property_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    return water_source

@app.put("/water-sources/{water_source_id}", response_model=WaterSourceResponse, tags=["Water Source"])
def update_water_source(
    water_source_id: str, 
    water_source_update: WaterSourceUpdate, 
    db: Session = Depends(get_db)
):
    water_source = db.query(WaterSource).filter(WaterSource.id == water_source_id).first()
    if not water_source:
        raise HTTPException(status_code=404, detail="Water source not found")
    
    # Update fields
    for field, value in water_source_update.dict(exclude_unset=True).items():
        setattr(water_source, field, value)
    
    # Update history
    water_source.update_history = update_history_string(water_source.update_history, water_source)
    
    db.commit()
    db.refresh(water_source)
    return water_source

@app.delete("/water-sources/{water_source_id}", tags=["Water Source"])
def delete_water_source(water_source_id: str, db: Session = Depends(get_db)):
    water_source = db.query(WaterSource).filter(WaterSource.id == water_source_id).first()
    if not water_source:
        raise HTTPException(status_code=404, detail="Water source not found")
    if water_source.property_id != property_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    

    db.delete(water_source)
    db.commit()
    return {"message": "Water source deleted successfully"}

# Water Reading CRUD Operations
@app.post("/water-readings/", response_model=WaterReadingResponse, tags=["Water Reading"])
def create_water_reading(water_reading: WaterReadingCreate, db: Session = Depends(get_db)):
    # Verify water source exists
    water_source = db.query(WaterSource).filter(WaterSource.id == water_reading.water_source_id).first()
    if not water_source:
        raise HTTPException(status_code=404, detail="Water source not found")
    if water_source.property_id != property_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    # Set reading_date if not provided
    if not water_reading.reading_date:
        water_reading.reading_date = datetime.utcnow()
    
    db_reading = WaterReading(**water_reading.dict())
    db_reading.update_history = update_history_string("", db_reading)
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

@app.get("/water-readings/", response_model=List[WaterReadingResponse], tags=["Water Reading"])
def get_water_readings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    water_source_id: Optional[str] = None,
    reading_type: Optional[str] = None,
    property_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WaterReading)
    
    if water_source_id:
        query = query.filter(WaterReading.water_source_id == water_source_id)
    if reading_type:
        query = query.filter(WaterReading.reading_type == reading_type)
    if property_id:
        query = query.filter(WaterReading.property_id == property_id)
    return query.offset(skip).limit(limit).all()

@app.get("/water-readings/{reading_id}", response_model=WaterReadingResponse, tags=["Water Reading"])
def get_water_reading(reading_id: str, db: Session = Depends(get_db)):
    reading = db.query(WaterReading).filter(WaterReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Water reading not found")
    if reading.property_id != property_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    return reading

@app.put("/water-readings/{reading_id}", response_model=WaterReadingResponse, tags=["Water Reading"])
def update_water_reading(
    reading_id: str, 
    reading_update: WaterReadingUpdate, 
    db: Session = Depends(get_db)
):
    reading = db.query(WaterReading).filter(WaterReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Water reading not found")
    
    # Update fields
    for field, value in reading_update.dict(exclude_unset=True).items():
        setattr(reading, field, value)
    
    # Update history
    reading.update_history = update_history_string(reading.update_history, reading)
    
    db.commit()
    db.refresh(reading)
    return reading

@app.delete("/water-readings/{reading_id}", tags=["Water Reading"])
def delete_water_reading(reading_id: str, db: Session = Depends(get_db)):
    reading = db.query(WaterReading).filter(WaterReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Water reading not found")
    if reading.property_id != property_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    db.delete(reading)
    db.commit()
    return {"message": "Water reading deleted successfully"}

# Additional endpoints for better functionality
@app.get("/water-sources/{water_source_id}/readings", response_model=List[WaterReadingResponse], tags=["Water Reading"])
def get_readings_for_water_source(
    water_source_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    reading_type: Optional[str] = None,
    property_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Verify water source exists
    water_source = db.query(WaterSource).filter(WaterSource.id == water_source_id).first()
    if not water_source:
        raise HTTPException(status_code=404, detail="Water source not found")
    if water_source.property_id != property_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")  
    query = db.query(WaterReading).filter(WaterReading.water_source_id == water_source_id)
    
    if reading_type:
        query = query.filter(WaterReading.reading_type == reading_type)
    
    return query.offset(skip).limit(limit).all()

@app.get("/water-sources/{water_source_id}/total-water-intake", tags=["Water Reading"])
def get_total_water_intake(water_source_id: str, db: Session = Depends(get_db)):
    # Verify water source exists
    water_source = db.query(WaterSource).filter(WaterSource.id == water_source_id).first()
    if not water_source:
        raise HTTPException(status_code=404, detail="Water source not found")
    if water_source.property_id != property_id:
        raise HTTPException(status_code=403, detail="Unauthorized access")
    # Calculate total intake
    total_intake = db.query(WaterReading).filter(
        WaterReading.water_source_id == water_source_id,
        WaterReading.reading_type == "intake"
    ).with_entities(func.sum(WaterReading.value)).scalar() or 0
    
    return {
        "water_source_id": water_source_id,
        "water_source_name": water_source.name,
        "total_intake": total_intake,
        "unit": "KL"
    }

@app.post("/properties/", response_model=PropertyResponse, tags=["Properties"])
def create_property(property: PropertyCreate, db: Session = Depends(get_db)):
    db_property = Property(**property.dict())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

@app.get("/properties/", response_model=List[PropertyResponse], tags=["Properties"])
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    properties = db.query(Property).offset(skip).limit(limit).all()
    return properties

@app.get("/properties/{property_id}", response_model=PropertyResponse, tags=["Properties"])
def get_property(property_id: str, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return property

@app.put("/properties/{property_id}", response_model=PropertyResponse, tags=["Properties"])
def update_property(property_id: str, property_update: PropertyCreate, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    for field, value in property_update.dict(exclude_unset=True).items():
        setattr(property, field, value)
    
    property.updated_time = datetime.utcnow()
    db.commit()
    db.refresh(property)
    return property

@app.delete("/properties/{property_id}" , tags=["Properties"])
def delete_property(property_id: str, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(property)
    db.commit()
    return {"message": "Property deleted successfully"}

# WTP APIS
@app.post("/wtp/", response_model=WTPResponse, tags=["WTP"])
def create_wtp(wtp: WTPCreate, db: Session = Depends(get_db)):
    # Check if property exists
    property = db.query(Property).filter(Property.id == wtp.property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db_wtp = WTP(**wtp.dict())
    db.add(db_wtp)
    db.commit()
    db.refresh(db_wtp)
    return db_wtp

@app.get("/wtp/", response_model=List[WTPResponse], tags=["WTP"])
def get_wtps(property_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(WTP)
    if property_id:
        query = query.filter(WTP.property_id == property_id)
    wtps = query.offset(skip).limit(limit).all()
    return wtps

@app.get("/wtp/{wtp_id}", response_model=WTPResponse, tags=["WTP"])
def get_wtp(wtp_id: str, db: Session = Depends(get_db)):
    wtp = db.query(WTP).filter(WTP.id == wtp_id).first()
    if wtp is None:
        raise HTTPException(status_code=404, detail="WTP not found")
    return wtp

@app.put("/wtp/{wtp_id}", response_model=WTPResponse, tags=["WTP"])
def update_wtp(wtp_id: str, wtp_update: WTPUpdate, db: Session = Depends(get_db)):
    wtp = db.query(WTP).filter(WTP.id == wtp_id).first()
    if wtp is None:
        raise HTTPException(status_code=404, detail="WTP not found")
    
    for field, value in wtp_update.dict(exclude_unset=True).items():
        setattr(wtp, field, value)
    
    wtp.updated_time = datetime.utcnow()
    db.commit()
    db.refresh(wtp)
    return wtp

@app.delete("/wtp/{wtp_id}", tags=["WTP"])
def delete_wtp(wtp_id: str, db: Session = Depends(get_db)):
    wtp = db.query(WTP).filter(WTP.id == wtp_id).first()
    if wtp is None:
        raise HTTPException(status_code=404, detail="WTP not found")
    
    db.delete(wtp)
    db.commit()
    return {"message": "WTP deleted successfully"}

# STP APIS
@app.post("/stp/", response_model=STPResponse, tags=["STP"])
def create_stp(stp: STPCreate, db: Session = Depends(get_db)):
    # Check if property exists
    property = db.query(Property).filter(Property.id == stp.property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db_stp = STP(**stp.dict())
    db.add(db_stp)
    db.commit()
    db.refresh(db_stp)
    return db_stp

@app.get("/stp/", response_model=List[STPResponse], tags=["STP"])
def get_stps(property_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(STP)
    if property_id:
        query = query.filter(STP.property_id == property_id)
    stps = query.offset(skip).limit(limit).all()
    return stps

@app.get("/stp/{stp_id}", response_model=STPResponse, tags=["STP"])
def get_stp(stp_id: str, db: Session = Depends(get_db)):
    stp = db.query(STP).filter(STP.id == stp_id).first()
    if stp is None:
        raise HTTPException(status_code=404, detail="STP not found")
    return stp

@app.put("/stp/{stp_id}", response_model=STPResponse, tags=["STP"])
def update_stp(stp_id: str, stp_update: STPUpdate, db: Session = Depends(get_db)):
    stp = db.query(STP).filter(STP.id == stp_id).first()
    if stp is None:
        raise HTTPException(status_code=404, detail="STP not found")
    
    for field, value in stp_update.dict(exclude_unset=True).items():
        setattr(stp, field, value)
    
    stp.updated_time = datetime.utcnow()
    db.commit()
    db.refresh(stp)
    return stp

@app.delete("/stp/{stp_id}", tags=["STP"])
def delete_stp(stp_id: str, db: Session = Depends(get_db)):
    stp = db.query(STP).filter(STP.id == stp_id).first()
    if stp is None:
        raise HTTPException(status_code=404, detail="STP not found")
    
    db.delete(stp)
    db.commit()
    return {"message": "STP deleted successfully"}

# Additional APIs for bulk operations
@app.get("/properties/{property_id}/wtp", response_model=List[WTPResponse], tags=["WTP"])
def get_property_wtps(property_id: str, db: Session = Depends(get_db)):
    # Check if property exists
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    wtps = db.query(WTP).filter(WTP.property_id == property_id).all()
    return wtps

@app.get("/properties/{property_id}/stp", response_model=List[STPResponse], tags=["STP"])
def get_property_stps(property_id: str, db: Session = Depends(get_db)):
    # Check if property exists
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    stps = db.query(STP).filter(STP.property_id == property_id).all()
    return stps

@app.post("/properties/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED, tags=["Properties"])
def create_property(property_data: PropertyCreate, db: Session = Depends(get_db)):
    db_property = Property(**property_data.dict())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property


@app.get("/properties/", response_model=List[PropertyResponse], tags=["Properties"])
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    properties = db.query(Property).offset(skip).limit(limit).all()
    return properties


@app.get("/properties/{property_id}", response_model=PropertyResponse, tags=["Properties"])
def get_property(property_id: str, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property


@app.put("/properties/{property_id}", response_model=PropertyResponse, tags=["Properties"])
def update_property(property_id: str, property_data: PropertyUpdate, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    update_data = property_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)
    
    db_property.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_property)
    return db_property


@app.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Properties"])
def delete_property(property_id: str, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(db_property)
    db.commit()
    return None


# Swimming Pool Endpoints
@app.post("/swimming-pools/", response_model=SwimmingPoolResponse, status_code=status.HTTP_201_CREATED, tags=["Swimming Pool"])
def create_swimming_pool(pool_data: SwimmingPoolCreate, db: Session = Depends(get_db)):
    # Check if property exists
    db_property = db.query(Property).filter(Property.id == pool_data.property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check if pool already exists for this property
    existing_pool = db.query(SwimmingPool).filter(SwimmingPool.property_id == pool_data.property_id).first()
    if existing_pool:
        raise HTTPException(status_code=400, detail="Swimming pool already exists for this property")
    
    db_pool = SwimmingPool(**pool_data.dict())
    
    if pool_data.ph_value is not None:
        db_pool.ph_updated_at = datetime.utcnow()
    
    if pool_data.chlorine_value is not None:
        db_pool.chlorine_updated_at = datetime.utcnow()
    
    db.add(db_pool)
    db.commit()
    db.refresh(db_pool)
    return db_pool


@app.get("/swimming-pools/", response_model=List[SwimmingPoolResponse], tags=["Swimming Pool"])
def get_swimming_pools(
    property_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(SwimmingPool)
    if property_id:
        query = query.filter(SwimmingPool.property_id == property_id)
    
    pools = query.offset(skip).limit(limit).all()
    return pools


@app.get("/swimming-pools/{pool_id}", response_model=SwimmingPoolResponse, tags=["Swimming Pool"])
def get_swimming_pool(pool_id: str, db: Session = Depends(get_db)):
    db_pool = db.query(SwimmingPool).filter(SwimmingPool.id == pool_id).first()
    if db_pool is None:
        raise HTTPException(status_code=404, detail="Swimming pool not found")
    return db_pool


@app.put("/swimming-pools/{pool_id}", response_model=SwimmingPoolResponse, tags=["Swimming Pool"])
def update_swimming_pool(pool_id: str, pool_data: SwimmingPoolUpdate, db: Session = Depends(get_db)):
    db_pool = db.query(SwimmingPool).filter(SwimmingPool.id == pool_id).first()
    if db_pool is None:
        raise HTTPException(status_code=404, detail="Swimming pool not found")
    
    update_data = pool_data.dict(exclude_unset=True)
    
    # Update timestamp for pH if changed
    if "ph_value" in update_data and update_data["ph_value"] is not None:
        update_data["ph_updated_at"] = datetime.utcnow()
    
    # Update timestamp for chlorine if changed
    if "chlorine_value" in update_data and update_data["chlorine_value"] is not None:
        update_data["chlorine_updated_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_pool, key, value)
    
    db_pool.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_pool)
    return db_pool


@app.delete("/swimming-pools/{pool_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Swimming Pool"])
def delete_swimming_pool(pool_id: str, db: Session = Depends(get_db)):
    db_pool = db.query(SwimmingPool).filter(SwimmingPool.id == pool_id).first()
    if db_pool is None:
        raise HTTPException(status_code=404, detail="Swimming pool not found")
    
    db.delete(db_pool)
    db.commit()
    return None


# Diesel Generator Endpoints
@app.post("/diesel-generators/", response_model=DieselGeneratorResponse, status_code=status.HTTP_201_CREATED, tags=["Diesel Generator"])
def create_diesel_generator(generator_data: DieselGeneratorCreate, db: Session = Depends(get_db)):
    # Check if property exists
    db_property = db.query(Property).filter(Property.id == generator_data.property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check if generator with same name already exists for this property
    existing_generator = db.query(DieselGenerator).filter(
        DieselGenerator.property_id == generator_data.property_id,
        DieselGenerator.name == generator_data.name
    ).first()
    
    if existing_generator:
        raise HTTPException(status_code=400, detail=f"Diesel generator '{generator_data.name}' already exists for this property")
    
    db_generator = DieselGenerator(**generator_data.dict())
    db.add(db_generator)
    db.commit()
    db.refresh(db_generator)
    return db_generator


@app.get("/diesel-generators/", response_model=List[DieselGeneratorResponse], tags=["Diesel Generator"])
def get_diesel_generators(
    property_id: Optional[str] = None,
    name: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(DieselGenerator)
    
    if property_id:
        query = query.filter(DieselGenerator.property_id == property_id)
    
    if name:
        query = query.filter(DieselGenerator.name == name)
    
    generators = query.offset(skip).limit(limit).all()
    return generators


@app.get("/diesel-generators/{generator_id}", response_model=DieselGeneratorResponse, tags=["Diesel Generator"])
def get_diesel_generator(generator_id: str, db: Session = Depends(get_db)):
    db_generator = db.query(DieselGenerator).filter(DieselGenerator.id == generator_id).first()
    if db_generator is None:
        raise HTTPException(status_code=404, detail="Diesel generator not found")
    return db_generator


@app.put("/diesel-generators/{generator_id}", response_model=DieselGeneratorResponse, tags=["Diesel Generator"])
def update_diesel_generator(generator_id: str, generator_data: DieselGeneratorUpdate, db: Session = Depends(get_db)):
    db_generator = db.query(DieselGenerator).filter(DieselGenerator.id == generator_id).first()
    if db_generator is None:
        raise HTTPException(status_code=404, detail="Diesel generator not found")
    
    update_data = generator_data.dict(exclude_unset=True)
    
    # If name is being updated, check for duplicates
    if "name" in update_data and update_data["name"] is not None and update_data["name"] != db_generator.name:
        existing_generator = db.query(DieselGenerator).filter(
            DieselGenerator.property_id == db_generator.property_id,
            DieselGenerator.name == update_data["name"]
        ).first()
        
        if existing_generator:
            raise HTTPException(status_code=400, detail=f"Diesel generator '{update_data['name']}' already exists for this property")
    
    for key, value in update_data.items():
        setattr(db_generator, key, value)
    
    db_generator.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_generator)
    return db_generator


@app.delete("/diesel-generators/{generator_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Diesel Generator"])
def delete_diesel_generator(generator_id: str, db: Session = Depends(get_db)):
    db_generator = db.query(DieselGenerator).filter(DieselGenerator.id == generator_id).first()
    if db_generator is None:
        raise HTTPException(status_code=404, detail="Diesel generator not found")
    
    db.delete(db_generator)
    db.commit()
    return None


# Electricity Consumption Endpoints
@app.post("/electricity-consumptions/", response_model=ElectricityConsumptionResponse, status_code=status.HTTP_201_CREATED, tags=["Electricity Consumption"])
def create_electricity_consumption(consumption_data: ElectricityConsumptionCreate, db: Session = Depends(get_db)):
    # Check if property exists
    db_property = db.query(Property).filter(Property.id == consumption_data.property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Validate consumption type
    if consumption_data.consumption_type not in ["Block", "STP"]:
        raise HTTPException(status_code=400, detail="Consumption type must be either 'Block' or 'STP'")
    
    # For STP type, phase should be specified
    if consumption_data.consumption_type == "STP" and not consumption_data.phase:
        raise HTTPException(status_code=400, detail="Phase must be specified for STP consumption type")
    
    # Check if electricity consumption with same block_name/phase already exists for this property
    filter_conditions = [
        ElectricityConsumption.property_id == consumption_data.property_id,
        ElectricityConsumption.consumption_type == consumption_data.consumption_type
    ]
    
    if consumption_data.consumption_type == "Block":
        filter_conditions.append(ElectricityConsumption.block_name == consumption_data.block_name)
    else:  # STP
        filter_conditions.append(ElectricityConsumption.phase == consumption_data.phase)
    
    existing_consumption = db.query(ElectricityConsumption).filter(*filter_conditions).first()
    
    if existing_consumption:
        entity_name = consumption_data.block_name if consumption_data.consumption_type == "Block" else consumption_data.phase
        raise HTTPException(
            status_code=400, 
            detail=f"Electricity consumption for {consumption_data.consumption_type} '{entity_name}' already exists for this property"
        )
    
    db_consumption = ElectricityConsumption(**consumption_data.dict())
    db.add(db_consumption)
    db.commit()
    db.refresh(db_consumption)
    return db_consumption


@app.get("/electricity-consumptions/", response_model=List[ElectricityConsumptionResponse], tags=["Electricity Consumption"])
def get_electricity_consumptions(
    property_id: Optional[str] = None,
    consumption_type: Optional[str] = None,
    block_name: Optional[str] = None,
    phase: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(ElectricityConsumption)
    
    if property_id:
        query = query.filter(ElectricityConsumption.property_id == property_id)
    
    if consumption_type:
        query = query.filter(ElectricityConsumption.consumption_type == consumption_type)
    
    if block_name:
        query = query.filter(ElectricityConsumption.block_name == block_name)
    
    if phase:
        query = query.filter(ElectricityConsumption.phase == phase)
    
    consumptions = query.offset(skip).limit(limit).all()
    return consumptions


@app.get("/electricity-consumptions/{consumption_id}", response_model=ElectricityConsumptionResponse, tags=["Electricity Consumption"])
def get_electricity_consumption(consumption_id: str, db: Session = Depends(get_db)):
    db_consumption = db.query(ElectricityConsumption).filter(ElectricityConsumption.id == consumption_id).first()
    if db_consumption is None:
        raise HTTPException(status_code=404, detail="Electricity consumption not found")
    return db_consumption


@app.put("/electricity-consumptions/{consumption_id}", response_model=ElectricityConsumptionResponse, tags=["Electricity Consumption"])
def update_electricity_consumption(consumption_id: str, consumption_data: ElectricityConsumptionUpdate, db: Session = Depends(get_db)):
    db_consumption = db.query(ElectricityConsumption).filter(ElectricityConsumption.id == consumption_id).first()
    if db_consumption is None:
        raise HTTPException(status_code=404, detail="Electricity consumption not found")
    
    update_data = consumption_data.dict(exclude_unset=True)
    
    # Validate consumption type if it's being updated
    if "consumption_type" in update_data and update_data["consumption_type"] is not None:
        if update_data["consumption_type"] not in ["Block", "STP"]:
            raise HTTPException(status_code=400, detail="Consumption type must be either 'Block' or 'STP'")
        
        # For STP type, phase should be specified
        if update_data["consumption_type"] == "STP" and not (db_consumption.phase or ("phase" in update_data and update_data["phase"])):
            raise HTTPException(status_code=400, detail="Phase must be specified for STP consumption type")
    
    # Check for duplicates if block_name, consumption_type, or phase is being updated
    if ("block_name" in update_data or "consumption_type" in update_data or "phase" in update_data):
        new_block_name = update_data.get("block_name", db_consumption.block_name)
        new_consumption_type = update_data.get("consumption_type", db_consumption.consumption_type)
        new_phase = update_data.get("phase", db_consumption.phase)
        
        filter_conditions = [
            ElectricityConsumption.property_id == db_consumption.property_id,
            ElectricityConsumption.consumption_type == new_consumption_type,
            ElectricityConsumption.id != consumption_id
        ]
        
        if new_consumption_type == "Block":
            filter_conditions.append(ElectricityConsumption.block_name == new_block_name)
        else:  # STP
            if new_phase:
                filter_conditions.append(ElectricityConsumption.phase == new_phase)
            else:
                raise HTTPException(status_code=400, detail="Phase must be specified for STP consumption type")
        
        existing_consumption = db.query(ElectricityConsumption).filter(*filter_conditions).first()
        
        if existing_consumption:
            entity_name = new_block_name if new_consumption_type == "Block" else new_phase
            raise HTTPException(
                status_code=400, 
                detail=f"Electricity consumption for {new_consumption_type} '{entity_name}' already exists for this property"
            )
    
    for key, value in update_data.items():
        setattr(db_consumption, key, value)
    
    db_consumption.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_consumption)
    return db_consumption


@app.delete("/electricity-consumptions/{consumption_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Electricity Consumption"])
def delete_electricity_consumption(consumption_id: str, db: Session = Depends(get_db)):
    db_consumption = db.query(ElectricityConsumption).filter(ElectricityConsumption.id == consumption_id).first()
    if db_consumption is None:
        raise HTTPException(status_code=404, detail="Electricity consumption not found")
    
    db.delete(db_consumption)
    db.commit()
    return None


# Diesel Stock Endpoints
@app.post("/diesel-stocks/", response_model=DieselStockResponse, status_code=status.HTTP_201_CREATED, tags=["Diesel Stock"])
def create_diesel_stock(stock_data: DieselStockCreate, db: Session = Depends(get_db)):
    # Check if property exists
    db_property = db.query(Property).filter(Property.id == stock_data.property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check if diesel stock already exists for this property
    existing_stock = db.query(DieselStock).filter(DieselStock.property_id == stock_data.property_id).first()
    if existing_stock:
        raise HTTPException(status_code=400, detail="Diesel stock already exists for this property")
    
    db_stock = DieselStock(**stock_data.dict())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


@app.get("/diesel-stocks/", response_model=List[DieselStockResponse], tags=["Diesel Stock"])
def get_diesel_stocks(
    property_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(DieselStock)
    
    if property_id:
        query = query.filter(DieselStock.property_id == property_id)
    
    stocks = query.offset(skip).limit(limit).all()
    return stocks


@app.get("/diesel-stocks/{stock_id}", response_model=DieselStockResponse, tags=["Diesel Stock"])
def get_diesel_stock(stock_id: str, db: Session = Depends(get_db)):
    db_stock = db.query(DieselStock).filter(DieselStock.id == stock_id).first()
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Diesel stock not found")
    return db_stock

@app.put("/diesel-stocks/{stock_id}", response_model=DieselStockResponse, tags=["Diesel Stock"])
def update_diesel_stock(stock_id: str, stock_data: DieselStockUpdate, db: Session = Depends(get_db)):
    db_stock = db.query(DieselStock).filter(DieselStock.id == stock_id).first()
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Diesel stock not found")
    
    update_data = stock_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_stock, key, value)
    
    db_stock.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_stock)
    return db_stock


@app.delete("/diesel-stocks/{stock_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Diesel Stock"])
def delete_diesel_stock(stock_id: str, db: Session = Depends(get_db)):
    db_stock = db.query(DieselStock).filter(DieselStock.id == stock_id).first()
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Diesel stock not found")
    
    db.delete(db_stock)
    db.commit()
    return None


# Dashboard and Summary Endpoints

@app.get("/properties/{property_id}/dashboard", tags=["Dashboard"])
def get_property_dashboard(property_id: str, db: Session = Depends(get_db)):
    """
    Get a consolidated dashboard view of property data including:
    - Swimming pool status
    - Diesel generators status
    - Electricity consumption summary
    - Diesel stock information
    """
    # Check if property exists
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get swimming pool data
    pool = db.query(SwimmingPool).filter(SwimmingPool.property_id == property_id).first()
    pool_data = None
    if pool:
        pool_data = {
            "id": pool.id,
            "ph_value": pool.ph_value,
            "ph_updated_at": pool.ph_updated_at,
            "chlorine_value": pool.chlorine_value,
            "chlorine_updated_at": pool.chlorine_updated_at
        }
    
    # Get diesel generators data
    generators = db.query(DieselGenerator).filter(DieselGenerator.property_id == property_id).all()
    generators_data = []
    for generator in generators:
        generators_data.append({
            "id": generator.id,
            "name": generator.name,
            "capacity": generator.capacity,
            "running_hours": generator.running_hours,
            "diesel_balance": generator.diesel_balance,
            "diesel_capacity": generator.diesel_capacity,
            "kwh_units": generator.kwh_units,
            "battery_voltage": generator.battery_voltage,
            "voltage_line_to_line": generator.voltage_line_to_line,
            "voltage_line_to_neutral": generator.voltage_line_to_neutral,
            "frequency": generator.frequency,
            "oil_pressure": generator.oil_pressure,
            "rpm": generator.rpm,
            "coolant_temperature": generator.coolant_temperature
        })
    
    # Get electricity consumption data
    block_consumptions = db.query(ElectricityConsumption).filter(
        ElectricityConsumption.property_id == property_id,
        ElectricityConsumption.consumption_type == "Block"
    ).all()
    
    stp_consumptions = db.query(ElectricityConsumption).filter(
        ElectricityConsumption.property_id == property_id,
        ElectricityConsumption.consumption_type == "STP"
    ).all()
    
    block_data = []
    for consumption in block_consumptions:
        block_data.append({
            "id": consumption.id,
            "block_name": consumption.block_name,
            "reference_number": consumption.reference_number,
            "reading": consumption.reading
        })
    
    stp_data = []
    for consumption in stp_consumptions:
        stp_data.append({
            "id": consumption.id,
            "phase": consumption.phase,
            "reference_number": consumption.reference_number,
            "reading": consumption.reading
        })
    
    # Get diesel stock data
    stock = db.query(DieselStock).filter(DieselStock.property_id == property_id).first()
    stock_data = None
    if stock:
        stock_data = {
            "id": stock.id,
            "purchase_amount": stock.purchase_amount,
            "total_stock": stock.total_stock,
            "capacity": stock.capacity
        }
    
    # Compile dashboard data
    dashboard = {
        "property": {
            "id": db_property.id,
            "name": db_property.name,
            "title": db_property.title
        },
        "swimming_pool": pool_data,
        "diesel_generators": generators_data,
        "electricity_consumption": {
            "blocks": block_data,
            "stp": stp_data
        },
        "diesel_stock": stock_data
    }
    
    return dashboard

# --- Health check endpoint ---

def generate_asset_pdf_and_qr(asset_id: str, db: Session):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    property = db.query(Property).filter(Property.id == asset.property_id).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Create PDF
    pdf = FPDF()
    pdf.add_page()
    
    # Set up fonts
    pdf.set_font("Arial", "B", 16)
    
    # Title
    pdf.cell(0, 10, "Asset Details", 0, 1, "C")
    pdf.ln(10)
    
    # Property details
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, f"Property: {property.name}", 0, 1)
    
    # Asset details
    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 10, f"Asset ID: {asset.id}", 0, 1)
    pdf.cell(0, 10, f"Asset Name: {asset.asset_name}", 0, 1)
    pdf.cell(0, 10, f"Category: {asset.asset_category}", 0, 1)
    pdf.cell(0, 10, f"Tag Number: {asset.tag_number}", 0, 1)
    pdf.cell(0, 10, f"Location: {asset.location}", 0, 1)
    pdf.cell(0, 10, f"Vendor: {asset.vendor_name}", 0, 1)
    pdf.cell(0, 10, f"Purchase Date: {asset.purchase_date.strftime('%Y-%m-%d')}", 0, 1)
    pdf.cell(0, 10, f"Cost: ${asset.asset_cost:.2f}", 0, 1)
    
    if asset.warranty_date:
        pdf.cell(0, 10, f"Warranty Until: {asset.warranty_date.strftime('%Y-%m-%d')}", 0, 1)
    
    pdf.cell(0, 10, f"Depreciation: {asset.depreciation_value}%", 0, 1)
    
    if asset.additional_info:
        pdf.ln(5)
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, "Additional Information:", 0, 1)
        pdf.set_font("Arial", "", 12)
        pdf.multi_cell(0, 10, asset.additional_info)
    
    # Save the PDF
    pdf_filename = f"assets/pdf/asset_{asset.id}.pdf"
    pdf.output(pdf_filename)
    
    # Generate QR code
    qr_url = f"{BASE_URL}/assets/pdf/{asset.id}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    qr_filename = f"assets/qr/qr_{asset.id}.png"
    img.save(qr_filename)
    
    # Update asset with QR code URL
    asset.qr_code_url = f"{BASE_URL}/assets/qr/{asset.id}"
    db.commit()
    
    return pdf_filename, qr_filename

# Endpoints for Asset Management

# Get all assets
@app.get("/assets/", response_model=List[AssetResponse], status_code=status.HTTP_200_OK, tags=["Assets"])
def get_all_assets(
    skip: int = 0, 
    limit: int = 100, 
    property_id: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Asset)
    
    if property_id:
        query = query.filter(Asset.property_id == property_id)
    
    if category:
        query = query.filter(Asset.asset_category == category)
    
    assets = query.offset(skip).limit(limit).all()
    return assets

# Get asset by ID
@app.get("/assets/{asset_id}", response_model=AssetResponse, status_code=status.HTTP_200_OK, tags=["Assets"])
def get_asset_by_id(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

# Create new asset
@app.post("/assets/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED, tags=["Assets"])
def create_asset(asset: AssetCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if property exists
    property = db.query(Property).filter(Property.id == asset.property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check if tag number is unique
    existing_tag = db.query(Asset).filter(Asset.tag_number == asset.tag_number).first()
    if existing_tag:
        raise HTTPException(status_code=400, detail="Tag number already exists")
    
    # Create new asset
    db_asset = Asset(
        property_id=asset.property_id,
        asset_category=asset.asset_category,
        asset_name=asset.asset_name,
        tag_number=asset.tag_number,
        additional_info=asset.additional_info,
        location=asset.location,
        vendor_name=asset.vendor_name,
        purchase_date=asset.purchase_date,
        asset_cost=asset.asset_cost,
        warranty_date=asset.warranty_date,
        depreciation_value=asset.depreciation_value,
        qr_code_url=""  # Temporarily empty, will be updated after creating the PDF
    )
    
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    # Generate PDF and QR code in the background
    background_tasks.add_task(generate_asset_pdf_and_qr, db_asset.id, db)
    
    return db_asset

# Update asset
@app.put("/assets/{asset_id}", response_model=AssetResponse, status_code=status.HTTP_200_OK, tags=["Assets"])
def update_asset(
    asset_id: str, 
    asset_update: AssetUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # If tag number is being updated, check if it's unique
    if asset_update.tag_number and asset_update.tag_number != db_asset.tag_number:
        existing_tag = db.query(Asset).filter(Asset.tag_number == asset_update.tag_number).first()
        if existing_tag:
            raise HTTPException(status_code=400, detail="Tag number already exists")
    
    # Update asset fields
    asset_data = asset_update.dict(exclude_unset=True)
    for key, value in asset_data.items():
        setattr(db_asset, key, value)
    
    db_asset.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_asset)
    
    # Regenerate PDF and QR code in the background
    background_tasks.add_task(generate_asset_pdf_and_qr, asset_id, db)
    
    return db_asset

# Delete asset
@app.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Assets"])
def delete_asset(asset_id: str, db: Session = Depends(get_db)):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Delete associated files
    pdf_path = f"assets/pdf/asset_{asset_id}.pdf"
    qr_path = f"assets/qr/qr_{asset_id}.png"
    
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    
    if os.path.exists(qr_path):
        os.remove(qr_path)
    
    # Delete from database
    db.delete(db_asset)
    db.commit()
    
    return None

# Get asset PDF
@app.get("/assets/pdf/{asset_id}", tags=["Assets"])
def get_asset_pdf(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    pdf_path = f"assets/pdf/asset_{asset_id}.pdf"
    if not os.path.exists(pdf_path):
        # Regenerate if missing
        generate_asset_pdf_and_qr(asset_id, db)
    
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"asset_{asset_id}.pdf")

# Get asset QR code
@app.get("/assets/qr/{asset_id}", tags=["Assets"])
def get_asset_qr(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    qr_path = f"assets/qr/qr_{asset_id}.png"
    if not os.path.exists(qr_path):
        # Regenerate if missing
        generate_asset_pdf_and_qr(asset_id, db)
    
    return FileResponse(qr_path, media_type="image/png", filename=f"qr_{asset_id}.png")

def generate_pdf(inventory_id: str, inventory_data: dict):
    """Generate PDF for inventory item and save it"""
    pdf_path = f"assets/pdf/{inventory_id}.pdf"
    
    # Create PDF
    c = canvas.Canvas(pdf_path, pagesize=A4)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, "Asset Information")
    
    c.setFont("Helvetica", 12)
    y_position = 770
    
    # Add inventory data to PDF
    for key, value in inventory_data.items():
        if key not in ["id", "created_at", "updated_at", "qr_code_url", "property_id"]:
            if value is not None:
                if isinstance(value, datetime):
                    value = value.strftime("%Y-%m-%d %H:%M:%S")
                c.drawString(50, y_position, f"{key.replace('_', ' ').title()}: {value}")
                y_position -= 20
    
    c.save()
    return pdf_path

def generate_qr_code(base_url: str, inventory_id: str):
    """Generate QR code for inventory PDF URL"""
    qr_path = f"assets/qr/{inventory_id}.png"
    pdf_url = f"{base_url}/inventory/pdf/{inventory_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(pdf_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(qr_path)
    return qr_path

def process_inventory_item(db: Session, inventory_id: str, base_url: str = "https://server.prktechindia.in"):
    """Process inventory item to generate PDF and QR code"""
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        return None
    
    # Convert to dict for PDF generation
    inventory_data = {
        "id": inventory.id,
        "stock_name": inventory.stock_name,
        "department": inventory.department,
        "stock_id": inventory.stock_id,
        "inventory_subledger": inventory.inventory_subledger,
        "units": inventory.units,
        "units_of_measurement": inventory.units_of_measurement,
        "date_of_purchase": inventory.date_of_purchase,
        "custodian": inventory.custodian,
        "location": inventory.location,
        "opening_balance": inventory.opening_balance,
        "issued": inventory.issued,
        "closing_balance": inventory.closing_balance,
        "description": inventory.description
    }
    
    # Generate PDF
    pdf_path = generate_pdf(inventory.id, inventory_data)
    
    # Generate QR code
    generate_qr_code(base_url, inventory.id)
    
    # Update QR code URL
    qr_code_url = f"{base_url}/inventory/pdf/{inventory.id}"
    inventory.qr_code_url = qr_code_url
    db.commit()
    
    return qr_code_url

# API Endpoints for Inventory Management

# Create a new inventory item
@app.post("/inventory/", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED, tags=["Inventory"])
def create_inventory(
    inventory: InventoryCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    base_url: str = Query("https://server.prktechindia.in", description="Base URL for QR code generation")
):
    # Check if property exists
    property_exists = db.query(Property).filter(Property.id == inventory.property_id).first()
    if not property_exists:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Create inventory item
    db_inventory = Inventory(
        id=str(uuid.uuid4()),
        property_id=inventory.property_id,
        stock_name=inventory.stock_name,
        department=inventory.department,
        stock_id=inventory.stock_id,
        inventory_subledger=inventory.inventory_subledger,
        units=inventory.units,
        units_of_measurement=inventory.units_of_measurement,
        date_of_purchase=inventory.date_of_purchase,
        custodian=inventory.custodian,
        location=inventory.location,
        opening_balance=inventory.opening_balance,
        issued=inventory.issued,
        closing_balance=inventory.closing_balance,
        description=inventory.description
    )
    
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    
    # Process PDF and QR code in background
    background_tasks.add_task(process_inventory_item, db, db_inventory.id, base_url)
    
    return db_inventory

# Get all inventory items
@app.get("/inventory/", response_model=List[InventoryResponse], tags=["Inventory"])
def get_all_inventory(
    skip: int = 0, 
    limit: int = 100,
    property_id: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Inventory)
    
    # Apply filters if provided
    if property_id:
        query = query.filter(Inventory.property_id == property_id)
    if department:
        query = query.filter(Inventory.department == department)
    
    return query.offset(skip).limit(limit).all()

# Get inventory item by ID
@app.get("/inventory/{inventory_id}", response_model=InventoryResponse, tags=["Inventory"])
def get_inventory_by_id(inventory_id: str, db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return inventory

# Update inventory item
@app.put("/inventory/{inventory_id}", response_model=InventoryResponse, tags=["Inventory"])
def update_inventory(
    inventory_id: str,
    inventory_update: InventoryUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    base_url: str = Query("https://server.prktechindia.in", description="Base URL for QR code generation")
):
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Update fields if provided
    update_data = inventory_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_inventory, key, value)
    
    db_inventory.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_inventory)
    
    # Regenerate PDF and QR code in background
    background_tasks.add_task(process_inventory_item, db, db_inventory.id, base_url)
    
    return db_inventory

# Delete inventory item
@app.delete("/inventory/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Inventory"])
def delete_inventory(inventory_id: str, db: Session = Depends(get_db)):
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Delete PDF and QR code files if they exist
    pdf_path = f"assets/pdf/{inventory_id}.pdf"
    qr_path = f"assets/qr/{inventory_id}.png"
    
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    if os.path.exists(qr_path):
        os.remove(qr_path)
    
    db.delete(db_inventory)
    db.commit()
    
    return None

# Get PDF by inventory ID
@app.get("/inventory/pdf/{inventory_id}", tags=["Inventory"])
def get_inventory_pdf(inventory_id: str, db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    pdf_path = f"assets/pdf/{inventory_id}.pdf"
    if not os.path.exists(pdf_path):
        # Regenerate PDF if it doesn't exist
        process_inventory_item(db, inventory_id)
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF not found")
    
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"asset_{inventory.stock_name}.pdf")

# Get QR code image by inventory ID
@app.get("/inventory/qr/{inventory_id}", tags=["Inventory"])
def get_inventory_qr(inventory_id: str, db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    qr_path = f"assets/qr/{inventory_id}.png"
    if not os.path.exists(qr_path):
        # Regenerate QR if it doesn't exist
        base_url = "https://server.prktechindia.in"  # Default base URL
        process_inventory_item(db, inventory_id, base_url)
        if not os.path.exists(qr_path):
            raise HTTPException(status_code=404, detail="QR code not found")
    
    return FileResponse(qr_path, media_type="image/png", filename=f"qr_{inventory.stock_name}.png")

# Regenerate PDF and QR code for an inventory item
@app.post("/inventory/{inventory_id}/regenerate", response_model=InventoryResponse, tags=["Inventory"])
def regenerate_inventory_files(
    inventory_id: str, 
    db: Session = Depends(get_db),
    base_url: str = Query("https://server.prktechindia.in", description="Base URL for QR code generation")
):
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Regenerate PDF and QR code
    process_inventory_item(db, inventory_id, base_url)
    
    db.refresh(inventory)
    return inventory

# Initialize database tables

@app.get("/health", tags=["Health Check"])
def health_check():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "connected": True,
                "error": None
            },
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "connected": False,
                "error": str(e)
            },
            "version": "1.0.0"
        }

# --- Daily Task Checklist CRUD Endpoints ---

@app.post("/daily-task-checklists/", response_model=DailyTaskChecklistResponse, tags=["Daily Task Checklist"])
def create_checklist(item: DailyTaskChecklistCreate, db: Session = Depends(get_db)):
    db_item = DailyTaskChecklist(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/daily-task-checklists/", response_model=List[DailyTaskChecklistResponse], tags=["Daily Task Checklist"])
def get_checklists(property_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(DailyTaskChecklist)
    if property_id:
        query = query.filter(DailyTaskChecklist.property_id == property_id)
    return query.all()

@app.put("/daily-task-checklists/{id}", response_model=DailyTaskChecklistResponse, tags=["Daily Task Checklist"])
def update_checklist(id: str, item: DailyTaskChecklistUpdate, db: Session = Depends(get_db)):
    db_item = db.query(DailyTaskChecklist).filter(DailyTaskChecklist.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Checklist not found")
    for key, value in item.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/daily-task-checklists/{id}", tags=["Daily Task Checklist"])
def delete_checklist(id: str, db: Session = Depends(get_db)):
    db_item = db.query(DailyTaskChecklist).filter(DailyTaskChecklist.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Checklist not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted"}

# ... existing code ...
class DailyTaskChecklistStatus(Base):
    __tablename__ = "daily_task_checklist_status"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    checklist_id = Column(String, ForeignKey("daily_task_checklists.id"))
    period = Column(String)  # e.g., '2024-06-09' for daily, '2024-06' for monthly, '2024-W23' for weekly, '2024-06-09T14' for hourly
    status = Column(String)  # 'Yes', 'No', 'Pending'
    updated_by = Column(String)  # user_id or name
    updated_at = Column(DateTime, default=datetime.utcnow)
    checklist = relationship("DailyTaskChecklist", backref="statuses")

# ... existing code ...
class DailyTaskChecklistStatusBase(BaseModel):
    checklist_id: str
    period: str
    status: Literal['Yes', 'No', 'Pending']
    updated_by: str

class DailyTaskChecklistStatusCreate(DailyTaskChecklistStatusBase):
    pass

class DailyTaskChecklistStatusResponse(DailyTaskChecklistStatusBase):
    id: str
    updated_at: datetime
    class Config:
        from_attributes = True

# ... existing code ...
@app.post("/daily-task-checklist-status/", response_model=DailyTaskChecklistStatusResponse, tags=["Daily Task Checklist Status"])
def create_or_update_status(item: DailyTaskChecklistStatusCreate, db: Session = Depends(get_db)):
    status_obj = db.query(DailyTaskChecklistStatus).filter(
        DailyTaskChecklistStatus.checklist_id == item.checklist_id,
        DailyTaskChecklistStatus.period == item.period
    ).first()
    if status_obj:
        status_obj.status = item.status
        status_obj.updated_by = item.updated_by
        status_obj.updated_at = datetime.utcnow()
    else:
        status_obj = DailyTaskChecklistStatus(**item.dict())
        db.add(status_obj)
    db.commit()
    db.refresh(status_obj)
    return status_obj

@app.get("/daily-task-checklist-status/{checklist_id}", response_model=List[DailyTaskChecklistStatusResponse], tags=["Daily Task Checklist Status"])
def get_statuses(checklist_id: str, db: Session = Depends(get_db)):
    return db.query(DailyTaskChecklistStatus).filter(DailyTaskChecklistStatus.checklist_id == checklist_id).all()

@app.get("/test-status-table", tags=["Test"])
def test_status_table(db: Session = Depends(get_db)):
    """Test endpoint to check if DailyTaskChecklistStatus table exists"""
    try:
        # Try to query the table to see if it exists
        result = db.query(DailyTaskChecklistStatus).limit(1).all()
        return {
            "status": "success",
            "message": "DailyTaskChecklistStatus table exists",
            "count": len(result)
        }
    except Exception as e:
        # If table doesn't exist, create it
        try:
            DailyTaskChecklistStatus.__table__.create(bind=engine, checkfirst=True)
            return {
                "status": "success", 
                "message": "DailyTaskChecklistStatus table created successfully"
            }
        except Exception as create_error:
            return {
                "status": "error",
                "message": f"Failed to create table: {str(create_error)}"
            }

# --- Daily Summary Report Model, Schemas, and Endpoints ---

class DailySummaryReport(Base):
    __tablename__ = "daily_summary_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False)
    date = Column(String, nullable=False)
    site_name = Column(String, nullable=False)
    prepared_by = Column(String, nullable=False)
    shift = Column(String, nullable=False)
    departments = Column(SAJSON().with_variant(SQLiteJSON, 'sqlite'), nullable=False)
    summary = Column(SAJSON().with_variant(SQLiteJSON, 'sqlite'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the table if not exists
DailySummaryReport.__table__.create(bind=engine, checkfirst=True)

from pydantic import BaseModel, Field
from typing import List, Dict, Any

class DepartmentTaskSchema(BaseModel):
    time: str
    description: str
    person_responsible: str
    status: str

class DepartmentSchema(BaseModel):
    name: str
    tasks: List[DepartmentTaskSchema]

class SummarySchema(BaseModel):
    department: str
    tasks_planned: int
    completed: int
    pending: int
    remarks: str

class DailySummaryReportBase(BaseModel):
    property_id: str
    date: str
    site_name: str
    prepared_by: str
    shift: str
    departments: List[DepartmentSchema]
    summary: List[SummarySchema]

class DailySummaryReportCreate(DailySummaryReportBase):
    pass

class DailySummaryReportUpdate(BaseModel):
    property_id: str = None
    date: str = None
    site_name: str = None
    prepared_by: str = None
    shift: str = None
    departments: List[DepartmentSchema] = None
    summary: List[SummarySchema] = None

class DailySummaryReportResponse(DailySummaryReportBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        orm_mode = True

from fastapi import Body

@app.post("/daily-summary/", response_model=DailySummaryReportResponse, tags=["Daily Summary"])
def create_daily_summary(item: DailySummaryReportCreate, db: Session = Depends(get_db)):
    db_item = DailySummaryReport(
        property_id=item.property_id,
        date=item.date,
        site_name=item.site_name,
        prepared_by=item.prepared_by,
        shift=item.shift,
        departments=[d.dict() for d in item.departments],
        summary=[s.dict() for s in item.summary]
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/daily-summary/", response_model=List[DailySummaryReportResponse], tags=["Daily Summary"])
def get_all_daily_summaries(db: Session = Depends(get_db)):
    return db.query(DailySummaryReport).all()

@app.get("/daily-summary/{id}", response_model=DailySummaryReportResponse, tags=["Daily Summary"])
def get_daily_summary(id: str, db: Session = Depends(get_db)):
    db_item = db.query(DailySummaryReport).filter(DailySummaryReport.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Daily summary report not found")
    return db_item

@app.put("/daily-summary/{id}", response_model=DailySummaryReportResponse, tags=["Daily Summary"])
def update_daily_summary(id: str, item: DailySummaryReportUpdate, db: Session = Depends(get_db)):
    db_item = db.query(DailySummaryReport).filter(DailySummaryReport.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Daily summary report not found")
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key in ["departments", "summary"] and value is not None:
            value = [v.dict() for v in value]
        setattr(db_item, key, value)
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/daily-summary/{id}", tags=["Daily Summary"])
def delete_daily_summary(id: str, db: Session = Depends(get_db)):
    db_item = db.query(DailySummaryReport).filter(DailySummaryReport.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Daily summary report not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Daily summary report deleted"}

# --- Additional Daily Summary APIs by property_id ---

@app.get("/daily-summary/property/{property_id}", response_model=List[DailySummaryReportResponse], tags=["Daily Summary"])
def get_daily_summaries_by_property(property_id: str, db: Session = Depends(get_db)):
    return db.query(DailySummaryReport).filter(DailySummaryReport.property_id == property_id).all()

@app.delete("/daily-summary/property/{property_id}", tags=["Daily Summary"])
def delete_daily_summaries_by_property(property_id: str, db: Session = Depends(get_db)):
    items = db.query(DailySummaryReport).filter(DailySummaryReport.property_id == property_id).all()
    count = 0
    for item in items:
        db.delete(item)
        count += 1
    db.commit()
    return {"message": f"Deleted {count} daily summary reports for property {property_id}"}

@app.get("/daily-summary/property/{property_id}/date/{date}", response_model=List[DailySummaryReportResponse], tags=["Daily Summary"])
def get_daily_summaries_by_property_and_date(property_id: str, date: str, db: Session = Depends(get_db)):
    return db.query(DailySummaryReport).filter(DailySummaryReport.property_id == property_id, DailySummaryReport.date == date).all()

# --- Utility Panel Models, Schemas, and Endpoints ---

class UtilityPanelCheckPoint(Base):
    __tablename__ = "utility_panel_checkpoints"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    utility_panel_id = Column(String, ForeignKey("utility_panels.id"), nullable=False)
    sl_no = Column(Integer, nullable=False)
    item = Column(String, nullable=False)
    action_required = Column(String, nullable=False)
    standard = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    daily_status = Column(SAJSON().with_variant(SQLiteJSON, 'sqlite'), nullable=False)  # JSON object for daily status
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UtilityPanel(Base):
    __tablename__ = "utility_panels"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False)
    panel_name = Column(String, nullable=False)
    building_name = Column(String, nullable=False)
    month = Column(String, nullable=False)
    site_name = Column(String, nullable=False)
    prepared_by = Column(String, nullable=False)
    reviewed_date = Column(String, nullable=False)
    document_no = Column(String, nullable=False)
    prepared_date = Column(String, nullable=False)
    implemented_date = Column(String, nullable=False)
    version_no = Column(String, nullable=False)
    reviewed_by = Column(String, nullable=False)
    responsible_spoc = Column(String, nullable=False)
    incharge_signature = Column(String, nullable=True)
    shift_staff_signature = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship with checkpoints
    checkpoints = relationship("UtilityPanelCheckPoint", backref="utility_panel", cascade="all, delete-orphan")

# Create the tables if not exists
UtilityPanel.__table__.create(bind=engine, checkfirst=True)
UtilityPanelCheckPoint.__table__.create(bind=engine, checkfirst=True)

# Pydantic schemas for Utility Panel
class CheckPointSchema(BaseModel):
    sl_no: int
    item: str
    action_required: str
    standard: str
    frequency: str
    daily_status: Dict[str, str]  # Dictionary for daily status (01: "", 02: "", etc.)

class CheckPointCreate(CheckPointSchema):
    pass

class CheckPointUpdate(BaseModel):
    sl_no: Optional[int] = None
    item: Optional[str] = None
    action_required: Optional[str] = None
    standard: Optional[str] = None
    frequency: Optional[str] = None
    daily_status: Optional[Dict[str, str]] = None

class CheckPointResponse(CheckPointSchema):
    id: str
    utility_panel_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UtilityPanelBase(BaseModel):
    property_id: str
    panel_name: str
    building_name: str
    month: str
    site_name: str
    prepared_by: str
    reviewed_date: str
    document_no: str
    prepared_date: str
    implemented_date: str
    version_no: str
    reviewed_by: str
    responsible_spoc: str
    incharge_signature: Optional[str] = None
    shift_staff_signature: Optional[str] = None
    comment: Optional[str] = None

class UtilityPanelCreate(UtilityPanelBase):
    checkpoints: List[CheckPointCreate]

class UtilityPanelUpdate(BaseModel):
    property_id: Optional[str] = None
    panel_name: Optional[str] = None
    building_name: Optional[str] = None
    month: Optional[str] = None
    site_name: Optional[str] = None
    prepared_by: Optional[str] = None
    reviewed_date: Optional[str] = None
    document_no: Optional[str] = None
    prepared_date: Optional[str] = None
    implemented_date: Optional[str] = None
    version_no: Optional[str] = None
    reviewed_by: Optional[str] = None
    responsible_spoc: Optional[str] = None
    incharge_signature: Optional[str] = None
    shift_staff_signature: Optional[str] = None
    comment: Optional[str] = None
    checkpoints: Optional[List[CheckPointCreate]] = None

class UtilityPanelResponse(UtilityPanelBase):
    id: str
    checkpoints: List[CheckPointResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Utility Panel API Endpoints

@app.post("/utility-panels/", response_model=UtilityPanelResponse, status_code=status.HTTP_201_CREATED, tags=["Utility Panel"])
def create_utility_panel(utility_panel: UtilityPanelCreate, db: Session = Depends(get_db)):
    """Create a new utility panel with checkpoints"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == utility_panel.property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Create utility panel
        db_utility_panel = UtilityPanel(
            property_id=utility_panel.property_id,
            panel_name=utility_panel.panel_name,
            building_name=utility_panel.building_name,
            month=utility_panel.month,
            site_name=utility_panel.site_name,
            prepared_by=utility_panel.prepared_by,
            reviewed_date=utility_panel.reviewed_date,
            document_no=utility_panel.document_no,
            prepared_date=utility_panel.prepared_date,
            implemented_date=utility_panel.implemented_date,
            version_no=utility_panel.version_no,
            reviewed_by=utility_panel.reviewed_by,
            responsible_spoc=utility_panel.responsible_spoc,
            incharge_signature=utility_panel.incharge_signature,
            shift_staff_signature=utility_panel.shift_staff_signature,
            comment=utility_panel.comment
        )
        
        db.add(db_utility_panel)
        db.flush()  # Get the ID without committing
        
        # Create checkpoints
        for checkpoint_data in utility_panel.checkpoints:
            db_checkpoint = UtilityPanelCheckPoint(
                utility_panel_id=db_utility_panel.id,
                sl_no=checkpoint_data.sl_no,
                item=checkpoint_data.item,
                action_required=checkpoint_data.action_required,
                standard=checkpoint_data.standard,
                frequency=checkpoint_data.frequency,
                daily_status=checkpoint_data.daily_status
            )
            db.add(db_checkpoint)
        
        db.commit()
        db.refresh(db_utility_panel)
        return db_utility_panel
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating utility panel: {str(e)}")

@app.get("/utility-panels/", response_model=List[UtilityPanelResponse], tags=["Utility Panel"])
def get_all_utility_panels(
    skip: int = 0,
    limit: int = 100,
    property_id: Optional[str] = None,
    month: Optional[str] = None,
    building_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all utility panels with optional filtering"""
    try:
        query = db.query(UtilityPanel)
        
        if property_id:
            query = query.filter(UtilityPanel.property_id == property_id)
        
        if month:
            query = query.filter(UtilityPanel.month == month)
        
        if building_name:
            query = query.filter(UtilityPanel.building_name == building_name)
        
        utility_panels = query.offset(skip).limit(limit).all()
        return utility_panels
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching utility panels: {str(e)}")

@app.get("/utility-panels/{utility_panel_id}", response_model=UtilityPanelResponse, tags=["Utility Panel"])
def get_utility_panel_by_id(utility_panel_id: str, db: Session = Depends(get_db)):
    """Get a specific utility panel by ID"""
    try:
        utility_panel = db.query(UtilityPanel).filter(UtilityPanel.id == utility_panel_id).first()
        if not utility_panel:
            raise HTTPException(status_code=404, detail="Utility panel not found")
        return utility_panel
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching utility panel: {str(e)}")

@app.put("/utility-panels/{utility_panel_id}", response_model=UtilityPanelResponse, tags=["Utility Panel"])
def update_utility_panel(utility_panel_id: str, utility_panel_update: UtilityPanelUpdate, db: Session = Depends(get_db)):
    """Update an existing utility panel"""
    try:
        utility_panel = db.query(UtilityPanel).filter(UtilityPanel.id == utility_panel_id).first()
        if not utility_panel:
            raise HTTPException(status_code=404, detail="Utility panel not found")
        
        # Update utility panel fields
        update_data = utility_panel_update.dict(exclude_unset=True, exclude={"checkpoints"})
        for key, value in update_data.items():
            setattr(utility_panel, key, value)
        
        # Update checkpoints if provided
        if utility_panel_update.checkpoints is not None:
            # Delete existing checkpoints
            db.query(UtilityPanelCheckPoint).filter(
                UtilityPanelCheckPoint.utility_panel_id == utility_panel_id
            ).delete()
            
            # Create new checkpoints
            for checkpoint_data in utility_panel_update.checkpoints:
                db_checkpoint = UtilityPanelCheckPoint(
                    utility_panel_id=utility_panel_id,
                    sl_no=checkpoint_data.sl_no,
                    item=checkpoint_data.item,
                    action_required=checkpoint_data.action_required,
                    standard=checkpoint_data.standard,
                    frequency=checkpoint_data.frequency,
                    daily_status=checkpoint_data.daily_status
                )
                db.add(db_checkpoint)
        
        utility_panel.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(utility_panel)
        return utility_panel
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating utility panel: {str(e)}")

@app.delete("/utility-panels/{utility_panel_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Utility Panel"])
def delete_utility_panel(utility_panel_id: str, db: Session = Depends(get_db)):
    """Delete a utility panel and all its checkpoints"""
    try:
        utility_panel = db.query(UtilityPanel).filter(UtilityPanel.id == utility_panel_id).first()
        if not utility_panel:
            raise HTTPException(status_code=404, detail="Utility panel not found")
        
        db.delete(utility_panel)
        db.commit()
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting utility panel: {str(e)}")

# Property-specific utility panel endpoints

@app.get("/utility-panels/property/{property_id}", response_model=List[UtilityPanelResponse], tags=["Utility Panel"])
def get_utility_panels_by_property(
    property_id: str,
    skip: int = 0,
    limit: int = 100,
    month: Optional[str] = None,
    building_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all utility panels for a specific property"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        query = db.query(UtilityPanel).filter(UtilityPanel.property_id == property_id)
        
        if month:
            query = query.filter(UtilityPanel.month == month)
        
        if building_name:
            query = query.filter(UtilityPanel.building_name == building_name)
        
        utility_panels = query.offset(skip).limit(limit).all()
        return utility_panels
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching utility panels for property: {str(e)}")

@app.delete("/utility-panels/property/{property_id}", tags=["Utility Panel"])
def delete_utility_panels_by_property(property_id: str, db: Session = Depends(get_db)):
    """Delete all utility panels for a specific property"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        utility_panels = db.query(UtilityPanel).filter(UtilityPanel.property_id == property_id).all()
        count = len(utility_panels)
        
        for utility_panel in utility_panels:
            db.delete(utility_panel)
        
        db.commit()
        return {"message": f"Deleted {count} utility panels for property {property_id}"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting utility panels for property: {str(e)}")

# Checkpoint-specific endpoints

@app.post("/utility-panels/{utility_panel_id}/checkpoints/", response_model=CheckPointResponse, status_code=status.HTTP_201_CREATED, tags=["Utility Panel Checkpoints"])
def create_checkpoint(utility_panel_id: str, checkpoint: CheckPointCreate, db: Session = Depends(get_db)):
    """Add a new checkpoint to an existing utility panel"""
    try:
        # Check if utility panel exists
        utility_panel = db.query(UtilityPanel).filter(UtilityPanel.id == utility_panel_id).first()
        if not utility_panel:
            raise HTTPException(status_code=404, detail="Utility panel not found")
        
        db_checkpoint = UtilityPanelCheckPoint(
            utility_panel_id=utility_panel_id,
            sl_no=checkpoint.sl_no,
            item=checkpoint.item,
            action_required=checkpoint.action_required,
            standard=checkpoint.standard,
            frequency=checkpoint.frequency,
            daily_status=checkpoint.daily_status
        )
        
        db.add(db_checkpoint)
        db.commit()
        db.refresh(db_checkpoint)
        return db_checkpoint
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating checkpoint: {str(e)}")

@app.get("/utility-panels/{utility_panel_id}/checkpoints/", response_model=List[CheckPointResponse], tags=["Utility Panel Checkpoints"])
def get_checkpoints(utility_panel_id: str, db: Session = Depends(get_db)):
    """Get all checkpoints for a specific utility panel"""
    try:
        # Check if utility panel exists
        utility_panel = db.query(UtilityPanel).filter(UtilityPanel.id == utility_panel_id).first()
        if not utility_panel:
            raise HTTPException(status_code=404, detail="Utility panel not found")
        
        checkpoints = db.query(UtilityPanelCheckPoint).filter(
            UtilityPanelCheckPoint.utility_panel_id == utility_panel_id
        ).all()
        return checkpoints
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching checkpoints: {str(e)}")

@app.get("/utility-panels/{utility_panel_id}/checkpoints/{checkpoint_id}", response_model=CheckPointResponse, tags=["Utility Panel Checkpoints"])
def get_checkpoint_by_id(utility_panel_id: str, checkpoint_id: str, db: Session = Depends(get_db)):
    """Get a specific checkpoint by ID"""
    try:
        checkpoint = db.query(UtilityPanelCheckPoint).filter(
            UtilityPanelCheckPoint.id == checkpoint_id,
            UtilityPanelCheckPoint.utility_panel_id == utility_panel_id
        ).first()
        
        if not checkpoint:
            raise HTTPException(status_code=404, detail="Checkpoint not found")
        
        return checkpoint
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching checkpoint: {str(e)}")

@app.put("/utility-panels/{utility_panel_id}/checkpoints/{checkpoint_id}", response_model=CheckPointResponse, tags=["Utility Panel Checkpoints"])
def update_checkpoint(utility_panel_id: str, checkpoint_id: str, checkpoint_update: CheckPointUpdate, db: Session = Depends(get_db)):
    """Update a specific checkpoint"""
    try:
        checkpoint = db.query(UtilityPanelCheckPoint).filter(
            UtilityPanelCheckPoint.id == checkpoint_id,
            UtilityPanelCheckPoint.utility_panel_id == utility_panel_id
        ).first()
        
        if not checkpoint:
            raise HTTPException(status_code=404, detail="Checkpoint not found")
        
        update_data = checkpoint_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(checkpoint, key, value)
        
        checkpoint.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(checkpoint)
        return checkpoint
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating checkpoint: {str(e)}")

@app.delete("/utility-panels/{utility_panel_id}/checkpoints/{checkpoint_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Utility Panel Checkpoints"])
def delete_checkpoint(utility_panel_id: str, checkpoint_id: str, db: Session = Depends(get_db)):
    """Delete a specific checkpoint"""
    try:
        checkpoint = db.query(UtilityPanelCheckPoint).filter(
            UtilityPanelCheckPoint.id == checkpoint_id,
            UtilityPanelCheckPoint.utility_panel_id == utility_panel_id
        ).first()
        
        if not checkpoint:
            raise HTTPException(status_code=404, detail="Checkpoint not found")
        
        db.delete(checkpoint)
        db.commit()
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting checkpoint: {str(e)}")

# Additional utility endpoints

@app.get("/utility-panels/property/{property_id}/month/{month}", response_model=List[UtilityPanelResponse], tags=["Utility Panel"])
def get_utility_panels_by_property_and_month(property_id: str, month: str, db: Session = Depends(get_db)):
    """Get utility panels for a specific property and month"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        utility_panels = db.query(UtilityPanel).filter(
            UtilityPanel.property_id == property_id,
            UtilityPanel.month == month
        ).all()
        
        return utility_panels
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching utility panels: {str(e)}")

@app.get("/utility-panels/property/{property_id}/building/{building_name}", response_model=List[UtilityPanelResponse], tags=["Utility Panel"])
def get_utility_panels_by_property_and_building(property_id: str, building_name: str, db: Session = Depends(get_db)):
    """Get utility panels for a specific property and building"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        utility_panels = db.query(UtilityPanel).filter(
            UtilityPanel.property_id == property_id,
            UtilityPanel.building_name == building_name
        ).all()
        
        return utility_panels
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching utility panels: {str(e)}")

# ... existing code ...

# --- Work Schedule Models, Schemas, and Endpoints ---

class WorkSchedule(Base):
    __tablename__ = "work_schedules"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False)
    company = Column(String, nullable=False)
    schedule_year = Column(String, nullable=False)
    location = Column(String, nullable=False)
    facility_manager = Column(String, nullable=False)
    afm = Column(String, nullable=False)
    generated_on = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with work schedule items
    work_schedule_items = relationship("WorkScheduleItem", backref="work_schedule", cascade="all, delete-orphan")

class WorkScheduleItem(Base):
    __tablename__ = "work_schedule_items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    work_schedule_id = Column(String, ForeignKey("work_schedules.id"), nullable=False)
    asset_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    location = Column(String, nullable=False)
    schedule_type = Column(String, nullable=False)  # D, W, M, Q, H, Y (Daily, Weekly, Monthly, Quarterly, Half Yearly, Yearly)
    weekwise_status = Column(SAJSON().with_variant(SQLiteJSON, 'sqlite'), nullable=False)  # JSON object for weekwise status
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the tables if not exists
WorkSchedule.__table__.create(bind=engine, checkfirst=True)
WorkScheduleItem.__table__.create(bind=engine, checkfirst=True)

# Pydantic schemas for Work Schedule
class WorkScheduleItemSchema(BaseModel):
    asset_name: str
    category: str
    location: str
    schedule_type: str  # D, W, M, Q, H, Y
    weekwise_status: Dict[str, str]  # Dictionary for weekwise status

class WorkScheduleItemCreate(WorkScheduleItemSchema):
    pass

class WorkScheduleItemUpdate(BaseModel):
    asset_name: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    schedule_type: Optional[str] = None
    weekwise_status: Optional[Dict[str, str]] = None

class WorkScheduleItemResponse(WorkScheduleItemSchema):
    id: str
    work_schedule_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class WorkScheduleBase(BaseModel):
    property_id: str
    company: str
    schedule_year: str
    location: str
    facility_manager: str
    afm: str
    generated_on: str

class WorkScheduleCreate(WorkScheduleBase):
    work_schedule_items: List[WorkScheduleItemCreate]

class WorkScheduleUpdate(BaseModel):
    property_id: Optional[str] = None
    company: Optional[str] = None
    schedule_year: Optional[str] = None
    location: Optional[str] = None
    facility_manager: Optional[str] = None
    afm: Optional[str] = None
    generated_on: Optional[str] = None
    work_schedule_items: Optional[List[WorkScheduleItemCreate]] = None

class WorkScheduleResponse(WorkScheduleBase):
    id: str
    work_schedule_items: List[WorkScheduleItemResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Work Schedule API Endpoints

@app.post("/work-schedules/", response_model=WorkScheduleResponse, status_code=status.HTTP_201_CREATED, tags=["Work Schedule"])
def create_work_schedule(work_schedule: WorkScheduleCreate, db: Session = Depends(get_db)):
    """Create a new work schedule with items"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == work_schedule.property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Create work schedule
        db_work_schedule = WorkSchedule(
            property_id=work_schedule.property_id,
            company=work_schedule.company,
            schedule_year=work_schedule.schedule_year,
            location=work_schedule.location,
            facility_manager=work_schedule.facility_manager,
            afm=work_schedule.afm,
            generated_on=work_schedule.generated_on
        )
        
        db.add(db_work_schedule)
        db.flush()  # Get the ID without committing
        
        # Create work schedule items
        for item_data in work_schedule.work_schedule_items:
            db_item = WorkScheduleItem(
                work_schedule_id=db_work_schedule.id,
                asset_name=item_data.asset_name,
                category=item_data.category,
                location=item_data.location,
                schedule_type=item_data.schedule_type,
                weekwise_status=item_data.weekwise_status
            )
            db.add(db_item)
        
        db.commit()
        db.refresh(db_work_schedule)
        return db_work_schedule
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating work schedule: {str(e)}")

@app.get("/work-schedules/", response_model=List[WorkScheduleResponse], tags=["Work Schedule"])
def get_all_work_schedules(
    skip: int = 0,
    limit: int = 100,
    property_id: Optional[str] = None,
    schedule_year: Optional[str] = None,
    category: Optional[str] = None,
    schedule_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all work schedules with optional filtering"""
    try:
        query = db.query(WorkSchedule)
        
        if property_id:
            query = query.filter(WorkSchedule.property_id == property_id)
        
        if schedule_year:
            query = query.filter(WorkSchedule.schedule_year == schedule_year)
        
        work_schedules = query.offset(skip).limit(limit).all()
        
        # Apply additional filters for items if needed
        if category or schedule_type:
            filtered_schedules = []
            for schedule in work_schedules:
                filtered_items = schedule.work_schedule_items
                if category:
                    filtered_items = [item for item in filtered_items if item.category == category]
                if schedule_type:
                    filtered_items = [item for item in filtered_items if item.schedule_type == schedule_type]
                
                if filtered_items:  # Only include schedules that have matching items
                    schedule.work_schedule_items = filtered_items
                    filtered_schedules.append(schedule)
            return filtered_schedules
        
        return work_schedules
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching work schedules: {str(e)}")

@app.get("/work-schedules/{work_schedule_id}", response_model=WorkScheduleResponse, tags=["Work Schedule"])
def get_work_schedule_by_id(work_schedule_id: str, db: Session = Depends(get_db)):
    """Get a specific work schedule by ID"""
    try:
        work_schedule = db.query(WorkSchedule).filter(WorkSchedule.id == work_schedule_id).first()
        if not work_schedule:
            raise HTTPException(status_code=404, detail="Work schedule not found")
        return work_schedule
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching work schedule: {str(e)}")

@app.put("/work-schedules/{work_schedule_id}", response_model=WorkScheduleResponse, tags=["Work Schedule"])
def update_work_schedule(work_schedule_id: str, work_schedule_update: WorkScheduleUpdate, db: Session = Depends(get_db)):
    """Update an existing work schedule"""
    try:
        work_schedule = db.query(WorkSchedule).filter(WorkSchedule.id == work_schedule_id).first()
        if not work_schedule:
            raise HTTPException(status_code=404, detail="Work schedule not found")
        
        # Update work schedule fields
        update_data = work_schedule_update.dict(exclude_unset=True, exclude={"work_schedule_items"})
        for key, value in update_data.items():
            setattr(work_schedule, key, value)
        
        # Update work schedule items if provided
        if work_schedule_update.work_schedule_items is not None:
            # Delete existing items
            db.query(WorkScheduleItem).filter(
                WorkScheduleItem.work_schedule_id == work_schedule_id
            ).delete()
            
            # Create new items
            for item_data in work_schedule_update.work_schedule_items:
                db_item = WorkScheduleItem(
                    work_schedule_id=work_schedule_id,
                    asset_name=item_data.asset_name,
                    category=item_data.category,
                    location=item_data.location,
                    schedule_type=item_data.schedule_type,
                    weekwise_status=item_data.weekwise_status
                )
                db.add(db_item)
        
        work_schedule.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(work_schedule)
        return work_schedule
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating work schedule: {str(e)}")

@app.delete("/work-schedules/{work_schedule_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Work Schedule"])
def delete_work_schedule(work_schedule_id: str, db: Session = Depends(get_db)):
    """Delete a work schedule and all its items"""
    try:
        work_schedule = db.query(WorkSchedule).filter(WorkSchedule.id == work_schedule_id).first()
        if not work_schedule:
            raise HTTPException(status_code=404, detail="Work schedule not found")
        
        db.delete(work_schedule)
        db.commit()
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting work schedule: {str(e)}")

# Property-specific work schedule endpoints

@app.get("/work-schedules/property/{property_id}", response_model=List[WorkScheduleResponse], tags=["Work Schedule"])
def get_work_schedules_by_property(
    property_id: str,
    skip: int = 0,
    limit: int = 100,
    schedule_year: Optional[str] = None,
    category: Optional[str] = None,
    schedule_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all work schedules for a specific property"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        query = db.query(WorkSchedule).filter(WorkSchedule.property_id == property_id)
        
        if schedule_year:
            query = query.filter(WorkSchedule.schedule_year == schedule_year)
        
        work_schedules = query.offset(skip).limit(limit).all()
        
        # Apply additional filters for items if needed
        if category or schedule_type:
            filtered_schedules = []
            for schedule in work_schedules:
                filtered_items = schedule.work_schedule_items
                if category:
                    filtered_items = [item for item in filtered_items if item.category == category]
                if schedule_type:
                    filtered_items = [item for item in filtered_items if item.schedule_type == schedule_type]
                
                if filtered_items:  # Only include schedules that have matching items
                    schedule.work_schedule_items = filtered_items
                    filtered_schedules.append(schedule)
            return filtered_schedules
        
        return work_schedules
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching work schedules for property: {str(e)}")

@app.delete("/work-schedules/property/{property_id}", tags=["Work Schedule"])
def delete_work_schedules_by_property(property_id: str, db: Session = Depends(get_db)):
    """Delete all work schedules for a specific property"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        work_schedules = db.query(WorkSchedule).filter(WorkSchedule.property_id == property_id).all()
        count = len(work_schedules)
        
        for work_schedule in work_schedules:
            db.delete(work_schedule)
        
        db.commit()
        return {"message": f"Deleted {count} work schedules for property {property_id}"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting work schedules for property: {str(e)}")

# Work Schedule Item-specific endpoints

@app.post("/work-schedules/{work_schedule_id}/items/", response_model=WorkScheduleItemResponse, status_code=status.HTTP_201_CREATED, tags=["Work Schedule Items"])
def create_work_schedule_item(work_schedule_id: str, item: WorkScheduleItemCreate, db: Session = Depends(get_db)):
    """Add a new item to an existing work schedule"""
    try:
        # Check if work schedule exists
        work_schedule = db.query(WorkSchedule).filter(WorkSchedule.id == work_schedule_id).first()
        if not work_schedule:
            raise HTTPException(status_code=404, detail="Work schedule not found")
        
        db_item = WorkScheduleItem(
            work_schedule_id=work_schedule_id,
            asset_name=item.asset_name,
            category=item.category,
            location=item.location,
            schedule_type=item.schedule_type,
            weekwise_status=item.weekwise_status
        )
        
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating work schedule item: {str(e)}")

@app.get("/work-schedules/{work_schedule_id}/items/", response_model=List[WorkScheduleItemResponse], tags=["Work Schedule Items"])
def get_work_schedule_items(
    work_schedule_id: str,
    category: Optional[str] = None,
    schedule_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all items for a specific work schedule"""
    try:
        # Check if work schedule exists
        work_schedule = db.query(WorkSchedule).filter(WorkSchedule.id == work_schedule_id).first()
        if not work_schedule:
            raise HTTPException(status_code=404, detail="Work schedule not found")
        
        query = db.query(WorkScheduleItem).filter(WorkScheduleItem.work_schedule_id == work_schedule_id)
        
        if category:
            query = query.filter(WorkScheduleItem.category == category)
        
        if schedule_type:
            query = query.filter(WorkScheduleItem.schedule_type == schedule_type)
        
        items = query.all()
        return items
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching work schedule items: {str(e)}")

@app.get("/work-schedules/{work_schedule_id}/items/{item_id}", response_model=WorkScheduleItemResponse, tags=["Work Schedule Items"])
def get_work_schedule_item_by_id(work_schedule_id: str, item_id: str, db: Session = Depends(get_db)):
    """Get a specific work schedule item by ID"""
    try:
        item = db.query(WorkScheduleItem).filter(
            WorkScheduleItem.id == item_id,
            WorkScheduleItem.work_schedule_id == work_schedule_id
        ).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Work schedule item not found")
        
        return item
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching work schedule item: {str(e)}")

@app.put("/work-schedules/{work_schedule_id}/items/{item_id}", response_model=WorkScheduleItemResponse, tags=["Work Schedule Items"])
def update_work_schedule_item(work_schedule_id: str, item_id: str, item_update: WorkScheduleItemUpdate, db: Session = Depends(get_db)):
    """Update a specific work schedule item"""
    try:
        item = db.query(WorkScheduleItem).filter(
            WorkScheduleItem.id == item_id,
            WorkScheduleItem.work_schedule_id == work_schedule_id
        ).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Work schedule item not found")
        
        update_data = item_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        
        item.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(item)
        return item
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating work schedule item: {str(e)}")

@app.delete("/work-schedules/{work_schedule_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Work Schedule Items"])
def delete_work_schedule_item(work_schedule_id: str, item_id: str, db: Session = Depends(get_db)):
    """Delete a specific work schedule item"""
    try:
        item = db.query(WorkScheduleItem).filter(
            WorkScheduleItem.id == item_id,
            WorkScheduleItem.work_schedule_id == work_schedule_id
        ).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Work schedule item not found")
        
        db.delete(item)
        db.commit()
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting work schedule item: {str(e)}")

# Additional work schedule endpoints

@app.get("/work-schedules/property/{property_id}/year/{schedule_year}", response_model=List[WorkScheduleResponse], tags=["Work Schedule"])
def get_work_schedules_by_property_and_year(property_id: str, schedule_year: str, db: Session = Depends(get_db)):
    """Get work schedules for a specific property and year"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        work_schedules = db.query(WorkSchedule).filter(
            WorkSchedule.property_id == property_id,
            WorkSchedule.schedule_year == schedule_year
        ).all()
        
        return work_schedules
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching work schedules: {str(e)}")

@app.get("/work-schedules/property/{property_id}/category/{category}", response_model=List[WorkScheduleResponse], tags=["Work Schedule"])
def get_work_schedules_by_property_and_category(property_id: str, category: str, db: Session = Depends(get_db)):
    """Get work schedules for a specific property and category"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        work_schedules = db.query(WorkSchedule).filter(WorkSchedule.property_id == property_id).all()
        
        # Filter by category
        filtered_schedules = []
        for schedule in work_schedules:
            filtered_items = [item for item in schedule.work_schedule_items if item.category == category]
            if filtered_items:
                schedule.work_schedule_items = filtered_items
                filtered_schedules.append(schedule)
        
        return filtered_schedules
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching work schedules: {str(e)}")

@app.get("/work-schedules/property/{property_id}/schedule-type/{schedule_type}", response_model=List[WorkScheduleResponse], tags=["Work Schedule"])
def get_work_schedules_by_property_and_schedule_type(property_id: str, schedule_type: str, db: Session = Depends(get_db)):
    """Get work schedules for a specific property and schedule type"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        work_schedules = db.query(WorkSchedule).filter(WorkSchedule.property_id == property_id).all()
        
        # Filter by schedule type
        filtered_schedules = []
        for schedule in work_schedules:
            filtered_items = [item for item in schedule.work_schedule_items if item.schedule_type == schedule_type]
            if filtered_items:
                schedule.work_schedule_items = filtered_items
                filtered_schedules.append(schedule)
        
        return filtered_schedules
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching work schedules: {str(e)}")

# Bulk operations for work schedule items

@app.post("/work-schedules/{work_schedule_id}/items/bulk", response_model=List[WorkScheduleItemResponse], status_code=status.HTTP_201_CREATED, tags=["Work Schedule Items"])
def create_bulk_work_schedule_items(work_schedule_id: str, items: List[WorkScheduleItemCreate], db: Session = Depends(get_db)):
    """Add multiple items to an existing work schedule"""
    try:
        # Check if work schedule exists
        work_schedule = db.query(WorkSchedule).filter(WorkSchedule.id == work_schedule_id).first()
        if not work_schedule:
            raise HTTPException(status_code=404, detail="Work schedule not found")
        
        created_items = []
        for item_data in items:
            db_item = WorkScheduleItem(
                work_schedule_id=work_schedule_id,
                asset_name=item_data.asset_name,
                category=item_data.category,
                location=item_data.location,
                schedule_type=item_data.schedule_type,
                weekwise_status=item_data.weekwise_status
            )
            db.add(db_item)
            created_items.append(db_item)
        
        db.commit()
        
        # Refresh all created items
        for item in created_items:
            db.refresh(item)
        
        return created_items
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating bulk work schedule items: {str(e)}")

# ... existing code ...

# --- Incident Report Models, Schemas, and Endpoints ---

class IncidentReport(Base):
    __tablename__ = "incident_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False)
    prepared_by = Column(String, nullable=False)
    organization = Column(String, nullable=False)
    date_of_report = Column(String, nullable=False)
    incident_id = Column(String, nullable=False, unique=True)
    incident_description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    site_details = relationship("IncidentSiteDetails", backref="incident_report", uselist=False, cascade="all, delete-orphan")
    personnel_involved = relationship("IncidentPersonnel", backref="incident_report", cascade="all, delete-orphan")
    evidence_attachments = relationship("IncidentEvidence", backref="incident_report", uselist=False, cascade="all, delete-orphan")
    root_cause_analysis = relationship("IncidentRootCause", backref="incident_report", cascade="all, delete-orphan")
    immediate_actions = relationship("IncidentImmediateAction", backref="incident_report", cascade="all, delete-orphan")
    corrective_actions = relationship("IncidentCorrectiveAction", backref="incident_report", cascade="all, delete-orphan")
    incident_classification = relationship("IncidentClassification", backref="incident_report", uselist=False, cascade="all, delete-orphan")
    client_communication = relationship("IncidentClientCommunication", backref="incident_report", uselist=False, cascade="all, delete-orphan")
    approvals_signatures = relationship("IncidentApproval", backref="incident_report", cascade="all, delete-orphan")

class IncidentSiteDetails(Base):
    __tablename__ = "incident_site_details"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    site_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    date_time_of_incident = Column(String, nullable=False)
    reported_by = Column(String, nullable=False)
    reported_to = Column(String, nullable=False)
    department_involved = Column(String, nullable=False)
    incident_type = Column(String, nullable=False)

class IncidentPersonnel(Base):
    __tablename__ = "incident_personnel"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    department = Column(String, nullable=False)
    role_in_incident = Column(String, nullable=False)

class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    cctv_footage = Column(String, nullable=True)
    visitor_entry_logs = Column(String, nullable=True)
    photographs = Column(String, nullable=True)
    site_map = Column(String, nullable=True)

class IncidentRootCause(Base):
    __tablename__ = "incident_root_causes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    cause_description = Column(Text, nullable=False)

class IncidentImmediateAction(Base):
    __tablename__ = "incident_immediate_actions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    action = Column(Text, nullable=False)
    by_whom = Column(String, nullable=False)
    time = Column(String, nullable=False)

class IncidentCorrectiveAction(Base):
    __tablename__ = "incident_corrective_actions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    action = Column(Text, nullable=False)
    responsible = Column(String, nullable=False)
    deadline = Column(String, nullable=False)
    status = Column(String, nullable=False)  # In progress, Completed, Scheduled, Pending

class IncidentClassification(Base):
    __tablename__ = "incident_classifications"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    risk_level = Column(String, nullable=False)  # Low, Medium, High, Critical
    report_severity = Column(String, nullable=False)  # Minor, Major, Critical

class IncidentClientCommunication(Base):
    __tablename__ = "incident_client_communications"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    client_contacted = Column(String, nullable=False)
    mode = Column(String, nullable=False)  # Phone, Email, In Person
    date_time = Column(String, nullable=False)
    response_summary = Column(Text, nullable=False)

class IncidentApproval(Base):
    __tablename__ = "incident_approvals"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_report_id = Column(String, ForeignKey("incident_reports.id"), nullable=False)
    approval_type = Column(String, nullable=False)  # prepared_by, reviewed_by_ops, client_acknowledgment
    name = Column(String, nullable=False)
    signature = Column(String, nullable=True)
    date = Column(String, nullable=False)

# Create the tables if not exists
IncidentReport.__table__.create(bind=engine, checkfirst=True)
IncidentSiteDetails.__table__.create(bind=engine, checkfirst=True)
IncidentPersonnel.__table__.create(bind=engine, checkfirst=True)
IncidentEvidence.__table__.create(bind=engine, checkfirst=True)
IncidentRootCause.__table__.create(bind=engine, checkfirst=True)
IncidentImmediateAction.__table__.create(bind=engine, checkfirst=True)
IncidentCorrectiveAction.__table__.create(bind=engine, checkfirst=True)
IncidentClassification.__table__.create(bind=engine, checkfirst=True)
IncidentClientCommunication.__table__.create(bind=engine, checkfirst=True)
IncidentApproval.__table__.create(bind=engine, checkfirst=True)

# Pydantic schemas for Incident Report
class SiteDetailsSchema(BaseModel):
    site_name: str
    location: str
    date_time_of_incident: str
    reported_by: str
    reported_to: str
    department_involved: str
    incident_type: str

class PersonnelSchema(BaseModel):
    name: str
    designation: str
    department: str
    role_in_incident: str

class EvidenceSchema(BaseModel):
    cctv_footage: Optional[str] = None
    visitor_entry_logs: Optional[str] = None
    photographs: Optional[str] = None
    site_map: Optional[str] = None

class RootCauseSchema(BaseModel):
    cause_description: str

class ImmediateActionSchema(BaseModel):
    action: str
    by_whom: str
    time: str

class CorrectiveActionSchema(BaseModel):
    action: str
    responsible: str
    deadline: str
    status: str

class ClassificationSchema(BaseModel):
    risk_level: str
    report_severity: str

class ClientCommunicationSchema(BaseModel):
    client_contacted: str
    mode: str
    date_time: str
    response_summary: str

class ApprovalSchema(BaseModel):
    approval_type: str  # prepared_by, reviewed_by_ops, client_acknowledgment
    name: str
    signature: Optional[str] = None
    date: str

# Create schemas
class IncidentReportCreate(BaseModel):
    property_id: str
    prepared_by: str
    organization: str
    date_of_report: str
    incident_id: str
    incident_description: str
    site_details: SiteDetailsSchema
    personnel_involved: List[PersonnelSchema]
    evidence_attachments: EvidenceSchema
    root_cause_analysis: List[RootCauseSchema]
    immediate_actions: List[ImmediateActionSchema]
    corrective_preventive_actions: List[CorrectiveActionSchema]
    incident_classification: ClassificationSchema
    client_communication: ClientCommunicationSchema
    approvals_signatures: List[ApprovalSchema]

class IncidentReportUpdate(BaseModel):
    prepared_by: Optional[str] = None
    organization: Optional[str] = None
    date_of_report: Optional[str] = None
    incident_description: Optional[str] = None
    site_details: Optional[SiteDetailsSchema] = None
    personnel_involved: Optional[List[PersonnelSchema]] = None
    evidence_attachments: Optional[EvidenceSchema] = None
    root_cause_analysis: Optional[List[RootCauseSchema]] = None
    immediate_actions: Optional[List[ImmediateActionSchema]] = None
    corrective_preventive_actions: Optional[List[CorrectiveActionSchema]] = None
    incident_classification: Optional[ClassificationSchema] = None
    client_communication: Optional[ClientCommunicationSchema] = None
    approvals_signatures: Optional[List[ApprovalSchema]] = None

# Response schemas
class SiteDetailsResponse(SiteDetailsSchema):
    id: str
    incident_report_id: str

class PersonnelResponse(PersonnelSchema):
    id: str
    incident_report_id: str

class EvidenceResponse(EvidenceSchema):
    id: str
    incident_report_id: str

class RootCauseResponse(RootCauseSchema):
    id: str
    incident_report_id: str

class ImmediateActionResponse(ImmediateActionSchema):
    id: str
    incident_report_id: str

class CorrectiveActionResponse(CorrectiveActionSchema):
    id: str
    incident_report_id: str

class ClassificationResponse(ClassificationSchema):
    id: str
    incident_report_id: str

class ClientCommunicationResponse(ClientCommunicationSchema):
    id: str
    incident_report_id: str

class ApprovalResponse(ApprovalSchema):
    id: str
    incident_report_id: str

class IncidentReportResponse(BaseModel):
    id: str
    property_id: str
    prepared_by: str
    organization: str
    date_of_report: str
    incident_id: str
    incident_description: str
    site_details: Optional[SiteDetailsResponse] = None
    personnel_involved: List[PersonnelResponse] = []
    evidence_attachments: Optional[EvidenceResponse] = None
    root_cause_analysis: List[RootCauseResponse] = []
    immediate_actions: List[ImmediateActionResponse] = []
    corrective_preventive_actions: List[CorrectiveActionResponse] = []
    incident_classification: Optional[ClassificationResponse] = None
    client_communication: Optional[ClientCommunicationResponse] = None
    approvals_signatures: List[ApprovalResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Incident Report API Endpoints

@app.post("/incident-reports/", response_model=IncidentReportResponse, status_code=status.HTTP_201_CREATED, tags=["Incident Report"])
def create_incident_report(incident_report: IncidentReportCreate, db: Session = Depends(get_db)):
    """Create a new incident report with all related data"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == incident_report.property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check if incident_id already exists
        existing_incident = db.query(IncidentReport).filter(IncidentReport.incident_id == incident_report.incident_id).first()
        if existing_incident:
            raise HTTPException(status_code=400, detail="Incident ID already exists")
        
        # Create incident report
        db_incident_report = IncidentReport(
            property_id=incident_report.property_id,
            prepared_by=incident_report.prepared_by,
            organization=incident_report.organization,
            date_of_report=incident_report.date_of_report,
            incident_id=incident_report.incident_id,
            incident_description=incident_report.incident_description
        )
        
        db.add(db_incident_report)
        db.flush()  # Get the ID without committing
        
        # Create site details
        db_site_details = IncidentSiteDetails(
            incident_report_id=db_incident_report.id,
            site_name=incident_report.site_details.site_name,
            location=incident_report.site_details.location,
            date_time_of_incident=incident_report.site_details.date_time_of_incident,
            reported_by=incident_report.site_details.reported_by,
            reported_to=incident_report.site_details.reported_to,
            department_involved=incident_report.site_details.department_involved,
            incident_type=incident_report.site_details.incident_type
        )
        db.add(db_site_details)
        
        # Create personnel involved
        for personnel_data in incident_report.personnel_involved:
            db_personnel = IncidentPersonnel(
                incident_report_id=db_incident_report.id,
                name=personnel_data.name,
                designation=personnel_data.designation,
                department=personnel_data.department,
                role_in_incident=personnel_data.role_in_incident
            )
            db.add(db_personnel)
        
        # Create evidence attachments
        db_evidence = IncidentEvidence(
            incident_report_id=db_incident_report.id,
            cctv_footage=incident_report.evidence_attachments.cctv_footage,
            visitor_entry_logs=incident_report.evidence_attachments.visitor_entry_logs,
            photographs=incident_report.evidence_attachments.photographs,
            site_map=incident_report.evidence_attachments.site_map
        )
        db.add(db_evidence)
        
        # Create root cause analysis
        for root_cause_data in incident_report.root_cause_analysis:
            db_root_cause = IncidentRootCause(
                incident_report_id=db_incident_report.id,
                cause_description=root_cause_data.cause_description
            )
            db.add(db_root_cause)
        
        # Create immediate actions
        for action_data in incident_report.immediate_actions:
            db_action = IncidentImmediateAction(
                incident_report_id=db_incident_report.id,
                action=action_data.action,
                by_whom=action_data.by_whom,
                time=action_data.time
            )
            db.add(db_action)
        
        # Create corrective actions
        for corrective_data in incident_report.corrective_preventive_actions:
            db_corrective = IncidentCorrectiveAction(
                incident_report_id=db_incident_report.id,
                action=corrective_data.action,
                responsible=corrective_data.responsible,
                deadline=corrective_data.deadline,
                status=corrective_data.status
            )
            db.add(db_corrective)
        
        # Create incident classification
        db_classification = IncidentClassification(
            incident_report_id=db_incident_report.id,
            risk_level=incident_report.incident_classification.risk_level,
            report_severity=incident_report.incident_classification.report_severity
        )
        db.add(db_classification)
        
        # Create client communication
        db_client_comm = IncidentClientCommunication(
            incident_report_id=db_incident_report.id,
            client_contacted=incident_report.client_communication.client_contacted,
            mode=incident_report.client_communication.mode,
            date_time=incident_report.client_communication.date_time,
            response_summary=incident_report.client_communication.response_summary
        )
        db.add(db_client_comm)
        
        # Create approvals signatures
        for approval_data in incident_report.approvals_signatures:
            db_approval = IncidentApproval(
                incident_report_id=db_incident_report.id,
                approval_type=approval_data.approval_type,
                name=approval_data.name,
                signature=approval_data.signature,
                date=approval_data.date
            )
            db.add(db_approval)
        
        db.commit()
        db.refresh(db_incident_report)
        return db_incident_report
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating incident report: {str(e)}")

@app.get("/incident-reports/", response_model=List[IncidentReportResponse], tags=["Incident Report"])
def get_all_incident_reports(
    skip: int = 0,
    limit: int = 100,
    property_id: Optional[str] = None,
    incident_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all incident reports with optional filtering"""
    try:
        query = db.query(IncidentReport)
        
        if property_id:
            query = query.filter(IncidentReport.property_id == property_id)
        
        if date_from:
            query = query.filter(IncidentReport.date_of_report >= date_from)
        
        if date_to:
            query = query.filter(IncidentReport.date_of_report <= date_to)
        
        incident_reports = query.offset(skip).limit(limit).all()
        
        # Apply additional filters if needed
        if incident_type or risk_level:
            filtered_reports = []
            for report in incident_reports:
                include_report = True
                
                if incident_type and hasattr(report, 'site_details') and report.site_details and report.site_details.incident_type != incident_type:
                    include_report = False
                
                if risk_level and hasattr(report, 'incident_classification') and report.incident_classification and report.incident_classification.risk_level != risk_level:
                    include_report = False
                
                if include_report:
                    filtered_reports.append(report)
            
            return filtered_reports
        
        return incident_reports
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incident reports: {str(e)}")

@app.get("/incident-reports/{incident_report_id}", response_model=IncidentReportResponse, tags=["Incident Report"])
def get_incident_report_by_id(incident_report_id: str, db: Session = Depends(get_db)):
    """Get a specific incident report by ID"""
    try:
        incident_report = db.query(IncidentReport).filter(IncidentReport.id == incident_report_id).first()
        if not incident_report:
            raise HTTPException(status_code=404, detail="Incident report not found")
        
        # Ensure all relationships are loaded
        if incident_report.site_details is None:
            incident_report.site_details = db.query(IncidentSiteDetails).filter(
                IncidentSiteDetails.incident_report_id == incident_report_id
            ).first()
        
        if not incident_report.personnel_involved:
            incident_report.personnel_involved = db.query(IncidentPersonnel).filter(
                IncidentPersonnel.incident_report_id == incident_report_id
            ).all()
        
        if incident_report.evidence_attachments is None:
            incident_report.evidence_attachments = db.query(IncidentEvidence).filter(
                IncidentEvidence.incident_report_id == incident_report_id
            ).first()
        
        if not incident_report.root_cause_analysis:
            incident_report.root_cause_analysis = db.query(IncidentRootCause).filter(
                IncidentRootCause.incident_report_id == incident_report_id
            ).all()
        
        if not incident_report.immediate_actions:
            incident_report.immediate_actions = db.query(IncidentImmediateAction).filter(
                IncidentImmediateAction.incident_report_id == incident_report_id
            ).all()
        
        if not incident_report.corrective_actions:
            incident_report.corrective_actions = db.query(IncidentCorrectiveAction).filter(
                IncidentCorrectiveAction.incident_report_id == incident_report_id
            ).all()
        
        if incident_report.incident_classification is None:
            incident_report.incident_classification = db.query(IncidentClassification).filter(
                IncidentClassification.incident_report_id == incident_report_id
            ).first()
        
        if incident_report.client_communication is None:
            incident_report.client_communication = db.query(IncidentClientCommunication).filter(
                IncidentClientCommunication.incident_report_id == incident_report_id
            ).first()
        
        if not incident_report.approvals_signatures:
            incident_report.approvals_signatures = db.query(IncidentApproval).filter(
                IncidentApproval.incident_report_id == incident_report_id
            ).all()
        
        return incident_report
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incident report: {str(e)}")

@app.get("/incident-reports/incident-id/{incident_id}", response_model=IncidentReportResponse, tags=["Incident Report"])
def get_incident_report_by_incident_id(incident_id: str, db: Session = Depends(get_db)):
    """Get a specific incident report by incident ID"""
    try:
        incident_report = db.query(IncidentReport).filter(IncidentReport.incident_id == incident_id).first()
        if not incident_report:
            raise HTTPException(status_code=404, detail="Incident report not found")
        
        # Ensure all relationships are loaded
        if incident_report.site_details is None:
            incident_report.site_details = db.query(IncidentSiteDetails).filter(
                IncidentSiteDetails.incident_report_id == incident_report.id
            ).first()
        
        if not incident_report.personnel_involved:
            incident_report.personnel_involved = db.query(IncidentPersonnel).filter(
                IncidentPersonnel.incident_report_id == incident_report.id
            ).all()
        
        if incident_report.evidence_attachments is None:
            incident_report.evidence_attachments = db.query(IncidentEvidence).filter(
                IncidentEvidence.incident_report_id == incident_report.id
            ).first()
        
        if not incident_report.root_cause_analysis:
            incident_report.root_cause_analysis = db.query(IncidentRootCause).filter(
                IncidentRootCause.incident_report_id == incident_report.id
            ).all()
        
        if not incident_report.immediate_actions:
            incident_report.immediate_actions = db.query(IncidentImmediateAction).filter(
                IncidentImmediateAction.incident_report_id == incident_report.id
            ).all()
        
        if not incident_report.corrective_actions:
            incident_report.corrective_actions = db.query(IncidentCorrectiveAction).filter(
                IncidentCorrectiveAction.incident_report_id == incident_report.id
            ).all()
        
        if incident_report.incident_classification is None:
            incident_report.incident_classification = db.query(IncidentClassification).filter(
                IncidentClassification.incident_report_id == incident_report.id
            ).first()
        
        if incident_report.client_communication is None:
            incident_report.client_communication = db.query(IncidentClientCommunication).filter(
                IncidentClientCommunication.incident_report_id == incident_report.id
            ).first()
        
        if not incident_report.approvals_signatures:
            incident_report.approvals_signatures = db.query(IncidentApproval).filter(
                IncidentApproval.incident_report_id == incident_report.id
            ).all()
        
        return incident_report
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incident report: {str(e)}")

@app.put("/incident-reports/{incident_report_id}", response_model=IncidentReportResponse, tags=["Incident Report"])
def update_incident_report(incident_report_id: str, incident_report_update: IncidentReportUpdate, db: Session = Depends(get_db)):
    """Update an existing incident report"""
    try:
        incident_report = db.query(IncidentReport).filter(IncidentReport.id == incident_report_id).first()
        if not incident_report:
            raise HTTPException(status_code=404, detail="Incident report not found")
        
        # Update main incident report fields
        update_data = incident_report_update.dict(exclude_unset=True, exclude={
            "site_details", "personnel_involved", "evidence_attachments", "root_cause_analysis",
            "immediate_actions", "corrective_preventive_actions", "incident_classification",
            "client_communication", "approvals_signatures"
        })
        
        for key, value in update_data.items():
            setattr(incident_report, key, value)
        
        # Update related data if provided
        if incident_report_update.site_details:
            # Delete existing site details
            db.query(IncidentSiteDetails).filter(
                IncidentSiteDetails.incident_report_id == incident_report_id
            ).delete()
            
            # Create new site details
            db_site_details = IncidentSiteDetails(
                incident_report_id=incident_report_id,
                **incident_report_update.site_details.dict()
            )
            db.add(db_site_details)
        
        if incident_report_update.personnel_involved is not None:
            # Delete existing personnel
            db.query(IncidentPersonnel).filter(
                IncidentPersonnel.incident_report_id == incident_report_id
            ).delete()
            
            # Create new personnel
            for personnel_data in incident_report_update.personnel_involved:
                db_personnel = IncidentPersonnel(
                    incident_report_id=incident_report_id,
                    **personnel_data.dict()
                )
                db.add(db_personnel)
        
        if incident_report_update.evidence_attachments:
            # Delete existing evidence
            db.query(IncidentEvidence).filter(
                IncidentEvidence.incident_report_id == incident_report_id
            ).delete()
            
            # Create new evidence
            db_evidence = IncidentEvidence(
                incident_report_id=incident_report_id,
                **incident_report_update.evidence_attachments.dict()
            )
            db.add(db_evidence)
        
        if incident_report_update.root_cause_analysis is not None:
            # Delete existing root causes
            db.query(IncidentRootCause).filter(
                IncidentRootCause.incident_report_id == incident_report_id
            ).delete()
            
            # Create new root causes
            for root_cause_data in incident_report_update.root_cause_analysis:
                db_root_cause = IncidentRootCause(
                    incident_report_id=incident_report_id,
                    **root_cause_data.dict()
                )
                db.add(db_root_cause)
        
        if incident_report_update.immediate_actions is not None:
            # Delete existing immediate actions
            db.query(IncidentImmediateAction).filter(
                IncidentImmediateAction.incident_report_id == incident_report_id
            ).delete()
            
            # Create new immediate actions
            for action_data in incident_report_update.immediate_actions:
                db_action = IncidentImmediateAction(
                    incident_report_id=incident_report_id,
                    **action_data.dict()
                )
                db.add(db_action)
        
        if incident_report_update.corrective_preventive_actions is not None:
            # Delete existing corrective actions
            db.query(IncidentCorrectiveAction).filter(
                IncidentCorrectiveAction.incident_report_id == incident_report_id
            ).delete()
            
            # Create new corrective actions
            for corrective_data in incident_report_update.corrective_preventive_actions:
                db_corrective = IncidentCorrectiveAction(
                    incident_report_id=incident_report_id,
                    **corrective_data.dict()
                )
                db.add(db_corrective)
        
        if incident_report_update.incident_classification:
            # Delete existing classification
            db.query(IncidentClassification).filter(
                IncidentClassification.incident_report_id == incident_report_id
            ).delete()
            
            # Create new classification
            db_classification = IncidentClassification(
                incident_report_id=incident_report_id,
                **incident_report_update.incident_classification.dict()
            )
            db.add(db_classification)
        
        if incident_report_update.client_communication:
            # Delete existing client communication
            db.query(IncidentClientCommunication).filter(
                IncidentClientCommunication.incident_report_id == incident_report_id
            ).delete()
            
            # Create new client communication
            db_client_comm = IncidentClientCommunication(
                incident_report_id=incident_report_id,
                **incident_report_update.client_communication.dict()
            )
            db.add(db_client_comm)
        
        if incident_report_update.approvals_signatures is not None:
            # Delete existing approvals
            db.query(IncidentApproval).filter(
                IncidentApproval.incident_report_id == incident_report_id
            ).delete()
            
            # Create new approvals
            for approval_data in incident_report_update.approvals_signatures:
                db_approval = IncidentApproval(
                    incident_report_id=incident_report_id,
                    **approval_data.dict()
                )
                db.add(db_approval)
        
        incident_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(incident_report)
        return incident_report
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating incident report: {str(e)}")

@app.delete("/incident-reports/{incident_report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Incident Report"])
def delete_incident_report(incident_report_id: str, db: Session = Depends(get_db)):
    """Delete an incident report and all its related data"""
    try:
        incident_report = db.query(IncidentReport).filter(IncidentReport.id == incident_report_id).first()
        if not incident_report:
            raise HTTPException(status_code=404, detail="Incident report not found")
        
        db.delete(incident_report)
        db.commit()
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting incident report: {str(e)}")

# Property-specific incident report endpoints

@app.get("/incident-reports/property/{property_id}", response_model=List[IncidentReportResponse], tags=["Incident Report"])
def get_incident_reports_by_property(
    property_id: str,
    skip: int = 0,
    limit: int = 100,
    incident_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all incident reports for a specific property"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        query = db.query(IncidentReport).filter(IncidentReport.property_id == property_id)
        
        if date_from:
            query = query.filter(IncidentReport.date_of_report >= date_from)
        
        if date_to:
            query = query.filter(IncidentReport.date_of_report <= date_to)
        
        incident_reports = query.offset(skip).limit(limit).all()
        
        # Apply additional filters if needed
        if incident_type or risk_level:
            filtered_reports = []
            for report in incident_reports:
                include_report = True
                
                # Load site details if needed
                if incident_type and (report.site_details is None or not hasattr(report, 'site_details')):
                    report.site_details = db.query(IncidentSiteDetails).filter(
                        IncidentSiteDetails.incident_report_id == report.id
                    ).first()
                
                if incident_type and report.site_details and report.site_details.incident_type != incident_type:
                    include_report = False
                
                # Load classification if needed
                if risk_level and (report.incident_classification is None or not hasattr(report, 'incident_classification')):
                    report.incident_classification = db.query(IncidentClassification).filter(
                        IncidentClassification.incident_report_id == report.id
                    ).first()
                
                if risk_level and report.incident_classification and report.incident_classification.risk_level != risk_level:
                    include_report = False
                
                if include_report:
                    filtered_reports.append(report)
            
            return filtered_reports
        
        return incident_reports
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incident reports for property: {str(e)}")

@app.delete("/incident-reports/property/{property_id}", tags=["Incident Report"])
def delete_incident_reports_by_property(property_id: str, db: Session = Depends(get_db)):
    """Delete all incident reports for a specific property"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        incident_reports = db.query(IncidentReport).filter(IncidentReport.property_id == property_id).all()
        count = len(incident_reports)
        
        for incident_report in incident_reports:
            db.delete(incident_report)
        
        db.commit()
        return {"message": f"Deleted {count} incident reports for property {property_id}"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting incident reports for property: {str(e)}")

# Additional filtering endpoints

@app.get("/incident-reports/property/{property_id}/incident-type/{incident_type}", response_model=List[IncidentReportResponse], tags=["Incident Report"])
def get_incident_reports_by_property_and_type(property_id: str, incident_type: str, db: Session = Depends(get_db)):
    """Get incident reports for a specific property and incident type"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        incident_reports = db.query(IncidentReport).filter(IncidentReport.property_id == property_id).all()
        
        # Filter by incident type
        filtered_reports = []
        for report in incident_reports:
            # Load site details if needed
            if report.site_details is None:
                report.site_details = db.query(IncidentSiteDetails).filter(
                    IncidentSiteDetails.incident_report_id == report.id
                ).first()
            
            if report.site_details and report.site_details.incident_type == incident_type:
                filtered_reports.append(report)
        
        return filtered_reports
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incident reports: {str(e)}")

@app.get("/incident-reports/property/{property_id}/risk-level/{risk_level}", response_model=List[IncidentReportResponse], tags=["Incident Report"])
def get_incident_reports_by_property_and_risk_level(property_id: str, risk_level: str, db: Session = Depends(get_db)):
    """Get incident reports for a specific property and risk level"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        incident_reports = db.query(IncidentReport).filter(IncidentReport.property_id == property_id).all()
        
        # Filter by risk level
        filtered_reports = []
        for report in incident_reports:
            # Load classification if needed
            if report.incident_classification is None:
                report.incident_classification = db.query(IncidentClassification).filter(
                    IncidentClassification.incident_report_id == report.id
                ).first()
            
            if report.incident_classification and report.incident_classification.risk_level == risk_level:
                filtered_reports.append(report)
        
        return filtered_reports
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incident reports: {str(e)}")

@app.get("/incident-reports/property/{property_id}/date-range", response_model=List[IncidentReportResponse], tags=["Incident Report"])
def get_incident_reports_by_property_and_date_range(
    property_id: str,
    date_from: str,
    date_to: str,
    db: Session = Depends(get_db)
):
    """Get incident reports for a specific property within a date range"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        incident_reports = db.query(IncidentReport).filter(
            IncidentReport.property_id == property_id,
            IncidentReport.date_of_report >= date_from,
            IncidentReport.date_of_report <= date_to
        ).all()
        
        return incident_reports
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incident reports: {str(e)}")

# Statistics endpoints

@app.get("/incident-reports/property/{property_id}/statistics", tags=["Incident Report"])
def get_incident_report_statistics(property_id: str, db: Session = Depends(get_db)):
    """Get statistics for incident reports of a specific property"""
    try:
        # Check if property exists
        property_exists = db.query(Property).filter(Property.id == property_id).first()
        if not property_exists:
            raise HTTPException(status_code=404, detail="Property not found")
        
        incident_reports = db.query(IncidentReport).filter(IncidentReport.property_id == property_id).all()
        
        # Calculate statistics
        total_incidents = len(incident_reports)
        
        # Count by incident type
        incident_types = {}
        for report in incident_reports:
            # Load site details if needed
            if report.site_details is None:
                report.site_details = db.query(IncidentSiteDetails).filter(
                    IncidentSiteDetails.incident_report_id == report.id
                ).first()
            
            if report.site_details:
                incident_type = report.site_details.incident_type
                incident_types[incident_type] = incident_types.get(incident_type, 0) + 1
        
        # Count by risk level
        risk_levels = {}
        for report in incident_reports:
            # Load classification if needed
            if report.incident_classification is None:
                report.incident_classification = db.query(IncidentClassification).filter(
                    IncidentClassification.incident_report_id == report.id
                ).first()
            
            if report.incident_classification:
                risk_level = report.incident_classification.risk_level
                risk_levels[risk_level] = risk_levels.get(risk_level, 0) + 1
        
        # Count by severity
        severities = {}
        for report in incident_reports:
            if report.incident_classification:
                severity = report.incident_classification.report_severity
                severities[severity] = severities.get(severity, 0) + 1
        
        # Count by status (corrective actions)
        action_statuses = {}
        for report in incident_reports:
            # Load corrective actions if needed
            if not report.corrective_actions:
                report.corrective_actions = db.query(IncidentCorrectiveAction).filter(
                    IncidentCorrectiveAction.incident_report_id == report.id
                ).all()
            
            for action in report.corrective_actions:
                status = action.status
                action_statuses[status] = action_statuses.get(status, 0) + 1
        
        return {
            "property_id": property_id,
            "total_incidents": total_incidents,
            "incident_types": incident_types,
            "risk_levels": risk_levels,
            "severities": severities,
            "corrective_action_statuses": action_statuses
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching incident report statistics: {str(e)}")


# Security Patrolling Report Models
class SecurityPatrollingReport(Base):
    __tablename__ = "security_patrolling_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    site_info = relationship("SecuritySiteInfo", backref="security_patrolling_report", uselist=False, cascade="all, delete-orphan")
    patrolling_schedule_summary = relationship("SecurityPatrollingScheduleSummary", backref="security_patrolling_report", uselist=False, cascade="all, delete-orphan")
    area_wise_patrolling_logs = relationship("SecurityAreaWisePatrollingLog", backref="security_patrolling_report", cascade="all, delete-orphan")
    key_observations_violations = relationship("SecurityKeyObservationViolation", backref="security_patrolling_report", cascade="all, delete-orphan")
    immediate_actions_taken = relationship("SecurityImmediateAction", backref="security_patrolling_report", cascade="all, delete-orphan")
    supervisor_comments = relationship("SecuritySupervisorComment", backref="security_patrolling_report", uselist=False, cascade="all, delete-orphan")
    photo_evidence = relationship("SecurityPhotoEvidence", backref="security_patrolling_report", cascade="all, delete-orphan")
    sign_off = relationship("SecuritySignOff", backref="security_patrolling_report", uselist=False, cascade="all, delete-orphan")

class SecuritySiteInfo(Base):
    __tablename__ = "security_site_info"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    security_patrolling_report_id = Column(String, ForeignKey("security_patrolling_reports.id"), nullable=False)
    site_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    date = Column(String, nullable=False)
    shift = Column(String, nullable=False)
    prepared_by = Column(String, nullable=False)
    report_id = Column(String, nullable=False)

class SecurityPatrollingScheduleSummary(Base):
    __tablename__ = "security_patrolling_schedule_summaries"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    security_patrolling_report_id = Column(String, ForeignKey("security_patrolling_reports.id"), nullable=False)
    total_rounds_planned = Column(Integer, nullable=False)
    completed = Column(Integer, nullable=False)
    missed = Column(Integer, nullable=False)
    reason_for_missed_rounds = Column(String, nullable=True)

class SecurityAreaWisePatrollingLog(Base):
    __tablename__ = "security_area_wise_patrolling_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    security_patrolling_report_id = Column(String, ForeignKey("security_patrolling_reports.id"), nullable=False)
    time = Column(String, nullable=False)
    location_checkpoint = Column(String, nullable=False)
    observation = Column(Text, nullable=False)
    status = Column(String, nullable=False)
    remarks = Column(String, nullable=True)

class SecurityKeyObservationViolation(Base):
    __tablename__ = "security_key_observations_violations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    security_patrolling_report_id = Column(String, ForeignKey("security_patrolling_reports.id"), nullable=False)
    observation_violation = Column(Text, nullable=False)

class SecurityImmediateAction(Base):
    __tablename__ = "security_immediate_actions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    security_patrolling_report_id = Column(String, ForeignKey("security_patrolling_reports.id"), nullable=False)
    action = Column(Text, nullable=False)
    by_whom = Column(String, nullable=False)
    time = Column(String, nullable=False)

class SecuritySupervisorComment(Base):
    __tablename__ = "security_supervisor_comments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    security_patrolling_report_id = Column(String, ForeignKey("security_patrolling_reports.id"), nullable=False)
    comment = Column(Text, nullable=False)

class SecurityPhotoEvidence(Base):
    __tablename__ = "security_photo_evidence"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    security_patrolling_report_id = Column(String, ForeignKey("security_patrolling_reports.id"), nullable=False)
    photo_description = Column(Text, nullable=False)

class SecuritySignOff(Base):
    __tablename__ = "security_sign_offs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    security_patrolling_report_id = Column(String, ForeignKey("security_patrolling_reports.id"), nullable=False)
    patrolling_guard_signature = Column(String, nullable=True)
    security_supervisor_signature = Column(String, nullable=True)
    client_acknowledgment_signature = Column(String, nullable=True)

# Security Patrolling Report Schemas
class SecuritySiteInfoSchema(BaseModel):
    site_name: str
    location: str
    date: str
    shift: str
    prepared_by: str
    report_id: str

class SecurityPatrollingScheduleSummarySchema(BaseModel):
    total_rounds_planned: int
    completed: int
    missed: int
    reason_for_missed_rounds: Optional[str] = None

class SecurityAreaWisePatrollingLogSchema(BaseModel):
    time: str
    location_checkpoint: str
    observation: str
    status: str
    remarks: Optional[str] = None

class SecurityKeyObservationViolationSchema(BaseModel):
    observation_violation: str

class SecurityImmediateActionSchema(BaseModel):
    action: str
    by_whom: str
    time: str

class SecuritySupervisorCommentSchema(BaseModel):
    comment: str

class SecurityPhotoEvidenceSchema(BaseModel):
    photo_description: str

class SecuritySignOffSchema(BaseModel):
    patrolling_guard_signature: Optional[str] = None
    security_supervisor_signature: Optional[str] = None
    client_acknowledgment_signature: Optional[str] = None

class SecurityPatrollingReportCreate(BaseModel):
    property_id: str
    site_info: SecuritySiteInfoSchema
    patrolling_schedule_summary: SecurityPatrollingScheduleSummarySchema
    area_wise_patrolling_log: List[SecurityAreaWisePatrollingLogSchema]
    key_observations_or_violations: List[SecurityKeyObservationViolationSchema]
    immediate_actions_taken: List[SecurityImmediateActionSchema]
    supervisor_comments: SecuritySupervisorCommentSchema
    photo_evidence: List[SecurityPhotoEvidenceSchema]
    sign_off: SecuritySignOffSchema

class SecurityPatrollingReportUpdate(BaseModel):
    site_info: Optional[SecuritySiteInfoSchema] = None
    patrolling_schedule_summary: Optional[SecurityPatrollingScheduleSummarySchema] = None
    area_wise_patrolling_log: Optional[List[SecurityAreaWisePatrollingLogSchema]] = None
    key_observations_or_violations: Optional[List[SecurityKeyObservationViolationSchema]] = None
    immediate_actions_taken: Optional[List[SecurityImmediateActionSchema]] = None
    supervisor_comments: Optional[SecuritySupervisorCommentSchema] = None
    photo_evidence: Optional[List[SecurityPhotoEvidenceSchema]] = None
    sign_off: Optional[SecuritySignOffSchema] = None

class SecuritySiteInfoResponse(SecuritySiteInfoSchema):
    id: str
    security_patrolling_report_id: str

class SecurityPatrollingScheduleSummaryResponse(SecurityPatrollingScheduleSummarySchema):
    id: str
    security_patrolling_report_id: str

class SecurityAreaWisePatrollingLogResponse(SecurityAreaWisePatrollingLogSchema):
    id: str
    security_patrolling_report_id: str

class SecurityKeyObservationViolationResponse(SecurityKeyObservationViolationSchema):
    id: str
    security_patrolling_report_id: str

class SecurityImmediateActionResponse(SecurityImmediateActionSchema):
    id: str
    security_patrolling_report_id: str

class SecuritySupervisorCommentResponse(SecuritySupervisorCommentSchema):
    id: str
    security_patrolling_report_id: str

class SecurityPhotoEvidenceResponse(SecurityPhotoEvidenceSchema):
    id: str
    security_patrolling_report_id: str

class SecuritySignOffResponse(SecuritySignOffSchema):
    id: str
    security_patrolling_report_id: str

class SecurityPatrollingReportResponse(BaseModel):
    id: str
    property_id: str
    site_info: Optional[SecuritySiteInfoResponse] = None
    patrolling_schedule_summary: Optional[SecurityPatrollingScheduleSummaryResponse] = None
    area_wise_patrolling_log: List[SecurityAreaWisePatrollingLogResponse] = []
    key_observations_or_violations: List[SecurityKeyObservationViolationResponse] = []
    immediate_actions_taken: List[SecurityImmediateActionResponse] = []
    supervisor_comments: Optional[SecuritySupervisorCommentResponse] = None
    photo_evidence: List[SecurityPhotoEvidenceResponse] = []
    sign_off: Optional[SecuritySignOffResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

SecurityPatrollingReport.__table__.create(bind=engine, checkfirst=True)
SecurityAreaWisePatrollingLog.__table__.create(bind=engine, checkfirst=True)
SecurityKeyObservationViolation.__table__.create(bind=engine, checkfirst=True)
SecurityImmediateAction.__table__.create(bind=engine, checkfirst=True)
SecuritySupervisorComment.__table__.create(bind=engine, checkfirst=True)
SecurityPhotoEvidence.__table__.create(bind=engine, checkfirst=True)
SecuritySignOff.__table__.create(bind=engine, checkfirst=True)
SecurityPatrollingScheduleSummary.__table__.create(bind=engine, checkfirst=True)
SecuritySiteInfo.__table__.create(bind=engine, checkfirst=True)

# Security Patrolling Report API Endpoints
@app.post("/security-patrolling-reports/", response_model=SecurityPatrollingReportResponse, status_code=status.HTTP_201_CREATED, tags=["Security Patrolling Report"])
def create_security_patrolling_report(security_patrolling_report: SecurityPatrollingReportCreate, db: Session = Depends(get_db)):
    try:
        # Create main report
        db_report = SecurityPatrollingReport(
            property_id=security_patrolling_report.property_id
        )
        db.add(db_report)
        db.flush()  # Get the ID without committing

        # Create site info
        if security_patrolling_report.site_info:
            db_site_info = SecuritySiteInfo(
                security_patrolling_report_id=db_report.id,
                **security_patrolling_report.site_info.dict()
            )
            db.add(db_site_info)

        # Create patrolling schedule summary
        if security_patrolling_report.patrolling_schedule_summary:
            db_schedule_summary = SecurityPatrollingScheduleSummary(
                security_patrolling_report_id=db_report.id,
                **security_patrolling_report.patrolling_schedule_summary.dict()
            )
            db.add(db_schedule_summary)

        # Create area wise patrolling logs
        for log in security_patrolling_report.area_wise_patrolling_log:
            db_log = SecurityAreaWisePatrollingLog(
                security_patrolling_report_id=db_report.id,
                **log.dict()
            )
            db.add(db_log)

        # Create key observations/violations
        for observation in security_patrolling_report.key_observations_or_violations:
            db_observation = SecurityKeyObservationViolation(
                security_patrolling_report_id=db_report.id,
                **observation.dict()
            )
            db.add(db_observation)

        # Create immediate actions
        for action in security_patrolling_report.immediate_actions_taken:
            db_action = SecurityImmediateAction(
                security_patrolling_report_id=db_report.id,
                **action.dict()
            )
            db.add(db_action)

        # Create supervisor comments
        if security_patrolling_report.supervisor_comments:
            db_supervisor_comment = SecuritySupervisorComment(
                security_patrolling_report_id=db_report.id,
                **security_patrolling_report.supervisor_comments.dict()
            )
            db.add(db_supervisor_comment)

        # Create photo evidence
        for photo in security_patrolling_report.photo_evidence:
            db_photo = SecurityPhotoEvidence(
                security_patrolling_report_id=db_report.id,
                **photo.dict()
            )
            db.add(db_photo)

        # Create sign off
        if security_patrolling_report.sign_off:
            db_sign_off = SecuritySignOff(
                security_patrolling_report_id=db_report.id,
                **security_patrolling_report.sign_off.dict()
            )
            db.add(db_sign_off)

        db.commit()
        db.refresh(db_report)

        # Load all related data
        db.refresh(db_report)
        if db_report.site_info:
            db.refresh(db_report.site_info)
        if db_report.patrolling_schedule_summary:
            db.refresh(db_report.patrolling_schedule_summary)
        if db_report.supervisor_comments:
            db.refresh(db_report.supervisor_comments)
        if db_report.sign_off:
            db.refresh(db_report.sign_off)

        return db_report

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating security patrolling report: {str(e)}")

@app.get("/security-patrolling-reports/", response_model=List[SecurityPatrollingReportResponse], tags=["Security Patrolling Report"])
def get_all_security_patrolling_reports(
    skip: int = 0,
    limit: int = 100,
    property_id: Optional[str] = None,
    shift: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(SecurityPatrollingReport)

        if property_id:
            query = query.filter(SecurityPatrollingReport.property_id == property_id)

        if shift:
            query = query.join(SecuritySiteInfo).filter(SecuritySiteInfo.shift == shift)

        if date_from or date_to:
            query = query.join(SecuritySiteInfo)
            if date_from:
                query = query.filter(SecuritySiteInfo.date >= date_from)
            if date_to:
                query = query.filter(SecuritySiteInfo.date <= date_to)

        reports = query.offset(skip).limit(limit).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.site_info:
                db.refresh(report.site_info)
            if report.patrolling_schedule_summary:
                db.refresh(report.patrolling_schedule_summary)
            if report.supervisor_comments:
                db.refresh(report.supervisor_comments)
            if report.sign_off:
                db.refresh(report.sign_off)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching security patrolling reports: {str(e)}")

@app.get("/security-patrolling-reports/{report_id}", response_model=SecurityPatrollingReportResponse, tags=["Security Patrolling Report"])
def get_security_patrolling_report_by_id(report_id: str, db: Session = Depends(get_db)):
    try:
        report = db.query(SecurityPatrollingReport).filter(SecurityPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Security patrolling report not found")

        # Load all related data
        db.refresh(report)
        if report.site_info:
            db.refresh(report.site_info)
        if report.patrolling_schedule_summary:
            db.refresh(report.patrolling_schedule_summary)
        if report.supervisor_comments:
            db.refresh(report.supervisor_comments)
        if report.sign_off:
            db.refresh(report.sign_off)

        return report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching security patrolling report: {str(e)}")

@app.get("/security-patrolling-reports/report-id/{report_id}", response_model=SecurityPatrollingReportResponse, tags=["Security Patrolling Report"])
def get_security_patrolling_report_by_report_id(report_id: str, db: Session = Depends(get_db)):
    try:
        # Find by the report_id field in site_info
        report = db.query(SecurityPatrollingReport).join(SecuritySiteInfo).filter(SecuritySiteInfo.report_id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Security patrolling report not found")

        # Load all related data
        db.refresh(report)
        if report.site_info:
            db.refresh(report.site_info)
        if report.patrolling_schedule_summary:
            db.refresh(report.patrolling_schedule_summary)
        if report.supervisor_comments:
            db.refresh(report.supervisor_comments)
        if report.sign_off:
            db.refresh(report.sign_off)

        return report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching security patrolling report: {str(e)}")

@app.put("/security-patrolling-reports/{report_id}", response_model=SecurityPatrollingReportResponse, tags=["Security Patrolling Report"])
def update_security_patrolling_report(report_id: str, report_update: SecurityPatrollingReportUpdate, db: Session = Depends(get_db)):
    try:
        report = db.query(SecurityPatrollingReport).filter(SecurityPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Security patrolling report not found")

        # Update site info
        if report_update.site_info:
            if report.site_info:
                for key, value in report_update.site_info.dict(exclude_unset=True).items():
                    setattr(report.site_info, key, value)
            else:
                db_site_info = SecuritySiteInfo(
                    security_patrolling_report_id=report.id,
                    **report_update.site_info.dict()
                )
                db.add(db_site_info)

        # Update patrolling schedule summary
        if report_update.patrolling_schedule_summary:
            if report.patrolling_schedule_summary:
                for key, value in report_update.patrolling_schedule_summary.dict(exclude_unset=True).items():
                    setattr(report.patrolling_schedule_summary, key, value)
            else:
                db_schedule_summary = SecurityPatrollingScheduleSummary(
                    security_patrolling_report_id=report.id,
                    **report_update.patrolling_schedule_summary.dict()
                )
                db.add(db_schedule_summary)

        # Update area wise patrolling logs
        if report_update.area_wise_patrolling_log is not None:
            # Delete existing logs
            db.query(SecurityAreaWisePatrollingLog).filter(
                SecurityAreaWisePatrollingLog.security_patrolling_report_id == report.id
            ).delete()
            
            # Create new logs
            for log in report_update.area_wise_patrolling_log:
                db_log = SecurityAreaWisePatrollingLog(
                    security_patrolling_report_id=report.id,
                    **log.dict()
                )
                db.add(db_log)

        # Update key observations/violations
        if report_update.key_observations_or_violations is not None:
            # Delete existing observations
            db.query(SecurityKeyObservationViolation).filter(
                SecurityKeyObservationViolation.security_patrolling_report_id == report.id
            ).delete()
            
            # Create new observations
            for observation in report_update.key_observations_or_violations:
                db_observation = SecurityKeyObservationViolation(
                    security_patrolling_report_id=report.id,
                    **observation.dict()
                )
                db.add(db_observation)

        # Update immediate actions
        if report_update.immediate_actions_taken is not None:
            # Delete existing actions
            db.query(SecurityImmediateAction).filter(
                SecurityImmediateAction.security_patrolling_report_id == report.id
            ).delete()
            
            # Create new actions
            for action in report_update.immediate_actions_taken:
                db_action = SecurityImmediateAction(
                    security_patrolling_report_id=report.id,
                    **action.dict()
                )
                db.add(db_action)

        # Update supervisor comments
        if report_update.supervisor_comments:
            if report.supervisor_comments:
                for key, value in report_update.supervisor_comments.dict(exclude_unset=True).items():
                    setattr(report.supervisor_comments, key, value)
            else:
                db_supervisor_comment = SecuritySupervisorComment(
                    security_patrolling_report_id=report.id,
                    **report_update.supervisor_comments.dict()
                )
                db.add(db_supervisor_comment)

        # Update photo evidence
        if report_update.photo_evidence is not None:
            # Delete existing photos
            db.query(SecurityPhotoEvidence).filter(
                SecurityPhotoEvidence.security_patrolling_report_id == report.id
            ).delete()
            
            # Create new photos
            for photo in report_update.photo_evidence:
                db_photo = SecurityPhotoEvidence(
                    security_patrolling_report_id=report.id,
                    **photo.dict()
                )
                db.add(db_photo)

        # Update sign off
        if report_update.sign_off:
            if report.sign_off:
                for key, value in report_update.sign_off.dict(exclude_unset=True).items():
                    setattr(report.sign_off, key, value)
            else:
                db_sign_off = SecuritySignOff(
                    security_patrolling_report_id=report.id,
                    **report_update.sign_off.dict()
                )
                db.add(db_sign_off)

        report.updated_at = datetime.utcnow()
        db.commit()

        # Load all related data
        db.refresh(report)
        if report.site_info:
            db.refresh(report.site_info)
        if report.patrolling_schedule_summary:
            db.refresh(report.patrolling_schedule_summary)
        if report.supervisor_comments:
            db.refresh(report.supervisor_comments)
        if report.sign_off:
            db.refresh(report.sign_off)

        return report

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating security patrolling report: {str(e)}")

@app.delete("/security-patrolling-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Security Patrolling Report"])
def delete_security_patrolling_report(report_id: str, db: Session = Depends(get_db)):
    try:
        report = db.query(SecurityPatrollingReport).filter(SecurityPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Security patrolling report not found")

        db.delete(report)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting security patrolling report: {str(e)}")

@app.get("/security-patrolling-reports/property/{property_id}", response_model=List[SecurityPatrollingReportResponse], tags=["Security Patrolling Report"])
def get_security_patrolling_reports_by_property(
    property_id: str,
    skip: int = 0,
    limit: int = 100,
    shift: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(SecurityPatrollingReport).filter(SecurityPatrollingReport.property_id == property_id)

        if shift:
            query = query.join(SecuritySiteInfo).filter(SecuritySiteInfo.shift == shift)

        if date_from or date_to:
            query = query.join(SecuritySiteInfo)
            if date_from:
                query = query.filter(SecuritySiteInfo.date >= date_from)
            if date_to:
                query = query.filter(SecuritySiteInfo.date <= date_to)

        reports = query.offset(skip).limit(limit).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.site_info:
                db.refresh(report.site_info)
            if report.patrolling_schedule_summary:
                db.refresh(report.patrolling_schedule_summary)
            if report.supervisor_comments:
                db.refresh(report.supervisor_comments)
            if report.sign_off:
                db.refresh(report.sign_off)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching security patrolling reports: {str(e)}")

@app.delete("/security-patrolling-reports/property/{property_id}", tags=["Security Patrolling Report"])
def delete_security_patrolling_reports_by_property(property_id: str, db: Session = Depends(get_db)):
    try:
        reports = db.query(SecurityPatrollingReport).filter(SecurityPatrollingReport.property_id == property_id).all()
        
        for report in reports:
            db.delete(report)
        
        db.commit()
        
        return {"message": f"Deleted {len(reports)} security patrolling reports for property {property_id}"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting security patrolling reports: {str(e)}")

@app.get("/security-patrolling-reports/property/{property_id}/shift/{shift}", response_model=List[SecurityPatrollingReportResponse], tags=["Security Patrolling Report"])
def get_security_patrolling_reports_by_property_and_shift(property_id: str, shift: str, db: Session = Depends(get_db)):
    try:
        reports = db.query(SecurityPatrollingReport).join(SecuritySiteInfo).filter(
            SecurityPatrollingReport.property_id == property_id,
            SecuritySiteInfo.shift == shift
        ).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.site_info:
                db.refresh(report.site_info)
            if report.patrolling_schedule_summary:
                db.refresh(report.patrolling_schedule_summary)
            if report.supervisor_comments:
                db.refresh(report.supervisor_comments)
            if report.sign_off:
                db.refresh(report.sign_off)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching security patrolling reports: {str(e)}")

@app.get("/security-patrolling-reports/property/{property_id}/date-range", response_model=List[SecurityPatrollingReportResponse], tags=["Security Patrolling Report"])
def get_security_patrolling_reports_by_property_and_date_range(
    property_id: str,
    date_from: str,
    date_to: str,
    db: Session = Depends(get_db)
):
    try:
        reports = db.query(SecurityPatrollingReport).join(SecuritySiteInfo).filter(
            SecurityPatrollingReport.property_id == property_id,
            SecuritySiteInfo.date >= date_from,
            SecuritySiteInfo.date <= date_to
        ).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.site_info:
                db.refresh(report.site_info)
            if report.patrolling_schedule_summary:
                db.refresh(report.patrolling_schedule_summary)
            if report.supervisor_comments:
                db.refresh(report.supervisor_comments)
            if report.sign_off:
                db.refresh(report.sign_off)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching security patrolling reports: {str(e)}")

@app.get("/security-patrolling-reports/property/{property_id}/statistics", tags=["Security Patrolling Report"])
def get_security_patrolling_report_statistics(property_id: str, db: Session = Depends(get_db)):
    try:
        # Get total reports
        total_reports = db.query(SecurityPatrollingReport).filter(
            SecurityPatrollingReport.property_id == property_id
        ).count()

        # Get shift-wise statistics
        shift_stats = db.query(
            SecuritySiteInfo.shift,
            func.count(SecuritySiteInfo.id).label('count')
        ).join(SecurityPatrollingReport).filter(
            SecurityPatrollingReport.property_id == property_id
        ).group_by(SecuritySiteInfo.shift).all()

        # Get completion statistics
        completion_stats = db.query(
            func.sum(SecurityPatrollingScheduleSummary.total_rounds_planned).label('total_planned'),
            func.sum(SecurityPatrollingScheduleSummary.completed).label('total_completed'),
            func.sum(SecurityPatrollingScheduleSummary.missed).label('total_missed')
        ).join(SecurityPatrollingReport).filter(
            SecurityPatrollingReport.property_id == property_id
        ).first()

        # Get status statistics from patrolling logs
        status_stats = db.query(
            SecurityAreaWisePatrollingLog.status,
            func.count(SecurityAreaWisePatrollingLog.id).label('count')
        ).join(SecurityPatrollingReport).filter(
            SecurityPatrollingReport.property_id == property_id
        ).group_by(SecurityAreaWisePatrollingLog.status).all()

        return {
            "property_id": property_id,
            "total_reports": total_reports,
            "shift_statistics": {shift: count for shift, count in shift_stats},
            "completion_statistics": {
                "total_rounds_planned": completion_stats.total_planned or 0,
                "total_rounds_completed": completion_stats.total_completed or 0,
                "total_rounds_missed": completion_stats.total_missed or 0,
                "completion_rate": round((completion_stats.total_completed or 0) / (completion_stats.total_planned or 1) * 100, 2)
            },
            "status_statistics": {status: count for status, count in status_stats}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching security patrolling report statistics: {str(e)}")

# Facility Technical Patrolling Report Models
class FacilityTechnicalPatrollingReport(Base):
    __tablename__ = "facility_technical_patrolling_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False)
    report_date = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with entries
    entries = relationship("FacilityTechnicalPatrollingEntry", backref="facility_technical_patrolling_report", cascade="all, delete-orphan")

class FacilityTechnicalPatrollingEntry(Base):
    __tablename__ = "facility_technical_patrolling_entries"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    facility_technical_patrolling_report_id = Column(String, ForeignKey("facility_technical_patrolling_reports.id"), nullable=False)
    sl_no = Column(Integer, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    location_area_covered = Column(String, nullable=False)
    equipment_asset_checked = Column(String, nullable=False)
    observation_issue_found = Column(String, nullable=False)
    action_taken = Column(String, nullable=False)
    remarks = Column(String, nullable=True)
    checked_by = Column(String, nullable=False)

# Facility Technical Patrolling Report Schemas
class FacilityTechnicalPatrollingEntrySchema(BaseModel):
    sl_no: int
    date: str
    time: str
    location_area_covered: str
    equipment_asset_checked: str
    observation_issue_found: str
    action_taken: str
    remarks: Optional[str] = None
    checked_by: str

class FacilityTechnicalPatrollingReportCreate(BaseModel):
    property_id: str
    report_date: str
    entries: List[FacilityTechnicalPatrollingEntrySchema]

class FacilityTechnicalPatrollingReportUpdate(BaseModel):
    report_date: Optional[str] = None
    entries: Optional[List[FacilityTechnicalPatrollingEntrySchema]] = None

class FacilityTechnicalPatrollingEntryResponse(FacilityTechnicalPatrollingEntrySchema):
    id: str
    facility_technical_patrolling_report_id: str

class FacilityTechnicalPatrollingReportResponse(BaseModel):
    id: str
    property_id: str
    report_date: str
    entries: List[FacilityTechnicalPatrollingEntryResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Create tables
FacilityTechnicalPatrollingReport.__table__.create(bind=engine, checkfirst=True)
FacilityTechnicalPatrollingEntry.__table__.create(bind=engine, checkfirst=True)

# Facility Technical Patrolling Report API Endpoints
@app.post("/facility-technical-patrolling-reports/", response_model=FacilityTechnicalPatrollingReportResponse, status_code=status.HTTP_201_CREATED, tags=["Facility Technical Patrolling Report"])
def create_facility_technical_patrolling_report(report: FacilityTechnicalPatrollingReportCreate, db: Session = Depends(get_db)):
    try:
        # Create main report
        db_report = FacilityTechnicalPatrollingReport(
            property_id=report.property_id,
            report_date=report.report_date
        )
        db.add(db_report)
        db.flush()  # Get the ID without committing

        # Create entries
        for entry in report.entries:
            db_entry = FacilityTechnicalPatrollingEntry(
                facility_technical_patrolling_report_id=db_report.id,
                **entry.dict()
            )
            db.add(db_entry)

        db.commit()
        db.refresh(db_report)

        return db_report

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating facility technical patrolling report: {str(e)}")

@app.get("/facility-technical-patrolling-reports/", response_model=List[FacilityTechnicalPatrollingReportResponse], tags=["Facility Technical Patrolling Report"])
def get_all_facility_technical_patrolling_reports(
    skip: int = 0,
    limit: int = 100,
    property_id: Optional[str] = None,
    report_date: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(FacilityTechnicalPatrollingReport)

        if property_id:
            query = query.filter(FacilityTechnicalPatrollingReport.property_id == property_id)

        if report_date:
            query = query.filter(FacilityTechnicalPatrollingReport.report_date == report_date)

        if date_from or date_to:
            if date_from:
                query = query.filter(FacilityTechnicalPatrollingReport.report_date >= date_from)
            if date_to:
                query = query.filter(FacilityTechnicalPatrollingReport.report_date <= date_to)

        reports = query.offset(skip).limit(limit).all()

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching facility technical patrolling reports: {str(e)}")

@app.get("/facility-technical-patrolling-reports/{report_id}", response_model=FacilityTechnicalPatrollingReportResponse, tags=["Facility Technical Patrolling Report"])
def get_facility_technical_patrolling_report_by_id(report_id: str, db: Session = Depends(get_db)):
    try:
        report = db.query(FacilityTechnicalPatrollingReport).filter(FacilityTechnicalPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Facility technical patrolling report not found")

        return report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching facility technical patrolling report: {str(e)}")

@app.put("/facility-technical-patrolling-reports/{report_id}", response_model=FacilityTechnicalPatrollingReportResponse, tags=["Facility Technical Patrolling Report"])
def update_facility_technical_patrolling_report(report_id: str, report_update: FacilityTechnicalPatrollingReportUpdate, db: Session = Depends(get_db)):
    try:
        report = db.query(FacilityTechnicalPatrollingReport).filter(FacilityTechnicalPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Facility technical patrolling report not found")

        # Update report date
        if report_update.report_date:
            report.report_date = report_update.report_date

        # Update entries
        if report_update.entries is not None:
            # Delete existing entries
            db.query(FacilityTechnicalPatrollingEntry).filter(
                FacilityTechnicalPatrollingEntry.facility_technical_patrolling_report_id == report.id
            ).delete()
            
            # Create new entries
            for entry in report_update.entries:
                db_entry = FacilityTechnicalPatrollingEntry(
                    facility_technical_patrolling_report_id=report.id,
                    **entry.dict()
                )
                db.add(db_entry)

        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)

        return report

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating facility technical patrolling report: {str(e)}")

@app.delete("/facility-technical-patrolling-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Facility Technical Patrolling Report"])
def delete_facility_technical_patrolling_report(report_id: str, db: Session = Depends(get_db)):
    try:
        report = db.query(FacilityTechnicalPatrollingReport).filter(FacilityTechnicalPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Facility technical patrolling report not found")

        db.delete(report)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting facility technical patrolling report: {str(e)}")

@app.get("/facility-technical-patrolling-reports/property/{property_id}", response_model=List[FacilityTechnicalPatrollingReportResponse], tags=["Facility Technical Patrolling Report"])
def get_facility_technical_patrolling_reports_by_property(
    property_id: str,
    skip: int = 0,
    limit: int = 100,
    report_date: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(FacilityTechnicalPatrollingReport).filter(FacilityTechnicalPatrollingReport.property_id == property_id)

        if report_date:
            query = query.filter(FacilityTechnicalPatrollingReport.report_date == report_date)

        if date_from or date_to:
            if date_from:
                query = query.filter(FacilityTechnicalPatrollingReport.report_date >= date_from)
            if date_to:
                query = query.filter(FacilityTechnicalPatrollingReport.report_date <= date_to)

        reports = query.offset(skip).limit(limit).all()

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching facility technical patrolling reports: {str(e)}")

@app.delete("/facility-technical-patrolling-reports/property/{property_id}", tags=["Facility Technical Patrolling Report"])
def delete_facility_technical_patrolling_reports_by_property(property_id: str, db: Session = Depends(get_db)):
    try:
        reports = db.query(FacilityTechnicalPatrollingReport).filter(FacilityTechnicalPatrollingReport.property_id == property_id).all()
        
        for report in reports:
            db.delete(report)
        
        db.commit()
        
        return {"message": f"Deleted {len(reports)} facility technical patrolling reports for property {property_id}"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting facility technical patrolling reports: {str(e)}")

@app.get("/facility-technical-patrolling-reports/property/{property_id}/date/{report_date}", response_model=List[FacilityTechnicalPatrollingReportResponse], tags=["Facility Technical Patrolling Report"])
def get_facility_technical_patrolling_reports_by_property_and_date(property_id: str, report_date: str, db: Session = Depends(get_db)):
    try:
        reports = db.query(FacilityTechnicalPatrollingReport).filter(
            FacilityTechnicalPatrollingReport.property_id == property_id,
            FacilityTechnicalPatrollingReport.report_date == report_date
        ).all()

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching facility technical patrolling reports: {str(e)}")

@app.get("/facility-technical-patrolling-reports/property/{property_id}/date-range", response_model=List[FacilityTechnicalPatrollingReportResponse], tags=["Facility Technical Patrolling Report"])
def get_facility_technical_patrolling_reports_by_property_and_date_range(
    property_id: str,
    date_from: str,
    date_to: str,
    db: Session = Depends(get_db)
):
    try:
        reports = db.query(FacilityTechnicalPatrollingReport).filter(
            FacilityTechnicalPatrollingReport.property_id == property_id,
            FacilityTechnicalPatrollingReport.report_date >= date_from,
            FacilityTechnicalPatrollingReport.report_date <= date_to
        ).all()

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching facility technical patrolling reports: {str(e)}")

@app.get("/facility-technical-patrolling-reports/property/{property_id}/statistics", tags=["Facility Technical Patrolling Report"])
def get_facility_technical_patrolling_report_statistics(property_id: str, db: Session = Depends(get_db)):
    try:
        # Get total reports
        total_reports = db.query(FacilityTechnicalPatrollingReport).filter(
            FacilityTechnicalPatrollingReport.property_id == property_id
        ).count()

        # Get total entries
        total_entries = db.query(FacilityTechnicalPatrollingEntry).join(FacilityTechnicalPatrollingReport).filter(
            FacilityTechnicalPatrollingReport.property_id == property_id
        ).count()

        # Get issue statistics
        issue_stats = db.query(
            FacilityTechnicalPatrollingEntry.observation_issue_found,
            func.count(FacilityTechnicalPatrollingEntry.id).label('count')
        ).join(FacilityTechnicalPatrollingReport).filter(
            FacilityTechnicalPatrollingReport.property_id == property_id
        ).group_by(FacilityTechnicalPatrollingEntry.observation_issue_found).all()

        # Get equipment statistics
        equipment_stats = db.query(
            FacilityTechnicalPatrollingEntry.equipment_asset_checked,
            func.count(FacilityTechnicalPatrollingEntry.id).label('count')
        ).join(FacilityTechnicalPatrollingReport).filter(
            FacilityTechnicalPatrollingReport.property_id == property_id
        ).group_by(FacilityTechnicalPatrollingEntry.equipment_asset_checked).all()

        # Get location statistics
        location_stats = db.query(
            FacilityTechnicalPatrollingEntry.location_area_covered,
            func.count(FacilityTechnicalPatrollingEntry.id).label('count')
        ).join(FacilityTechnicalPatrollingReport).filter(
            FacilityTechnicalPatrollingReport.property_id == property_id
        ).group_by(FacilityTechnicalPatrollingEntry.location_area_covered).all()

        return {
            "property_id": property_id,
            "total_reports": total_reports,
            "total_entries": total_entries,
            "issue_statistics": {issue: count for issue, count in issue_stats},
            "equipment_statistics": {equipment: count for equipment, count in equipment_stats},
            "location_statistics": {location: count for location, count in location_stats}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching facility technical patrolling report statistics: {str(e)}")

# Night Patrolling Report Models
class NightPatrollingReport(Base):
    __tablename__ = "night_patrolling_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with general report details and observations
    general_report_details = relationship("NightPatrollingGeneralReportDetails", backref="night_patrolling_report", uselist=False, cascade="all, delete-orphan")
    observations = relationship("NightPatrollingObservation", backref="night_patrolling_report", cascade="all, delete-orphan")
    officer_signature = relationship("NightPatrollingOfficerSignature", backref="night_patrolling_report", uselist=False, cascade="all, delete-orphan")

class NightPatrollingGeneralReportDetails(Base):
    __tablename__ = "night_patrolling_general_report_details"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    night_patrolling_report_id = Column(String, ForeignKey("night_patrolling_reports.id"), nullable=False)
    date = Column(String, nullable=False)
    patrolling_officer = Column(String, nullable=False)
    site_name = Column(String, nullable=False)
    shift = Column(String, nullable=False)
    total_guards_on_duty = Column(Integer, nullable=False)
    vehicle_used = Column(String, nullable=False)
    weather_condition = Column(String, nullable=False)

class NightPatrollingObservation(Base):
    __tablename__ = "night_patrolling_observations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    night_patrolling_report_id = Column(String, ForeignKey("night_patrolling_reports.id"), nullable=False)
    sl_no = Column(Integer, nullable=False)
    time_of_visit = Column(String, nullable=False)
    location_visited = Column(String, nullable=False)
    guard_on_duty = Column(String, nullable=False)
    photo_of_staff = Column(String, nullable=True)
    uniform_and_alertness = Column(String, nullable=False)
    logbook_entry = Column(String, nullable=False)
    issues_observed = Column(String, nullable=False)
    action_taken = Column(String, nullable=False)
    patrolling_officer_sign = Column(String, nullable=True)

class NightPatrollingOfficerSignature(Base):
    __tablename__ = "night_patrolling_officer_signatures"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    night_patrolling_report_id = Column(String, ForeignKey("night_patrolling_reports.id"), nullable=False)
    signature = Column(String, nullable=True)

# Night Patrolling Report Schemas
class NightPatrollingGeneralReportDetailsSchema(BaseModel):
    date: str
    patrolling_officer: str
    site_name: str
    shift: str
    total_guards_on_duty: int
    vehicle_used: str
    weather_condition: str

class NightPatrollingObservationSchema(BaseModel):
    sl_no: int
    time_of_visit: str
    location_visited: str
    guard_on_duty: str
    photo_of_staff: Optional[str] = None
    uniform_and_alertness: str
    logbook_entry: str
    issues_observed: str
    action_taken: str
    patrolling_officer_sign: Optional[str] = None

class NightPatrollingOfficerSignatureSchema(BaseModel):
    signature: Optional[str] = None

class NightPatrollingReportCreate(BaseModel):
    property_id: str
    general_report_details: NightPatrollingGeneralReportDetailsSchema
    observations: List[NightPatrollingObservationSchema]
    officer_signature: NightPatrollingOfficerSignatureSchema

class NightPatrollingReportUpdate(BaseModel):
    general_report_details: Optional[NightPatrollingGeneralReportDetailsSchema] = None
    observations: Optional[List[NightPatrollingObservationSchema]] = None
    officer_signature: Optional[NightPatrollingOfficerSignatureSchema] = None

class NightPatrollingGeneralReportDetailsResponse(NightPatrollingGeneralReportDetailsSchema):
    id: str
    night_patrolling_report_id: str

class NightPatrollingObservationResponse(NightPatrollingObservationSchema):
    id: str
    night_patrolling_report_id: str

class NightPatrollingOfficerSignatureResponse(NightPatrollingOfficerSignatureSchema):
    id: str
    night_patrolling_report_id: str

class NightPatrollingReportResponse(BaseModel):
    id: str
    property_id: str
    general_report_details: Optional[NightPatrollingGeneralReportDetailsResponse] = None
    observations: List[NightPatrollingObservationResponse] = []
    officer_signature: Optional[NightPatrollingOfficerSignatureResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Create tables
NightPatrollingReport.__table__.create(bind=engine, checkfirst=True)
NightPatrollingGeneralReportDetails.__table__.create(bind=engine, checkfirst=True)
NightPatrollingObservation.__table__.create(bind=engine, checkfirst=True)
NightPatrollingOfficerSignature.__table__.create(bind=engine, checkfirst=True)

# Night Patrolling Report API Endpoints
@app.post("/night-patrolling-reports/", response_model=NightPatrollingReportResponse, status_code=status.HTTP_201_CREATED, tags=["Night Patrolling Report"])
def create_night_patrolling_report(report: NightPatrollingReportCreate, db: Session = Depends(get_db)):
    try:
        # Create main report
        db_report = NightPatrollingReport(
            property_id=report.property_id
        )
        db.add(db_report)
        db.flush()  # Get the ID without committing

        # Create general report details
        if report.general_report_details:
            db_general_details = NightPatrollingGeneralReportDetails(
                night_patrolling_report_id=db_report.id,
                **report.general_report_details.dict()
            )
            db.add(db_general_details)

        # Create observations
        for observation in report.observations:
            db_observation = NightPatrollingObservation(
                night_patrolling_report_id=db_report.id,
                **observation.dict()
            )
            db.add(db_observation)

        # Create officer signature
        if report.officer_signature:
            db_officer_signature = NightPatrollingOfficerSignature(
                night_patrolling_report_id=db_report.id,
                **report.officer_signature.dict()
            )
            db.add(db_officer_signature)

        db.commit()
        db.refresh(db_report)

        # Load all related data
        db.refresh(db_report)
        if db_report.general_report_details:
            db.refresh(db_report.general_report_details)
        if db_report.officer_signature:
            db.refresh(db_report.officer_signature)

        return db_report

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating night patrolling report: {str(e)}")

@app.get("/night-patrolling-reports/", response_model=List[NightPatrollingReportResponse], tags=["Night Patrolling Report"])
def get_all_night_patrolling_reports(
    skip: int = 0,
    limit: int = 100,
    property_id: Optional[str] = None,
    date: Optional[str] = None,
    patrolling_officer: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(NightPatrollingReport)

        if property_id:
            query = query.filter(NightPatrollingReport.property_id == property_id)

        if date or patrolling_officer or date_from or date_to:
            query = query.join(NightPatrollingGeneralReportDetails)
            
            if date:
                query = query.filter(NightPatrollingGeneralReportDetails.date == date)
            
            if patrolling_officer:
                query = query.filter(NightPatrollingGeneralReportDetails.patrolling_officer == patrolling_officer)
            
            if date_from:
                query = query.filter(NightPatrollingGeneralReportDetails.date >= date_from)
            
            if date_to:
                query = query.filter(NightPatrollingGeneralReportDetails.date <= date_to)

        reports = query.offset(skip).limit(limit).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.general_report_details:
                db.refresh(report.general_report_details)
            if report.officer_signature:
                db.refresh(report.officer_signature)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching night patrolling reports: {str(e)}")

@app.get("/night-patrolling-reports/{report_id}", response_model=NightPatrollingReportResponse, tags=["Night Patrolling Report"])
def get_night_patrolling_report_by_id(report_id: str, db: Session = Depends(get_db)):
    try:
        report = db.query(NightPatrollingReport).filter(NightPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Night patrolling report not found")

        # Load all related data
        db.refresh(report)
        if report.general_report_details:
            db.refresh(report.general_report_details)
        if report.officer_signature:
            db.refresh(report.officer_signature)

        return report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching night patrolling report: {str(e)}")

@app.put("/night-patrolling-reports/{report_id}", response_model=NightPatrollingReportResponse, tags=["Night Patrolling Report"])
def update_night_patrolling_report(report_id: str, report_update: NightPatrollingReportUpdate, db: Session = Depends(get_db)):
    try:
        report = db.query(NightPatrollingReport).filter(NightPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Night patrolling report not found")

        # Update general report details
        if report_update.general_report_details:
            if report.general_report_details:
                for key, value in report_update.general_report_details.dict(exclude_unset=True).items():
                    setattr(report.general_report_details, key, value)
            else:
                db_general_details = NightPatrollingGeneralReportDetails(
                    night_patrolling_report_id=report.id,
                    **report_update.general_report_details.dict()
                )
                db.add(db_general_details)

        # Update observations
        if report_update.observations is not None:
            # Delete existing observations
            db.query(NightPatrollingObservation).filter(
                NightPatrollingObservation.night_patrolling_report_id == report.id
            ).delete()
            
            # Create new observations
            for observation in report_update.observations:
                db_observation = NightPatrollingObservation(
                    night_patrolling_report_id=report.id,
                    **observation.dict()
                )
                db.add(db_observation)

        # Update officer signature
        if report_update.officer_signature:
            if report.officer_signature:
                for key, value in report_update.officer_signature.dict(exclude_unset=True).items():
                    setattr(report.officer_signature, key, value)
            else:
                db_officer_signature = NightPatrollingOfficerSignature(
                    night_patrolling_report_id=report.id,
                    **report_update.officer_signature.dict()
                )
                db.add(db_officer_signature)

        report.updated_at = datetime.utcnow()
        db.commit()

        # Load all related data
        db.refresh(report)
        if report.general_report_details:
            db.refresh(report.general_report_details)
        if report.officer_signature:
            db.refresh(report.officer_signature)

        return report

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating night patrolling report: {str(e)}")

@app.delete("/night-patrolling-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Night Patrolling Report"])
def delete_night_patrolling_report(report_id: str, db: Session = Depends(get_db)):
    try:
        report = db.query(NightPatrollingReport).filter(NightPatrollingReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Night patrolling report not found")

        db.delete(report)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting night patrolling report: {str(e)}")

@app.get("/night-patrolling-reports/property/{property_id}", response_model=List[NightPatrollingReportResponse], tags=["Night Patrolling Report"])
def get_night_patrolling_reports_by_property(
    property_id: str,
    skip: int = 0,
    limit: int = 100,
    date: Optional[str] = None,
    patrolling_officer: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(NightPatrollingReport).filter(NightPatrollingReport.property_id == property_id)

        if date or patrolling_officer or date_from or date_to:
            query = query.join(NightPatrollingGeneralReportDetails)
            
            if date:
                query = query.filter(NightPatrollingGeneralReportDetails.date == date)
            
            if patrolling_officer:
                query = query.filter(NightPatrollingGeneralReportDetails.patrolling_officer == patrolling_officer)
            
            if date_from:
                query = query.filter(NightPatrollingGeneralReportDetails.date >= date_from)
            
            if date_to:
                query = query.filter(NightPatrollingGeneralReportDetails.date <= date_to)

        reports = query.offset(skip).limit(limit).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.general_report_details:
                db.refresh(report.general_report_details)
            if report.officer_signature:
                db.refresh(report.officer_signature)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching night patrolling reports: {str(e)}")

@app.delete("/night-patrolling-reports/property/{property_id}", tags=["Night Patrolling Report"])
def delete_night_patrolling_reports_by_property(property_id: str, db: Session = Depends(get_db)):
    try:
        reports = db.query(NightPatrollingReport).filter(NightPatrollingReport.property_id == property_id).all()
        
        for report in reports:
            db.delete(report)
        
        db.commit()
        
        return {"message": f"Deleted {len(reports)} night patrolling reports for property {property_id}"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting night patrolling reports: {str(e)}")

@app.get("/night-patrolling-reports/property/{property_id}/date/{date}", response_model=List[NightPatrollingReportResponse], tags=["Night Patrolling Report"])
def get_night_patrolling_reports_by_property_and_date(property_id: str, date: str, db: Session = Depends(get_db)):
    try:
        reports = db.query(NightPatrollingReport).join(NightPatrollingGeneralReportDetails).filter(
            NightPatrollingReport.property_id == property_id,
            NightPatrollingGeneralReportDetails.date == date
        ).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.general_report_details:
                db.refresh(report.general_report_details)
            if report.officer_signature:
                db.refresh(report.officer_signature)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching night patrolling reports: {str(e)}")

@app.get("/night-patrolling-reports/property/{property_id}/officer/{patrolling_officer}", response_model=List[NightPatrollingReportResponse], tags=["Night Patrolling Report"])
def get_night_patrolling_reports_by_property_and_officer(property_id: str, patrolling_officer: str, db: Session = Depends(get_db)):
    try:
        reports = db.query(NightPatrollingReport).join(NightPatrollingGeneralReportDetails).filter(
            NightPatrollingReport.property_id == property_id,
            NightPatrollingGeneralReportDetails.patrolling_officer == patrolling_officer
        ).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.general_report_details:
                db.refresh(report.general_report_details)
            if report.officer_signature:
                db.refresh(report.officer_signature)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching night patrolling reports: {str(e)}")

@app.get("/night-patrolling-reports/property/{property_id}/date-range", response_model=List[NightPatrollingReportResponse], tags=["Night Patrolling Report"])
def get_night_patrolling_reports_by_property_and_date_range(
    property_id: str,
    date_from: str,
    date_to: str,
    db: Session = Depends(get_db)
):
    try:
        reports = db.query(NightPatrollingReport).join(NightPatrollingGeneralReportDetails).filter(
            NightPatrollingReport.property_id == property_id,
            NightPatrollingGeneralReportDetails.date >= date_from,
            NightPatrollingGeneralReportDetails.date <= date_to
        ).all()

        # Load all related data for each report
        for report in reports:
            db.refresh(report)
            if report.general_report_details:
                db.refresh(report.general_report_details)
            if report.officer_signature:
                db.refresh(report.officer_signature)

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching night patrolling reports: {str(e)}")

@app.get("/night-patrolling-reports/property/{property_id}/statistics", tags=["Night Patrolling Report"])
def get_night_patrolling_report_statistics(property_id: str, db: Session = Depends(get_db)):
    try:
        # Get total reports
        total_reports = db.query(NightPatrollingReport).filter(
            NightPatrollingReport.property_id == property_id
        ).count()

        # Get total observations
        total_observations = db.query(NightPatrollingObservation).join(NightPatrollingReport).filter(
            NightPatrollingReport.property_id == property_id
        ).count()

        # Get uniform and alertness statistics
        alertness_stats = db.query(
            NightPatrollingObservation.uniform_and_alertness,
            func.count(NightPatrollingObservation.id).label('count')
        ).join(NightPatrollingReport).filter(
            NightPatrollingReport.property_id == property_id
        ).group_by(NightPatrollingObservation.uniform_and_alertness).all()

        # Get logbook entry statistics
        logbook_stats = db.query(
            NightPatrollingObservation.logbook_entry,
            func.count(NightPatrollingObservation.id).label('count')
        ).join(NightPatrollingReport).filter(
            NightPatrollingReport.property_id == property_id
        ).group_by(NightPatrollingObservation.logbook_entry).all()

        # Get location statistics
        location_stats = db.query(
            NightPatrollingObservation.location_visited,
            func.count(NightPatrollingObservation.id).label('count')
        ).join(NightPatrollingReport).filter(
            NightPatrollingReport.property_id == property_id
        ).group_by(NightPatrollingObservation.location_visited).all()

        # Get issues statistics
        issues_stats = db.query(
            NightPatrollingObservation.issues_observed,
            func.count(NightPatrollingObservation.id).label('count')
        ).join(NightPatrollingReport).filter(
            NightPatrollingReport.property_id == property_id
        ).group_by(NightPatrollingObservation.issues_observed).all()

        # Get weather condition statistics
        weather_stats = db.query(
            NightPatrollingGeneralReportDetails.weather_condition,
            func.count(NightPatrollingGeneralReportDetails.id).label('count')
        ).join(NightPatrollingReport).filter(
            NightPatrollingReport.property_id == property_id
        ).group_by(NightPatrollingGeneralReportDetails.weather_condition).all()

        return {
            "property_id": property_id,
            "total_reports": total_reports,
            "total_observations": total_observations,
            "alertness_statistics": {alertness: count for alertness, count in alertness_stats},
            "logbook_entry_statistics": {logbook: count for logbook, count in logbook_stats},
            "location_statistics": {location: count for location, count in location_stats},
            "issues_statistics": {issue: count for issue, count in issues_stats},
            "weather_statistics": {weather: count for weather, count in weather_stats}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching night patrolling report statistics: {str(e)}")

# ... existing code ...
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get a DB session for each request.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==============================================================================
# 2. SQLAlchemy MODELS (Database Tables)
# ==============================================================================

# --- Main Parent Model ---
class VisitorManagementReport(Base):
    """The main report that acts as a container for all individual entries."""
    __tablename__ = "visitor_management_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-many relationships to all child entry tables
    inward_non_returnable = relationship("InwardNonReturnable", backref="report", cascade="all, delete-orphan")
    inward_returnable = relationship("InwardReturnable", backref="report", cascade="all, delete-orphan")
    outward_non_returnable = relationship("OutwardNonReturnable", backref="report", cascade="all, delete-orphan")
    outward_returnable = relationship("OutwardReturnable", backref="report", cascade="all, delete-orphan")
    move_in = relationship("MoveIn", backref="report", cascade="all, delete-orphan")
    move_out = relationship("MoveOut", backref="report", cascade="all, delete-orphan")
    interior_work_tracking = relationship("InteriorWorkTracking", backref="report", cascade="all, delete-orphan")
    work_permit_issuance = relationship("WorkPermitIssuance", backref="report", cascade="all, delete-orphan")
    gate_pass_management = relationship("GatePassManagement", backref="report", cascade="all, delete-orphan")
    blocklist_management = relationship("BlocklistManagement", backref="report", cascade="all, delete-orphan")
    daily_entry_details = relationship("DailyEntryDetails", backref="report", cascade="all, delete-orphan")
    water_tanker_management = relationship("WaterTankerManagement", backref="report", cascade="all, delete-orphan")
    vendor_entry_management = relationship("VendorEntryManagement", backref="report", cascade="all, delete-orphan")
    staff_entry_management = relationship("StaffEntryManagement", backref="report", cascade="all, delete-orphan")
    emergency_contact_details = relationship("EmergencyContactDetails", backref="report", cascade="all, delete-orphan")
    visitor_management_log = relationship("VisitorManagementLog", backref="report", cascade="all, delete-orphan")


# --- Child Entry Models ---
class InwardNonReturnable(Base):
    __tablename__ = 'inward_non_returnable'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    item_id = Column(String, nullable=False); item_description = Column(String, nullable=False); quantity = Column(Integer, nullable=False); supplier_name = Column(String, nullable=False); supplier_contact = Column(String, nullable=False); entry_date = Column(String, nullable=False); entry_time = Column(String, nullable=False); gate_no = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); driver_name = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class InwardReturnable(Base):
    __tablename__ = 'inward_returnable'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    item_id = Column(String, nullable=False); item_description = Column(String, nullable=False); quantity = Column(Integer, nullable=False); supplier_name = Column(String, nullable=False); supplier_contact = Column(String, nullable=False); entry_date = Column(String, nullable=False); entry_time = Column(String, nullable=False); gate_no = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); driver_name = Column(String, nullable=False); expected_return_date = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class OutwardNonReturnable(Base):
    __tablename__ = 'outward_non_returnable'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    item_id = Column(String, nullable=False); item_description = Column(String, nullable=False); quantity = Column(Integer, nullable=False); recipient_name = Column(String, nullable=False); recipient_contact = Column(String, nullable=False); outward_date = Column(String, nullable=False); outward_time = Column(String, nullable=False); gate_no = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); driver_name = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class OutwardReturnable(Base):
    __tablename__ = 'outward_returnable'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    item_id = Column(String, nullable=False); item_description = Column(String, nullable=False); quantity = Column(Integer, nullable=False); recipient_name = Column(String, nullable=False); recipient_contact = Column(String, nullable=False); outward_date = Column(String, nullable=False); outward_time = Column(String, nullable=False); gate_no = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); driver_name = Column(String, nullable=False); expected_return_date = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class MoveIn(Base):
    __tablename__ = 'move_in'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    move_in_id = Column(String, nullable=False); name = Column(String, nullable=False); contact_number = Column(String, nullable=False); address = Column(String, nullable=False); move_in_date = Column(String, nullable=False); move_in_time = Column(String, nullable=False); gate_no = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); driver_name = Column(String, nullable=False); no_of_persons = Column(Integer, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class MoveOut(Base):
    __tablename__ = 'move_out'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    move_out_id = Column(String, nullable=False); name = Column(String, nullable=False); contact_number = Column(String, nullable=False); address = Column(String, nullable=False); move_out_date = Column(String, nullable=False); move_out_time = Column(String, nullable=False); gate_no = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); driver_name = Column(String, nullable=False); no_of_persons = Column(Integer, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class InteriorWorkTracking(Base):
    __tablename__ = 'interior_work_tracking'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    work_id = Column(String, nullable=False); resident_name = Column(String, nullable=False); contact_number = Column(String, nullable=False); address = Column(String, nullable=False); work_description = Column(String, nullable=False); start_date = Column(String, nullable=False); end_date = Column(String, nullable=False); contractor_name = Column(String, nullable=False); contractor_contact = Column(String, nullable=False); no_of_workers = Column(Integer, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class WorkPermitIssuance(Base):
    __tablename__ = 'work_permit_issuance'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    permit_id = Column(String, nullable=False); worker_name = Column(String, nullable=False); contact_number = Column(String, nullable=False); company_name = Column(String, nullable=False); work_type = Column(String, nullable=False); permit_issue_date = Column(String, nullable=False); permit_expiry_date = Column(String, nullable=False); address = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class GatePassManagement(Base):
    __tablename__ = 'gate_pass_management'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    pass_id = Column(String, nullable=False); name = Column(String, nullable=False); contact_number = Column(String, nullable=False); purpose = Column(String, nullable=False); entry_date = Column(String, nullable=False); entry_time = Column(String, nullable=False); exit_date = Column(String, nullable=True); exit_time = Column(String, nullable=True); gate_no = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class BlocklistManagement(Base):
    __tablename__ = 'blocklist_management'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    blocklist_id = Column(String, nullable=False); name = Column(String, nullable=False); contact_number = Column(String, nullable=False); reason_for_block = Column(String, nullable=False); date_added = Column(String, nullable=False); added_by = Column(String, nullable=False); remarks = Column(String, nullable=False)

class DailyEntryDetails(Base):
    __tablename__ = 'daily_entry_details'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    entry_id = Column(String, nullable=False); name = Column(String, nullable=False); contact_number = Column(String, nullable=False); purpose = Column(String, nullable=False); entry_date = Column(String, nullable=False); entry_time = Column(String, nullable=False); exit_time = Column(String, nullable=True); gate_no = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class WaterTankerManagement(Base):
    __tablename__ = 'water_tanker_management'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    tanker_id = Column(String, nullable=False); supplier_name = Column(String, nullable=False); contact_number = Column(String, nullable=False); vehicle_no = Column(String, nullable=False); driver_name = Column(String, nullable=False); capacity_liters = Column(Integer, nullable=False); entry_date = Column(String, nullable=False); entry_time = Column(String, nullable=False); gate_no = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class VendorEntryManagement(Base):
    __tablename__ = 'vendor_entry_management'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    vendor_id = Column(String, nullable=False); vendor_name = Column(String, nullable=False); contact_number = Column(String, nullable=False); company_name = Column(String, nullable=False); purpose = Column(String, nullable=False); entry_date = Column(String, nullable=False); entry_time = Column(String, nullable=False); exit_time = Column(String, nullable=True); gate_no = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class StaffEntryManagement(Base):
    __tablename__ = 'staff_entry_management'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    staff_id = Column(String, nullable=False); name = Column(String, nullable=False); contact_number = Column(String, nullable=False); department = Column(String, nullable=False); entry_date = Column(String, nullable=False); entry_time = Column(String, nullable=False); exit_time = Column(String, nullable=True); gate_no = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class EmergencyContactDetails(Base):
    __tablename__ = 'emergency_contact_details'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    contact_id = Column(String, nullable=False); name = Column(String, nullable=False); contact_number = Column(String, nullable=False); relation = Column(String, nullable=False); address = Column(String, nullable=False); emergency_type = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

class VisitorManagementLog(Base):
    __tablename__ = 'visitor_management_log'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("visitor_management_reports.id"), nullable=False)
    record_id = Column(String, nullable=False); type = Column(String, nullable=False); name = Column(String, nullable=False); contact_number = Column(String, nullable=False); purpose = Column(String, nullable=False); company_supplier = Column(String, nullable=False); item_description = Column(String, nullable=False); quantity = Column(Integer, nullable=False); vehicle_no = Column(String, nullable=False); driver_name = Column(String, nullable=False); entry_date = Column(String, nullable=False); entry_time = Column(String, nullable=False); exit_date = Column(String, nullable=True); exit_time = Column(String, nullable=True); gate_no = Column(String, nullable=False); expected_return_date = Column(String, nullable=True); blocklist_status = Column(String, nullable=False); security_officer = Column(String, nullable=False); remarks = Column(String, nullable=False)

# ==============================================================================
# 3. Pydantic SCHEMAS (Data Validation)
# ==============================================================================

# --- Base Schemas for individual entries ---
class InwardNonReturnableSchema(BaseModel):
    item_id: str; item_description: str; quantity: int; supplier_name: str; supplier_contact: str; entry_date: str; entry_time: str; gate_no: str; vehicle_no: str; driver_name: str; security_officer: str; remarks: str
class InwardReturnableSchema(BaseModel):
    item_id: str; item_description: str; quantity: int; supplier_name: str; supplier_contact: str; entry_date: str; entry_time: str; gate_no: str; vehicle_no: str; driver_name: str; expected_return_date: str; security_officer: str; remarks: str
class OutwardNonReturnableSchema(BaseModel):
    item_id: str; item_description: str; quantity: int; recipient_name: str; recipient_contact: str; outward_date: str; outward_time: str; gate_no: str; vehicle_no: str; driver_name: str; security_officer: str; remarks: str
class OutwardReturnableSchema(BaseModel):
    item_id: str; item_description: str; quantity: int; recipient_name: str; recipient_contact: str; outward_date: str; outward_time: str; gate_no: str; vehicle_no: str; driver_name: str; expected_return_date: str; security_officer: str; remarks: str
class MoveInSchema(BaseModel):
    move_in_id: str; name: str; contact_number: str; address: str; move_in_date: str; move_in_time: str; gate_no: str; vehicle_no: str; driver_name: str; no_of_persons: int; security_officer: str; remarks: str
class MoveOutSchema(BaseModel):
    move_out_id: str; name: str; contact_number: str; address: str; move_out_date: str; move_out_time: str; gate_no: str; vehicle_no: str; driver_name: str; no_of_persons: int; security_officer: str; remarks: str
class InteriorWorkTrackingSchema(BaseModel):
    work_id: str; resident_name: str; contact_number: str; address: str; work_description: str; start_date: str; end_date: str; contractor_name: str; contractor_contact: str; no_of_workers: int; security_officer: str; remarks: str
class WorkPermitIssuanceSchema(BaseModel):
    permit_id: str; worker_name: str; contact_number: str; company_name: str; work_type: str; permit_issue_date: str; permit_expiry_date: str; address: str; security_officer: str; remarks: str
class GatePassManagementSchema(BaseModel):
    pass_id: str; name: str; contact_number: str; purpose: str; entry_date: str; entry_time: str; exit_date: Optional[str] = None; exit_time: Optional[str] = None; gate_no: str; vehicle_no: str; security_officer: str; remarks: str
class BlocklistManagementSchema(BaseModel):
    blocklist_id: str; name: str; contact_number: str; reason_for_block: str; date_added: str; added_by: str; remarks: str
class DailyEntryDetailsSchema(BaseModel):
    entry_id: str; name: str; contact_number: str; purpose: str; entry_date: str; entry_time: str; exit_time: Optional[str] = None; gate_no: str; vehicle_no: str; security_officer: str; remarks: str
class WaterTankerManagementSchema(BaseModel):
    tanker_id: str; supplier_name: str; contact_number: str; vehicle_no: str; driver_name: str; capacity_liters: int; entry_date: str; entry_time: str; gate_no: str; security_officer: str; remarks: str
class VendorEntryManagementSchema(BaseModel):
    vendor_id: str; vendor_name: str; contact_number: str; company_name: str; purpose: str; entry_date: str; entry_time: str; exit_time: Optional[str] = None; gate_no: str; security_officer: str; remarks: str
class StaffEntryManagementSchema(BaseModel):
    staff_id: str; name: str; contact_number: str; department: str; entry_date: str; entry_time: str; exit_time: Optional[str] = None; gate_no: str; security_officer: str; remarks: str
class EmergencyContactDetailsSchema(BaseModel):
    contact_id: str; name: str; contact_number: str; relation: str; address: str; emergency_type: str; security_officer: str; remarks: str
class VisitorManagementLogSchema(BaseModel):
    record_id: str; type: str; name: str; contact_number: str; purpose: str; company_supplier: str; item_description: str; quantity: int; vehicle_no: str; driver_name: str; entry_date: str; entry_time: str; exit_date: Optional[str] = None; exit_time: Optional[str] = None; gate_no: str; expected_return_date: Optional[str] = None; blocklist_status: str; security_officer: str; remarks: str

# --- Schemas for Create and Update Payloads ---
class VisitorManagementReportCreate(BaseModel):
    property_id: str
    inward_non_returnable: List[InwardNonReturnableSchema] = []
    inward_returnable: List[InwardReturnableSchema] = []
    outward_non_returnable: List[OutwardNonReturnableSchema] = []
    outward_returnable: List[OutwardReturnableSchema] = []
    move_in: List[MoveInSchema] = []
    move_out: List[MoveOutSchema] = []
    interior_work_tracking: List[InteriorWorkTrackingSchema] = []
    work_permit_issuance: List[WorkPermitIssuanceSchema] = []
    gate_pass_management: List[GatePassManagementSchema] = []
    blocklist_management: List[BlocklistManagementSchema] = []
    daily_entry_details: List[DailyEntryDetailsSchema] = []
    water_tanker_management: List[WaterTankerManagementSchema] = []
    vendor_entry_management: List[VendorEntryManagementSchema] = []
    staff_entry_management: List[StaffEntryManagementSchema] = []
    emergency_contact_details: List[EmergencyContactDetailsSchema] = []
    visitor_management_log: List[VisitorManagementLogSchema] = []

class VisitorManagementReportUpdate(BaseModel):
    property_id: Optional[str] = None
    inward_non_returnable: Optional[List[InwardNonReturnableSchema]] = None
    inward_returnable: Optional[List[InwardReturnableSchema]] = None
    outward_non_returnable: Optional[List[OutwardNonReturnableSchema]] = None
    outward_returnable: Optional[List[OutwardReturnableSchema]] = None
    move_in: Optional[List[MoveInSchema]] = None
    move_out: Optional[List[MoveOutSchema]] = None
    interior_work_tracking: Optional[List[InteriorWorkTrackingSchema]] = None
    work_permit_issuance: Optional[List[WorkPermitIssuanceSchema]] = None
    gate_pass_management: Optional[List[GatePassManagementSchema]] = None
    blocklist_management: Optional[List[BlocklistManagementSchema]] = None
    daily_entry_details: Optional[List[DailyEntryDetailsSchema]] = None
    water_tanker_management: Optional[List[WaterTankerManagementSchema]] = None
    vendor_entry_management: Optional[List[VendorEntryManagementSchema]] = None
    staff_entry_management: Optional[List[StaffEntryManagementSchema]] = None
    emergency_contact_details: Optional[List[EmergencyContactDetailsSchema]] = None
    visitor_management_log: Optional[List[VisitorManagementLogSchema]] = None

# --- Response Schemas (include DB-generated fields like id) ---
class InwardNonReturnableResponse(InwardNonReturnableSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class InwardReturnableResponse(InwardReturnableSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class OutwardNonReturnableResponse(OutwardNonReturnableSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class OutwardReturnableResponse(OutwardReturnableSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class MoveInResponse(MoveInSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class MoveOutResponse(MoveOutSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class InteriorWorkTrackingResponse(InteriorWorkTrackingSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class WorkPermitIssuanceResponse(WorkPermitIssuanceSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class GatePassManagementResponse(GatePassManagementSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class BlocklistManagementResponse(BlocklistManagementSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class DailyEntryDetailsResponse(DailyEntryDetailsSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class WaterTankerManagementResponse(WaterTankerManagementSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class VendorEntryManagementResponse(VendorEntryManagementSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class StaffEntryManagementResponse(StaffEntryManagementSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class EmergencyContactDetailsResponse(EmergencyContactDetailsSchema): 
    id: str; report_id: str
    class Config: from_attributes = True
class VisitorManagementLogResponse(VisitorManagementLogSchema): 
    id: str; report_id: str
    class Config: from_attributes = True

class VisitorManagementReportResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    inward_non_returnable: List[InwardNonReturnableResponse] = []
    inward_returnable: List[InwardReturnableResponse] = []
    outward_non_returnable: List[OutwardNonReturnableResponse] = []
    outward_returnable: List[OutwardReturnableResponse] = []
    move_in: List[MoveInResponse] = []
    move_out: List[MoveOutResponse] = []
    interior_work_tracking: List[InteriorWorkTrackingResponse] = []
    work_permit_issuance: List[WorkPermitIssuanceResponse] = []
    gate_pass_management: List[GatePassManagementResponse] = []
    blocklist_management: List[BlocklistManagementResponse] = []
    daily_entry_details: List[DailyEntryDetailsResponse] = []
    water_tanker_management: List[WaterTankerManagementResponse] = []
    vendor_entry_management: List[VendorEntryManagementResponse] = []
    staff_entry_management: List[StaffEntryManagementResponse] = []
    emergency_contact_details: List[EmergencyContactDetailsResponse] = []
    visitor_management_log: List[VisitorManagementLogResponse] = []

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, orm_model: VisitorManagementReport):
        """Convert SQLAlchemy ORM object to Pydantic response model"""
        return cls(
            id=orm_model.id,
            property_id=orm_model.property_id,
            created_at=orm_model.created_at,
            updated_at=orm_model.updated_at,
            inward_non_returnable=[InwardNonReturnableResponse.from_orm(item) for item in orm_model.inward_non_returnable],
            inward_returnable=[InwardReturnableResponse.from_orm(item) for item in orm_model.inward_returnable],
            outward_non_returnable=[OutwardNonReturnableResponse.from_orm(item) for item in orm_model.outward_non_returnable],
            outward_returnable=[OutwardReturnableResponse.from_orm(item) for item in orm_model.outward_returnable],
            move_in=[MoveInResponse.from_orm(item) for item in orm_model.move_in],
            move_out=[MoveOutResponse.from_orm(item) for item in orm_model.move_out],
            interior_work_tracking=[InteriorWorkTrackingResponse.from_orm(item) for item in orm_model.interior_work_tracking],
            work_permit_issuance=[WorkPermitIssuanceResponse.from_orm(item) for item in orm_model.work_permit_issuance],
            gate_pass_management=[GatePassManagementResponse.from_orm(item) for item in orm_model.gate_pass_management],
            blocklist_management=[BlocklistManagementResponse.from_orm(item) for item in orm_model.blocklist_management],
            daily_entry_details=[DailyEntryDetailsResponse.from_orm(item) for item in orm_model.daily_entry_details],
            water_tanker_management=[WaterTankerManagementResponse.from_orm(item) for item in orm_model.water_tanker_management],
            vendor_entry_management=[VendorEntryManagementResponse.from_orm(item) for item in orm_model.vendor_entry_management],
            staff_entry_management=[StaffEntryManagementResponse.from_orm(item) for item in orm_model.staff_entry_management],
            emergency_contact_details=[EmergencyContactDetailsResponse.from_orm(item) for item in orm_model.emergency_contact_details],
            visitor_management_log=[VisitorManagementLogResponse.from_orm(item) for item in orm_model.visitor_management_log]
        )



# This command creates all the database tables defined in the models.
# It's good practice to run this once when you first set up your application.
# You can also manage migrations with a tool like Alembic.
Base.metadata.create_all(bind=engine)

# Helper dictionary to map schema field names to their corresponding SQLAlchemy models.
MODEL_MAP = {
    "inward_non_returnable": InwardNonReturnable,
    "inward_returnable": InwardReturnable,
    "outward_non_returnable": OutwardNonReturnable,
    "outward_returnable": OutwardReturnable,
    "move_in": MoveIn,
    "move_out": MoveOut,
    "interior_work_tracking": InteriorWorkTracking,
    "work_permit_issuance": WorkPermitIssuance,
    "gate_pass_management": GatePassManagement,
    "blocklist_management": BlocklistManagement,
    "daily_entry_details": DailyEntryDetails,
    "water_tanker_management": WaterTankerManagement,
    "vendor_entry_management": VendorEntryManagement,
    "staff_entry_management": StaffEntryManagement,
    "emergency_contact_details": EmergencyContactDetails,
    "visitor_management_log": VisitorManagementLog,
}

# --- API Endpoints ---
# Define visitor management model map locally to avoid conflicts
VISITOR_MODEL_MAP = {
    "inward_non_returnable": InwardNonReturnable,
    "inward_returnable": InwardReturnable,
    "outward_non_returnable": OutwardNonReturnable,
    "outward_returnable": OutwardReturnable,
    "move_in": MoveIn,
    "move_out": MoveOut,
    "interior_work_tracking": InteriorWorkTracking,
    "work_permit_issuance": WorkPermitIssuance,
    "gate_pass_management": GatePassManagement,
    "blocklist_management": BlocklistManagement,
    "daily_entry_details": DailyEntryDetails,
    "water_tanker_management": WaterTankerManagement,
    "vendor_entry_management": VendorEntryManagement,
    "staff_entry_management": StaffEntryManagement,
    "emergency_contact_details": EmergencyContactDetails,
    "visitor_management_log": VisitorManagementLog,
}

@app.post("/visitor-management-reports/", response_model=VisitorManagementReportResponse, status_code=status.HTTP_201_CREATED, tags=["Visitor Management Report"])
def create_visitor_management_report(report: VisitorManagementReportCreate, db: Session = Depends(get_db)):
    """
    Create a new visitor management report with all its associated entries.
    """
    try:
        db_report = VisitorManagementReport(property_id=report.property_id)
        db.add(db_report)
        db.flush()  # Use flush to get the report's generated ID before commit.

        # Iterate through the model map to create all child entries from the payload.
        for field, model in VISITOR_MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(report_id=db_report.id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return VisitorManagementReportResponse.from_orm_model(db_report)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")


@app.get("/visitor-management-reports/", response_model=List[VisitorManagementReportResponse], tags=["Visitor Management Report"])
def get_all_visitor_management_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Retrieve all visitor management reports, with optional filtering by property_id.
    """
    try:
        query = db.query(VisitorManagementReport)
        if property_id:
            query = query.filter(VisitorManagementReport.property_id == property_id)
        
        reports = query.offset(skip).limit(limit).all()
        return [VisitorManagementReportResponse.from_orm_model(report) for report in reports]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")


@app.get("/visitor-management-reports/{report_id}", response_model=VisitorManagementReportResponse, tags=["Visitor Management Report"])
def get_visitor_management_report_by_id(report_id: str, db: Session = Depends(get_db)):
    """
    Retrieve a single visitor management report by its ID.
    """
    report = db.query(VisitorManagementReport).filter(VisitorManagementReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return VisitorManagementReportResponse.from_orm_model(report)


@app.put("/visitor-management-reports/{report_id}", response_model=VisitorManagementReportResponse, tags=["Visitor Management Report"])
def update_visitor_management_report(report_id: str, report_update: VisitorManagementReportUpdate, db: Session = Depends(get_db)):
    """
    Update a visitor management report.
    For lists of entries (e.g., move_in), this replaces the entire existing list with the new one.
    """
    db_report = db.query(VisitorManagementReport).filter(VisitorManagementReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        # Update property_id if provided in the payload.
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        # Use the "delete and replace" strategy for updating child entries.
        for field, model in VISITOR_MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                # Delete all existing entries of this type for the report.
                db.query(model).filter(model.report_id == report_id).delete(synchronize_session=False)
                # Create the new entries from the payload.
                for entry_data in update_entries:
                    db_entry = model(report_id=report_id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return VisitorManagementReportResponse.from_orm_model(db_report)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")


@app.delete("/visitor-management-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Visitor Management Report"])
def delete_visitor_management_report(report_id: str, db: Session = Depends(get_db)):
    """
    Delete a visitor management report and all its associated entries.
    """
    report = db.query(VisitorManagementReport).filter(VisitorManagementReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    try:
        db.delete(report)  # The 'cascade="all, delete-orphan"' setting handles deleting all children.
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")


@app.get("/visitor-management-reports/property/{property_id}", response_model=List[VisitorManagementReportResponse], tags=["Visitor Management Report"])
def get_reports_by_property(property_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all reports associated with a specific property ID.
    """
    return get_all_visitor_management_reports(skip=skip, limit=limit, property_id=property_id, db=db)


@app.delete("/visitor-management-reports/property/{property_id}", tags=["Visitor Management Report"])
def delete_reports_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Delete all reports (and their child entries) associated with a specific property ID.
    """
    try:
        # We must fetch the reports first to trigger the ORM's cascade delete mechanism.
        reports_to_delete = db.query(VisitorManagementReport).filter(VisitorManagementReport.property_id == property_id).all()
        if not reports_to_delete:
            raise HTTPException(status_code=404, detail=f"No reports found for property ID {property_id}")
        
        count = len(reports_to_delete)
        for report in reports_to_delete:
            db.delete(report)
            
        db.commit()
        return {"message": f"Successfully deleted {count} reports for property {property_id}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting reports by property: {str(e)}")


class CommunityReport(Base):
    __tablename__ = "community_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tickets = relationship("Ticket", backref="report", cascade="all, delete-orphan")
    ticket_assignments = relationship("TicketAssignment", backref="report", cascade="all, delete-orphan")
    notices = relationship("Notice", backref="report", cascade="all, delete-orphan")
    parking_stickers = relationship("ParkingSticker", backref="report", cascade="all, delete-orphan")
    announcements = relationship("Announcement", backref="report", cascade="all, delete-orphan")
    move_in_coordinations = relationship("MoveInCoordination", backref="report", cascade="all, delete-orphan")
    move_out_coordinations = relationship("MoveOutCoordination", backref="report", cascade="all, delete-orphan")
    interior_work_approvals = relationship("InteriorWorkApproval", backref="report", cascade="all, delete-orphan")
    work_permit_trackings = relationship("WorkPermitTracking", backref="report", cascade="all, delete-orphan")

# --- Child Entry Models ---
class Ticket(Base):
    __tablename__ = 'tickets'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    ticket_id = Column(String); resident_name = Column(String); contact_number = Column(String); address = Column(String); issue_type = Column(String); description = Column(String); priority = Column(String); status = Column(String); reported_date = Column(String); reported_time = Column(String); resolution_date = Column(String, nullable=True); resolution_time = Column(String, nullable=True); assigned_team = Column(String); security_officer = Column(String); remarks = Column(String)

class TicketAssignment(Base):
    __tablename__ = 'ticket_assignments'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    assignment_id = Column(String); ticket_id = Column(String); assigned_to = Column(String); department = Column(String); assignment_date = Column(String); assignment_time = Column(String); priority = Column(String); status = Column(String); expected_resolution_date = Column(String); security_officer = Column(String); remarks = Column(String)

class Notice(Base):
    __tablename__ = 'notices'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    notice_id = Column(String); title = Column(String); description = Column(String); target_audience = Column(String); issue_date = Column(String); expiry_date = Column(String); issued_by = Column(String); communication_channel = Column(String); status = Column(String); security_officer = Column(String); remarks = Column(String)

class ParkingSticker(Base):
    __tablename__ = 'parking_stickers'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    sticker_id = Column(String); resident_name = Column(String); contact_number = Column(String); vehicle_no = Column(String); vehicle_type = Column(String); sticker_issue_date = Column(String); sticker_expiry_date = Column(String); address = Column(String); status = Column(String); security_officer = Column(String); remarks = Column(String)

class Announcement(Base):
    __tablename__ = 'announcements'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    communication_id = Column(String); title = Column(String); description = Column(String); target_audience = Column(String); sent_date = Column(String); sent_time = Column(String); sent_by = Column(String); channel = Column(String); status = Column(String); security_officer = Column(String); remarks = Column(String)

class MoveInCoordination(Base):
    __tablename__ = 'move_in_coordinations'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    move_in_id = Column(String); name = Column(String); contact_number = Column(String); address = Column(String); move_in_date = Column(String); move_in_time = Column(String); vehicle_no = Column(String); driver_name = Column(String); no_of_persons = Column(String); security_officer = Column(String); remarks = Column(String)

class MoveOutCoordination(Base):
    __tablename__ = 'move_out_coordinations'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    move_out_id = Column(String); name = Column(String); contact_number = Column(String); address = Column(String); move_out_date = Column(String); move_out_time = Column(String); vehicle_no = Column(String); driver_name = Column(String); no_of_persons = Column(String); security_officer = Column(String); remarks = Column(String)

class InteriorWorkApproval(Base):
    __tablename__ = 'interior_work_approvals'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    approval_id = Column(String); resident_name = Column(String); contact_number = Column(String); address = Column(String); work_description = Column(String); approval_status = Column(String); approval_date = Column(String); start_date = Column(String); end_date = Column(String); contractor_name = Column(String); security_officer = Column(String); remarks = Column(String)

class WorkPermitTracking(Base):
    __tablename__ = 'work_permit_trackings'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    community_report_id = Column(String, ForeignKey("community_reports.id"), nullable=False)
    permit_id = Column(String); worker_name = Column(String); contact_number = Column(String); company_name = Column(String); work_type = Column(String); permit_issue_date = Column(String); permit_expiry_date = Column(String); address = Column(String); status = Column(String); security_officer = Column(String); remarks = Column(String)

class TicketSchema(BaseModel):
    ticket_id: str; resident_name: str; contact_number: str; address: str; issue_type: str; description: str; priority: str; status: str; reported_date: str; reported_time: str; resolution_date: Optional[str] = None; resolution_time: Optional[str] = None; assigned_team: str; security_officer: str; remarks: str
class TicketAssignmentSchema(BaseModel):
    assignment_id: str; ticket_id: str; assigned_to: str; department: str; assignment_date: str; assignment_time: str; priority: str; status: str; expected_resolution_date: str; security_officer: str; remarks: str
class NoticeSchema(BaseModel):
    notice_id: str; title: str; description: str; target_audience: str; issue_date: str; expiry_date: str; issued_by: str; communication_channel: str; status: str; security_officer: str; remarks: str
class ParkingStickerSchema(BaseModel):
    sticker_id: str; resident_name: str; contact_number: str; vehicle_no: str; vehicle_type: str; sticker_issue_date: str; sticker_expiry_date: str; address: str; status: str; security_officer: str; remarks: str
class AnnouncementSchema(BaseModel):
    communication_id: str; title: str; description: str; target_audience: str; sent_date: str; sent_time: str; sent_by: str; channel: str; status: str; security_officer: str; remarks: str
class MoveInCoordinationSchema(BaseModel):
    move_in_id: str; name: str; contact_number: str; address: str; move_in_date: str; move_in_time: str; vehicle_no: str; driver_name: str; no_of_persons: int; security_officer: str; remarks: str
class MoveOutCoordinationSchema(BaseModel):
    move_out_id: str; name: str; contact_number: str; address: str; move_out_date: str; move_out_time: str; vehicle_no: str; driver_name: str; no_of_persons: int; security_officer: str; remarks: str
class InteriorWorkApprovalSchema(BaseModel):
    approval_id: str; resident_name: str; contact_number: str; address: str; work_description: str; approval_status: str; approval_date: str; start_date: str; end_date: str; contractor_name: str; security_officer: str; remarks: str
class WorkPermitTrackingSchema(BaseModel):
    permit_id: str; worker_name: str; contact_number: str; company_name: str; work_type: str; permit_issue_date: str; permit_expiry_date: str; address: str; status: str; security_officer: str; remarks: str

# --- Schemas for Create and Update Payloads ---
class CommunityReportCreate(BaseModel):
    property_id: str
    tickets: List[TicketSchema] = []
    ticket_assignments: List[TicketAssignmentSchema] = []
    notices: List[NoticeSchema] = []
    parking_stickers: List[ParkingStickerSchema] = []
    announcements: List[AnnouncementSchema] = []
    move_in_coordinations: List[MoveInCoordinationSchema] = []
    move_out_coordinations: List[MoveOutCoordinationSchema] = []
    interior_work_approvals: List[InteriorWorkApprovalSchema] = []
    work_permit_trackings: List[WorkPermitTrackingSchema] = []

class CommunityReportUpdate(BaseModel):
    property_id: Optional[str] = None
    tickets: Optional[List[TicketSchema]] = None
    ticket_assignments: Optional[List[TicketAssignmentSchema]] = None
    notices: Optional[List[NoticeSchema]] = None
    parking_stickers: Optional[List[ParkingStickerSchema]] = None
    announcements: Optional[List[AnnouncementSchema]] = None
    move_in_coordinations: Optional[List[MoveInCoordinationSchema]] = None
    move_out_coordinations: Optional[List[MoveOutCoordinationSchema]] = None
    interior_work_approvals: Optional[List[InteriorWorkApprovalSchema]] = None
    work_permit_trackings: Optional[List[WorkPermitTrackingSchema]] = None

# --- Response Schemas ---
class TicketResponse(TicketSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True
class TicketAssignmentResponse(TicketAssignmentSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True
class NoticeResponse(NoticeSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True
class ParkingStickerResponse(ParkingStickerSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True
class AnnouncementResponse(AnnouncementSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True
class MoveInCoordinationResponse(MoveInCoordinationSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True
class MoveOutCoordinationResponse(MoveOutCoordinationSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True
class InteriorWorkApprovalResponse(InteriorWorkApprovalSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True
class WorkPermitTrackingResponse(WorkPermitTrackingSchema): 
    id: str; community_report_id: str
    class Config: from_attributes = True

class CommunityReportResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    tickets: List[TicketResponse] = []
    ticket_assignments: List[TicketAssignmentResponse] = []
    notices: List[NoticeResponse] = []
    parking_stickers: List[ParkingStickerResponse] = []
    announcements: List[AnnouncementResponse] = []
    move_in_coordinations: List[MoveInCoordinationResponse] = []
    move_out_coordinations: List[MoveOutCoordinationResponse] = []
    interior_work_approvals: List[InteriorWorkApprovalResponse] = []
    work_permit_trackings: List[WorkPermitTrackingResponse] = []

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, orm_model: CommunityReport):
        """Convert SQLAlchemy ORM object to Pydantic response model"""
        return cls(
            id=orm_model.id,
            property_id=orm_model.property_id,
            created_at=orm_model.created_at,
            updated_at=orm_model.updated_at,
            tickets=[TicketResponse.from_orm(item) for item in orm_model.tickets],
            ticket_assignments=[TicketAssignmentResponse.from_orm(item) for item in orm_model.ticket_assignments],
            notices=[NoticeResponse.from_orm(item) for item in orm_model.notices],
            parking_stickers=[ParkingStickerResponse.from_orm(item) for item in orm_model.parking_stickers],
            announcements=[AnnouncementResponse.from_orm(item) for item in orm_model.announcements],
            move_in_coordinations=[MoveInCoordinationResponse.from_orm(item) for item in orm_model.move_in_coordinations],
            move_out_coordinations=[MoveOutCoordinationResponse.from_orm(item) for item in orm_model.move_out_coordinations],
            interior_work_approvals=[InteriorWorkApprovalResponse.from_orm(item) for item in orm_model.interior_work_approvals],
            work_permit_trackings=[WorkPermitTrackingResponse.from_orm(item) for item in orm_model.work_permit_trackings]
        )

Base.metadata.create_all(bind=engine)

# Define community management model map locally to avoid conflicts
COMMUNITY_MODEL_MAP = {
    "tickets": Ticket,
    "ticket_assignments": TicketAssignment,
    "notices": Notice,
    "parking_stickers": ParkingSticker,
    "announcements": Announcement,
    "move_in_coordinations": MoveInCoordination,
    "move_out_coordinations": MoveOutCoordination,
    "interior_work_approvals": InteriorWorkApproval,
    "work_permit_trackings": WorkPermitTracking,
}

@app.post("/community-reports/", response_model=CommunityReportResponse, status_code=status.HTTP_201_CREATED, tags=["Community Management Report"])
def create_community_report(report: CommunityReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = CommunityReport(property_id=report.property_id)
        db.add(db_report)
        db.flush()

        for field, model in COMMUNITY_MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(community_report_id=db_report.id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return CommunityReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@app.get("/community-reports/", response_model=List[CommunityReportResponse], tags=["Community Management Report"])
def get_all_community_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(CommunityReport)
        if property_id:
            query = query.filter(CommunityReport.property_id == property_id)
        reports = query.offset(skip).limit(limit).all()
        return [CommunityReportResponse.from_orm_model(report) for report in reports]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/community-reports/{report_id}", response_model=CommunityReportResponse, tags=["Community Management Report"])
def get_community_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(CommunityReport).filter(CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Community report not found")
    return CommunityReportResponse.from_orm_model(report)

@app.put("/community-reports/{report_id}", response_model=CommunityReportResponse, tags=["Community Management Report"])
def update_community_report(report_id: str, report_update: CommunityReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(CommunityReport).filter(CommunityReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Community report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, model in COMMUNITY_MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.community_report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(community_report_id=report_id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return CommunityReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@app.delete("/community-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Community Management Report"])
def delete_community_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(CommunityReport).filter(CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Community report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")

@app.get("/community-reports/property/{property_id}", response_model=List[CommunityReportResponse], tags=["Community Management Report"])
def get_reports_by_property(property_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_all_community_reports(skip=skip, limit=limit, property_id=property_id, db=db)

@app.delete("/community-reports/property/{property_id}", tags=["Community Management Report"])
def delete_reports_by_property(property_id: str, db: Session = Depends(get_db)):
    try:
        reports_to_delete = db.query(CommunityReport).filter(CommunityReport.property_id == property_id).all()
        if not reports_to_delete:
            raise HTTPException(status_code=404, detail=f"No reports found for property ID {property_id}")
        
        count = len(reports_to_delete)
        for report in reports_to_delete:
            db.delete(report)
            
        db.commit()
        return {"message": f"Successfully deleted {count} reports for property {property_id}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting reports by property: {str(e)}")

# --- Main Parent Model ---
class InventoryReport(Base):
    __tablename__ = "inventory_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    inventory_items = relationship("InventoryItem", backref="report", cascade="all, delete-orphan")
    stock_transactions = relationship("StockTransaction", backref="report", cascade="all, delete-orphan")
    min_max_levels = relationship("MinMaxLevel", backref="report", cascade="all, delete-orphan")
    consumption_reports = relationship("ConsumptionReport", backref="report", cascade="all, delete-orphan")
    expiry_damage_logs = relationship("ExpiryDamageLog", backref="report", cascade="all, delete-orphan")

# --- Child Entry Models ---
class InventoryItem(Base):
    __tablename__ = 'inventory_items'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inventory_report_id = Column(String, ForeignKey("inventory_reports.id"), nullable=False)
    item_id = Column(String); item_name = Column(String); category = Column(String); current_stock = Column(Integer); unit = Column(String); location = Column(String); last_updated = Column(String); responsible_person = Column(String); remarks = Column(String)

class StockTransaction(Base):
    __tablename__ = 'stock_transactions'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inventory_report_id = Column(String, ForeignKey("inventory_reports.id"), nullable=False)
    transaction_id = Column(String); item_id = Column(String); item_name = Column(String); transaction_type = Column(String); quantity = Column(Integer); unit = Column(String); date = Column(String); time = Column(String); supplier_recipient = Column(String); vehicle_no = Column(String, nullable=True); responsible_person = Column(String); remarks = Column(String)

class MinMaxLevel(Base):
    __tablename__ = 'min_max_levels'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inventory_report_id = Column(String, ForeignKey("inventory_reports.id"), nullable=False)
    item_id = Column(String); item_name = Column(String); category = Column(String); current_stock = Column(Integer); minimum_level = Column(Integer); maximum_level = Column(Integer); status = Column(String); last_checked = Column(String); responsible_person = Column(String); remarks = Column(String)

class ConsumptionReport(Base):
    __tablename__ = 'consumption_reports'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inventory_report_id = Column(String, ForeignKey("inventory_reports.id"), nullable=False)
    report_id = Column(String); item_id = Column(String); item_name = Column(String); category = Column(String); quantity_consumed = Column(Integer); unit = Column(String); period_start = Column(String); period_end = Column(String); consumed_by = Column(String); purpose = Column(String); responsible_person = Column(String); remarks = Column(String)

class ExpiryDamageLog(Base):
    __tablename__ = 'expiry_damage_logs'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inventory_report_id = Column(String, ForeignKey("inventory_reports.id"), nullable=False)
    log_id = Column(String); item_id = Column(String); item_name = Column(String); category = Column(String); quantity = Column(Integer); unit = Column(String); status = Column(String); date_recorded = Column(String); expiry_date = Column(String, nullable=True); reason = Column(String); responsible_person = Column(String); remarks = Column(String)


# ==============================================================================
# 3. Pydantic SCHEMAS (Data Validation)
# ==============================================================================

# --- Base Schemas for individual entries ---
class InventoryItemSchema(BaseModel):
    item_id: str; item_name: str; category: str; current_stock: int; unit: str; location: str; last_updated: str; responsible_person: str; remarks: str
class StockTransactionSchema(BaseModel):
    transaction_id: str; item_id: str; item_name: str; transaction_type: str; quantity: int; unit: str; date: str; time: str; supplier_recipient: str; vehicle_no: Optional[str] = None; responsible_person: str; remarks: str
class MinMaxLevelSchema(BaseModel):
    item_id: str; item_name: str; category: str; current_stock: int; minimum_level: int; maximum_level: int; status: str; last_checked: str; responsible_person: str; remarks: str
class ConsumptionReportSchema(BaseModel):
    report_id: str; item_id: str; item_name: str; category: str; quantity_consumed: int; unit: str; period_start: str; period_end: str; consumed_by: str; purpose: str; responsible_person: str; remarks: str
class ExpiryDamageLogSchema(BaseModel):
    log_id: str; item_id: str; item_name: str; category: str; quantity: int; unit: str; status: str; date_recorded: str; expiry_date: Optional[str] = None; reason: str; responsible_person: str; remarks: str

# --- Schemas for Create and Update Payloads ---
class InventoryReportCreate(BaseModel):
    property_id: str
    inventory_items: List[InventoryItemSchema] = []
    stock_transactions: List[StockTransactionSchema] = []
    min_max_levels: List[MinMaxLevelSchema] = []
    consumption_reports: List[ConsumptionReportSchema] = []
    expiry_damage_logs: List[ExpiryDamageLogSchema] = []

class InventoryReportUpdate(BaseModel):
    property_id: Optional[str] = None
    inventory_items: Optional[List[InventoryItemSchema]] = None
    stock_transactions: Optional[List[StockTransactionSchema]] = None
    min_max_levels: Optional[List[MinMaxLevelSchema]] = None
    consumption_reports: Optional[List[ConsumptionReportSchema]] = None
    expiry_damage_logs: Optional[List[ExpiryDamageLogSchema]] = None

# --- Response Schemas ---
class InventoryItemResponse(InventoryItemSchema): 
    id: str; inventory_report_id: str
    class Config: from_attributes = True
class StockTransactionResponse(StockTransactionSchema): 
    id: str; inventory_report_id: str
    class Config: from_attributes = True
class MinMaxLevelResponse(MinMaxLevelSchema): 
    id: str; inventory_report_id: str
    class Config: from_attributes = True
class ConsumptionReportResponse(ConsumptionReportSchema): 
    id: str; inventory_report_id: str
    class Config: from_attributes = True
class ExpiryDamageLogResponse(ExpiryDamageLogSchema): 
    id: str; inventory_report_id: str
    class Config: from_attributes = True

class InventoryReportResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    inventory_items: List[InventoryItemResponse] = []
    stock_transactions: List[StockTransactionResponse] = []
    min_max_levels: List[MinMaxLevelResponse] = []
    consumption_reports: List[ConsumptionReportResponse] = []
    expiry_damage_logs: List[ExpiryDamageLogResponse] = []

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, orm_model: InventoryReport):
        """Convert SQLAlchemy ORM object to Pydantic response model"""
        return cls(
            id=orm_model.id,
            property_id=orm_model.property_id,
            created_at=orm_model.created_at,
            updated_at=orm_model.updated_at,
            inventory_items=[InventoryItemResponse.from_orm(item) for item in orm_model.inventory_items],
            stock_transactions=[StockTransactionResponse.from_orm(item) for item in orm_model.stock_transactions],
            min_max_levels=[MinMaxLevelResponse.from_orm(item) for item in orm_model.min_max_levels],
            consumption_reports=[ConsumptionReportResponse.from_orm(item) for item in orm_model.consumption_reports],
            expiry_damage_logs=[ExpiryDamageLogResponse.from_orm(item) for item in orm_model.expiry_damage_logs]
        )

Base.metadata.create_all(bind=engine)

# Define inventory management model map locally to avoid conflicts
INVENTORY_MODEL_MAP = {
    "inventory_items": InventoryItem,
    "stock_transactions": StockTransaction,
    "min_max_levels": MinMaxLevel,
    "consumption_reports": ConsumptionReport,
    "expiry_damage_logs": ExpiryDamageLog,
}

@app.post("/inventory-reports/", response_model=InventoryReportResponse, status_code=status.HTTP_201_CREATED, tags=["Inventory Management Report"])
def create_inventory_report(report: InventoryReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = InventoryReport(property_id=report.property_id)
        db.add(db_report)
        db.flush()

        for field, model in INVENTORY_MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(inventory_report_id=db_report.id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return InventoryReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@app.get("/inventory-reports/", response_model=List[InventoryReportResponse], tags=["Inventory Management Report"])
def get_all_inventory_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(InventoryReport)
        if property_id:
            query = query.filter(InventoryReport.property_id == property_id)
        reports = query.offset(skip).limit(limit).all()
        return [InventoryReportResponse.from_orm_model(report) for report in reports]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/inventory-reports/{report_id}", response_model=InventoryReportResponse, tags=["Inventory Management Report"])
def get_inventory_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(InventoryReport).filter(InventoryReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Inventory report not found")
    return InventoryReportResponse.from_orm_model(report)

@app.put("/inventory-reports/{report_id}", response_model=InventoryReportResponse, tags=["Inventory Management Report"])
def update_inventory_report(report_id: str, report_update: InventoryReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(InventoryReport).filter(InventoryReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Inventory report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, model in INVENTORY_MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.inventory_report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(inventory_report_id=report_id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return InventoryReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@app.delete("/inventory-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Inventory Management Report"])
def delete_inventory_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(InventoryReport).filter(InventoryReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Inventory report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")

# --- Main Parent Model ---
class AssetReport(Base):
    __tablename__ = "asset_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assets = relationship("AssetMain", backref="report", cascade="all, delete-orphan")
    movement_logs = relationship("AssetMovementLog", backref="report", cascade="all, delete-orphan")
    amc_warranties = relationship("AmcWarranty", backref="report", cascade="all, delete-orphan")
    maintenance_schedules = relationship("MaintenanceSchedule", backref="report", cascade="all, delete-orphan")
    audits = relationship("AssetAudit", backref="report", cascade="all, delete-orphan")
    depreciations = relationship("Depreciation", backref="report", cascade="all, delete-orphan")

# --- Child Entry Models ---
class AssetMain(Base):
    __tablename__ = 'assets_main'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_report_id = Column(String, ForeignKey("asset_reports.id"), nullable=False)
    asset_id = Column(String); asset_name = Column(String); category = Column(String); tag_barcode = Column(String); location = Column(String); purchase_date = Column(String); cost = Column(Float); status = Column(String); assigned_to = Column(String); responsible_person = Column(String); remarks = Column(String)

class AssetMovementLog(Base):
    __tablename__ = 'asset_movement_logs'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_report_id = Column(String, ForeignKey("asset_reports.id"), nullable=False)
    movement_id = Column(String); asset_id = Column(String); asset_name = Column(String); from_location = Column(String); to_location = Column(String); movement_date = Column(String); movement_time = Column(String); purpose = Column(String); transported_by = Column(String); vehicle_no = Column(String, nullable=True); responsible_person = Column(String); remarks = Column(String)

class AmcWarranty(Base):
    __tablename__ = 'amc_warranties'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_report_id = Column(String, ForeignKey("asset_reports.id"), nullable=False)
    amc_warranty_id = Column(String); asset_id = Column(String); asset_name = Column(String); contract_type = Column(String); provider = Column(String); start_date = Column(String); end_date = Column(String); cost = Column(Float); coverage_details = Column(String); status = Column(String); responsible_person = Column(String); remarks = Column(String)

class MaintenanceSchedule(Base):
    __tablename__ = 'asset_maintenance_schedules'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_report_id = Column(String, ForeignKey("asset_reports.id"), nullable=False)
    maintenance_id = Column(String); asset_id = Column(String); asset_name = Column(String); maintenance_type = Column(String); scheduled_date = Column(String); actual_date = Column(String, nullable=True); status = Column(String); technician = Column(String); cost = Column(Float); responsible_person = Column(String); remarks = Column(String)

class AssetAudit(Base):
    __tablename__ = 'asset_audits'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_report_id = Column(String, ForeignKey("asset_reports.id"), nullable=False)
    audit_id = Column(String); asset_id = Column(String); asset_name = Column(String); audit_date = Column(String); location = Column(String); condition = Column(String); status = Column(String); auditor = Column(String); discrepancies = Column(String); responsible_person = Column(String); remarks = Column(String)

class Depreciation(Base):
    __tablename__ = 'depreciations'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_report_id = Column(String, ForeignKey("asset_reports.id"), nullable=False)
    depreciation_id = Column(String); asset_id = Column(String); asset_name = Column(String); purchase_date = Column(String); purchase_cost = Column(Float); depreciation_method = Column(String); annual_depreciation = Column(Float); current_value = Column(Float); replacement_date = Column(String); status = Column(String); responsible_person = Column(String); remarks = Column(String)


# --- Base Schemas for individual entries ---
class AssetSchema(BaseModel):
    asset_id: str; asset_name: str; category: str; tag_barcode: str; location: str; purchase_date: str; cost: float; status: str; assigned_to: str; responsible_person: str; remarks: str
class AssetMovementLogSchema(BaseModel):
    movement_id: str; asset_id: str; asset_name: str; from_location: str; to_location: str; movement_date: str; movement_time: str; purpose: str; transported_by: str; vehicle_no: Optional[str] = None; responsible_person: str; remarks: str
class AmcWarrantySchema(BaseModel):
    amc_warranty_id: str; asset_id: str; asset_name: str; contract_type: str; provider: str; start_date: str; end_date: str; cost: float; coverage_details: str; status: str; responsible_person: str; remarks: str
class MaintenanceScheduleSchema(BaseModel):
    maintenance_id: str; asset_id: str; asset_name: str; maintenance_type: str; scheduled_date: str; actual_date: Optional[str] = None; status: str; technician: str; cost: float; responsible_person: str; remarks: str
class AssetAuditSchema(BaseModel):
    audit_id: str; asset_id: str; asset_name: str; audit_date: str; location: str; condition: str; status: str; auditor: str; discrepancies: str; responsible_person: str; remarks: str
class DepreciationSchema(BaseModel):
    depreciation_id: str; asset_id: str; asset_name: str; purchase_date: str; purchase_cost: float; depreciation_method: str; annual_depreciation: float; current_value: float; replacement_date: str; status: str; responsible_person: str; remarks: str

# --- Schemas for Create and Update Payloads ---
class AssetReportCreate(BaseModel):
    property_id: str
    assets: List[AssetSchema] = []
    movement_logs: List[AssetMovementLogSchema] = []
    amc_warranties: List[AmcWarrantySchema] = []
    maintenance_schedules: List[MaintenanceScheduleSchema] = []
    audits: List[AssetAuditSchema] = []
    depreciations: List[DepreciationSchema] = []

class AssetReportUpdate(BaseModel):
    property_id: Optional[str] = None
    assets: Optional[List[AssetSchema]] = None
    movement_logs: Optional[List[AssetMovementLogSchema]] = None
    amc_warranties: Optional[List[AmcWarrantySchema]] = None
    maintenance_schedules: Optional[List[MaintenanceScheduleSchema]] = None
    audits: Optional[List[AssetAuditSchema]] = None
    depreciations: Optional[List[DepreciationSchema]] = None

# --- Response Schemas ---
class AssetResponse(AssetSchema): 
    id: str; asset_report_id: str
    class Config: from_attributes = True
class AssetMovementLogResponse(AssetMovementLogSchema): 
    id: str; asset_report_id: str
    class Config: from_attributes = True
class AmcWarrantyResponse(AmcWarrantySchema): 
    id: str; asset_report_id: str
    class Config: from_attributes = True
class MaintenanceScheduleResponse(MaintenanceScheduleSchema): 
    id: str; asset_report_id: str
    class Config: from_attributes = True
class AssetAuditResponse(AssetAuditSchema): 
    id: str; asset_report_id: str
    class Config: from_attributes = True
class DepreciationResponse(DepreciationSchema): 
    id: str; asset_report_id: str
    class Config: from_attributes = True

class AssetReportResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    assets: List[AssetResponse] = []
    movement_logs: List[AssetMovementLogResponse] = []
    amc_warranties: List[AmcWarrantyResponse] = []
    maintenance_schedules: List[MaintenanceScheduleResponse] = []
    audits: List[AssetAuditResponse] = []
    depreciations: List[DepreciationResponse] = []

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, orm_model: AssetReport):
        """Convert SQLAlchemy ORM object to Pydantic response model"""
        return cls(
            id=orm_model.id,
            property_id=orm_model.property_id,
            created_at=orm_model.created_at,
            updated_at=orm_model.updated_at,
            assets=[AssetResponse.from_orm(item) for item in orm_model.assets],
            movement_logs=[AssetMovementLogResponse.from_orm(item) for item in orm_model.movement_logs],
            amc_warranties=[AmcWarrantyResponse.from_orm(item) for item in orm_model.amc_warranties],
            maintenance_schedules=[MaintenanceScheduleResponse.from_orm(item) for item in orm_model.maintenance_schedules],
            audits=[AssetAuditResponse.from_orm(item) for item in orm_model.audits],
            depreciations=[DepreciationResponse.from_orm(item) for item in orm_model.depreciations]
        )

Base.metadata.create_all(bind=engine)

# Define asset management model map locally to avoid conflicts
ASSET_MODEL_MAP = {
    "assets": AssetMain,
    "movement_logs": AssetMovementLog,
    "amc_warranties": AmcWarranty,
    "maintenance_schedules": MaintenanceSchedule,
    "audits": AssetAudit,
    "depreciations": Depreciation,
}

@app.post("/asset-reports/", response_model=AssetReportResponse, status_code=status.HTTP_201_CREATED, tags=["Asset Management Report"])
def create_asset_report(report: AssetReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = AssetReport(property_id=report.property_id)
        db.add(db_report)
        db.flush()

        for field, model in ASSET_MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(asset_report_id=db_report.id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return AssetReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@app.get("/asset-reports/", response_model=List[AssetReportResponse], tags=["Asset Management Report"])
def get_all_asset_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(AssetReport)
        if property_id:
            query = query.filter(AssetReport.property_id == property_id)
        reports = query.offset(skip).limit(limit).all()
        return [AssetReportResponse.from_orm_model(report) for report in reports]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/asset-reports/{report_id}", response_model=AssetReportResponse, tags=["Asset Management Report"])
def get_asset_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(AssetReport).filter(AssetReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Asset report not found")
    return AssetReportResponse.from_orm_model(report)

@app.put("/asset-reports/{report_id}", response_model=AssetReportResponse, tags=["Asset Management Report"])
def update_asset_report(report_id: str, report_update: AssetReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(AssetReport).filter(AssetReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Asset report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, model in ASSET_MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.asset_report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(asset_report_id=report_id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return AssetReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@app.delete("/asset-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Asset Management Report"])
def delete_asset_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(AssetReport).filter(AssetReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Asset report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")


# --- Main Parent Model ---
class QualityReport(Base):
    __tablename__ = "quality_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quality_plans = relationship("QualityPlan", backref="report", cascade="all, delete-orphan")
    process_setups = relationship("ProcessSetup", backref="report", cascade="all, delete-orphan")
    quality_assurance_activities = relationship("QualityAssurance", backref="report", cascade="all, delete-orphan")
    quality_control_checks = relationship("QualityControl", backref="report", cascade="all, delete-orphan")
    performance_monitors = relationship("PerformanceMonitor", backref="report", cascade="all, delete-orphan")
    documents = relationship("QualityDocument", backref="report", cascade="all, delete-orphan")

# --- Child Entry Models ---
class QualityPlan(Base):
    __tablename__ = 'quality_plans'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quality_report_id = Column(String, ForeignKey("quality_reports.id"), nullable=False)
    plan_id = Column(String); project_process_name = Column(String); objective = Column(String); standards = Column(String); start_date = Column(String); end_date = Column(String); responsible_person = Column(String); status = Column(String); remarks = Column(String)

class ProcessSetup(Base):
    __tablename__ = 'process_setups'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quality_report_id = Column(String, ForeignKey("quality_reports.id"), nullable=False)
    process_id = Column(String); process_name = Column(String); description = Column(String); inputs = Column(String); outputs = Column(String); owner = Column(String); tools_methods = Column(String); status = Column(String); last_updated = Column(String); remarks = Column(String)

class QualityAssurance(Base):
    __tablename__ = 'quality_assurance_activities'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quality_report_id = Column(String, ForeignKey("quality_reports.id"), nullable=False)
    qa_id = Column(String); project_process_id = Column(String); activity = Column(String); standard = Column(String); execution_date = Column(String); responsible_person = Column(String); compliance_status = Column(String); evidence = Column(String); remarks = Column(String)

class QualityControl(Base):
    __tablename__ = 'quality_control_checks'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quality_report_id = Column(String, ForeignKey("quality_reports.id"), nullable=False)
    qc_id = Column(String); project_process_id = Column(String); item_output = Column(String); specification = Column(String); inspection_date = Column(String); inspection_time = Column(String); result = Column(String); inspector = Column(String); corrective_action = Column(String); remarks = Column(String)

class PerformanceMonitor(Base):
    __tablename__ = 'performance_monitors'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quality_report_id = Column(String, ForeignKey("quality_reports.id"), nullable=False)
    monitor_id = Column(String); project_process_id = Column(String); metric = Column(String); target = Column(String); actual = Column(String); variance = Column(String); date_checked = Column(String); status = Column(String); responsible_person = Column(String); remarks = Column(String)

class QualityDocument(Base):
    __tablename__ = 'quality_documents'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quality_report_id = Column(String, ForeignKey("quality_reports.id"), nullable=False)
    document_id = Column(String); project_process_id = Column(String); document_type = Column(String); title = Column(String); created_date = Column(String); author = Column(String); status = Column(String); storage_location = Column(String); responsible_person = Column(String); remarks = Column(String)

# ==============================================================================
# 3. Pydantic SCHEMAS (Data Validation)
# ==============================================================================

# --- Base Schemas ---
class QualityPlanSchema(BaseModel):
    plan_id: str; project_process_name: str; objective: str; standards: str; start_date: str; end_date: str; responsible_person: str; status: str; remarks: str
class ProcessSetupSchema(BaseModel):
    process_id: str; process_name: str; description: str; inputs: str; outputs: str; owner: str; tools_methods: str; status: str; last_updated: str; remarks: str
class QualityAssuranceSchema(BaseModel):
    qa_id: str; project_process_id: str; activity: str; standard: str; execution_date: str; responsible_person: str; compliance_status: str; evidence: str; remarks: str
class QualityControlSchema(BaseModel):
    qc_id: str; project_process_id: str; item_output: str; specification: str; inspection_date: str; inspection_time: str; result: str; inspector: str; corrective_action: str; remarks: str
class PerformanceMonitorSchema(BaseModel):
    monitor_id: str; project_process_id: str; metric: str; target: str; actual: str; variance: str; date_checked: str; status: str; responsible_person: str; remarks: str
class QualityDocumentSchema(BaseModel):
    document_id: str; project_process_id: str; document_type: str; title: str; created_date: str; author: str; status: str; storage_location: str; responsible_person: str; remarks: str

# --- Create and Update Schemas ---
class QualityReportCreate(BaseModel):
    property_id: str
    quality_plans: List[QualityPlanSchema] = []
    process_setups: List[ProcessSetupSchema] = []
    quality_assurance_activities: List[QualityAssuranceSchema] = []
    quality_control_checks: List[QualityControlSchema] = []
    performance_monitors: List[PerformanceMonitorSchema] = []
    documents: List[QualityDocumentSchema] = []

class QualityReportUpdate(BaseModel):
    property_id: Optional[str] = None
    quality_plans: Optional[List[QualityPlanSchema]] = None
    process_setups: Optional[List[ProcessSetupSchema]] = None
    quality_assurance_activities: Optional[List[QualityAssuranceSchema]] = None
    quality_control_checks: Optional[List[QualityControlSchema]] = None
    performance_monitors: Optional[List[PerformanceMonitorSchema]] = None
    documents: Optional[List[QualityDocumentSchema]] = None

# --- Response Schemas ---
class QualityPlanResponse(QualityPlanSchema): 
    id: str; quality_report_id: str
    class Config: from_attributes = True

class ProcessSetupResponse(ProcessSetupSchema): 
    id: str; quality_report_id: str
    class Config: from_attributes = True

class QualityAssuranceResponse(QualityAssuranceSchema): 
    id: str; quality_report_id: str
    class Config: from_attributes = True

class QualityControlResponse(QualityControlSchema): 
    id: str; quality_report_id: str
    class Config: from_attributes = True

class PerformanceMonitorResponse(PerformanceMonitorSchema): 
    id: str; quality_report_id: str
    class Config: from_attributes = True

class QualityDocumentResponse(QualityDocumentSchema): 
    id: str; quality_report_id: str
    class Config: from_attributes = True

class QualityReportResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    quality_plans: List[QualityPlanResponse] = []
    process_setups: List[ProcessSetupResponse] = []
    quality_assurance_activities: List[QualityAssuranceResponse] = []
    quality_control_checks: List[QualityControlResponse] = []
    performance_monitors: List[PerformanceMonitorResponse] = []
    documents: List[QualityDocumentResponse] = []

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_model(cls, orm_model):
        """Convert SQLAlchemy ORM object to Pydantic response model"""
        return cls(
            id=orm_model.id,
            property_id=orm_model.property_id,
            created_at=orm_model.created_at,
            updated_at=orm_model.updated_at,
            quality_plans=[QualityPlanResponse.from_orm(item) for item in orm_model.quality_plans],
            process_setups=[ProcessSetupResponse.from_orm(item) for item in orm_model.process_setups],
            quality_assurance_activities=[QualityAssuranceResponse.from_orm(item) for item in orm_model.quality_assurance_activities],
            quality_control_checks=[QualityControlResponse.from_orm(item) for item in orm_model.quality_control_checks],
            performance_monitors=[PerformanceMonitorResponse.from_orm(item) for item in orm_model.performance_monitors],
            documents=[QualityDocumentResponse.from_orm(item) for item in orm_model.documents]
        )


Base.metadata.create_all(bind=engine)

# Define quality management model map locally to avoid conflicts
QUALITY_MODEL_MAP = {
    "quality_plans": QualityPlan,
    "process_setups": ProcessSetup,
    "quality_assurance_activities": QualityAssurance,
    "quality_control_checks": QualityControl,
    "performance_monitors": PerformanceMonitor,
    "documents": QualityDocument,
}

@app.post("/quality-reports/", response_model=QualityReportResponse, status_code=status.HTTP_201_CREATED, tags=["Quality Management Report"])
def create_quality_report(report: QualityReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = QualityReport(property_id=report.property_id)
        db.add(db_report)
        db.flush()

        for field, model in QUALITY_MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(quality_report_id=db_report.id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return QualityReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@app.get("/quality-reports/", response_model=List[QualityReportResponse], tags=["Quality Management Report"])
def get_all_quality_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(QualityReport)
        if property_id:
            query = query.filter(QualityReport.property_id == property_id)
        reports = query.offset(skip).limit(limit).all()
        return [QualityReportResponse.from_orm_model(report) for report in reports]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/quality-reports/{report_id}", response_model=QualityReportResponse, tags=["Quality Management Report"])
def get_quality_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(QualityReport).filter(QualityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Quality report not found")
    return QualityReportResponse.from_orm_model(report)

@app.put("/quality-reports/{report_id}", response_model=QualityReportResponse, tags=["Quality Management Report"])
def update_quality_report(report_id: str, report_update: QualityReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(QualityReport).filter(QualityReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Quality report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, model in QUALITY_MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.quality_report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(quality_report_id=report_id, **entry_data.model_dump())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return QualityReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@app.delete("/quality-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Quality Management Report"])
def delete_quality_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(QualityReport).filter(QualityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Quality report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")

# # Main Report Table
# class CctvAuditReport(Base):
#     __tablename__ = "cctv_audit_reports"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     property_id = Column(String, index=True, nullable=False)
#     created_at = Column(DateTime, default=datetime.utcnow)
#     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

#     # Relationships (deletes children when parent is deleted)
#     site_assessments = relationship("SiteAssessmentFormat", back_populates="report", cascade="all, delete-orphan")
#     installation_checklists = relationship("InstallationChecklist", back_populates="report", cascade="all, delete-orphan")
#     configuration_checklists = relationship("ConfigurationTestingChecklist", back_populates="report", cascade="all, delete-orphan")
#     daily_operations = relationship("DailyOperationsMonitoring", back_populates="report", cascade="all, delete-orphan")
#     maintenance_schedules = relationship("CctvMaintenanceSchedule", back_populates="report", cascade="all, delete-orphan")
#     amc_compliance_formats = relationship("AmcComplianceFormat", back_populates="report", cascade="all, delete-orphan")
#     site_information = relationship("SiteInformation", uselist=False, back_populates="report", cascade="all, delete-orphan")
#     camera_inventory_logs = relationship("CameraInventoryLog", back_populates="report", cascade="all, delete-orphan")

# # Child Tables
# class SiteAssessmentFormat(Base):
#     __tablename__ = "site_assessment_formats"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     cctv_audit_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
#     SL_No = Column(Integer)
#     Description = Column(String)
#     Checklist_Points = Column(String)
#     Checked_Status = Column(String)
#     Observations = Column(String)
#     Suggestions_Actions = Column(String)
#     Responsibility = Column(String)
#     Target_Date = Column(String, nullable=True)
#     Photo_Insert = Column(String)
#     Remarks = Column(String)
#     report = relationship("CctvAuditReport", back_populates="site_assessments")

# class InstallationChecklist(Base):
#     __tablename__ = "installation_checklists"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     cctv_audit_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
#     SL_No = Column(Integer)
#     Category = Column(String)
#     Checklist_Point = Column(String)
#     Checked = Column(String)
#     Observations = Column(String)
#     Remarks_Action_Required = Column(String)
#     Responsibility = Column(String)
#     Target_Completion_Date = Column(String, nullable=True)
#     Photo_Insert = Column(String)
#     Remarks = Column(String)
#     report = relationship("CctvAuditReport", back_populates="installation_checklists")

# class ConfigurationTestingChecklist(Base):
#     __tablename__ = "configuration_testing_checklists"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     cctv_audit_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
#     SL_No = Column(Integer)
#     Category = Column(String)
#     Checklist_Point = Column(String)
#     Checked = Column(String)
#     Observations = Column(String)
#     Suggestions_Action_Required = Column(String)
#     Responsibility = Column(String)
#     Target_Completion_Date = Column(String, nullable=True)
#     Photo_Screenshot = Column(String)
#     Remarks = Column(String)
#     report = relationship("CctvAuditReport", back_populates="configuration_checklists")

# class DailyOperationsMonitoring(Base):
#     __tablename__ = "daily_operations_monitorings"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     cctv_audit_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
#     SL_No = Column(Integer)
#     Category = Column(String)
#     Checklist_Point = Column(String)
#     Checked = Column(String)
#     Observations = Column(String)
#     Actions_Required = Column(String)
#     Responsibility = Column(String)
#     Time_Checked = Column(String)
#     Photo_Screenshot = Column(String)
#     Remarks = Column(String)
#     report = relationship("CctvAuditReport", back_populates="daily_operations")

# class CctvMaintenanceSchedule(Base):
#     __tablename__ = "cctv_maintenance_schedules"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     cctv_audit_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
#     SL_No = Column(Integer)
#     Maintenance_Type = Column(String)
#     Checklist_Point_Task = Column(String)
#     Frequency = Column(String)
#     Last_Maintenance_Date = Column(String, nullable=True)
#     Next_Due_Date = Column(String, nullable=True)
#     Status = Column(String)
#     Observations_Issues = Column(String)
#     Action_Taken_Required = Column(String)
#     Responsible = Column(String)
#     Remarks = Column(String)
#     report = relationship("CctvAuditReport", back_populates="maintenance_schedules")

# class AmcComplianceFormat(Base):
#     __tablename__ = "amc_compliance_formats"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     cctv_audit_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
#     SL_No = Column(Integer)
#     Category = Column(String)
#     Checklist_Description = Column(String)
#     Details_Status = Column(String)
#     Last_Updated = Column(String, nullable=True)
#     Next_Due_Date = Column(String, nullable=True)
#     Observations_Non_Compliance = Column(String)
#     Action_Taken_Required = Column(String)
#     Responsible = Column(String)
#     Remarks = Column(String)
#     report = relationship("CctvAuditReport", back_populates="amc_compliance_formats")

# class SiteInformation(Base):
#     __tablename__ = "site_information"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     cctv_audit_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
#     Site_Name_Code = Column(String)
#     Address = Column(String)
#     Contact_Person_Site_Incharge = Column(String)
#     CCTV_Install_Date = Column(String)
#     report = relationship("CctvAuditReport", back_populates="site_information")

# class CameraInventoryLog(Base):
#     __tablename__ = "camera_inventory_logs"
#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     cctv_audit_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
#     Camera_ID_Name = Column(String)
#     Camera_Type = Column(String)
#     Brand_Model_No = Column(String)
#     Resolution_MP = Column(String)
#     Location_Installed = Column(String)
#     Indoor_Outdoor = Column(String)
#     Working_Status = Column(String)
#     report = relationship("CctvAuditReport", back_populates="camera_inventory_logs")


# # --- Pydantic Schemas ---

# # Base schemas for individual items
# class SiteAssessmentFormatSchema(BaseModel):
#     SL_No: int
#     Description: str
#     Checklist_Points: str
#     Checked_Status: str
#     Observations: str
#     Suggestions_Actions: str
#     Responsibility: str
#     Target_Date: Optional[str] = None
#     Photo_Insert: str
#     Remarks: str
    
#     class Config:
#         from_attributes = True

# class InstallationChecklistSchema(BaseModel):
#     SL_No: int
#     Category: str
#     Checklist_Point: str
#     Checked: str
#     Observations: str
#     Remarks_Action_Required: str
#     Responsibility: str
#     Target_Completion_Date: Optional[str] = None
#     Photo_Insert: str
#     Remarks: str
    
#     class Config:
#         from_attributes = True

# class ConfigurationTestingChecklistSchema(BaseModel):
#     SL_No: int
#     Category: str
#     Checklist_Point: str
#     Checked: str
#     Observations: str
#     Suggestions_Action_Required: str
#     Responsibility: str
#     Target_Completion_Date: Optional[str] = None
#     Photo_Screenshot: str
#     Remarks: str
    
#     class Config:
#         from_attributes = True

# class DailyOperationsMonitoringSchema(BaseModel):
#     SL_No: int
#     Category: str
#     Checklist_Point: str
#     Checked: str
#     Observations: str
#     Actions_Required: str
#     Responsibility: str
#     Time_Checked: str
#     Photo_Screenshot: str
#     Remarks: str
    
#     class Config:
#         from_attributes = True

# class CctvMaintenanceScheduleSchema(BaseModel):
#     SL_No: int
#     Maintenance_Type: str
#     Checklist_Point_Task: str
#     Frequency: str
#     Last_Maintenance_Date: Optional[str] = None
#     Next_Due_Date: Optional[str] = None
#     Status: str
#     Observations_Issues: str
#     Action_Taken_Required: str
#     Responsible: str
#     Remarks: str
    
#     class Config:
#         from_attributes = True
    
# class AmcComplianceFormatSchema(BaseModel):
#     SL_No: int
#     Category: str
#     Checklist_Description: str
#     Details_Status: str
#     Last_Updated: Optional[str] = None
#     Next_Due_Date: Optional[str] = None
#     Observations_Non_Compliance: str
#     Action_Taken_Required: str
#     Responsible: str
#     Remarks: str
    
#     class Config:
#         from_attributes = True

# class SiteInformationSchema(BaseModel):
#     Site_Name_Code: str
#     Address: str
#     Contact_Person_Site_Incharge: str
#     CCTV_Install_Date: str
    
#     class Config:
#         from_attributes = True

# class CameraInventoryLogSchema(BaseModel):
#     Camera_ID_Name: str
#     Camera_Type: str
#     Brand_Model_No: str
#     Resolution_MP: str
#     Location_Installed: str
#     Indoor_Outdoor: str
#     Working_Status: str
    
#     class Config:
#         from_attributes = True

# class DocumentationFormatSchema(BaseModel):
#     Site_Information: SiteInformationSchema
#     Camera_Inventory_Log: List[CameraInventoryLogSchema] = []

# # Schemas for Create/Update operations
# class CctvAuditData(BaseModel):
#     Site_Assessment_Format: List[SiteAssessmentFormatSchema] = []
#     Installation_Checklist: List[InstallationChecklistSchema] = []
#     Configuration_Testing_Checklist: List[ConfigurationTestingChecklistSchema] = []
#     Daily_Operations_Monitoring: List[DailyOperationsMonitoringSchema] = []
#     Maintenance_Schedule: List[CctvMaintenanceScheduleSchema] = []
#     Documentation_Format: DocumentationFormatSchema
#     AMC_Compliance_Format: List[AmcComplianceFormatSchema] = []

# class CctvAuditReportCreate(BaseModel):
#     property_id: str
#     CCTV_Audit: CctvAuditData

# class CctvAuditReportUpdate(BaseModel):
#     property_id: Optional[str] = None
#     CCTV_Audit: Optional[CctvAuditData] = None

# # Schemas for Response models (including generated IDs)
# class SiteAssessmentFormatResponse(SiteAssessmentFormatSchema): id: str; cctv_audit_id: str
# class InstallationChecklistResponse(InstallationChecklistSchema): id: str; cctv_audit_id: str
# class ConfigurationTestingChecklistResponse(ConfigurationTestingChecklistSchema): id: str; cctv_audit_id: str
# class DailyOperationsMonitoringResponse(DailyOperationsMonitoringSchema): id: str; cctv_audit_id: str
# class MaintenanceScheduleResponse(CctvMaintenanceScheduleSchema): id: str; cctv_audit_id: str
# class AmcComplianceFormatResponse(AmcComplianceFormatSchema): id: str; cctv_audit_id: str
# class SiteInformationResponse(SiteInformationSchema): id: str; cctv_audit_id: str
# class CameraInventoryLogResponse(CameraInventoryLogSchema): id: str; cctv_audit_id: str

# class DocumentationFormatResponse(BaseModel):
#     Site_Information: SiteInformationResponse
#     Camera_Inventory_Log: List[CameraInventoryLogResponse] = []

# class CctvAuditReportResponse(BaseModel):
#     id: str
#     property_id: str
#     created_at: datetime
#     updated_at: datetime
#     Site_Assessment_Format: List[SiteAssessmentFormatResponse] = []
#     Installation_Checklist: List[InstallationChecklistResponse] = []
#     Configuration_Testing_Checklist: List[ConfigurationTestingChecklistResponse] = []
#     Daily_Operations_Monitoring: List[DailyOperationsMonitoringResponse] = []
#     Maintenance_Schedule: List[MaintenanceScheduleResponse] = []
#     AMC_Compliance_Format: List[AmcComplianceFormatResponse] = []
#     Site_Information: Optional[SiteInformationResponse] = None
#     Camera_Inventory_Log: List[CameraInventoryLogResponse] = []

#     class Config:
#         from_attributes = True
#         populate_by_name = True

#     @classmethod
#     def model_validate(cls, obj):
#         # Create a copy of the object to avoid modifying the original
#         data = {
#             'id': obj.id,
#             'property_id': obj.property_id,
#             'created_at': obj.created_at,
#             'updated_at': obj.updated_at,
#             'Site_Assessment_Format': [SiteAssessmentFormatResponse.model_validate(item) for item in obj.site_assessments],
#             'Installation_Checklist': [InstallationChecklistResponse.model_validate(item) for item in obj.installation_checklists],
#             'Configuration_Testing_Checklist': [ConfigurationTestingChecklistResponse.model_validate(item) for item in obj.configuration_checklists],
#             'Daily_Operations_Monitoring': [DailyOperationsMonitoringResponse.model_validate(item) for item in obj.daily_operations],
#             'Maintenance_Schedule': [MaintenanceScheduleResponse.model_validate(item) for item in obj.maintenance_schedules],
#             'AMC_Compliance_Format': [AmcComplianceFormatResponse.model_validate(item) for item in obj.amc_compliance_formats],
#             'Site_Information': SiteInformationResponse.model_validate(obj.site_information) if obj.site_information else None,
#             'Camera_Inventory_Log': [CameraInventoryLogResponse.model_validate(item) for item in obj.camera_inventory_logs]
#         }
#         return cls(**data)

# # Create database tables on startup
# Base.metadata.create_all(bind=engine)

# # Map JSON field names to SQLAlchemy models
# MODEL_MAP = {
#     "Site_Assessment_Format": (SiteAssessmentFormat, "site_assessments"),
#     "Installation_Checklist": (InstallationChecklist, "installation_checklists"),
#     "Configuration_Testing_Checklist": (ConfigurationTestingChecklist, "configuration_checklists"),
#     "Daily_Operations_Monitoring": (DailyOperationsMonitoring, "daily_operations"),
#     "Maintenance_Schedule": (CctvMaintenanceSchedule, "maintenance_schedules"),
#     "AMC_Compliance_Format": (AmcComplianceFormat, "amc_compliance_formats"),
# }

# @app.post("/cctv-audits/", response_model=CctvAuditReportResponse, status_code=status.HTTP_201_CREATED, tags=["CCTV Audit Report"])
# def create_cctv_audit_report(report: CctvAuditReportCreate, db: Session = Depends(get_db)):
#     try:
#         db_report = CctvAuditReport(property_id=report.property_id)
#         db.add(db_report)
#         db.flush() # Flush to get the db_report.id

#         audit_data = report.CCTV_Audit

#         # Handle nested list entries
#         for field, (model, _) in MODEL_MAP.items():
#             entries = getattr(audit_data, field, [])
#             if entries:
#                 for entry_data in entries:
#                     db_entry = model(cctv_audit_id=db_report.id, **entry_data.model_dump())
#                     db.add(db_entry)
        
#         # Handle Documentation_Format separately
#         doc_format = audit_data.Documentation_Format
#         if doc_format.Site_Information:
#             db_site_info = SiteInformation(cctv_audit_id=db_report.id, **doc_format.Site_Information.model_dump())
#             db.add(db_site_info)
        
#         for log_data in doc_format.Camera_Inventory_Log:
#             db_log = CameraInventoryLog(cctv_audit_id=db_report.id, **log_data.model_dump())
#             db.add(db_log)

#         db.commit()
#         db.refresh(db_report)
#         return CctvAuditReportResponse.model_validate(db_report) # Use model_validate for complex nested models
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Error creating CCTV audit report: {str(e)}")

# @app.get("/cctv-audits/", response_model=List[CctvAuditReportResponse], tags=["CCTV Audit Report"])
# def get_all_cctv_audit_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
#     try:
#         query = db.query(CctvAuditReport)
#         if property_id:
#             query = query.filter(CctvAuditReport.property_id == property_id)
#         reports = query.offset(skip).limit(limit).all()
#         return [CctvAuditReportResponse.model_validate(r) for r in reports]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching CCTV audit reports: {str(e)}")

# @app.get("/cctv-audits/{report_id}", response_model=CctvAuditReportResponse, tags=["CCTV Audit Report"])
# def get_cctv_audit_report_by_id(report_id: str, db: Session = Depends(get_db)):
#     report = db.query(CctvAuditReport).filter(CctvAuditReport.id == report_id).first()
#     if not report:
#         raise HTTPException(status_code=404, detail="CCTV audit report not found")
#     return CctvAuditReportResponse.model_validate(report)

# @app.put("/cctv-audits/{report_id}", response_model=CctvAuditReportResponse, tags=["CCTV Audit Report"])
# def update_cctv_audit_report(report_id: str, report_update: CctvAuditReportUpdate, db: Session = Depends(get_db)):
#     db_report = db.query(CctvAuditReport).filter(CctvAuditReport.id == report_id).first()
#     if not db_report:
#         raise HTTPException(status_code=404, detail="CCTV audit report not found")

#     try:
#         if report_update.property_id:
#             db_report.property_id = report_update.property_id

#         if report_update.CCTV_Audit:
#             audit_data = report_update.CCTV_Audit
#             # Handle list updates (delete old, create new)
#             for field, (model, rel_name) in MODEL_MAP.items():
#                 update_entries = getattr(audit_data, field, None)
#                 if update_entries is not None:
#                     # Delete existing
#                     db.query(model).filter(model.cctv_audit_id == report_id).delete(synchronize_session=False)
#                     # Add new
#                     for entry_data in update_entries:
#                         db_entry = model(cctv_audit_id=report_id, **entry_data.model_dump())
#                         db.add(db_entry)
            
#             # Handle Documentation_Format update
#             doc_format_update = getattr(audit_data, 'Documentation_Format', None)
#             if doc_format_update:
#                 # Update SiteInformation
#                 if doc_format_update.Site_Information:
#                     db.query(SiteInformation).filter(SiteInformation.cctv_audit_id == report_id).delete(synchronize_session=False)
#                     db_site_info = SiteInformation(cctv_audit_id=report_id, **doc_format_update.Site_Information.model_dump())
#                     db.add(db_site_info)
#                 # Update CameraInventoryLog
#                 if doc_format_update.Camera_Inventory_Log is not None:
#                     db.query(CameraInventoryLog).filter(CameraInventoryLog.cctv_audit_id == report_id).delete(synchronize_session=False)
#                     for log_data in doc_format_update.Camera_Inventory_Log:
#                         db_log = CameraInventoryLog(cctv_audit_id=report_id, **log_data.model_dump())
#                         db.add(db_log)
        
#         db_report.updated_at = datetime.utcnow()
#         db.commit()
#         db.refresh(db_report)
#         return CctvAuditReportResponse.model_validate(db_report)
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Error updating CCTV audit report: {str(e)}")

# @app.delete("/cctv-audits/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["CCTV Audit Report"])
# def delete_cctv_audit_report(report_id: str, db: Session = Depends(get_db)):
#     report = db.query(CctvAuditReport).filter(CctvAuditReport.id == report_id).first()
#     if not report:
#         raise HTTPException(status_code=404, detail="CCTV audit report not found")
    
#     try:
#         db.delete(report)
#         db.commit()
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Error deleting CCTV audit report: {str(e)}")

# Main Report Table
class FireSafetyReport(Base):
    __tablename__ = "fire_safety_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (deletes children when parent is deleted)
    site_assessments = relationship("SiteAssessmentAndPlanning", back_populates="report", cascade="all, delete-orphan")
    installations = relationship("InstallationAndEquipmentSetup", back_populates="report", cascade="all, delete-orphan")
    documents = relationship("FireSafetyDocument", back_populates="report", cascade="all, delete-orphan")
    compliance_reports = relationship("ComplianceReport", back_populates="report", cascade="all, delete-orphan")
    trainings = relationship("FireAndSafetyTraining", back_populates="report", cascade="all, delete-orphan")
    daily_checklists = relationship("DailyChecklist", back_populates="report", cascade="all, delete-orphan")
    weekly_checklists = relationship("WeeklyChecklist", back_populates="report", cascade="all, delete-orphan")
    monthly_checklists = relationship("MonthlyChecklist", back_populates="report", cascade="all, delete-orphan")
    quarterly_checklists = relationship("QuarterlyChecklist", back_populates="report", cascade="all, delete-orphan")
    emergency_plans = relationship("EmergencyPreparednessPlan", back_populates="report", cascade="all, delete-orphan")
    records = relationship("RecordKeeping", back_populates="report", cascade="all, delete-orphan")

# Child Tables
class SiteAssessmentAndPlanning(Base):
    __tablename__ = "site_assessments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Assessment_ID = Column(String, index=True)
    Site_Name = Column(String)
    Location = Column(String)
    Assessment_Date = Column(String)
    Assessor = Column(String)
    Risk_Areas = Column(String)
    Fire_Hazards_Identified = Column(String)
    Recommendations = Column(String)
    Compliance_Standards = Column(String)
    Status = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="site_assessments")

class InstallationAndEquipmentSetup(Base):
    __tablename__ = "installations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Installation_ID = Column(String, index=True)
    Site_Name = Column(String)
    Equipment_ID = Column(String)
    Equipment_Type = Column(String)
    Location = Column(String)
    Installation_Date = Column(String)
    Installer = Column(String)
    Status = Column(String)
    Checklist_Items = Column(String)
    Compliance_Status = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="installations")

class FireSafetyDocument(Base):
    __tablename__ = "fire_safety_documents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Document_ID = Column(String, index=True)
    Site_Name = Column(String)
    Document_Type = Column(String)
    Title = Column(String)
    Created_Date = Column(String)
    Author = Column(String)
    Status = Column(String)
    Storage_Location = Column(String)
    Compliance_Standards = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="documents")

class ComplianceReport(Base):
    __tablename__ = "compliance_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Compliance_ID = Column(String, index=True)
    Site_Name = Column(String)
    Regulation = Column(String)
    Audit_Date = Column(String)
    Auditor = Column(String)
    Findings = Column(String)
    Compliance_Status = Column(String)
    Corrective_Actions = Column(String)
    Next_Audit_Date = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="compliance_reports")

class FireAndSafetyTraining(Base):
    __tablename__ = "trainings"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Training_ID = Column(String, index=True)
    Site_Name = Column(String)
    Training_Type = Column(String)
    Date = Column(String)
    Time = Column(String)
    Trainer = Column(String)
    Participants = Column(String)
    Duration = Column(String)
    Topics_Covered = Column(String)
    Status = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="trainings")

class DailyChecklist(Base):
    __tablename__ = "daily_checklists"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Checklist_ID = Column(String, index=True)
    Site_Name = Column(String)
    Date = Column(String)
    Time = Column(String)
    Inspector = Column(String)
    Equipment_Area_Checked = Column(String)
    Status = Column(String)
    Issues_Found = Column(String)
    Corrective_Actions = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="daily_checklists")

class WeeklyChecklist(Base):
    __tablename__ = "weekly_checklists"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Checklist_ID = Column(String, index=True)
    Site_Name = Column(String)
    Date = Column(String)
    Inspector = Column(String)
    Equipment_Area_Checked = Column(String)
    Status = Column(String)
    Issues_Found = Column(String)
    Corrective_Actions = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="weekly_checklists")

class MonthlyChecklist(Base):
    __tablename__ = "monthly_checklists"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Checklist_ID = Column(String, index=True)
    Site_Name = Column(String)
    Date = Column(String)
    Inspector = Column(String)
    Equipment_Area_Checked = Column(String)
    Status = Column(String)
    Issues_Found = Column(String)
    Corrective_Actions = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="monthly_checklists")

class QuarterlyChecklist(Base):
    __tablename__ = "quarterly_checklists"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Checklist_ID = Column(String, index=True)
    Site_Name = Column(String)
    Date = Column(String)
    Inspector = Column(String)
    Equipment_Area_Checked = Column(String)
    Status = Column(String)
    Issues_Found = Column(String)
    Corrective_Actions = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="quarterly_checklists")

class EmergencyPreparednessPlan(Base):
    __tablename__ = "emergency_plans"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Plan_ID = Column(String, index=True)
    Site_Name = Column(String)
    Plan_Type = Column(String)
    Created_Date = Column(String)
    Last_Updated = Column(String)
    Responsible_Person = Column(String)
    Key_Components = Column(String)
    Status = Column(String)
    Next_Review_Date = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="emergency_plans")

class RecordKeeping(Base):
    __tablename__ = "records"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("fire_safety_reports.id"), nullable=False)
    Record_ID = Column(String, index=True)
    Site_Name = Column(String)
    Record_Type = Column(String)
    Title = Column(String)
    Created_Date = Column(String)
    Author = Column(String)
    Storage_Location = Column(String)
    Retention_Period = Column(String)
    Status = Column(String)
    Remarks = Column(String)
    report = relationship("FireSafetyReport", back_populates="records")

# --- Pydantic Schemas ---

# Base schemas for individual items
class SiteAssessmentAndPlanningSchema(BaseModel):
    Assessment_ID: str; Site_Name: str; Location: str; Assessment_Date: str; Assessor: str; Risk_Areas: str; Fire_Hazards_Identified: str; Recommendations: str; Compliance_Standards: str; Status: str; Remarks: str
    class Config: from_attributes = True

class InstallationAndEquipmentSetupSchema(BaseModel):
    Installation_ID: str; Site_Name: str; Equipment_ID: str; Equipment_Type: str; Location: str; Installation_Date: str; Installer: str; Status: str; Checklist_Items: str; Compliance_Status: str; Remarks: str
    class Config: from_attributes = True

class FireSafetyDocumentSchema(BaseModel):
    Document_ID: str; Site_Name: str; Document_Type: str; Title: str; Created_Date: str; Author: str; Status: str; Storage_Location: str; Compliance_Standards: str; Remarks: str
    class Config: from_attributes = True

class ComplianceReportSchema(BaseModel):
    Compliance_ID: str; Site_Name: str; Regulation: str; Audit_Date: str; Auditor: str; Findings: str; Compliance_Status: str; Corrective_Actions: str; Next_Audit_Date: str; Remarks: str
    class Config: from_attributes = True

class FireAndSafetyTrainingSchema(BaseModel):
    Training_ID: str; Site_Name: str; Training_Type: str; Date: str; Time: str; Trainer: str; Participants: str; Duration: str; Topics_Covered: str; Status: str; Remarks: str
    class Config: from_attributes = True

class DailyChecklistSchema(BaseModel):
    Checklist_ID: str; Site_Name: str; Date: str; Time: str; Inspector: str; Equipment_Area_Checked: str; Status: str; Issues_Found: str; Corrective_Actions: str; Remarks: str
    class Config: from_attributes = True

class WeeklyChecklistSchema(BaseModel):
    Checklist_ID: str; Site_Name: str; Date: str; Inspector: str; Equipment_Area_Checked: str; Status: str; Issues_Found: str; Corrective_Actions: str; Remarks: str
    class Config: from_attributes = True

class MonthlyChecklistSchema(BaseModel):
    Checklist_ID: str; Site_Name: str; Date: str; Inspector: str; Equipment_Area_Checked: str; Status: str; Issues_Found: str; Corrective_Actions: str; Remarks: str
    class Config: from_attributes = True

class QuarterlyChecklistSchema(BaseModel):
    Checklist_ID: str; Site_Name: str; Date: str; Inspector: str; Equipment_Area_Checked: str; Status: str; Issues_Found: str; Corrective_Actions: str; Remarks: str
    class Config: from_attributes = True
    
class EmergencyPreparednessPlanSchema(BaseModel):
    Plan_ID: str; Site_Name: str; Plan_Type: str; Created_Date: str; Last_Updated: str; Responsible_Person: str; Key_Components: str; Status: str; Next_Review_Date: str; Remarks: str
    class Config: from_attributes = True

class RecordKeepingSchema(BaseModel):
    Record_ID: str; Site_Name: str; Record_Type: str; Title: str; Created_Date: str; Author: str; Storage_Location: str; Retention_Period: str; Status: str; Remarks: str
    class Config: from_attributes = True

# Schema for the nested Fire_Safety_Management object
class FireSafetyData(BaseModel):
    Site_Assessment_and_Planning: List[SiteAssessmentAndPlanningSchema] = []
    Installation_and_Equipment_Setup: List[InstallationAndEquipmentSetupSchema] = []
    Fire_Safety_Documents: List[FireSafetyDocumentSchema] = []
    Compliance_Reports: List[ComplianceReportSchema] = []
    Fire_and_Safety_Training: List[FireAndSafetyTrainingSchema] = []
    Daily_Checklist: List[DailyChecklistSchema] = []
    Weekly_Checklist: List[WeeklyChecklistSchema] = []
    Monthly_Checklist: List[MonthlyChecklistSchema] = []
    Quarterly_Checklist: List[QuarterlyChecklistSchema] = []
    Emergency_Preparedness_Plan: List[EmergencyPreparednessPlanSchema] = []
    Record_Keeping: List[RecordKeepingSchema] = []

# Schemas for Create/Update operations
class FireSafetyReportCreate(BaseModel):
    property_id: str
    Fire_Safety_Management: FireSafetyData

class FireSafetyReportUpdate(BaseModel):
    property_id: Optional[str] = None
    Fire_Safety_Management: Optional[FireSafetyData] = None

# Schemas for Response models (including generated IDs)
class SiteAssessmentAndPlanningResponse(SiteAssessmentAndPlanningSchema): id: str; report_id: str
class InstallationAndEquipmentSetupResponse(InstallationAndEquipmentSetupSchema): id: str; report_id: str
class FireSafetyDocumentResponse(FireSafetyDocumentSchema): id: str; report_id: str
class ComplianceReportResponse(ComplianceReportSchema): id: str; report_id: str
class FireAndSafetyTrainingResponse(FireAndSafetyTrainingSchema): id: str; report_id: str
class DailyChecklistResponse(DailyChecklistSchema): id: str; report_id: str
class WeeklyChecklistResponse(WeeklyChecklistSchema): id: str; report_id: str
class MonthlyChecklistResponse(MonthlyChecklistSchema): id: str; report_id: str
class QuarterlyChecklistResponse(QuarterlyChecklistSchema): id: str; report_id: str
class EmergencyPreparednessPlanResponse(EmergencyPreparednessPlanSchema): id: str; report_id: str
class RecordKeepingResponse(RecordKeepingSchema): id: str; report_id: str

class FireSafetyReportResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    
    Site_Assessment_and_Planning: List[SiteAssessmentAndPlanningResponse] = Field(..., alias="site_assessments")
    Installation_and_Equipment_Setup: List[InstallationAndEquipmentSetupResponse] = Field(..., alias="installations")
    Fire_Safety_Documents: List[FireSafetyDocumentResponse] = Field(..., alias="documents")
    Compliance_Reports: List[ComplianceReportResponse] = Field(..., alias="compliance_reports")
    Fire_and_Safety_Training: List[FireAndSafetyTrainingResponse] = Field(..., alias="trainings")
    Daily_Checklist: List[DailyChecklistResponse] = Field(..., alias="daily_checklists")
    Weekly_Checklist: List[WeeklyChecklistResponse] = Field(..., alias="weekly_checklists")
    Monthly_Checklist: List[MonthlyChecklistResponse] = Field(..., alias="monthly_checklists")
    Quarterly_Checklist: List[QuarterlyChecklistResponse] = Field(..., alias="quarterly_checklists")
    Emergency_Preparedness_Plan: List[EmergencyPreparednessPlanResponse] = Field(..., alias="emergency_plans")
    Record_Keeping: List[RecordKeepingResponse] = Field(..., alias="records")

    class Config:
        from_attributes = True
        populate_by_name = True

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# Map JSON field names to SQLAlchemy models and response aliases
MODEL_MAP = {
    "Site_Assessment_and_Planning": (SiteAssessmentAndPlanning, "site_assessments"),
    "Installation_and_Equipment_Setup": (InstallationAndEquipmentSetup, "installations"),
    "Fire_Safety_Documents": (FireSafetyDocument, "documents"),
    "Compliance_Reports": (ComplianceReport, "compliance_reports"),
    "Fire_and_Safety_Training": (FireAndSafetyTraining, "trainings"),
    "Daily_Checklist": (DailyChecklist, "daily_checklists"),
    "Weekly_Checklist": (WeeklyChecklist, "weekly_checklists"),
    "Monthly_Checklist": (MonthlyChecklist, "monthly_checklists"),
    "Quarterly_Checklist": (QuarterlyChecklist, "quarterly_checklists"),
    "Emergency_Preparedness_Plan": (EmergencyPreparednessPlan, "emergency_plans"),
    "Record_Keeping": (RecordKeeping, "records"),
}

@app.post("/fire-safety-reports/", response_model=FireSafetyReportResponse, status_code=status.HTTP_201_CREATED, tags=["Fire Safety Report"])
def create_fire_safety_report(report: FireSafetyReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = FireSafetyReport(property_id=report.property_id)
        db.add(db_report)
        db.flush()

        report_data = report.Fire_Safety_Management

        for field, (model, _) in MODEL_MAP.items():
            entries = getattr(report_data, field, [])
            for entry_data in entries:
                db_entry = model(report_id=db_report.id, **entry_data.dict())
                db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return FireSafetyReportResponse.model_validate(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@app.get("/fire-safety-reports/", response_model=List[FireSafetyReportResponse], tags=["Fire Safety Report"])
def get_all_fire_safety_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(FireSafetyReport)
        if property_id:
            query = query.filter(FireSafetyReport.property_id == property_id)
        reports = query.offset(skip).limit(limit).all()
        return [FireSafetyReportResponse.model_validate(r) for r in reports]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/fire-safety-reports/{report_id}", response_model=FireSafetyReportResponse, tags=["Fire Safety Report"])
def get_fire_safety_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(FireSafetyReport).filter(FireSafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Fire Safety report not found")
    return FireSafetyReportResponse.model_validate(report)

@app.put("/fire-safety-reports/{report_id}", response_model=FireSafetyReportResponse, tags=["Fire Safety Report"])
def update_fire_safety_report(report_id: str, report_update: FireSafetyReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(FireSafetyReport).filter(FireSafetyReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Fire Safety report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        if report_update.Fire_Safety_Management:
            update_data = report_update.Fire_Safety_Management
            for field, (model, _) in MODEL_MAP.items():
                update_entries = getattr(update_data, field, None)
                if update_entries is not None:
                    db.query(model).filter(model.report_id == report_id).delete(synchronize_session=False)
                    for entry_data in update_entries:
                        db_entry = model(report_id=report_id, **entry_data.dict())
                        db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return FireSafetyReportResponse.model_validate(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@app.delete("/fire-safety-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Fire Safety Report"])
def delete_fire_safety_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(FireSafetyReport).filter(FireSafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Fire Safety report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")

# Main Report Table
class ProcurementReport(Base):
    __tablename__ = "procurement_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    procurement_plans = relationship("ProcurementPlanning", back_populates="report", cascade="all, delete-orphan")
    vendors = relationship("VendorManagement", back_populates="report", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseRequisitionToOrder", back_populates="report", cascade="all, delete-orphan")
    goods_receipts = relationship("GoodsReceiptAndInspection", back_populates="report", cascade="all, delete-orphan")
    procurement_inventory_items = relationship("InventoryAndStockManagement", back_populates="report", cascade="all, delete-orphan")
    payments = relationship("PaymentTracking", back_populates="report", cascade="all, delete-orphan")
    documents = relationship("ProcurementDocumentation", back_populates="report", cascade="all, delete-orphan")
    compliances = relationship("ComplianceAndPolicy", back_populates="report", cascade="all, delete-orphan")
    analysis_reports = relationship("ReportingAndAnalysis", back_populates="report", cascade="all, delete-orphan")
    procurement_categories = relationship("ProcurementCategory", back_populates="report", cascade="all, delete-orphan")


# Child Tables (Nested objects are flattened into columns)
class ProcurementPlanning(Base):
    __tablename__ = "procurement_plans"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Plan_ID = Column(String)
    Project_Department = Column(String)
    Item_Service = Column(String)
    Quantity = Column(Integer)
    Estimated_Cost = Column(Float)
    Timeline_Start = Column(String)
    Timeline_End = Column(String)
    Priority = Column(String)
    Responsible_Person = Column(String)
    Status = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="procurement_plans")

class VendorManagement(Base):
    __tablename__ = "procurement_vendors"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Vendor_ID = Column(String, index=True)
    Vendor_Name = Column(String)
    Contact_Phone = Column(String)
    Contact_Email = Column(String)
    Category = Column(String)
    Contract_Start_Date = Column(String)
    Contract_End_Date = Column(String)
    Performance_Rating = Column(Integer)
    Status = Column(String)
    Responsible_Person = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="vendors")

class PurchaseRequisitionToOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    PR_PO_ID = Column(String, index=True)
    Requisitioner = Column(String)
    Item_Service = Column(String)
    Quantity = Column(Integer)
    Requested_Date = Column(String)
    Approved_Date = Column(String)
    Purchase_Order_Date = Column(String)
    Vendor_ID = Column(String)
    Total_Cost = Column(Float)
    Status = Column(String)
    Responsible_Person = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="purchase_orders")

class GoodsReceiptAndInspection(Base):
    __tablename__ = "goods_receipts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Receipt_ID = Column(String)
    PO_ID = Column(String)
    Item_Service = Column(String)
    Quantity_Received = Column(Integer)
    Receipt_Date = Column(String)
    Inspection_Date = Column(String)
    Inspection_Result = Column(String)
    Inspector = Column(String)
    Storage_Location = Column(String)
    Responsible_Person = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="goods_receipts")

class InventoryAndStockManagement(Base):
    __tablename__ = "procurement_inventory_items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Inventory_ID = Column(String)
    Item_ID = Column(String)
    Item_Name = Column(String)
    Category = Column(String)
    Current_Stock = Column(Integer)
    Unit = Column(String)
    Location = Column(String)
    Last_Updated = Column(String)
    Responsible_Person = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="procurement_inventory_items")

class PaymentTracking(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Payment_ID = Column(String)
    PO_ID = Column(String)
    Vendor_ID = Column(String)
    Invoice_Number = Column(String)
    Invoice_Amount = Column(Float)
    Payment_Due_Date = Column(String)
    Payment_Date = Column(String)
    Payment_Status = Column(String)
    Payment_Method = Column(String)
    Responsible_Person = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="payments")

class ProcurementDocumentation(Base):
    __tablename__ = "procurement_documents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Document_ID = Column(String)
    Project_PO_ID = Column(String)
    Document_Type = Column(String)
    Title = Column(String)
    Created_Date = Column(String)
    Author = Column(String)
    Status = Column(String)
    Storage_Location = Column(String)
    Responsible_Person = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="documents")

class ComplianceAndPolicy(Base):
    __tablename__ = "compliances"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Compliance_ID = Column(String)
    Project_PO_ID = Column(String)
    Policy_Regulation = Column(String)
    Audit_Date = Column(String)
    Auditor = Column(String)
    Findings = Column(String)
    Compliance_Status = Column(String)
    Corrective_Actions = Column(String)
    Next_Audit_Date = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="compliances")
    
class ReportingAndAnalysis(Base):
    __tablename__ = "analysis_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Analysis_Report_ID = Column(String)
    Report_Type = Column(String)
    Period_Start = Column(String)
    Period_End = Column(String)
    Metrics = Column(String)
    Findings = Column(String)
    Generated_Date = Column(String)
    Responsible_Person = Column(String)
    Status = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="analysis_reports")

class ProcurementCategory(Base):
    __tablename__ = "procurement_categories"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("procurement_reports.id"), nullable=False)
    Category_ID = Column(String)
    Category_Name = Column(String)
    Description = Column(String)
    Budget_Allocation = Column(Float)
    Items_Services = Column(String)
    Responsible_Person = Column(String)
    Status = Column(String)
    Remarks = Column(String)
    report = relationship("ProcurementReport", back_populates="procurement_categories")


# --- Pydantic Schemas ---

# Schemas for nested objects
class TimelineSchema(BaseModel):
    Start: str
    End: str

class ContactDetailsSchema(BaseModel):
    Phone: str
    Email: EmailStr

class PeriodSchema(BaseModel):
    Start: str
    End: str

# Base Schemas for each list item
class ProcurementPlanningSchema(BaseModel):
    Plan_ID: str; Project_Department: str; Item_Service: str; Quantity: int; Estimated_Cost: float; Timeline: TimelineSchema; Priority: str; Responsible_Person: str; Status: str; Remarks: str
    class Config: from_attributes = True

class VendorManagementSchema(BaseModel):
    Vendor_ID: str; Vendor_Name: str; Contact_Details: ContactDetailsSchema; Category: str; Contract_Start_Date: str; Contract_End_Date: str; Performance_Rating: int; Status: str; Responsible_Person: str; Remarks: str
    class Config: from_attributes = True

class PurchaseRequisitionToOrderSchema(BaseModel):
    PR_PO_ID: str; Requisitioner: str; Item_Service: str; Quantity: int; Requested_Date: str; Approved_Date: str; Purchase_Order_Date: str; Vendor_ID: str; Total_Cost: float; Status: str; Responsible_Person: str; Remarks: str
    class Config: from_attributes = True

class GoodsReceiptAndInspectionSchema(BaseModel):
    Receipt_ID: str; PO_ID: str; Item_Service: str; Quantity_Received: int; Receipt_Date: str; Inspection_Date: str; Inspection_Result: str; Inspector: str; Storage_Location: str; Responsible_Person: str; Remarks: str
    class Config: from_attributes = True

class InventoryAndStockManagementSchema(BaseModel):
    Inventory_ID: str; Item_ID: str; Item_Name: str; Category: str; Current_Stock: int; Unit: str; Location: str; Last_Updated: str; Responsible_Person: str; Remarks: str
    class Config: from_attributes = True

class PaymentTrackingSchema(BaseModel):
    Payment_ID: str; PO_ID: str; Vendor_ID: str; Invoice_Number: str; Invoice_Amount: float; Payment_Due_Date: str; Payment_Date: str; Payment_Status: str; Payment_Method: str; Responsible_Person: str; Remarks: str
    class Config: from_attributes = True

class ProcurementDocumentationSchema(BaseModel):
    Document_ID: str; Project_PO_ID: str; Document_Type: str; Title: str; Created_Date: str; Author: str; Status: str; Storage_Location: str; Responsible_Person: str; Remarks: str
    class Config: from_attributes = True

class ComplianceAndPolicySchema(BaseModel):
    Compliance_ID: str; Project_PO_ID: str; Policy_Regulation: str; Audit_Date: str; Auditor: str; Findings: str; Compliance_Status: str; Corrective_Actions: str; Next_Audit_Date: str; Remarks: str
    class Config: from_attributes = True

class ReportingAndAnalysisSchema(BaseModel):
    Analysis_Report_ID: str; Report_Type: str; Period: PeriodSchema; Metrics: str; Findings: str; Generated_Date: str; Responsible_Person: str; Status: str; Remarks: str
    class Config: from_attributes = True

class ProcurementCategorySchema(BaseModel):
    Category_ID: str; Category_Name: str; Description: str; Budget_Allocation: float; Items_Services: str; Responsible_Person: str; Status: str; Remarks: str
    class Config: from_attributes = True

# Schema for the main data object
class ProcurementData(BaseModel):
    Procurement_Planning: List[ProcurementPlanningSchema] = []
    Vendor_Management: List[VendorManagementSchema] = []
    Purchase_Requisition_to_Order: List[PurchaseRequisitionToOrderSchema] = []
    Goods_Receipt_and_Inspection: List[GoodsReceiptAndInspectionSchema] = []
    Inventory_and_Stock_Management: List[InventoryAndStockManagementSchema] = []
    Payment_Tracking: List[PaymentTrackingSchema] = []
    Procurement_Documentation: List[ProcurementDocumentationSchema] = []
    Compliance_and_Policy: List[ComplianceAndPolicySchema] = []
    Reporting_and_Analysis: List[ReportingAndAnalysisSchema] = []
    Procurement_Categories: List[ProcurementCategorySchema] = []

# Schemas for API Operations
class ProcurementReportCreate(BaseModel):
    property_id: str
    Procurement_Management: ProcurementData

class ProcurementReportUpdate(BaseModel):
    property_id: Optional[str] = None
    Procurement_Management: Optional[ProcurementData] = None

# Response Schemas (include DB-generated IDs)
class ProcurementPlanningResponse(ProcurementPlanningSchema): id: str; report_id: str
class VendorManagementResponse(VendorManagementSchema): id: str; report_id: str
class PurchaseRequisitionToOrderResponse(PurchaseRequisitionToOrderSchema): id: str; report_id: str
class GoodsReceiptAndInspectionResponse(GoodsReceiptAndInspectionSchema): id: str; report_id: str
class InventoryAndStockManagementResponse(InventoryAndStockManagementSchema): id: str; report_id: str
class PaymentTrackingResponse(PaymentTrackingSchema): id: str; report_id: str
class ProcurementDocumentationResponse(ProcurementDocumentationSchema): id: str; report_id: str
class ComplianceAndPolicyResponse(ComplianceAndPolicySchema): id: str; report_id: str
class ReportingAndAnalysisResponse(ReportingAndAnalysisSchema): id: str; report_id: str
class ProcurementCategoryResponse(ProcurementCategorySchema): id: str; report_id: str

class ProcurementReportResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    Procurement_Planning: List[ProcurementPlanningResponse] = Field(..., alias="procurement_plans")
    Vendor_Management: List[VendorManagementResponse] = Field(..., alias="vendors")
    Purchase_Requisition_to_Order: List[PurchaseRequisitionToOrderResponse] = Field(..., alias="purchase_orders")
    Goods_Receipt_and_Inspection: List[GoodsReceiptAndInspectionResponse] = Field(..., alias="goods_receipts")
    Inventory_and_Stock_Management: List[InventoryAndStockManagementResponse] = Field(..., alias="procurement_inventory_items")
    Payment_Tracking: List[PaymentTrackingResponse] = Field(..., alias="payments")
    Procurement_Documentation: List[ProcurementDocumentationResponse] = Field(..., alias="documents")
    Compliance_and_Policy: List[ComplianceAndPolicyResponse] = Field(..., alias="compliances")
    Reporting_and_Analysis: List[ReportingAndAnalysisResponse] = Field(..., alias="analysis_reports")
    Procurement_Categories: List[ProcurementCategoryResponse] = Field(..., alias="procurement_categories")

    class Config:
        from_attributes = True
        populate_by_name = True

    @classmethod
    def model_validate(cls, obj):
        # Reconstruct nested objects for each relationship
        if hasattr(obj, 'procurement_plans'):
            for plan in obj.procurement_plans:
                plan_dict = {c.name: getattr(plan, c.name) for c in plan.__table__.columns}
                reconstructed = reconstruct_entry_data(plan_dict)
                for key, value in reconstructed.items():
                    setattr(plan, key, value)
        
        if hasattr(obj, 'vendors'):
            for vendor in obj.vendors:
                vendor_dict = {c.name: getattr(vendor, c.name) for c in vendor.__table__.columns}
                reconstructed = reconstruct_entry_data(vendor_dict)
                for key, value in reconstructed.items():
                    setattr(vendor, key, value)
        
        if hasattr(obj, 'analysis_reports'):
            for report in obj.analysis_reports:
                report_dict = {c.name: getattr(report, c.name) for c in report.__table__.columns}
                reconstructed = reconstruct_entry_data(report_dict)
                for key, value in reconstructed.items():
                    setattr(report, key, value)
        
        return super().model_validate(obj)


MODEL_MAP = {
    "Procurement_Planning": (ProcurementPlanning, "procurement_plans"),
    "Vendor_Management": (VendorManagement, "procurement_vendors"),
    "Purchase_Requisition_to_Order": (PurchaseRequisitionToOrder, "purchase_orders"),
    "Goods_Receipt_and_Inspection": (GoodsReceiptAndInspection, "goods_receipts"),
    "Inventory_and_Stock_Management": (InventoryAndStockManagement, "procurement_inventory_items"),
    "Payment_Tracking": (PaymentTracking, "payments"),
    "Procurement_Documentation": (ProcurementDocumentation, "documents"),
    "Compliance_and_Policy": (ComplianceAndPolicy, "compliances"),
    "Reporting_and_Analysis": (ReportingAndAnalysis, "analysis_reports"),
    "Procurement_Categories": (ProcurementCategory, "procurement_categories"),
}


def flatten_entry_data(entry_data_dict: dict) -> dict:
    if "Timeline" in entry_data_dict:
        timeline = entry_data_dict.pop("Timeline")
        entry_data_dict["Timeline_Start"] = timeline["Start"]
        entry_data_dict["Timeline_End"] = timeline["End"]
    if "Contact_Details" in entry_data_dict:
        contact = entry_data_dict.pop("Contact_Details")
        entry_data_dict["Contact_Phone"] = contact["Phone"]
        entry_data_dict["Contact_Email"] = contact["Email"]
    if "Period" in entry_data_dict:
        period = entry_data_dict.pop("Period")
        entry_data_dict["Period_Start"] = period["Start"]
        entry_data_dict["Period_End"] = period["End"]
    return entry_data_dict

def reconstruct_entry_data(entry_data_dict: dict) -> dict:
    if "Timeline_Start" in entry_data_dict and "Timeline_End" in entry_data_dict:
        entry_data_dict["Timeline"] = {
            "Start": entry_data_dict.pop("Timeline_Start"),
            "End": entry_data_dict.pop("Timeline_End")
        }
    if "Contact_Phone" in entry_data_dict and "Contact_Email" in entry_data_dict:
        entry_data_dict["Contact_Details"] = {
            "Phone": entry_data_dict.pop("Contact_Phone"),
            "Email": entry_data_dict.pop("Contact_Email")
        }
    if "Period_Start" in entry_data_dict and "Period_End" in entry_data_dict:
        entry_data_dict["Period"] = {
            "Start": entry_data_dict.pop("Period_Start"),
            "End": entry_data_dict.pop("Period_End")
        }
    return entry_data_dict

@app.post("/procurement-reports/", response_model=ProcurementReportResponse, status_code=status.HTTP_201_CREATED, tags=["Procurement Report"])
def create_procurement_report(report: ProcurementReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = ProcurementReport(property_id=report.property_id)
        db.add(db_report)
        db.flush()

        report_data = report.Procurement_Management

        for field, (model, _) in MODEL_MAP.items():
            entries = getattr(report_data, field, [])
            for entry_data in entries:
                entry_dict = flatten_entry_data(entry_data.dict())
                db_entry = model(report_id=db_report.id, **entry_dict)
                db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return ProcurementReportResponse.model_validate(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@app.get("/procurement-reports/", response_model=List[ProcurementReportResponse], tags=["Procurement Report"])
def get_all_procurement_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(ProcurementReport)
        if property_id:
            query = query.filter(ProcurementReport.property_id == property_id)
        reports = query.offset(skip).limit(limit).all()
        return [ProcurementReportResponse.model_validate(r) for r in reports]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/procurement-reports/{report_id}", response_model=ProcurementReportResponse, tags=["Procurement Report"])
def get_procurement_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(ProcurementReport).filter(ProcurementReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Procurement report not found")
    return ProcurementReportResponse.model_validate(report)

@app.put("/procurement-reports/{report_id}", response_model=ProcurementReportResponse, tags=["Procurement Report"])
def update_procurement_report(report_id: str, report_update: ProcurementReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(ProcurementReport).filter(ProcurementReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Procurement report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        if report_update.Procurement_Management:
            update_data = report_update.Procurement_Management
            for field, (model, _) in MODEL_MAP.items():
                update_entries = getattr(update_data, field, None)
                if update_entries is not None:
                    db.query(model).filter(model.report_id == report_id).delete(synchronize_session=False)
                    for entry_data in update_entries:
                        entry_dict = flatten_entry_data(entry_data.dict())
                        db_entry = model(report_id=report_id, **entry_dict)
                        db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return ProcurementReportResponse.model_validate(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@app.delete("/procurement-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Procurement Report"])
def delete_procurement_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(ProcurementReport).filter(ProcurementReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Procurement report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")


def generate_uuid():
    return str(uuid.uuid4())

# --- SQLAlchemy ORM Models ---

# Main Vendor Table
class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, index=True, nullable=False)
    vendor_id = Column(String, unique=True, index=True)
    vendor_name = Column(String)
    contact_person = Column(String)
    contact_phone = Column(String)
    contact_email = Column(String)
    address = Column(String)
    registration_date = Column(String)
    status = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-one relationships
    classification = relationship("VendorClassification", uselist=False, back_populates="vendor", cascade="all, delete-orphan")
    evaluation = relationship("VendorEvaluation", uselist=False, back_populates="vendor", cascade="all, delete-orphan")
    purchase_integration = relationship("IntegrationWithPurchaseProcess", uselist=False, back_populates="vendor", cascade="all, delete-orphan")
    payment_tracking = relationship("VendorPaymentTracking", uselist=False, back_populates="vendor", cascade="all, delete-orphan")
    relationship_management = relationship("VendorRelationshipManagement", uselist=False, back_populates="vendor", cascade="all, delete-orphan")
    compliance_check = relationship("ComplianceAndLegalCheck", uselist=False, back_populates="vendor", cascade="all, delete-orphan")
    documentation = relationship("VendorDocumentation", uselist=False, back_populates="vendor", cascade="all, delete-orphan")
    reporting = relationship("VendorReportingAndAnalysis", uselist=False, back_populates="vendor", cascade="all, delete-orphan")


# Child tables with one-to-one link to Vendor
class VendorClassification(Base):
    __tablename__ = "vendor_classifications"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_master_id = Column(String, ForeignKey("vendors.id"), unique=True, nullable=False)
    classification_id = Column(String)
    category = Column(String)
    sub_category = Column(String)
    rating = Column(String)
    classification_date = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    vendor = relationship("Vendor", back_populates="classification")

class VendorEvaluation(Base):
    __tablename__ = "vendor_evaluations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_master_id = Column(String, ForeignKey("vendors.id"), unique=True, nullable=False)
    evaluation_id = Column(String)
    evaluation_date = Column(String)
    criteria = Column(SAJSON) # For list of strings
    score_quality = Column(Integer)
    score_delivery_time = Column(Integer)
    outcome = Column(String)
    evaluator = Column(String)
    remarks = Column(String)
    vendor = relationship("Vendor", back_populates="evaluation")

class IntegrationWithPurchaseProcess(Base):
    __tablename__ = "purchase_integrations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_master_id = Column(String, ForeignKey("vendors.id"), unique=True, nullable=False)
    purchase_id = Column(String)
    purchase_order_no = Column(String)
    item_or_service = Column(String)
    quantity = Column(Integer)
    order_date = Column(String)
    delivery_status = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    vendor = relationship("Vendor", back_populates="purchase_integration")
    
class VendorPaymentTracking(Base):
    __tablename__ = "vendor_payment_trackings"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_master_id = Column(String, ForeignKey("vendors.id"), unique=True, nullable=False)
    payment_id = Column(String)
    invoice_number = Column(String)
    invoice_amount = Column(Float)
    payment_due_date = Column(String)
    payment_date = Column(String)
    payment_status = Column(String)
    payment_method = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    vendor = relationship("Vendor", back_populates="payment_tracking")

class VendorRelationshipManagement(Base):
    __tablename__ = "relationship_managements"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_master_id = Column(String, ForeignKey("vendors.id"), unique=True, nullable=False)
    relationship_id = Column(String)
    interaction_type = Column(String)
    date = Column(String)
    details = Column(String)
    outcome = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    vendor = relationship("Vendor", back_populates="relationship_management")

class ComplianceAndLegalCheck(Base):
    __tablename__ = "compliance_checks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_master_id = Column(String, ForeignKey("vendors.id"), unique=True, nullable=False)
    compliance_id = Column(String)
    regulation = Column(String)
    check_date = Column(String)
    compliance_status = Column(String)
    issues_found = Column(String)
    corrective_actions = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    vendor = relationship("Vendor", back_populates="compliance_check")

class VendorDocumentation(Base):
    __tablename__ = "vendor_documentations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_master_id = Column(String, ForeignKey("vendors.id"), unique=True, nullable=False)
    document_id = Column(String)
    document_type = Column(String)
    title = Column(String)
    created_date = Column(String)
    author = Column(String)
    status = Column(String)
    storage_location = Column(String)
    remarks = Column(String)
    vendor = relationship("Vendor", back_populates="documentation")

class VendorReportingAndAnalysis(Base):
    __tablename__ = "vendor_reporting_and_analyses"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_master_id = Column(String, ForeignKey("vendors.id"), unique=True, nullable=False)
    report_id = Column(String)
    report_type = Column(String)
    period = Column(String)
    metrics_delivery_time_avg_days = Column(Integer)
    metrics_cost_variance_percent = Column(Float)
    metrics_quality_score_avg = Column(Float)
    findings = Column(String)
    generated_date = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    vendor = relationship("Vendor", back_populates="reporting")


# --- Pydantic Schemas ---

# Schemas for nested objects
class ContactDetailsSchema(BaseModel):
    phone: str
    email: EmailStr

class ScoreSchema(BaseModel):
    quality: int
    delivery_time: int

class MetricsSchema(BaseModel):
    delivery_time_avg_days: int
    cost_variance_percent: float
    quality_score_avg: float

# Schemas for each top-level object
class VendorMasterManagementSchema(BaseModel):
    vendor_id: str; vendor_name: str; contact_person: str; contact_details: ContactDetailsSchema; address: str; registration_date: str; status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

class VendorClassificationSchema(BaseModel):
    classification_id: str; vendor_id: str; vendor_name: str; category: str; sub_category: str; rating: str; classification_date: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

class VendorEvaluationSchema(BaseModel):
    evaluation_id: str; vendor_id: str; vendor_name: str; evaluation_date: str; criteria: List[str]; score: ScoreSchema; outcome: str; evaluator: str; remarks: str
    class Config: from_attributes = True

class IntegrationWithPurchaseProcessSchema(BaseModel):
    purchase_id: str; vendor_id: str; vendor_name: str; purchase_order_no: str; item_or_service: str; quantity: int; order_date: str; delivery_status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

class VendorPaymentTrackingSchema(BaseModel):
    payment_id: str; vendor_id: str; vendor_name: str; invoice_number: str; invoice_amount: float; payment_due_date: str; payment_date: str; payment_status: str; payment_method: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

class VendorRelationshipManagementSchema(BaseModel):
    relationship_id: str; vendor_id: str; vendor_name: str; interaction_type: str; date: str; details: str; outcome: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

class ComplianceAndLegalCheckSchema(BaseModel):
    compliance_id: str; vendor_id: str; vendor_name: str; regulation: str; check_date: str; compliance_status: str; issues_found: str; corrective_actions: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

class VendorDocumentationSchema(BaseModel):
    document_id: str; vendor_id: str; vendor_name: str; document_type: str; title: str; created_date: str; author: str; status: str; storage_location: str; remarks: str
    class Config: from_attributes = True

class VendorReportingAndAnalysisSchema(BaseModel):
    report_id: str; vendor_id: str; vendor_name: str; report_type: str; period: str; metrics: MetricsSchema; findings: str; generated_date: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

# Schema for the complete Vendor Master record for Create/Update
class VendorMasterCreate(BaseModel):
    property_id: str
    vendor_master_management: VendorMasterManagementSchema
    vendor_classification: Optional[VendorClassificationSchema] = None
    vendor_evaluation: Optional[VendorEvaluationSchema] = None
    integration_with_purchase_process: Optional[IntegrationWithPurchaseProcessSchema] = None
    payment_tracking: Optional[VendorPaymentTrackingSchema] = None
    vendor_relationship_management: Optional[VendorRelationshipManagementSchema] = None
    compliance_and_legal_check: Optional[ComplianceAndLegalCheckSchema] = None
    vendor_documentation: Optional[VendorDocumentationSchema] = None
    reporting_and_analysis: Optional[VendorReportingAndAnalysisSchema] = None

class VendorMasterUpdate(BaseModel):
    property_id: Optional[str] = None
    vendor_master_management: Optional[VendorMasterManagementSchema] = None
    vendor_classification: Optional[VendorClassificationSchema] = None
    vendor_evaluation: Optional[VendorEvaluationSchema] = None
    integration_with_purchase_process: Optional[IntegrationWithPurchaseProcessSchema] = None
    payment_tracking: Optional[VendorPaymentTrackingSchema] = None
    vendor_relationship_management: Optional[VendorRelationshipManagementSchema] = None
    compliance_and_legal_check: Optional[ComplianceAndLegalCheckSchema] = None
    vendor_documentation: Optional[VendorDocumentationSchema] = None
    reporting_and_analysis: Optional[VendorReportingAndAnalysisSchema] = None

# Schema for the response model
class VendorMasterResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    vendor_master_management: VendorMasterManagementSchema
    vendor_classification: Optional[VendorClassificationSchema] = None
    vendor_evaluation: Optional[VendorEvaluationSchema] = None
    integration_with_purchase_process: Optional[IntegrationWithPurchaseProcessSchema] = None
    payment_tracking: Optional[VendorPaymentTrackingSchema] = None
    vendor_relationship_management: Optional[VendorRelationshipManagementSchema] = None
    compliance_and_legal_check: Optional[ComplianceAndLegalCheckSchema] = None
    vendor_documentation: Optional[VendorDocumentationSchema] = None
    reporting_and_analysis: Optional[VendorReportingAndAnalysisSchema] = None
    
    class Config:
        from_attributes = True
    
    @classmethod
    def model_validate(cls, obj):
        # Convert SQLAlchemy object to response format
        data = {
            "id": obj.id,
            "property_id": obj.property_id,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "vendor_master_management": {
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "contact_person": obj.contact_person,
                "contact_details": {
                    "phone": obj.contact_phone,
                    "email": obj.contact_email
                },
                "address": obj.address,
                "registration_date": obj.registration_date,
                "status": obj.status,
                "responsible_person": obj.responsible_person,
                "remarks": obj.remarks
            }
        }
        
        # Add optional relationships if they exist
        if obj.classification:
            data["vendor_classification"] = {
                "classification_id": obj.classification.classification_id,
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "category": obj.classification.category,
                "sub_category": obj.classification.sub_category,
                "rating": obj.classification.rating,
                "classification_date": obj.classification.classification_date,
                "responsible_person": obj.classification.responsible_person,
                "remarks": obj.classification.remarks
            }
        
        if obj.evaluation:
            data["vendor_evaluation"] = {
                "evaluation_id": obj.evaluation.evaluation_id,
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "evaluation_date": obj.evaluation.evaluation_date,
                "criteria": obj.evaluation.criteria or [],
                "score": {
                    "quality": obj.evaluation.score_quality,
                    "delivery_time": obj.evaluation.score_delivery_time
                },
                "outcome": obj.evaluation.outcome,
                "evaluator": obj.evaluation.evaluator,
                "remarks": obj.evaluation.remarks
            }
        
        if obj.purchase_integration:
            data["integration_with_purchase_process"] = {
                "purchase_id": obj.purchase_integration.purchase_id,
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "purchase_order_no": obj.purchase_integration.purchase_order_no,
                "item_or_service": obj.purchase_integration.item_or_service,
                "quantity": obj.purchase_integration.quantity,
                "order_date": obj.purchase_integration.order_date,
                "delivery_status": obj.purchase_integration.delivery_status,
                "responsible_person": obj.purchase_integration.responsible_person,
                "remarks": obj.purchase_integration.remarks
            }
        
        if obj.payment_tracking:
            data["payment_tracking"] = {
                "payment_id": obj.payment_tracking.payment_id,
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "invoice_number": obj.payment_tracking.invoice_number,
                "invoice_amount": obj.payment_tracking.invoice_amount,
                "payment_due_date": obj.payment_tracking.payment_due_date,
                "payment_date": obj.payment_tracking.payment_date,
                "payment_status": obj.payment_tracking.payment_status,
                "payment_method": obj.payment_tracking.payment_method,
                "responsible_person": obj.payment_tracking.responsible_person,
                "remarks": obj.payment_tracking.remarks
            }
        
        if obj.relationship_management:
            data["vendor_relationship_management"] = {
                "relationship_id": obj.relationship_management.relationship_id,
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "interaction_type": obj.relationship_management.interaction_type,
                "date": obj.relationship_management.date,
                "details": obj.relationship_management.details,
                "outcome": obj.relationship_management.outcome,
                "responsible_person": obj.relationship_management.responsible_person,
                "remarks": obj.relationship_management.remarks
            }
        
        if obj.compliance_check:
            data["compliance_and_legal_check"] = {
                "compliance_id": obj.compliance_check.compliance_id,
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "regulation": obj.compliance_check.regulation,
                "check_date": obj.compliance_check.check_date,
                "compliance_status": obj.compliance_check.compliance_status,
                "issues_found": obj.compliance_check.issues_found,
                "corrective_actions": obj.compliance_check.corrective_actions,
                "responsible_person": obj.compliance_check.responsible_person,
                "remarks": obj.compliance_check.remarks
            }
        
        if obj.documentation:
            data["vendor_documentation"] = {
                "document_id": obj.documentation.document_id,
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "document_type": obj.documentation.document_type,
                "title": obj.documentation.title,
                "created_date": obj.documentation.created_date,
                "author": obj.documentation.author,
                "status": obj.documentation.status,
                "storage_location": obj.documentation.storage_location,
                "remarks": obj.documentation.remarks
            }
        
        if obj.reporting:
            data["reporting_and_analysis"] = {
                "report_id": obj.reporting.report_id,
                "vendor_id": obj.vendor_id,
                "vendor_name": obj.vendor_name,
                "report_type": obj.reporting.report_type,
                "period": obj.reporting.period,
                "metrics": {
                    "delivery_time_avg_days": obj.reporting.metrics_delivery_time_avg_days,
                    "cost_variance_percent": obj.reporting.metrics_cost_variance_percent,
                    "quality_score_avg": obj.reporting.metrics_quality_score_avg
                },
                "findings": obj.reporting.findings,
                "generated_date": obj.reporting.generated_date,
                "responsible_person": obj.reporting.responsible_person,
                "remarks": obj.reporting.remarks
            }
        
        return cls(**data)

Base.metadata.create_all(bind=engine)

# Helper to flatten nested Pydantic models to dict for DB insertion
def flatten_data(pydantic_model: BaseModel) -> dict:
    data = pydantic_model.dict()
    flat_data = {}
    for key, value in data.items():
        if isinstance(value, dict):
            for sub_key, sub_value in value.items():
                # Special handling for contact_details to map to contact_phone and contact_email
                if key == "contact_details":
                    if sub_key == "phone":
                        flat_data["contact_phone"] = sub_value
                    elif sub_key == "email":
                        flat_data["contact_email"] = sub_value
                else:
                    flat_data[f"{key}_{sub_key}"] = sub_value
        else:
            flat_data[key] = value
    return flat_data

# Map JASON keys to their corresponding SQLAlchemy models
CHILD_MODEL_MAP = {
    "vendor_classification": VendorClassification,
    "vendor_evaluation": VendorEvaluation,
    "integration_with_purchase_process": IntegrationWithPurchaseProcess,
    "payment_tracking": VendorPaymentTracking,
    "vendor_relationship_management": VendorRelationshipManagement,
    "compliance_and_legal_check": ComplianceAndLegalCheck,
    "vendor_documentation": VendorDocumentation,
    "reporting_and_analysis": VendorReportingAndAnalysis,
}


@app.post("/vendor-masters/", response_model=VendorMasterResponse, status_code=status.HTTP_201_CREATED, tags=["Vendor Master"])
def create_vendor_master(vendor_data: VendorMasterCreate, db: Session = Depends(get_db)):
    try:
        # Create the main vendor record
        master_data_dict = flatten_data(vendor_data.vendor_master_management)
        db_vendor = Vendor(property_id=vendor_data.property_id, **master_data_dict)
        db.add(db_vendor)
        db.flush()

        # Create child one-to-one records
        for key, model in CHILD_MODEL_MAP.items():
            child_data = getattr(vendor_data, key)
            if child_data:
                child_dict = flatten_data(child_data)
                # Remove fields that don't map directly to the model (vendor_id, vendor_name)
                child_dict.pop("vendor_id", None)
                child_dict.pop("vendor_name", None)
                db_child = model(vendor_master_id=db_vendor.id, **child_dict)
                db.add(db_child)

        db.commit()
        db.refresh(db_vendor)
        return VendorMasterResponse.model_validate(db_vendor)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating vendor master: {str(e)}")


@app.get("/vendor-masters/", response_model=List[VendorMasterResponse], tags=["Vendor Master"])
def get_all_vendor_masters(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Vendor)
    if property_id:
        query = query.filter(Vendor.property_id == property_id)
    vendors = query.offset(skip).limit(limit).all()
    return [VendorMasterResponse.model_validate(v) for v in vendors]


@app.get("/vendor-masters/{vendor_master_id}", response_model=VendorMasterResponse, tags=["Vendor Master"])
def get_vendor_master_by_id(vendor_master_id: str, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_master_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor master record not found")
    return VendorMasterResponse.model_validate(vendor)


@app.put("/vendor-masters/{vendor_master_id}", response_model=VendorMasterResponse, tags=["Vendor Master"])
def update_vendor_master(vendor_master_id: str, vendor_update: VendorMasterUpdate, db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_master_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor master record not found")
    
    try:
        # Update main vendor record
        if vendor_update.property_id:
            db_vendor.property_id = vendor_update.property_id
        if vendor_update.vendor_master_management:
            update_data = flatten_data(vendor_update.vendor_master_management)
            for key, value in update_data.items():
                setattr(db_vendor, key, value)

        # Update or create child records
        for key, model in CHILD_MODEL_MAP.items():
            child_update_data = getattr(vendor_update, key)
            if child_update_data:
                db_child = db.query(model).filter(model.vendor_master_id == vendor_master_id).first()
                child_dict = flatten_data(child_update_data)
                child_dict.pop("vendor_id", None)
                child_dict.pop("vendor_name", None)
                if db_child: # Update existing child
                    for c_key, c_value in child_dict.items():
                        setattr(db_child, c_key, c_value)
                else: # Create new child if it didn't exist
                    db_child = model(vendor_master_id=vendor_master_id, **child_dict)
                    db.add(db_child)

        db.commit()
        db.refresh(db_vendor)
        return VendorMasterResponse.model_validate(db_vendor)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating vendor master: {str(e)}")


@app.delete("/vendor-masters/{vendor_master_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Vendor Master"])
def delete_vendor_master(vendor_master_id: str, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_master_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor master record not found")
    
    try:
        db.delete(vendor)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting vendor master: {str(e)}")



def generate_uuid():
    return str(uuid.uuid4())

# --- SQLAlchemy ORM Models ---

# Main Project Table (from project_initiation)
class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    project_id = Column(String, unique=True, index=True)
    project_name = Column(String)
    sponsor = Column(String)
    objective = Column(String)
    start_date = Column(String)
    budget = Column(Float)
    status = Column(String)
    project_manager = Column(String)
    stakeholders = Column(JSON) # Stores list as JSON
    remarks = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-one relationships
    planning = relationship("ProjectPlanning", uselist=False, back_populates="project", cascade="all, delete-orphan")
    closure = relationship("ProjectClosure", uselist=False, back_populates="project", cascade="all, delete-orphan")
    
    # One-to-many relationships
    team_allocations = relationship("TeamResourceAllocation", back_populates="project", cascade="all, delete-orphan")
    execution_tasks = relationship("ExecutionImplementation", back_populates="project", cascade="all, delete-orphan")
    monitoring_logs = relationship("MonitoringControl", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("DocumentationReporting", back_populates="project", cascade="all, delete-orphan")
    depreciation_assets = relationship("DepreciationReplacement", back_populates="project", cascade="all, delete-orphan")

# --- Child Tables ---

# One-to-One Child Tables
class ProjectPlanning(Base):
    __tablename__ = "project_planning"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_master_id = Column(String, ForeignKey("projects.id"), unique=True, nullable=False)
    plan_id = Column(String)
    scope = Column(String)
    milestones = Column(JSON)
    start_date = Column(String)
    end_date = Column(String)
    resources_required = Column(JSON)
    risk_assessment = Column(String)
    status = Column(String)
    remarks = Column(String)
    project = relationship("Project", back_populates="planning")

class ProjectClosure(Base):
    __tablename__ = "project_closure"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_master_id = Column(String, ForeignKey("projects.id"), unique=True, nullable=False)
    closure_id = Column(String)
    completion_date = Column(String)
    final_budget = Column(Float)
    deliverables = Column(JSON)
    lessons_learned = Column(String)
    status = Column(String)
    remarks = Column(String)
    project = relationship("Project", back_populates="closure")

# One-to-Many Child Tables
class TeamResourceAllocation(Base):
    __tablename__ = "team_allocations"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_master_id = Column(String, ForeignKey("projects.id"), nullable=False)
    allocation_id = Column(String)
    team_member = Column(String)
    role = Column(String)
    allocation_start_date = Column(String)
    allocation_end_date = Column(String)
    hours_allocated = Column(Integer)
    department = Column(String)
    status = Column(String)
    remarks = Column(String)
    project = relationship("Project", back_populates="team_allocations")

class ExecutionImplementation(Base):
    __tablename__ = "execution_tasks"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_master_id = Column(String, ForeignKey("projects.id"), nullable=False)
    task_id = Column(String)
    task_description = Column(String)
    assigned_to = Column(String)
    start_date = Column(String)
    due_date = Column(String)
    progress = Column(Integer)
    status = Column(String)
    priority = Column(String)
    remarks = Column(String)
    project = relationship("Project", back_populates="execution_tasks")

class MonitoringControl(Base):
    __tablename__ = "monitoring_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_master_id = Column(String, ForeignKey("projects.id"), nullable=False)
    monitor_id = Column(String)
    kpi_metric = Column(String)
    target = Column(Integer)
    actual = Column(Integer)
    variance = Column(Integer)
    date_checked = Column(String)
    status = Column(String)
    remarks = Column(String)
    project = relationship("Project", back_populates="monitoring_logs")

class DocumentationReporting(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_master_id = Column(String, ForeignKey("projects.id"), nullable=False)
    document_id = Column(String)
    document_type = Column(String)
    title = Column(String)
    created_date = Column(String)
    author = Column(String)
    status = Column(String)
    storage_location = Column(String)
    remarks = Column(String)
    project = relationship("Project", back_populates="documents")

class DepreciationReplacement(Base):
    __tablename__ = "depreciation_assets"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_master_id = Column(String, ForeignKey("projects.id"), nullable=False)
    depreciation_id = Column(String)
    asset_id = Column(String)
    asset_name = Column(String)
    purchase_date = Column(String)
    purchase_cost = Column(Float)
    depreciation_method = Column(String)
    annual_depreciation = Column(Float)
    current_value = Column(Float)
    replacement_date = Column(String)
    status = Column(String)
    remarks = Column(String)
    project = relationship("Project", back_populates="depreciation_assets")

# --- Pydantic Schemas ---
class ProjectInitiationSchema(BaseModel):
    project_id: str; project_name: str; sponsor: str; objective: str; start_date: str; budget: float; status: str; project_manager: str; stakeholders: List[str]; remarks: str
    class Config: from_attributes = True
class ProjectPlanningSchema(BaseModel):
    plan_id: str; project_id: str; project_name: Optional[str] = None; scope: str; milestones: List[str]; start_date: str; end_date: str; resources_required: List[str]; risk_assessment: str; status: str; project_manager: Optional[str] = None; remarks: str
    class Config: from_attributes = True
class TeamResourceAllocationSchema(BaseModel):
    allocation_id: str; project_id: str; project_name: Optional[str] = None; team_member: str; role: str; allocation_start_date: str; allocation_end_date: str; hours_allocated: int; department: str; status: str; project_manager: Optional[str] = None; remarks: str
    class Config: from_attributes = True
class ExecutionImplementationSchema(BaseModel):
    task_id: str; project_id: str; project_name: Optional[str] = None; task_description: str; assigned_to: str; start_date: str; due_date: str; progress: int; status: str; priority: str; project_manager: Optional[str] = None; remarks: str
    class Config: from_attributes = True
class MonitoringControlSchema(BaseModel):
    monitor_id: str; project_id: str; project_name: Optional[str] = None; kpi_metric: str; target: int; actual: int; variance: int; date_checked: str; status: str; project_manager: Optional[str] = None; remarks: str
    class Config: from_attributes = True
class DocumentationReportingSchema(BaseModel):
    document_id: str; project_id: str; project_name: Optional[str] = None; document_type: str; title: str; created_date: str; author: str; status: str; storage_location: str; project_manager: Optional[str] = None; remarks: str
    class Config: from_attributes = True
class ProjectClosureSchema(BaseModel):
    closure_id: str; project_id: str; project_name: Optional[str] = None; completion_date: str; final_budget: float; deliverables: List[str]; lessons_learned: str; status: str; project_manager: Optional[str] = None; remarks: str
    class Config: from_attributes = True
class DepreciationReplacementSchema(BaseModel):
    depreciation_id: str; project_id: str; asset_id: str; asset_name: str; purchase_date: str; purchase_cost: float; depreciation_method: str; annual_depreciation: float; current_value: float; replacement_date: str; status: str; project_manager: Optional[str] = None; remarks: str
    class Config: from_attributes = True

# Schemas for API Operations
class ProjectMasterCreate(BaseModel):
    property_id: str
    project_initiation: ProjectInitiationSchema
    project_planning: ProjectPlanningSchema
    team_resource_allocation: List[TeamResourceAllocationSchema] = []
    execution_implementation: List[ExecutionImplementationSchema] = []
    monitoring_control: List[MonitoringControlSchema] = []
    documentation_reporting: List[DocumentationReportingSchema] = []
    project_closure: Optional[ProjectClosureSchema] = None
    depreciation_replacement: List[DepreciationReplacementSchema] = []

class ProjectMasterUpdate(BaseModel):
    property_id: Optional[str] = None
    project_initiation: Optional[ProjectInitiationSchema] = None
    project_planning: Optional[ProjectPlanningSchema] = None
    team_resource_allocation: Optional[List[TeamResourceAllocationSchema]] = None
    execution_implementation: Optional[List[ExecutionImplementationSchema]] = None
    monitoring_control: Optional[List[MonitoringControlSchema]] = None
    documentation_reporting: Optional[List[DocumentationReportingSchema]] = None
    project_closure: Optional[ProjectClosureSchema] = None
    depreciation_replacement: Optional[List[DepreciationReplacementSchema]] = None
    
# Schemas for API Response
class ProjectInitiationResponse(ProjectInitiationSchema): 
    id: str; created_at: datetime; updated_at: datetime
    class Config: from_attributes = True

class ProjectPlanningResponse(ProjectPlanningSchema): 
    id: str
    class Config: from_attributes = True

class TeamResourceAllocationResponse(TeamResourceAllocationSchema): 
    id: str
    class Config: from_attributes = True

class ExecutionImplementationResponse(ExecutionImplementationSchema): 
    id: str
    class Config: from_attributes = True

class MonitoringControlResponse(MonitoringControlSchema): 
    id: str
    class Config: from_attributes = True

class DocumentationReportingResponse(DocumentationReportingSchema): 
    id: str
    class Config: from_attributes = True

class ProjectClosureResponse(ProjectClosureSchema): 
    id: str
    class Config: from_attributes = True

class DepreciationReplacementResponse(DepreciationReplacementSchema): 
    id: str
    class Config: from_attributes = True

class ProjectMasterResponse(BaseModel):
    property_id: str
    project_initiation: ProjectInitiationResponse
    project_planning: Optional[ProjectPlanningResponse] = None
    project_closure: Optional[ProjectClosureResponse] = None
    team_resource_allocation: List[TeamResourceAllocationResponse] = []
    execution_implementation: List[ExecutionImplementationResponse] = []
    monitoring_control: List[MonitoringControlResponse] = []
    documentation_reporting: List[DocumentationReportingResponse] = []
    depreciation_replacement: List[DepreciationReplacementResponse] = []
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm_model(cls, orm_model):
        """Convert SQLAlchemy ORM object to Pydantic response model"""
        return cls(
            property_id=orm_model.property_id,
            project_initiation=ProjectInitiationResponse.from_orm(orm_model),
            project_planning=ProjectPlanningResponse(
                id=orm_model.planning.id,
                plan_id=orm_model.planning.plan_id,
                project_id=orm_model.project_id,
                project_name=orm_model.project_name,
                scope=orm_model.planning.scope,
                milestones=orm_model.planning.milestones or [],
                start_date=orm_model.planning.start_date,
                end_date=orm_model.planning.end_date,
                resources_required=orm_model.planning.resources_required or [],
                risk_assessment=orm_model.planning.risk_assessment,
                status=orm_model.planning.status,
                project_manager=orm_model.project_manager,
                remarks=orm_model.planning.remarks
            ) if hasattr(orm_model, 'planning') and orm_model.planning else None,
            project_closure=ProjectClosureResponse(
                id=orm_model.closure.id,
                closure_id=orm_model.closure.closure_id,
                project_id=orm_model.project_id,
                project_name=orm_model.project_name,
                closure_date=orm_model.closure.closure_date,
                final_budget=orm_model.closure.final_budget,
                lessons_learned=orm_model.closure.lessons_learned,
                deliverables_completed=orm_model.closure.deliverables_completed or [],
                project_manager=orm_model.project_manager,
                remarks=orm_model.closure.remarks
            ) if hasattr(orm_model, 'closure') and orm_model.closure else None,
            team_resource_allocation=[TeamResourceAllocationResponse(
                id=item.id,
                allocation_id=item.allocation_id,
                project_id=orm_model.project_id,
                project_name=orm_model.project_name,
                team_member=item.team_member,
                role=item.role,
                allocation_start_date=item.allocation_start_date,
                allocation_end_date=item.allocation_end_date,
                hours_allocated=item.hours_allocated,
                department=item.department,
                status=item.status,
                project_manager=orm_model.project_manager,
                remarks=item.remarks
            ) for item in orm_model.team_allocations] if hasattr(orm_model, 'team_allocations') else [],
            execution_implementation=[ExecutionImplementationResponse.from_orm(item) for item in orm_model.execution_tasks] if hasattr(orm_model, 'execution_tasks') else [],
            monitoring_control=[MonitoringControlResponse.from_orm(item) for item in orm_model.monitoring_logs] if hasattr(orm_model, 'monitoring_logs') else [],
            documentation_reporting=[DocumentationReportingResponse.from_orm(item) for item in orm_model.documents] if hasattr(orm_model, 'documents') else [],
            depreciation_replacement=[DepreciationReplacementResponse.from_orm(item) for item in orm_model.depreciation_assets] if hasattr(orm_model, 'depreciation_assets') else []
        )
    
    @classmethod
    def model_validate(cls, obj):
        # Handle both SQLAlchemy objects and dictionaries
        if hasattr(obj, 'property_id'):  # SQLAlchemy object
            data = {
                "property_id": obj.property_id,
                "project_initiation": {
                    "id": obj.id,
                    "project_id": obj.project_id,
                    "project_name": obj.project_name,
                    "sponsor": obj.sponsor,
                    "objective": obj.objective,
                    "start_date": obj.start_date,
                    "budget": obj.budget,
                    "status": obj.status,
                    "project_manager": obj.project_manager,
                    "stakeholders": obj.stakeholders or [],
                    "remarks": obj.remarks,
                    "created_at": obj.created_at,
                    "updated_at": obj.updated_at
                }
            }
        else:  # Dictionary
            data = obj
        
        # Add optional one-to-one relationships if they exist
        if hasattr(obj, 'planning') and obj.planning:
            data["project_planning"] = {
                "id": obj.planning.id,
                "plan_id": obj.planning.plan_id,
                "project_id": obj.project_id,
                "project_name": obj.project_name,
                "scope": obj.planning.scope,
                "milestones": obj.planning.milestones or [],
                "start_date": obj.planning.start_date,
                "end_date": obj.planning.end_date,
                "resources_required": obj.planning.resources_required or [],
                "risk_assessment": obj.planning.risk_assessment,
                "status": obj.planning.status,
                "project_manager": obj.project_manager,
                "remarks": obj.planning.remarks
            }
        
        if hasattr(obj, 'closure') and obj.closure:
            data["project_closure"] = {
                "id": obj.closure.id,
                "closure_id": obj.closure.closure_id,
                "project_id": obj.project_id,
                "project_name": obj.project_name,
                "completion_date": obj.closure.completion_date,
                "final_budget": obj.closure.final_budget,
                "deliverables": obj.closure.deliverables or [],
                "lessons_learned": obj.closure.lessons_learned,
                "status": obj.closure.status,
                "project_manager": obj.project_manager,
                "remarks": obj.closure.remarks
            }
        
        # Add one-to-many relationships
        if hasattr(obj, 'team_allocations'):
            data["team_resource_allocation"] = [
                {
                    "id": allocation.id,
                    "allocation_id": allocation.allocation_id,
                    "project_id": obj.project_id,
                    "project_name": obj.project_name,
                    "team_member": allocation.team_member,
                    "role": allocation.role,
                    "allocation_start_date": allocation.allocation_start_date,
                    "allocation_end_date": allocation.allocation_end_date,
                    "hours_allocated": allocation.hours_allocated,
                    "department": allocation.department,
                    "status": allocation.status,
                    "project_manager": obj.project_manager,
                    "remarks": allocation.remarks
                }
                for allocation in obj.team_allocations
            ]
        else:
            data["team_resource_allocation"] = []
        
        if hasattr(obj, 'execution_tasks'):
            data["execution_implementation"] = [
                {
                    "id": task.id,
                    "task_id": task.task_id,
                    "project_id": obj.project_id,
                    "project_name": obj.project_name,
                    "task_description": task.task_description,
                    "assigned_to": task.assigned_to,
                    "start_date": task.start_date,
                    "due_date": task.due_date,
                    "progress": task.progress,
                    "status": task.status,
                    "priority": task.priority,
                    "project_manager": obj.project_manager,
                    "remarks": task.remarks
                }
                for task in obj.execution_tasks
            ]
        else:
            data["execution_implementation"] = []
        
        if hasattr(obj, 'monitoring_logs'):
            data["monitoring_control"] = [
                {
                    "id": monitor.id,
                    "monitor_id": monitor.monitor_id,
                    "project_id": obj.project_id,
                    "project_name": obj.project_name,
                    "kpi_metric": monitor.kpi_metric,
                    "target": monitor.target,
                    "actual": monitor.actual,
                    "variance": monitor.variance,
                    "date_checked": monitor.date_checked,
                    "status": monitor.status,
                    "project_manager": obj.project_manager,
                    "remarks": monitor.remarks
                }
                for monitor in obj.monitoring_logs
            ]
        else:
            data["monitoring_control"] = []
        
        if hasattr(obj, 'documents'):
            data["documentation_reporting"] = [
                {
                    "id": doc.id,
                    "document_id": doc.document_id,
                    "project_id": obj.project_id,
                    "project_name": obj.project_name,
                    "document_type": doc.document_type,
                    "title": doc.title,
                    "created_date": doc.created_date,
                    "author": doc.author,
                    "status": doc.status,
                    "storage_location": doc.storage_location,
                    "project_manager": obj.project_manager,
                    "remarks": doc.remarks
                }
                for doc in obj.documents
            ]
        else:
            data["documentation_reporting"] = []
        
        if hasattr(obj, 'depreciation_assets'):
            data["depreciation_replacement"] = [
                {
                    "id": dep.id,
                    "depreciation_id": dep.depreciation_id,
                    "project_id": obj.project_id,
                    "asset_id": dep.asset_id,
                    "asset_name": dep.asset_name,
                    "purchase_date": dep.purchase_date,
                    "purchase_cost": dep.purchase_cost,
                    "depreciation_method": dep.depreciation_method,
                    "annual_depreciation": dep.annual_depreciation,
                    "current_value": dep.current_value,
                    "replacement_date": dep.replacement_date,
                    "status": dep.status,
                    "project_manager": obj.project_manager,
                    "remarks": dep.remarks
                }
                for dep in obj.depreciation_assets
            ]
        else:
            data["depreciation_replacement"] = []
        
        return cls(**data)

Base.metadata.create_all(bind=engine)

# Define project master model maps locally to avoid conflicts
PROJECT_ONE_TO_ONE_MAP = {"project_planning": ProjectPlanning, "project_closure": ProjectClosure}
PROJECT_ONE_TO_MANY_MAP = {
    "team_resource_allocation": TeamResourceAllocation, "execution_implementation": ExecutionImplementation,
    "monitoring_control": MonitoringControl, "documentation_reporting": DocumentationReporting,
    "depreciation_replacement": DepreciationReplacement
}

@app.post("/project-masters/", response_model=ProjectMasterResponse, status_code=status.HTTP_201_CREATED, tags=["Project Master"])
def create_project_master(project_data: ProjectMasterCreate, db: Session = Depends(get_db)):
    try:
        init_data = project_data.project_initiation.model_dump()
        # Keep all fields as they map directly to the Project model
        db_project = Project(property_id=project_data.property_id, **init_data)
        db.add(db_project)
        db.flush()

        for key, model in PROJECT_ONE_TO_ONE_MAP.items():
            data = getattr(project_data, key)
            if data:
                data_dict = data.model_dump()
                # Remove fields that don't belong to the child model
                data_dict.pop("project_id", None); data_dict.pop("project_name", None); data_dict.pop("project_manager", None)
                db_child = model(project_master_id=db_project.id, **data_dict)
                db.add(db_child)
        
        for key, model in PROJECT_ONE_TO_MANY_MAP.items():
            entries = getattr(project_data, key, [])
            for entry_data in entries:
                data_dict = entry_data.model_dump()
                data_dict.pop("project_id", None); data_dict.pop("project_name", None); data_dict.pop("project_manager", None)
                db_entry = model(project_master_id=db_project.id, **data_dict)
                db.add(db_entry)

        db.commit()
        db.refresh(db_project)
        return ProjectMasterResponse.from_orm_model(db_project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

# @app.get("/project-masters/", response_model=List[ProjectMasterResponse], tags=["Project Master"])
# def get_all_project_masters(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
#     from sqlalchemy.orm import joinedload
    
#     query = db.query(Project).options(
#         joinedload(Project.planning),
#         joinedload(Project.closure),
#         joinedload(Project.team_allocations),
#         joinedload(Project.execution_tasks),
#         joinedload(Project.monitoring_logs),
#         joinedload(Project.documents),
#         joinedload(Project.depreciation_assets)
#     )
#     if property_id:
#         query = query.filter(Project.property_id == property_id)
#     projects = query.offset(skip).limit(limit).all()
    
#     # Use the same approach as the working POST endpoint
#     return [ProjectMasterResponse.model_validate(project) for project in projects]

@app.get("/project-masters/", response_model=List[ProjectMasterResponse], tags=["Project Master"])
def get_all_projects(db: Session = Depends(get_db)):
    try:
        projects = db.query(Project).all()
        return [ProjectMasterResponse.model_validate(proj) for proj in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")


@app.get("/project-masters/{project_id}", response_model=ProjectMasterResponse, tags=["Project Master"])
def get_project_master(project_id: int, db: Session = Depends(get_db)):
    try:
        db_project = db.query(Project).filter(Project.id == project_id).first()
        if not db_project:
            raise HTTPException(status_code=404, detail="Project not found")

        return ProjectMasterResponse.model_validate(db_project)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching project: {str(e)}")


# @app.get("/project-masters/{project_id}", response_model=ProjectMasterResponse, tags=["Project Master"])
# def get_project_master_by_id(project_id: str, db: Session = Depends(get_db)):
#     project = db.query(Project).filter(Project.id == project_id).first()
#     if not project:
#         raise HTTPException(status_code=404, detail="Project not found")
#     # Manually structure the response since it's complex
#     response_data = {
#         "property_id": project.property_id,
#         "project_initiation": project,
#         "project_planning": project.planning,
#         "project_closure": project.closure,
#         "team_resource_allocation": project.team_allocations,
#         "execution_implementation": project.execution_tasks,
#         "monitoring_control": project.monitoring_logs,
#         "documentation_reporting": project.documents,
#         "depreciation_replacement": project.depreciation_assets,
#     }
#     return ProjectMasterResponse.model_validate(response_data)


@app.put("/project-masters/{project_id}", response_model=ProjectMasterResponse, tags=["Project Master"])
def update_project_master(project_id: str, update_data: ProjectMasterUpdate, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Update main project record
        if update_data.property_id: db_project.property_id = update_data.property_id
        if update_data.project_initiation:
            init_update = update_data.project_initiation.model_dump(exclude_unset=True)
            for key, value in init_update.items():
                if hasattr(db_project, key): setattr(db_project, key, value)
        
        # Update one-to-one children
        for key, model in PROJECT_ONE_TO_ONE_MAP.items():
            child_data = getattr(update_data, key)
            if child_data:
                db_child = getattr(db_project, key.split('_')[-1]) # e.g., db_project.planning
                data_dict = child_data.model_dump(exclude_unset=True)
                data_dict.pop("project_id", None); data_dict.pop("project_name", None); data_dict.pop("project_manager", None)
                if db_child:
                    for c_key, c_value in data_dict.items(): setattr(db_child, c_key, c_value)
                else:
                    db_child = model(project_master_id=project_id, **data_dict); db.add(db_child)

        # Update one-to-many children (delete and replace)
        for key, model in PROJECT_ONE_TO_MANY_MAP.items():
            entries = getattr(update_data, key, None)
            if entries is not None:
                db.query(model).filter(model.project_master_id == project_id).delete(synchronize_session=False)
                for entry_data in entries:
                    data_dict = entry_data.model_dump()
                    data_dict.pop("project_id", None); data_dict.pop("project_name", None); data_dict.pop("project_manager", None)
                    db_entry = model(project_master_id=project_id, **data_dict)
                    db.add(db_entry)

        db.commit()
        db.refresh(db_project)
        return ProjectMasterResponse.from_orm_model(db_project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating project: {str(e)}")

@app.delete("/project-masters/{project_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Project Master"])
def delete_project_master(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        db.delete(project)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")

# Main Report Table
class SlaReport(Base):
    __tablename__ = "sla_reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    planning_definitions = relationship("SlaPlanningAndDefinition", back_populates="report", cascade="all, delete-orphan")
    key_components = relationship("KeySlaComponent", back_populates="report", cascade="all, delete-orphan")
    implementations = relationship("SlaImplementation", back_populates="report", cascade="all, delete-orphan")
    monitorings = relationship("SlaMonitoring", back_populates="report", cascade="all, delete-orphan")
    evaluations = relationship("SlaEvaluation", back_populates="report", cascade="all, delete-orphan")
    renewal_exits = relationship("SlaRenewalAndExitProcess", back_populates="report", cascade="all, delete-orphan")

# Child Tables
class SlaPlanningAndDefinition(Base):
    __tablename__ = "sla_planning_definitions"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("sla_reports.id"), nullable=False)
    sla_id = Column(String, index=True)
    service_name = Column(String)
    client_department = Column(String)
    objective = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    responsible_person = Column(String)
    status = Column(String)
    remarks = Column(String)
    report = relationship("SlaReport", back_populates="planning_definitions")

class KeySlaComponent(Base):
    __tablename__ = "key_sla_components"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("sla_reports.id"), nullable=False)
    component_id = Column(String)
    sla_id = Column(String)
    service_name = Column(String)
    component_type = Column(String)
    description = Column(String)
    target = Column(String)
    measurement_method = Column(String)
    responsible_person = Column(String)
    status = Column(String)
    remarks = Column(String)
    report = relationship("SlaReport", back_populates="key_components")

class SlaImplementation(Base):
    __tablename__ = "sla_implementations"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("sla_reports.id"), nullable=False)
    implementation_id = Column(String)
    sla_id = Column(String)
    service_name = Column(String)
    implementation_date = Column(String)
    actions_taken = Column(String)
    resources_assigned = Column(String)
    status = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    report = relationship("SlaReport", back_populates="implementations")

class SlaMonitoring(Base):
    __tablename__ = "sla_monitorings"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("sla_reports.id"), nullable=False)
    monitor_id = Column(String)
    sla_id = Column(String)
    service_name = Column(String)
    component_type = Column(String)
    target = Column(String)
    actual = Column(String)
    date_checked = Column(String)
    status = Column(String)
    responsible_person = Column(String)
    remarks = Column(String)
    report = relationship("SlaReport", back_populates="monitorings")

class SlaEvaluation(Base):
    __tablename__ = "sla_evaluations"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("sla_reports.id"), nullable=False)
    evaluation_id = Column(String)
    sla_id = Column(String)
    service_name = Column(String)
    evaluation_date = Column(String)
    criteria = Column(String)
    outcome = Column(String)
    evaluator = Column(String)
    corrective_actions = Column(String)
    remarks = Column(String)
    report = relationship("SlaReport", back_populates="evaluations")

class SlaRenewalAndExitProcess(Base):
    __tablename__ = "sla_renewal_exits"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("sla_reports.id"), nullable=False)
    renewal_exit_id = Column(String)
    sla_id = Column(String)
    service_name = Column(String)
    action_type = Column(String)
    action_date = Column(String)
    new_end_date = Column(String)
    reason = Column(String)
    responsible_person = Column(String)
    status = Column(String)
    remarks = Column(String)
    report = relationship("SlaReport", back_populates="renewal_exits")

# --- Pydantic Schemas ---

# Base schemas for individual list items
class SlaPlanningAndDefinitionSchema(BaseModel):
    sla_id: str; service_name: str; client_department: str; objective: str; start_date: str; end_date: str; responsible_person: str; status: str; remarks: str
    class Config: from_attributes = True

class KeySlaComponentSchema(BaseModel):
    component_id: str; sla_id: str; service_name: str; component_type: str; description: str; target: str; measurement_method: str; responsible_person: str; status: str; remarks: str
    class Config: from_attributes = True

class SlaImplementationSchema(BaseModel):
    implementation_id: str; sla_id: str; service_name: str; implementation_date: str; actions_taken: str; resources_assigned: str; status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

class SlaMonitoringSchema(BaseModel):
    monitor_id: str; sla_id: str; service_name: str; component_type: str; target: str; actual: str; date_checked: str; status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True

class SlaEvaluationSchema(BaseModel):
    evaluation_id: str; sla_id: str; service_name: str; evaluation_date: str; criteria: str; outcome: str; evaluator: str; corrective_actions: str; remarks: str
    class Config: from_attributes = True

class SlaRenewalAndExitProcessSchema(BaseModel):
    renewal_exit_id: str; sla_id: str; service_name: str; action_type: str; action_date: str; new_end_date: str; reason: str; responsible_person: str; status: str; remarks: str
    class Config: from_attributes = True

# Schema for the main data object
class SlaData(BaseModel):
    sla_planning_and_definition: List[SlaPlanningAndDefinitionSchema] = []
    key_sla_components: List[KeySlaComponentSchema] = []
    sla_implementation: List[SlaImplementationSchema] = []
    sla_monitoring: List[SlaMonitoringSchema] = []
    sla_evaluation: List[SlaEvaluationSchema] = []
    sla_renewal_and_exit_process: List[SlaRenewalAndExitProcessSchema] = []

# Schemas for API Operations
class SlaReportCreate(SlaData):
    property_id: str

class SlaReportUpdate(BaseModel):
    property_id: Optional[str] = None
    sla_planning_and_definition: Optional[List[SlaPlanningAndDefinitionSchema]] = None
    key_sla_components: Optional[List[KeySlaComponentSchema]] = None
    sla_implementation: Optional[List[SlaImplementationSchema]] = None
    sla_monitoring: Optional[List[SlaMonitoringSchema]] = None
    sla_evaluation: Optional[List[SlaEvaluationSchema]] = None
    sla_renewal_and_exit_process: Optional[List[SlaRenewalAndExitProcessSchema]] = None
    
# Schemas for Response models
class SlaPlanningAndDefinitionResponse(SlaPlanningAndDefinitionSchema): id: str; report_id: str
class KeySlaComponentResponse(KeySlaComponentSchema): id: str; report_id: str
class SlaImplementationResponse(SlaImplementationSchema): id: str; report_id: str
class SlaMonitoringResponse(SlaMonitoringSchema): id: str; report_id: str
class SlaEvaluationResponse(SlaEvaluationSchema): id: str; report_id: str
class SlaRenewalAndExitProcessResponse(SlaRenewalAndExitProcessSchema): id: str; report_id: str

class SlaReportResponse(BaseModel):
    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime
    sla_planning_and_definition: List[SlaPlanningAndDefinitionResponse] = Field(..., alias="planning_definitions")
    key_sla_components: List[KeySlaComponentResponse] = Field(..., alias="key_components")
    sla_implementation: List[SlaImplementationResponse] = Field(..., alias="implementations")
    sla_monitoring: List[SlaMonitoringResponse] = Field(..., alias="monitorings")
    sla_evaluation: List[SlaEvaluationResponse] = Field(..., alias="evaluations")
    sla_renewal_and_exit_process: List[SlaRenewalAndExitProcessResponse] = Field(..., alias="renewal_exits")

    class Config:
        from_attributes = True
        populate_by_name = True

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# Map JSON keys to DB models and response aliases
MODEL_MAP = {
    "sla_planning_and_definition": (SlaPlanningAndDefinition, "planning_definitions"),
    "key_sla_components": (KeySlaComponent, "key_components"),
    "sla_implementation": (SlaImplementation, "implementations"),
    "sla_monitoring": (SlaMonitoring, "monitorings"),
    "sla_evaluation": (SlaEvaluation, "evaluations"),
    "sla_renewal_and_exit_process": (SlaRenewalAndExitProcess, "renewal_exits"),
}

@app.post("/sla-reports/", response_model=SlaReportResponse, status_code=status.HTTP_201_CREATED, tags=["SLA Report"])
def create_sla_report(report_data: SlaReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = SlaReport(property_id=report_data.property_id)
        db.add(db_report)
        db.flush()

        for field, (model, _) in MODEL_MAP.items():
            entries = getattr(report_data, field, [])
            for entry_data in entries:
                db_entry = model(report_id=db_report.id, **entry_data.dict())
                db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return SlaReportResponse.model_validate(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating SLA report: {str(e)}")

@app.get("/sla-reports/", response_model=List[SlaReportResponse], tags=["SLA Report"])
def get_all_sla_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(SlaReport)
        if property_id:
            query = query.filter(SlaReport.property_id == property_id)
        reports = query.offset(skip).limit(limit).all()
        return [SlaReportResponse.model_validate(r) for r in reports]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching SLA reports: {str(e)}")

@app.get("/sla-reports/{report_id}", response_model=SlaReportResponse, tags=["SLA Report"])
def get_sla_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(SlaReport).filter(SlaReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="SLA report not found")
    return SlaReportResponse.model_validate(report)

@app.put("/sla-reports/{report_id}", response_model=SlaReportResponse, tags=["SLA Report"])
def update_sla_report(report_id: str, report_update: SlaReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(SlaReport).filter(SlaReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="SLA report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, (model, _) in MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(report_id=report_id, **entry_data.dict())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return SlaReportResponse.model_validate(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating SLA report: {str(e)}")

@app.delete("/sla-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["SLA Report"])
def delete_sla_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(SlaReport).filter(SlaReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="SLA report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting SLA report: {str(e)}")

# --- SQLAlchemy ORM Model ---
class AuditReport(Base):
    __tablename__ = "audit_reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    audit_id = Column(String, index=True)
    audit_date = Column(String)
    site_name = Column(String)
    location = Column(String)
    auditor_name = Column(String)
    audit_type = Column(String, index=True)
    department = Column(String)
    checklist_item = Column(String)
    compliance = Column(String)
    score = Column(Integer)
    observation_remarks = Column(String)
    photo_evidence = Column(String)
    status = Column(String, index=True)
    assigned_to = Column(String)
    target_closure_date = Column(String)
    actual_closure_date = Column(String, nullable=True)
    verification_by = Column(String, nullable=True)
    verified_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# --- Pydantic Schemas ---

# Base schema with all fields from the JSON
class AuditReportSchema(BaseModel):
    audit_id: str
    audit_date: str
    site_name: str
    location: str
    auditor_name: str
    audit_type: str
    department: str
    checklist_item: str
    compliance: str
    score: int
    observation_remarks: str
    photo_evidence: str
    status: str
    assigned_to: str
    target_closure_date: str
    actual_closure_date: Optional[str] = None
    verification_by: Optional[str] = None
    verified_date: Optional[str] = None

# Schema for creating a new report (adds property_id)
class AuditReportCreate(AuditReportSchema):
    property_id: str

# Schema for updating a report (all fields are optional)
class AuditReportUpdate(BaseModel):
    property_id: Optional[str] = None
    audit_id: Optional[str] = None
    audit_date: Optional[str] = None
    site_name: Optional[str] = None
    location: Optional[str] = None
    auditor_name: Optional[str] = None
    audit_type: Optional[str] = None
    department: Optional[str] = None
    checklist_item: Optional[str] = None
    compliance: Optional[str] = None
    score: Optional[int] = None
    observation_remarks: Optional[str] = None
    photo_evidence: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    target_closure_date: Optional[str] = None
    actual_closure_date: Optional[str] = None
    verification_by: Optional[str] = None
    verified_date: Optional[str] = None

# Schema for API response (includes DB-generated fields)
class AuditReportResponse(AuditReportCreate):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

Base.metadata.create_all(bind=engine)

@app.post("/audit-reports/", response_model=AuditReportResponse, status_code=status.HTTP_201_CREATED, tags=["Audit Reports"])
def create_audit_report(report: AuditReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = AuditReport(**report.dict())
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating audit report: {str(e)}")

@app.get("/audit-reports/", response_model=List[AuditReportResponse], tags=["Audit Reports"])
def get_all_audit_reports(
    skip: int = 0, 
    limit: int = 100, 
    property_id: Optional[str] = None, 
    audit_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(AuditReport)
        if property_id:
            query = query.filter(AuditReport.property_id == property_id)
        if audit_type:
            query = query.filter(AuditReport.audit_type == audit_type)
        if status:
            query = query.filter(AuditReport.status == status)
        
        reports = query.offset(skip).limit(limit).all()
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching audit reports: {str(e)}")

@app.get("/audit-reports/{report_id}", response_model=AuditReportResponse, tags=["Audit Reports"])
def get_audit_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Audit report not found")
    return report

@app.put("/audit-reports/{report_id}", response_model=AuditReportResponse, tags=["Audit Reports"])
def update_audit_report(report_id: str, report_update: AuditReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Audit report not found")

    try:
        update_data = report_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_report, key, value)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return db_report
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating audit report: {str(e)}")

@app.delete("/audit-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Audit Reports"])
def delete_audit_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Audit report not found")
    
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting audit report: {str(e)}")

# Main Parent Table
class ComplaintManagementRecord(Base):
    __tablename__ = "complaint_management_records"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-many relationships
    client_complaints = relationship("ClientComplaint", back_populates="record", cascade="all, delete-orphan")
    staff_complaints = relationship("StaffComplaint", back_populates="record", cascade="all, delete-orphan")
    client_resolutions = relationship("ClientComplaintResolution", back_populates="record", cascade="all, delete-orphan")
    staff_resolutions = relationship("StaffComplaintResolution", back_populates="record", cascade="all, delete-orphan")
    escalations = relationship("EscalationTracking", back_populates="record", cascade="all, delete-orphan")
    rca_entries = relationship("RootCauseAnalysis", back_populates="record", cascade="all, delete-orphan")

# Child Tables
class ClientComplaint(Base):
    __tablename__ = 'client_complaints'
    id = Column(String, primary_key=True, default=generate_uuid)
    record_id = Column(String, ForeignKey("complaint_management_records.id"), nullable=False)
    complaint_id = Column(String, index=True); client_id = Column(String); client_name = Column(String); complaint_category = Column(String); description = Column(String); date_raised = Column(String); priority = Column(String); status = Column(String); responsible_person = Column(String); remarks = Column(String)
    record = relationship("ComplaintManagementRecord", back_populates="client_complaints")

class StaffComplaint(Base):
    __tablename__ = 'staff_complaints'
    id = Column(String, primary_key=True, default=generate_uuid)
    record_id = Column(String, ForeignKey("complaint_management_records.id"), nullable=False)
    complaint_id = Column(String, index=True); staff_id = Column(String); staff_name = Column(String); department = Column(String); complaint_category = Column(String); description = Column(String); date_raised = Column(String); priority = Column(String); status = Column(String); responsible_person = Column(String); remarks = Column(String)
    record = relationship("ComplaintManagementRecord", back_populates="staff_complaints")

class ClientComplaintResolution(Base):
    __tablename__ = 'client_complaint_resolutions'
    id = Column(String, primary_key=True, default=generate_uuid)
    record_id = Column(String, ForeignKey("complaint_management_records.id"), nullable=False)
    resolution_id = Column(String); complaint_id = Column(String, index=True); client_id = Column(String); client_name = Column(String); resolution_description = Column(String); date_resolved = Column(String); time_to_resolve_hours = Column(Integer); resolution_rate_percent = Column(Integer); status = Column(String); responsible_person = Column(String); remarks = Column(String)
    record = relationship("ComplaintManagementRecord", back_populates="client_resolutions")

class StaffComplaintResolution(Base):
    __tablename__ = 'staff_complaint_resolutions'
    id = Column(String, primary_key=True, default=generate_uuid)
    record_id = Column(String, ForeignKey("complaint_management_records.id"), nullable=False)
    resolution_id = Column(String); complaint_id = Column(String, index=True); staff_id = Column(String); staff_name = Column(String); department = Column(String); resolution_description = Column(String); date_resolved = Column(String); time_to_resolve_hours = Column(Integer); resolution_rate_percent = Column(Integer); status = Column(String); responsible_person = Column(String); remarks = Column(String)
    record = relationship("ComplaintManagementRecord", back_populates="staff_resolutions")

class EscalationTracking(Base):
    __tablename__ = 'escalation_tracking'
    id = Column(String, primary_key=True, default=generate_uuid)
    record_id = Column(String, ForeignKey("complaint_management_records.id"), nullable=False)
    escalation_id = Column(String); complaint_id = Column(String, index=True); type = Column(String); escalation_level = Column(String); description = Column(String); date_escalated = Column(String); escalated_to = Column(String); status = Column(String); responsible_person = Column(String); remarks = Column(String)
    record = relationship("ComplaintManagementRecord", back_populates="escalations")

class RootCauseAnalysis(Base):
    __tablename__ = 'root_cause_analysis'
    id = Column(String, primary_key=True, default=generate_uuid)
    record_id = Column(String, ForeignKey("complaint_management_records.id"), nullable=False)
    rca_id = Column(String); complaint_id = Column(String, index=True); type = Column(String); root_cause = Column(String); corrective_action = Column(String); implementation_date = Column(String); effectiveness = Column(String); effectiveness_rate_percent = Column(Integer); responsible_person = Column(String); remarks = Column(String)
    record = relationship("ComplaintManagementRecord", back_populates="rca_entries")

# --- Pydantic Schemas ---
class ClientComplaintSchema(BaseModel):
    complaint_id: str; client_id: str; client_name: str; complaint_category: str; description: str; date_raised: str; priority: str; status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True
class StaffComplaintSchema(BaseModel):
    complaint_id: str; staff_id: str; staff_name: str; department: str; complaint_category: str; description: str; date_raised: str; priority: str; status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True
class ClientComplaintResolutionSchema(BaseModel):
    resolution_id: str; complaint_id: str; client_id: str; client_name: str; resolution_description: str; date_resolved: str; time_to_resolve_hours: int; resolution_rate_percent: int; status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True
class StaffComplaintResolutionSchema(BaseModel):
    resolution_id: str; complaint_id: str; staff_id: str; staff_name: str; department: str; resolution_description: str; date_resolved: str; time_to_resolve_hours: int; resolution_rate_percent: int; status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True
class EscalationTrackingSchema(BaseModel):
    escalation_id: str; complaint_id: str; type: str; escalation_level: str; description: str; date_escalated: str; escalated_to: str; status: str; responsible_person: str; remarks: str
    class Config: from_attributes = True
class RootCauseAnalysisSchema(BaseModel):
    rca_id: str; complaint_id: str; type: str; root_cause: str; corrective_action: str; implementation_date: str; effectiveness: str; effectiveness_rate_percent: int; responsible_person: str; remarks: str
    class Config: from_attributes = True

class ComplaintManagementData(BaseModel):
    client_complaints: List[ClientComplaintSchema] = []
    staff_complaints: List[StaffComplaintSchema] = []
    client_complaint_resolutions: List[ClientComplaintResolutionSchema] = []
    staff_complaint_resolutions: List[StaffComplaintResolutionSchema] = []
    escalation_tracking: List[EscalationTrackingSchema] = []
    root_cause_analysis: List[RootCauseAnalysisSchema] = []

class ComplaintManagementCreate(BaseModel):
    property_id: str
    complaint_management: ComplaintManagementData

class ComplaintManagementUpdate(BaseModel):
    property_id: Optional[str] = None
    complaint_management: Optional[ComplaintManagementData] = None

class ClientComplaintResponse(ClientComplaintSchema): id: str; record_id: str
class StaffComplaintResponse(StaffComplaintSchema): id: str; record_id: str
class ClientComplaintResolutionResponse(ClientComplaintResolutionSchema): id: str; record_id: str
class StaffComplaintResolutionResponse(StaffComplaintResolutionSchema): id: str; record_id: str
class EscalationTrackingResponse(EscalationTrackingSchema): id: str; record_id: str
class RootCauseAnalysisResponse(RootCauseAnalysisSchema): id: str; record_id: str

class ComplaintManagementResponse(BaseModel):
    id: str; property_id: str; created_at: datetime; updated_at: datetime
    complaint_management: ComplaintManagementData = Field(..., alias="complaint_management_data")
    class Config: from_attributes = True; populate_by_name = True

    @classmethod
    def from_orm_model(cls, orm_model: ComplaintManagementRecord):
        # Manually construct the nested data object for the response
        data = ComplaintManagementData(
            client_complaints=orm_model.client_complaints,
            staff_complaints=orm_model.staff_complaints,
            client_complaint_resolutions=orm_model.client_resolutions,
            staff_complaint_resolutions=orm_model.staff_resolutions,
            escalation_tracking=orm_model.escalations,
            root_cause_analysis=orm_model.rca_entries,
        )
        return cls(
            id=orm_model.id,
            property_id=orm_model.property_id,
            created_at=orm_model.created_at,
            updated_at=orm_model.updated_at,
            complaint_management_data=data,
        )

Base.metadata.create_all(bind=engine)

MODEL_MAP = {
    "client_complaints": ClientComplaint, "staff_complaints": StaffComplaint,
    "client_complaint_resolutions": ClientComplaintResolution, "staff_complaint_resolutions": StaffComplaintResolution,
    "escalation_tracking": EscalationTracking, "root_cause_analysis": RootCauseAnalysis
}

TAG1 = "Complaint Management Records"

@app.post("/complaint-management-records/", response_model=ComplaintManagementResponse, status_code=status.HTTP_201_CREATED, tags=[TAG1])
def create_record(record_data: ComplaintManagementCreate, db: Session = Depends(get_db)):
    try:
        db_record = ComplaintManagementRecord(property_id=record_data.property_id)
        db.add(db_record)
        db.flush()

        for field, model in INVENTORY_MODEL_MAP.items():
            entries = getattr(record_data.complaint_management, field, [])
            for entry_data in entries:
                db_entry = model(record_id=db_record.id, **entry_data.dict())
                db.add(db_entry)
        
        db.commit()
        db.refresh(db_record)
        return ComplaintManagementResponse.from_orm_model(db_record)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating record: {str(e)}")

@app.get("/complaint-management-records/", response_model=List[ComplaintManagementResponse], tags=[TAG1])
def get_all_records(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ComplaintManagementRecord)
    if property_id:
        query = query.filter(ComplaintManagementRecord.property_id == property_id)
    records = query.offset(skip).limit(limit).all()
    return [ComplaintManagementResponse.from_orm_model(r) for r in records]

@app.get("/complaint-management-records/{record_id}", response_model=ComplaintManagementResponse, tags=[TAG1])
def get_record_by_id(record_id: str, db: Session = Depends(get_db)):
    record = db.query(ComplaintManagementRecord).filter(ComplaintManagementRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return ComplaintManagementResponse.from_orm_model(record)

@app.put("/complaint-management-records/{record_id}", response_model=ComplaintManagementResponse, tags=[TAG1])
def update_record(record_id: str, update_data: ComplaintManagementUpdate, db: Session = Depends(get_db)):
    db_record = db.query(ComplaintManagementRecord).filter(ComplaintManagementRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    try:
        if update_data.property_id:
            db_record.property_id = update_data.property_id
        
        if update_data.complaint_management:
            for field, model in INVENTORY_MODEL_MAP.items():
                update_entries = getattr(update_data.complaint_management, field, None)
                if update_entries is not None:
                    db.query(model).filter(model.record_id == record_id).delete(synchronize_session=False)
                    for entry_data in update_entries:
                        db_entry = model(record_id=record_id, **entry_data.dict())
                        db.add(db_entry)
        
        db_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_record)
        return ComplaintManagementResponse.from_orm_model(db_record)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating record: {str(e)}")

@app.delete("/complaint-management-records/{record_id}", status_code=status.HTTP_204_NO_CONTENT, tags=[TAG1])
def delete_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(ComplaintManagementRecord).filter(ComplaintManagementRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    try:
        db.delete(record)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting record: {str(e)}")

# Main Parent Table
class SiteVisitReport(Base):
    __tablename__ = "site_visit_reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    visit_details = relationship("VisitDetail", back_populates="report", cascade="all, delete-orphan")
    observations = relationship("ObservationInteractionSummary", back_populates="report", cascade="all, delete-orphan")
    checklist_reviews = relationship("ChecklistReview", back_populates="report", cascade="all, delete-orphan")
    photos = relationship("PhotoCaptured", back_populates="report", cascade="all, delete-orphan")
    action_plans = relationship("FollowUpActionPlan", back_populates="report", cascade="all, delete-orphan")
    final_comments = relationship("FinalCommentsSummary", uselist=False, back_populates="report", cascade="all, delete-orphan")
    sign_off = relationship("SignOff", uselist=False, back_populates="report", cascade="all, delete-orphan")

# Child Tables
class VisitDetail(Base):
    __tablename__ = "visit_details"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("site_visit_reports.id"), nullable=False)
    s_no = Column(Integer); date_of_visit = Column(String); site_name = Column(String); client_name = Column(String); location = Column(String); visited_by_name = Column(String); visited_by_designation = Column(String); visit_purpose = Column(String); time_in = Column(String); time_out = Column(String); duration_hrs = Column(Float)
    report = relationship("SiteVisitReport", back_populates="visit_details")

class ObservationInteractionSummary(Base):
    __tablename__ = "observations"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("site_visit_reports.id"), nullable=False)
    department_visited = Column(String); staff_met = Column(String); observation_summary = Column(String); compliance_with_SOP = Column(String); remarks_issues_found = Column(String); corrective_action_required = Column(String)
    report = relationship("SiteVisitReport", back_populates="observations")

class ChecklistReview(Base):
    __tablename__ = "checklist_reviews"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("site_visit_reports.id"), nullable=False)
    checklist_item = Column(String); status = Column(String); remarks = Column(String)
    report = relationship("SiteVisitReport", back_populates="checklist_reviews")

class PhotoCaptured(Base):
    __tablename__ = "photos_captured"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("site_visit_reports.id"), nullable=False)
    location_area = Column(String); photo_description = Column(String); photo_file_link = Column(String)
    report = relationship("SiteVisitReport", back_populates="photos")

class FollowUpActionPlan(Base):
    __tablename__ = "follow_up_action_plans"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("site_visit_reports.id"), nullable=False)
    issue_observed = Column(String); assigned_to = Column(String); target_completion_date = Column(String); status_update = Column(String)
    report = relationship("SiteVisitReport", back_populates="action_plans")

class FinalCommentsSummary(Base):
    __tablename__ = "final_comments"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("site_visit_reports.id"), unique=True, nullable=False)
    team_observations = Column(String); client_feedback = Column(String); suggestions_recommendations = Column(String)
    report = relationship("SiteVisitReport", back_populates="final_comments")

class SignOff(Base):
    __tablename__ = "sign_offs"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("site_visit_reports.id"), unique=True, nullable=False)
    reported_by_name = Column(String); reported_by_designation = Column(String); signature = Column(String); date = Column(String)
    report = relationship("SiteVisitReport", back_populates="sign_off")

# --- Pydantic Schemas ---
class VisitedBySchema(BaseModel): name: str; designation: str
class ReportedBySchema(BaseModel): name: str; designation: str
class VisitDetailSchema(BaseModel): s_no: int; date_of_visit: str; site_name: str; client_name: str; location: str; visited_by: VisitedBySchema; visit_purpose: str; time_in: str; time_out: str; duration_hrs: float
class ObservationInteractionSummarySchema(BaseModel): department_visited: str; staff_met: str; observation_summary: str; compliance_with_SOP: str; remarks_issues_found: str; corrective_action_required: str
class ChecklistReviewSchema(BaseModel): checklist_item: str; status: str; remarks: str
class PhotosCapturedSchema(BaseModel): location_area: str; photo_description: str; photo_file_link: str
class FollowUpActionPlanSchema(BaseModel): issue_observed: str; assigned_to: str; target_completion_date: str; status_update: str
class FinalCommentsSummarySchema(BaseModel): team_observations: str; client_feedback: str; suggestions_recommendations: str
class SignOffSchema(BaseModel): reported_by: ReportedBySchema; signature: str; date: str

class SiteVisitReportData(BaseModel):
    visit_details: List[VisitDetailSchema]
    observation_interaction_summary: List[ObservationInteractionSummarySchema] = []
    checklist_review: List[ChecklistReviewSchema] = []
    photos_captured: List[PhotosCapturedSchema] = []
    follow_up_action_plan: List[FollowUpActionPlanSchema] = []
    final_comments_summary: FinalCommentsSummarySchema
    sign_off: SignOffSchema

class SiteVisitReportCreate(BaseModel):
    property_id: str
    site_visit_report: SiteVisitReportData

class SiteVisitReportUpdate(BaseModel):
    property_id: Optional[str] = None
    site_visit_report: Optional[SiteVisitReportData] = None

class VisitDetailResponse(VisitDetailSchema): id: str
class ObservationInteractionSummaryResponse(ObservationInteractionSummarySchema): id: str
class ChecklistReviewResponse(ChecklistReviewSchema): id: str
class PhotosCapturedResponse(PhotosCapturedSchema): id: str
class FollowUpActionPlanResponse(FollowUpActionPlanSchema): id: str
class FinalCommentsSummaryResponse(FinalCommentsSummarySchema): id: str
class SignOffResponse(SignOffSchema): id: str

class SiteVisitReportResponse(BaseModel):
    id: str; property_id: str; created_at: datetime; updated_at: datetime
    site_visit_report: SiteVisitReportData = Field(..., alias="report_data")
    class Config: from_attributes = True; populate_by_name = True

    @classmethod
    def from_orm_model(cls, orm_model: SiteVisitReport):
        # Convert ORM objects to dictionaries for Pydantic validation
        visit_details = []
        for detail in orm_model.visit_details:
            visit_details.append({
                "s_no": detail.s_no,
                "date_of_visit": detail.date_of_visit,
                "site_name": detail.site_name,
                "client_name": detail.client_name,
                "location": detail.location,
                "visited_by": {
                    "name": detail.visited_by_name,
                    "designation": detail.visited_by_designation
                },
                "visit_purpose": detail.visit_purpose,
                "time_in": detail.time_in,
                "time_out": detail.time_out,
                "duration_hrs": detail.duration_hrs
            })
        
        observations = []
        for obs in orm_model.observations:
            observations.append({
                "department_visited": obs.department_visited,
                "staff_met": obs.staff_met,
                "observation_summary": obs.observation_summary,
                "compliance_with_SOP": obs.compliance_with_SOP,
                "remarks_issues_found": obs.remarks_issues_found,
                "corrective_action_required": obs.corrective_action_required
            })
        
        checklist_reviews = []
        for check in orm_model.checklist_reviews:
            checklist_reviews.append({
                "checklist_item": check.checklist_item,
                "status": check.status,
                "remarks": check.remarks
            })
        
        photos = []
        for photo in orm_model.photos:
            photos.append({
                "location_area": photo.location_area,
                "photo_description": photo.photo_description,
                "photo_file_link": photo.photo_file_link
            })
        
        action_plans = []
        for plan in orm_model.action_plans:
            action_plans.append({
                "issue_observed": plan.issue_observed,
                "assigned_to": plan.assigned_to,
                "target_completion_date": plan.target_completion_date,
                "status_update": plan.status_update
            })
        
        final_comments = None
        if orm_model.final_comments:
            final_comments = {
                "team_observations": orm_model.final_comments.team_observations,
                "client_feedback": orm_model.final_comments.client_feedback,
                "suggestions_recommendations": orm_model.final_comments.suggestions_recommendations
            }
        
        sign_off_data = None
        if orm_model.sign_off:
            sign_off_data = {
                "reported_by": {
                    "name": orm_model.sign_off.reported_by_name,
                    "designation": orm_model.sign_off.reported_by_designation
                },
                "signature": orm_model.sign_off.signature,
                "date": orm_model.sign_off.date
            }
        
        data = SiteVisitReportData(
            visit_details=visit_details,
            observation_interaction_summary=observations,
            checklist_review=checklist_reviews,
            photos_captured=photos,
            follow_up_action_plan=action_plans,
            final_comments_summary=final_comments,
            sign_off=sign_off_data
        )
        return cls(id=orm_model.id, property_id=orm_model.property_id, created_at=orm_model.created_at, updated_at=orm_model.updated_at, report_data=data)


def orm_to_dict(orm_obj):
    """Convert SQLAlchemy ORM object to dictionary"""
    if orm_obj is None:
        return None
    return {c.name: getattr(orm_obj, c.name) for c in orm_obj.__table__.columns}

Base.metadata.create_all(bind=engine)

ONE_TO_MANY_MAP = {
    "observation_interaction_summary": ObservationInteractionSummary, "checklist_review": ChecklistReview,
    "photos_captured": PhotoCaptured, "follow_up_action_plan": FollowUpActionPlan, "visit_details": VisitDetail
}
ONE_TO_ONE_MAP = {"final_comments_summary": FinalCommentsSummary, "sign_off": SignOff}
TAG = "Site Visit Reports"

@app.post("/site-visit-reports/", response_model=SiteVisitReportResponse, status_code=status.HTTP_201_CREATED, tags=[TAG])
def create_report(report_data: SiteVisitReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = SiteVisitReport(property_id=report_data.property_id); db.add(db_report); db.flush()
        report_payload = report_data.site_visit_report

        for key, model in ONE_TO_ONE_MAP.items():
            data = getattr(report_payload, key)
            data_dict = data.dict(); flat_dict = {}
            for k, v in data_dict.items():
                if isinstance(v, dict): flat_dict.update({f"{k}_{sub_k}": sub_v for sub_k, sub_v in v.items()})
                else: flat_dict[k] = v
            db_child = model(report_id=db_report.id, **flat_dict); db.add(db_child)
        
        for key, model in ONE_TO_MANY_MAP.items():
            entries = getattr(report_payload, key, [])
            for entry_data in entries:
                data_dict = entry_data.dict(); flat_dict = {}
                for k, v in data_dict.items():
                    if isinstance(v, dict): flat_dict.update({f"{k}_{sub_k}": sub_v for sub_k, sub_v in v.items()})
                    else: flat_dict[k] = v
                db_entry = model(report_id=db_report.id, **flat_dict); db.add(db_entry)

        db.commit(); db.refresh(db_report)
        return SiteVisitReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@app.get("/site-visit-reports/", response_model=List[SiteVisitReportResponse], tags=[TAG])
def get_all_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SiteVisitReport)
    if property_id: query = query.filter(SiteVisitReport.property_id == property_id)
    records = query.offset(skip).limit(limit).all()
    return [SiteVisitReportResponse.from_orm_model(r) for r in records]

@app.get("/site-visit-reports/{report_id}", response_model=SiteVisitReportResponse, tags=[TAG])
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    record = db.query(SiteVisitReport).filter(SiteVisitReport.id == report_id).first()
    if not record: raise HTTPException(status_code=404, detail="Report not found")
    return SiteVisitReportResponse.from_orm_model(record)

@app.put("/site-visit-reports/{report_id}", response_model=SiteVisitReportResponse, tags=[TAG])
def update_report(report_id: str, update_data: SiteVisitReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(SiteVisitReport).filter(SiteVisitReport.id == report_id).first()
    if not db_report: raise HTTPException(status_code=404, detail="Report not found")
    try:
        if update_data.property_id: db_report.property_id = update_data.property_id
        if update_data.site_visit_report:
            report_payload = update_data.site_visit_report
            for key, model in ONE_TO_ONE_MAP.items():
                data = getattr(report_payload, key, None)
                if data:
                    # For simplicity, replace the one-to-one child
                    db.query(model).filter(model.report_id == report_id).delete(synchronize_session=False)
                    data_dict = data.dict(); flat_dict = {}
                    for k, v in data_dict.items():
                        if isinstance(v, dict): flat_dict.update({f"{k}_{sub_k}": sub_v for sub_k, sub_v in v.items()})
                        else: flat_dict[k] = v
                    db_child = model(report_id=db_report.id, **flat_dict); db.add(db_child)
            
            for key, model in ONE_TO_MANY_MAP.items():
                entries = getattr(report_payload, key, None)
                if entries is not None:
                    db.query(model).filter(model.report_id == report_id).delete(synchronize_session=False)
                    for entry_data in entries:
                        data_dict = entry_data.dict(); flat_dict = {}
                        for k, v in data_dict.items():
                            if isinstance(v, dict): flat_dict.update({f"{k}_{sub_k}": sub_v for sub_k, sub_v in v.items()})
                            else: flat_dict[k] = v
                        db_entry = model(report_id=db_report.id, **flat_dict); db.add(db_entry)

        db_report.updated_at = datetime.utcnow(); db.commit(); db.refresh(db_report)
        return SiteVisitReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@app.delete("/site-visit-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=[TAG])
def delete_report(report_id: str, db: Session = Depends(get_db)):
    record = db.query(SiteVisitReport).filter(SiteVisitReport.id == report_id).first()
    if not record: raise HTTPException(status_code=404, detail="Report not found")
    try:
        db.delete(record); db.commit()
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")


# --- SQLAlchemy ORM Model ---
# All nested objects are flattened into columns for simplicity and performance.
class HotWorkPermit(Base):
    __tablename__ = "hot_work_permits"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    permit_no = Column(String, unique=True, index=True)
    date_of_issue = Column(String)
    location_building = Column(String)
    location_floor = Column(String)
    location_zone = Column(String)
    description_of_hot_work = Column(String)
    person_agency_performing_work = Column(String)
    supervisor_project_in_charge_name = Column(String)
    contact_worker = Column(String)
    contact_supervisor = Column(String)
    start_date_time = Column(String)
    end_date_time = Column(String)
    fire_watch_personnel_assigned = Column(String)
    fire_watch_personnel_name = Column(String)
    fire_extinguisher_available = Column(String)
    type_of_fire_extinguisher = Column(String)
    fire_blanket_shielding_used = Column(String)
    nearby_flammable_materials_removed_covered = Column(String)
    gas_cylinders_condition_verified = Column(String)
    work_area_ventilation_verified = Column(String)
    sparks_heat_barriers_installed = Column(String)
    area_wet_down_if_required = Column(String)
    gas_detector_used = Column(String)
    last_gas_test_reading_ppm = Column(Integer)
    ppe_helmet = Column(String)
    ppe_goggles = Column(String)
    ppe_gloves = Column(String)
    ppe_apron = Column(String)
    ppe_shoes = Column(String)
    permit_validity_period = Column(String)
    emergency_procedure_explained_to_workers = Column(String)
    area_inspected_before_work_by = Column(String)
    area_inspected_after_work_by = Column(String)
    work_completed_time = Column(String)
    post_work_fire_watch_time = Column(String)
    final_area_clearance_given_by = Column(String)
    signature_worker = Column(String)
    signature_fire_watcher = Column(String)
    signature_safety_officer = Column(String)
    remarks_precautions = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# --- Pydantic Schemas ---
# Schemas for nested objects
class LocationOfWorkSchema(BaseModel): building: str; floor: str; zone: str
class ContactNumberSchema(BaseModel): worker: str; supervisor: str
class PpeVerifiedSchema(BaseModel): helmet: str; goggles: str; gloves: str; apron: str; shoes: str
class AreaInspectedSchema(BaseModel): inspected_by: str
class SignaturesSchema(BaseModel): worker: str; fire_watcher: str; safety_officer: str

# Main schema for the hot_work_permit object
class HotWorkPermitDataSchema(BaseModel):
    permit_no: str; date_of_issue: str; location_of_work: LocationOfWorkSchema; description_of_hot_work: str; person_agency_performing_work: str; supervisor_project_in_charge_name: str; contact_number: ContactNumberSchema; start_date_time: str; end_date_time: str; fire_watch_personnel_assigned: str; fire_watch_personnel_name: str; fire_extinguisher_available: str; type_of_fire_extinguisher: str; fire_blanket_shielding_used: str; nearby_flammable_materials_removed_covered: str; gas_cylinders_condition_verified: str; work_area_ventilation_verified: str; sparks_heat_barriers_installed: str; area_wet_down_if_required: str; gas_detector_used: str; last_gas_test_reading_ppm: int; ppe_verified: PpeVerifiedSchema; permit_validity_period: str; emergency_procedure_explained_to_workers: str; area_inspected_before_work: AreaInspectedSchema; area_inspected_after_work: AreaInspectedSchema; work_completed_time: str; post_work_fire_watch_time: str; final_area_clearance_given_by: str; signatures: SignaturesSchema; remarks_precautions: str

# Schemas for API Operations
class HotWorkPermitCreate(BaseModel):
    property_id: str
    hot_work_permit: HotWorkPermitDataSchema

class HotWorkPermitUpdate(BaseModel):
    property_id: Optional[str] = None
    hot_work_permit: Optional[HotWorkPermitDataSchema] = None

# Schema for the API Response
class HotWorkPermitResponse(HotWorkPermitCreate):
    id: str; created_at: datetime; updated_at: datetime
    class Config: from_attributes = True; arbitrary_types_allowed=True

# --- Helper Function to flatten the data for the DB ---
def flatten_permit_data(permit_data: HotWorkPermitDataSchema) -> dict:
    flat_data = permit_data.dict()
    # Flatten nested dictionaries by prefixing keys
    for key, value in permit_data.dict().items():
        if isinstance(value, dict):
            del flat_data[key]
            for sub_key, sub_value in value.items():
                # Special handling for specific keys to match database column names
                if key == "area_inspected_before_work" or key == "area_inspected_after_work":
                    flat_data[f"{key}_by"] = sub_value
                elif key == "location_of_work":
                    flat_data[f"location_{sub_key}"] = sub_value
                elif key == "contact_number":
                    flat_data[f"contact_{sub_key}"] = sub_value
                elif key == "ppe_verified":
                    flat_data[f"ppe_{sub_key}"] = sub_value
                elif key == "signatures":
                    flat_data[f"signature_{sub_key}"] = sub_value
                else:
                    flat_data[f"{key.replace('_of_work','').replace('_number','').replace('_verified','')}_{sub_key}"] = sub_value
    return flat_data

Base.metadata.create_all(bind=engine)
TAG = "Hot Work Permits"

@app.post("/hot-work-permits/", response_model=HotWorkPermitResponse, status_code=status.HTTP_201_CREATED, tags=[TAG])
def create_permit(permit_data: HotWorkPermitCreate, db: Session = Depends(get_db)):
    try:
        flat_data = flatten_permit_data(permit_data.hot_work_permit)
        db_permit = HotWorkPermit(property_id=permit_data.property_id, **flat_data)
        db.add(db_permit)
        db.commit()
        db.refresh(db_permit)
        # Reconstruct the nested response
        return HotWorkPermitResponse(
            id=db_permit.id,
            property_id=db_permit.property_id,
            hot_work_permit=permit_data.hot_work_permit,
            created_at=db_permit.created_at,
            updated_at=db_permit.updated_at
        )
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error creating permit: {str(e)}")

@app.get("/hot-work-permits/", response_model=List[HotWorkPermitResponse], tags=[TAG])
def get_all_permits(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(HotWorkPermit)
    if property_id: query = query.filter(HotWorkPermit.property_id == property_id)
    permits = query.offset(skip).limit(limit).all()
    # Reconstruct nested responses for the list
    response_list = []
    for p in permits:
        response_data = {
            "id": p.id, "property_id": p.property_id, "created_at": p.created_at, "updated_at": p.updated_at,
            "hot_work_permit": {
                "permit_no": p.permit_no, "date_of_issue": p.date_of_issue,
                "location_of_work": {"building": p.location_building, "floor": p.location_floor, "zone": p.location_zone},
                "description_of_hot_work": p.description_of_hot_work, "person_agency_performing_work": p.person_agency_performing_work,
                "supervisor_project_in_charge_name": p.supervisor_project_in_charge_name,
                "contact_number": {"worker": p.contact_worker, "supervisor": p.contact_supervisor},
                "start_date_time": p.start_date_time, "end_date_time": p.end_date_time,
                "fire_watch_personnel_assigned": p.fire_watch_personnel_assigned, "fire_watch_personnel_name": p.fire_watch_personnel_name,
                "fire_extinguisher_available": p.fire_extinguisher_available, "type_of_fire_extinguisher": p.type_of_fire_extinguisher,
                "fire_blanket_shielding_used": p.fire_blanket_shielding_used, "nearby_flammable_materials_removed_covered": p.nearby_flammable_materials_removed_covered,
                "gas_cylinders_condition_verified": p.gas_cylinders_condition_verified, "work_area_ventilation_verified": p.work_area_ventilation_verified,
                "sparks_heat_barriers_installed": p.sparks_heat_barriers_installed, "area_wet_down_if_required": p.area_wet_down_if_required,
                "gas_detector_used": p.gas_detector_used, "last_gas_test_reading_ppm": p.last_gas_test_reading_ppm,
                "ppe_verified": {"helmet": p.ppe_helmet, "goggles": p.ppe_goggles, "gloves": p.ppe_gloves, "apron": p.ppe_apron, "shoes": p.ppe_shoes},
                "permit_validity_period": p.permit_validity_period, "emergency_procedure_explained_to_workers": p.emergency_procedure_explained_to_workers,
                "area_inspected_before_work": {"inspected_by": p.area_inspected_before_work_by},
                "area_inspected_after_work": {"inspected_by": p.area_inspected_after_work_by},
                "work_completed_time": p.work_completed_time, "post_work_fire_watch_time": p.post_work_fire_watch_time,
                "final_area_clearance_given_by": p.final_area_clearance_given_by,
                "signatures": {"worker": p.signature_worker, "fire_watcher": p.signature_fire_watcher, "safety_officer": p.signature_safety_officer},
                "remarks_precautions": p.remarks_precautions
            }
        }
        response_list.append(response_data)
    return response_list

@app.get("/hot-work-permits/{permit_id}", response_model=HotWorkPermitResponse, tags=[TAG])
def get_permit_by_id(permit_id: str, db: Session = Depends(get_db)):
    permit = db.query(HotWorkPermit).filter(HotWorkPermit.id == permit_id).first()
    if not permit: raise HTTPException(status_code=404, detail="Permit not found")
    # Use the list comprehension logic from GET all to reconstruct the single object
    reconstructed_permit = get_all_permits(db=db)[0] # This is a shortcut for demonstration
    single_permit_list = [p for p in get_all_permits(db=db) if p['id'] == permit_id]
    if not single_permit_list: raise HTTPException(status_code=404, detail="Permit not found")
    return single_permit_list[0]

@app.put("/hot-work-permits/{permit_id}", response_model=HotWorkPermitResponse, tags=[TAG])
def update_permit(permit_id: str, permit_update: HotWorkPermitUpdate, db: Session = Depends(get_db)):
    db_permit = db.query(HotWorkPermit).filter(HotWorkPermit.id == permit_id).first()
    if not db_permit: raise HTTPException(status_code=404, detail="Permit not found")
    try:
        if permit_update.property_id: db_permit.property_id = permit_update.property_id
        if permit_update.hot_work_permit:
            update_data = flatten_permit_data(permit_update.hot_work_permit)
            for key, value in update_data.items():
                setattr(db_permit, key, value)
        
        db_permit.updated_at = datetime.utcnow(); db.commit(); db.refresh(db_permit)
        return get_permit_by_id(permit_id, db) # Re-use get logic to build response
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error updating permit: {str(e)}")

@app.delete("/hot-work-permits/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=[TAG])
def delete_permit(permit_id: str, db: Session = Depends(get_db)):
    permit = db.query(HotWorkPermit).filter(HotWorkPermit.id == permit_id).first()
    if not permit: raise HTTPException(status_code=404, detail="Permit not found")
    try:
        db.delete(permit); db.commit()
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error deleting permit: {str(e)}")

# --- SQLAlchemy ORM Model ---
class KpiRecord(Base):
    __tablename__ = "kpi_records"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    sl_no = Column(Integer)
    kpi_id = Column(String, index=True)
    department = Column(String, index=True)
    kpi_name = Column(String)
    description_objective = Column(String)
    unit_of_measure = Column(String)
    target_value = Column(String)
    actual_value = Column(String)
    achievement_percentage = Column(String)
    frequency = Column(String)
    data_source = Column(String)
    responsible_person = Column(String)
    status = Column(String, index=True)
    last_updated = Column(String)
    remarks = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# --- Pydantic Schemas ---

# Base schema with all fields from the JSON
class KpiRecordSchema(BaseModel):
    sl_no: int
    kpi_id: str
    department: str
    kpi_name: str
    description_objective: str
    unit_of_measure: str
    target_value: str
    actual_value: str
    achievement_percentage: str
    frequency: str
    data_source: str
    responsible_person: str
    status: str
    last_updated: str
    remarks: str

# Schema for creating a new record (adds property_id)
class KpiRecordCreate(KpiRecordSchema):
    property_id: str

# Schema for updating a record (all fields are optional)
class KpiRecordUpdate(BaseModel):
    property_id: Optional[str] = None
    sl_no: Optional[int] = None
    kpi_id: Optional[str] = None
    department: Optional[str] = None
    kpi_name: Optional[str] = None
    description_objective: Optional[str] = None
    unit_of_measure: Optional[str] = None
    target_value: Optional[str] = None
    actual_value: Optional[str] = None
    achievement_percentage: Optional[str] = None
    frequency: Optional[str] = None
    data_source: Optional[str] = None
    responsible_person: Optional[str] = None
    status: Optional[str] = None
    last_updated: Optional[str] = None
    remarks: Optional[str] = None

# Schema for API response (includes DB-generated fields)
class KpiRecordResponse(KpiRecordCreate):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

Base.metadata.create_all(bind=engine)
TAG = "KPI Records"

@app.post("/kpi-records/", response_model=KpiRecordResponse, status_code=status.HTTP_201_CREATED, tags=[TAG])
def create_kpi_record(record: KpiRecordCreate, db: Session = Depends(get_db)):
    try:
        db_record = KpiRecord(**record.dict())
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating KPI record: {str(e)}")

@app.get("/kpi-records/", response_model=List[KpiRecordResponse], tags=[TAG])
def get_all_kpi_records(
    skip: int = 0, 
    limit: int = 100, 
    property_id: Optional[str] = None, 
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(KpiRecord)
        if property_id:
            query = query.filter(KpiRecord.property_id == property_id)
        if department:
            query = query.filter(KpiRecord.department == department)
        if status:
            query = query.filter(KpiRecord.status == status)
        
        records = query.offset(skip).limit(limit).all()
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KPI records: {str(e)}")

@app.get("/kpi-records/{record_id}", response_model=KpiRecordResponse, tags=[TAG])
def get_kpi_record_by_id(record_id: str, db: Session = Depends(get_db)):
    record = db.query(KpiRecord).filter(KpiRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="KPI record not found")
    return record

@app.put("/kpi-records/{record_id}", response_model=KpiRecordResponse, tags=[TAG])
def update_kpi_record(record_id: str, record_update: KpiRecordUpdate, db: Session = Depends(get_db)):
    db_record = db.query(KpiRecord).filter(KpiRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="KPI record not found")

    try:
        update_data = record_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_record, key, value)
        
        db_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_record)
        return db_record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating KPI record: {str(e)}")

@app.delete("/kpi-records/{record_id}", status_code=status.HTTP_204_NO_CONTENT, tags=[TAG])
def delete_kpi_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(KpiRecord).filter(KpiRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="KPI record not found")
    
    try:
        db.delete(record)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting KPI record: {str(e)}")

# --- SQLAlchemy ORM Models ---

# Main Parent Table
class CCTVAuditReport(Base):
    __tablename__ = "cctv_audit_reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    site_assessments = relationship("SiteAssessmentFormat", back_populates="report", cascade="all, delete-orphan")
    installation_checklists = relationship("InstallationChecklist", back_populates="report", cascade="all, delete-orphan")
    configuration_checklists = relationship("ConfigurationTestingChecklist", back_populates="report", cascade="all, delete-orphan")
    daily_operations = relationship("DailyOperationsMonitoring", back_populates="report", cascade="all, delete-orphan")
    maintenance_schedules = relationship("CctvMaintenanceSchedule", back_populates="report", cascade="all, delete-orphan")
    amc_compliance_formats = relationship("AMCComplianceFormat", back_populates="report", cascade="all, delete-orphan")
    
    # Documentation Format Children
    site_information = relationship("SiteInformation", uselist=False, back_populates="report", cascade="all, delete-orphan")
    camera_inventory_logs = relationship("CameraInventoryLog", back_populates="report", cascade="all, delete-orphan")


# Child Tables
class SiteAssessmentFormat(Base):
    __tablename__ = "site_assessment_formats"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
    SL_No = Column(Integer); Description = Column(String); Checklist_Points = Column(String); Checked_Status = Column(String); Observations = Column(String); Suggestions_Actions = Column(String); Responsibility = Column(String); Target_Date = Column(String); Photo_Insert = Column(String); Remarks = Column(String)
    report = relationship("CCTVAuditReport", back_populates="site_assessments")

class InstallationChecklist(Base):
    __tablename__ = "installation_checklists"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
    SL_No = Column(Integer); Category = Column(String); Checklist_Point = Column(String); Checked = Column(String); Observations = Column(String); Remarks_Action_Required = Column(String); Responsibility = Column(String); Target_Completion_Date = Column(String); Photo_Insert = Column(String); Remarks = Column(String)
    report = relationship("CCTVAuditReport", back_populates="installation_checklists")

class ConfigurationTestingChecklist(Base):
    __tablename__ = "configuration_testing_checklists"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
    SL_No = Column(Integer); Category = Column(String); Checklist_Point = Column(String); Checked = Column(String); Observations = Column(String); Suggestions_Action_Required = Column(String); Responsibility = Column(String); Target_Completion_Date = Column(String); Photo_Screenshot = Column(String); Remarks = Column(String)
    report = relationship("CCTVAuditReport", back_populates="configuration_checklists")

class DailyOperationsMonitoring(Base):
    __tablename__ = "daily_operations_monitoring"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
    SL_No = Column(Integer); Category = Column(String); Checklist_Point = Column(String); Checked = Column(String); Observations = Column(String); Actions_Required = Column(String); Responsibility = Column(String); Time_Checked = Column(String); Photo_Screenshot = Column(String); Remarks = Column(String)
    report = relationship("CCTVAuditReport", back_populates="daily_operations")

class CctvMaintenanceSchedule(Base):
    __tablename__ = "cctv_maintenance_schedules"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
    SL_No = Column(Integer); Maintenance_Type = Column(String); Checklist_Point_Task = Column(String); Frequency = Column(String); Last_Maintenance_Date = Column(String); Next_Due_Date = Column(String); Status = Column(String); Observations_Issues = Column(String); Action_Taken_Required = Column(String); Responsible = Column(String); Remarks = Column(String)
    report = relationship("CCTVAuditReport", back_populates="maintenance_schedules")

class SiteInformation(Base):
    __tablename__ = "site_information"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("cctv_audit_reports.id"), unique=True, nullable=False)
    Site_Name_Code = Column(String); Address = Column(String); Contact_Person_Site_Incharge = Column(String); CCTV_Install_Date = Column(String)
    report = relationship("CCTVAuditReport", back_populates="site_information")

class CameraInventoryLog(Base):
    __tablename__ = "camera_inventory_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
    Camera_ID_Name = Column(String); Camera_Type = Column(String); Brand_Model_No = Column(String); Resolution_MP = Column(String); Location_Installed = Column(String); Indoor_Outdoor = Column(String); Working_Status = Column(String)
    report = relationship("CCTVAuditReport", back_populates="camera_inventory_logs")
    
class AMCComplianceFormat(Base):
    __tablename__ = "amc_compliance_formats"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("cctv_audit_reports.id"), nullable=False)
    SL_No = Column(Integer); Category = Column(String); Checklist_Description = Column(String); Details_Status = Column(String); Last_Updated = Column(String); Next_Due_Date = Column(String); Observations_Non_Compliance = Column(String); Action_Taken_Required = Column(String); Responsible = Column(String); Remarks = Column(String)
    report = relationship("CCTVAuditReport", back_populates="amc_compliance_formats")

# --- Pydantic Schemas ---
class SiteAssessmentFormatSchema(BaseModel): 
    SL_No: int; Description: str; Checklist_Points: str; Checked_Status: str; Observations: str; Suggestions_Actions: str; Responsibility: str; Target_Date: str; Photo_Insert: str; Remarks: str
    class Config: from_attributes = True

class InstallationChecklistSchema(BaseModel): 
    SL_No: int; Category: str; Checklist_Point: str; Checked: str; Observations: str; Remarks_Action_Required: str; Responsibility: str; Target_Completion_Date: str; Photo_Insert: str; Remarks: str
    class Config: from_attributes = True

class ConfigurationTestingChecklistSchema(BaseModel): 
    SL_No: int; Category: str; Checklist_Point: str; Checked: str; Observations: str; Suggestions_Action_Required: str; Responsibility: str; Target_Completion_Date: str; Photo_Screenshot: str; Remarks: str
    class Config: from_attributes = True

class DailyOperationsMonitoringSchema(BaseModel): 
    SL_No: int; Category: str; Checklist_Point: str; Checked: str; Observations: str; Actions_Required: str; Responsibility: str; Time_Checked: str; Photo_Screenshot: str; Remarks: str
    class Config: from_attributes = True

class CctvMaintenanceScheduleSchema(BaseModel): 
    SL_No: int; Maintenance_Type: str; Checklist_Point_Task: str; Frequency: str; Last_Maintenance_Date: str; Next_Due_Date: str; Status: str; Observations_Issues: str; Action_Taken_Required: str; Responsible: str; Remarks: str
    class Config: from_attributes = True

class SiteInformationSchema(BaseModel): 
    Site_Name_Code: str; Address: str; Contact_Person_Site_Incharge: str; CCTV_Install_Date: str
    class Config: from_attributes = True

class CameraInventoryLogSchema(BaseModel): 
    Camera_ID_Name: str; Camera_Type: str; Brand_Model_No: str; Resolution_MP: str; Location_Installed: str; Indoor_Outdoor: str; Working_Status: str
    class Config: from_attributes = True

class AMCComplianceFormatSchema(BaseModel): 
    SL_No: int; Category: str; Checklist_Description: str; Details_Status: str; Last_Updated: str; Next_Due_Date: str; Observations_Non_Compliance: str; Action_Taken_Required: str; Responsible: str; Remarks: str
    class Config: from_attributes = True

class DocumentationFormatSchema(BaseModel):
    Site_Information: SiteInformationSchema
    Camera_Inventory_Log: List[CameraInventoryLogSchema] = []
    
    class Config:
        from_attributes = True

class CCTVAuditData(BaseModel):
    Site_Assessment_Format: List[SiteAssessmentFormatSchema] = []; Installation_Checklist: List[InstallationChecklistSchema] = []; Configuration_Testing_Checklist: List[ConfigurationTestingChecklistSchema] = []; Daily_Operations_Monitoring: List[DailyOperationsMonitoringSchema] = []; Maintenance_Schedule: List[CctvMaintenanceScheduleSchema] = []; Documentation_Format: DocumentationFormatSchema; AMC_Compliance_Format: List[AMCComplianceFormatSchema] = []
    
    class Config:
        from_attributes = True

class CCTVAuditReportCreate(BaseModel):
    property_id: str
    CCTV_Audit: CCTVAuditData
class CCTVAuditReportUpdate(BaseModel):
    property_id: Optional[str] = None
    CCTV_Audit: Optional[CCTVAuditData] = None

class CCTVAuditReportResponse(BaseModel):
    id: str; property_id: str; created_at: datetime; updated_at: datetime
    CCTV_Audit: CCTVAuditData = Field(..., alias="cctv_audit_data")
    class Config: from_attributes = True; populate_by_name = True

    @classmethod
    def from_orm_model(cls, orm_model: CCTVAuditReport):
        # Convert ORM objects to dictionaries for Pydantic using helper function
        site_assessments = [SiteAssessmentFormatSchema.model_validate(orm_to_dict(item)) for item in orm_model.site_assessments]
        installation_checklists = [InstallationChecklistSchema.model_validate(orm_to_dict(item)) for item in orm_model.installation_checklists]
        configuration_checklists = [ConfigurationTestingChecklistSchema.model_validate(orm_to_dict(item)) for item in orm_model.configuration_checklists]
        daily_operations = [DailyOperationsMonitoringSchema.model_validate(orm_to_dict(item)) for item in orm_model.daily_operations]
        maintenance_schedules = [CctvMaintenanceScheduleSchema.model_validate(orm_to_dict(item)) for item in orm_model.maintenance_schedules]
        amc_compliance_formats = [AMCComplianceFormatSchema.model_validate(orm_to_dict(item)) for item in orm_model.amc_compliance_formats]
        
        # Handle one-to-one relationship
        site_information = SiteInformationSchema.model_validate(orm_to_dict(orm_model.site_information)) if orm_model.site_information else None
        camera_inventory_logs = [CameraInventoryLogSchema.model_validate(orm_to_dict(item)) for item in orm_model.camera_inventory_logs]
        
        documentation_format = DocumentationFormatSchema(
            Site_Information=site_information,
            Camera_Inventory_Log=camera_inventory_logs
        )
        
        data = CCTVAuditData(
            Site_Assessment_Format=site_assessments,
            Installation_Checklist=installation_checklists,
            Configuration_Testing_Checklist=configuration_checklists,
            Daily_Operations_Monitoring=daily_operations,
            Maintenance_Schedule=maintenance_schedules,
            AMC_Compliance_Format=amc_compliance_formats,
            Documentation_Format=documentation_format
        )
        return cls(id=orm_model.id, property_id=orm_model.property_id, created_at=orm_model.created_at, updated_at=orm_model.updated_at, cctv_audit_data=data)


Base.metadata.create_all(bind=engine)

ONE_TO_MANY_MAP = {
    "Site_Assessment_Format": SiteAssessmentFormat, "Installation_Checklist": InstallationChecklist, "Configuration_Testing_Checklist": ConfigurationTestingChecklist,
    "Daily_Operations_Monitoring": DailyOperationsMonitoring, "Maintenance_Schedule": CctvMaintenanceSchedule, "AMC_Compliance_Format": AMCComplianceFormat,
    "Camera_Inventory_Log": CameraInventoryLog
}
ONE_TO_ONE_MAP = {"Site_Information": SiteInformation}
TAG = "CCTV Audit Reports"

@app.post("/cctv-audit-reports/", response_model=CCTVAuditReportResponse, status_code=status.HTTP_201_CREATED, tags=[TAG])
def create_report(report_data: CCTVAuditReportCreate, db: Session = Depends(get_db)):
    try:
        db_report = CCTVAuditReport(property_id=report_data.property_id); db.add(db_report); db.flush()
        cctv_audit_payload = report_data.CCTV_Audit

        # Handle one-to-one
        site_info_data = cctv_audit_payload.Documentation_Format.Site_Information
        db.add(SiteInformation(report_id=db_report.id, **site_info_data.model_dump()))

        # Handle one-to-many from Documentation_Format
        for entry_data in cctv_audit_payload.Documentation_Format.Camera_Inventory_Log:
            db.add(CameraInventoryLog(report_id=db_report.id, **entry_data.model_dump()))

        # Handle other one-to-many lists
        for key, model in ONE_TO_MANY_MAP.items():
            if key == "Camera_Inventory_Log": continue # Already handled
            entries = getattr(cctv_audit_payload, key, [])
            for entry_data in entries:
                db.add(model(report_id=db_report.id, **entry_data.model_dump()))

        db.commit(); db.refresh(db_report)
        return CCTVAuditReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@app.get("/cctv-audit-reports/", response_model=List[CCTVAuditReportResponse], tags=[TAG])
def get_all_reports(skip: int = 0, limit: int = 100, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(CCTVAuditReport)
    if property_id: query = query.filter(CCTVAuditReport.property_id == property_id)
    records = query.offset(skip).limit(limit).all()
    return [CCTVAuditReportResponse.from_orm_model(r) for r in records]

@app.get("/cctv-audit-reports/{report_id}", response_model=CCTVAuditReportResponse, tags=[TAG])
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    record = db.query(CCTVAuditReport).filter(CCTVAuditReport.id == report_id).first()
    if not record: raise HTTPException(status_code=404, detail="Report not found")
    return CCTVAuditReportResponse.from_orm_model(record)

@app.put("/cctv-audit-reports/{report_id}", response_model=CCTVAuditReportResponse, tags=[TAG])
def update_report(report_id: str, update_data: CCTVAuditReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(CCTVAuditReport).filter(CCTVAuditReport.id == report_id).first()
    if not db_report: raise HTTPException(status_code=404, detail="Report not found")
    try:
        if update_data.property_id: db_report.property_id = update_data.property_id
        if update_data.CCTV_Audit:
            cctv_audit_payload = update_data.CCTV_Audit
            
            # Update Site_Information
            site_info_data = cctv_audit_payload.Documentation_Format.Site_Information
            db.query(SiteInformation).filter(SiteInformation.report_id == report_id).delete(synchronize_session=False)
            db.add(SiteInformation(report_id=report_id, **site_info_data.model_dump()))
            
            # Update Camera_Inventory_Log
            db.query(CameraInventoryLog).filter(CameraInventoryLog.report_id == report_id).delete(synchronize_session=False)
            for entry_data in cctv_audit_payload.Documentation_Format.Camera_Inventory_Log:
                db.add(CameraInventoryLog(report_id=report_id, **entry_data.model_dump()))

            # Update other lists
            for key, model in ONE_TO_MANY_MAP.items():
                if key == "Camera_Inventory_Log": continue
                entries = getattr(cctv_audit_payload, key, None)
                if entries is not None:
                    db.query(model).filter(model.report_id == report_id).delete(synchronize_session=False)
                    for entry_data in entries:
                        db.add(model(report_id=report_id, **entry_data.model_dump()))

        db_report.updated_at = datetime.utcnow(); db.commit(); db.refresh(db_report)
        return CCTVAuditReportResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@app.delete("/cctv-audit-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=[TAG])
def delete_report(report_id: str, db: Session = Depends(get_db)):
    record = db.query(CCTVAuditReport).filter(CCTVAuditReport.id == report_id).first()
    if not record: raise HTTPException(status_code=404, detail="Report not found")
    try:
        db.delete(record); db.commit()
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")

# --- Helper Functions ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_uuid():
    return str(uuid.uuid4())

# --- SQLAlchemy ORM Models ---

# Main Parent Table
class TransitionChecklistReport(Base):
    __tablename__ = "transition_checklist_reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, index=True, nullable=False)
    # Metadata fields
    company_logo = Column(String)
    client_logo = Column(String)
    site_name = Column(String)
    transition_details = Column(String)
    prepared_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-many relationship to a unified checklist table
    checklist_items = relationship("ChecklistItem", back_populates="report", cascade="all, delete-orphan")

# Unified Child Table for all checklist items
class ChecklistItem(Base):
    __tablename__ = "checklist_items"
    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("transition_checklist_reports.id"), nullable=False)
    section = Column(String, index=True) # e.g., "Helpdesk", "Housekeeping"
    sr_no = Column(Integer)
    description = Column(Text)
    critical_important_desirable = Column(String)
    applicable = Column(String)
    availability_status = Column(String)
    details = Column(Text)
    remarks = Column(Text)
    report = relationship("TransitionChecklistReport", back_populates="checklist_items")

# --- Pydantic Schemas ---
class ChecklistItemSchema(BaseModel):
    sr_no: int
    description: str
    critical_important_desirable: str
    applicable: str
    availability_status: str
    details: str
    remarks: str
    class Config: from_attributes = True

class SectionCategorySchema(BaseModel):
    documents_to_be_customised: List[ChecklistItemSchema] = []

# Schemas for API Operations
class TransitionChecklistCreate(BaseModel):
    property_id: str
    company_logo: str
    client_logo: str
    site_name: str
    transition_details: str
    prepared_by: str
    sections: Dict[str, SectionCategorySchema]

class TransitionChecklistUpdate(BaseModel):
    property_id: Optional[str] = None
    company_logo: Optional[str] = None
    client_logo: Optional[str] = None
    site_name: Optional[str] = None
    transition_details: Optional[str] = None
    prepared_by: Optional[str] = None
    sections: Optional[Dict[str, SectionCategorySchema]] = None

# Schema for API Response
class TransitionChecklistResponse(BaseModel):
    id: str; property_id: str; created_at: datetime; updated_at: datetime
    company_logo: str; client_logo: str; site_name: str; transition_details: str; prepared_by: str
    sections: Dict[str, SectionCategorySchema]
    class Config: from_attributes = True

    @classmethod
    def from_orm_model(cls, report: TransitionChecklistReport):
        # Reconstruct the nested sections object from the flat list of items
        sections_data = {}
        for item in report.checklist_items:
            # Initialize the section if it's not already in our dictionary
            if item.section not in sections_data:
                sections_data[item.section] = {"documents_to_be_customised": []}
            
            item_schema = ChecklistItemSchema.from_orm(item)
            sections_data[item.section]["documents_to_be_customised"].append(item_schema)

        return cls(
            id=report.id, property_id=report.property_id, created_at=report.created_at, updated_at=report.updated_at,
            company_logo=report.company_logo, client_logo=report.client_logo, site_name=report.site_name,
            transition_details=report.transition_details, prepared_by=report.prepared_by,
            sections=sections_data
        )

Base.metadata.create_all(bind=engine)
TAG = "Transition Checklists"

@app.post("/transition-checklists/", response_model=TransitionChecklistResponse, status_code=status.HTTP_201_CREATED, tags=[TAG])
def create_checklist(report_data: TransitionChecklistCreate, db: Session = Depends(get_db)):
    try:
        report_dict = report_data.dict(exclude={"sections"}) # Exclude sections from main object creation
        db_report = TransitionChecklistReport(**report_dict)
        db.add(db_report)
        db.flush()

        # Iterate through the sections dictionary and add items to the unified table
        for section_name, section_content in report_data.sections.items():
            for item_data in section_content.documents_to_be_customised:
                db_item = ChecklistItem(
                    report_id=db_report.id,
                    section=section_name,
                    **item_data.dict()
                )
                db.add(db_item)
        
        db.commit()
        db.refresh(db_report)
        return TransitionChecklistResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating checklist: {str(e)}")

@app.get("/transition-checklists/", response_model=List[TransitionChecklistResponse], tags=[TAG])
def get_all_checklists(skip: int = 0, limit: int = 10, property_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(TransitionChecklistReport)
    if property_id:
        query = query.filter(TransitionChecklistReport.property_id == property_id)
    reports = query.offset(skip).limit(limit).all()
    return [TransitionChecklistResponse.from_orm_model(r) for r in reports]

@app.get("/transition-checklists/{report_id}", response_model=TransitionChecklistResponse, tags=[TAG])
def get_checklist_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(TransitionChecklistReport).filter(TransitionChecklistReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return TransitionChecklistResponse.from_orm_model(report)

@app.put("/transition-checklists/{report_id}", response_model=TransitionChecklistResponse, tags=[TAG])
def update_checklist(report_id: str, update_data: TransitionChecklistUpdate, db: Session = Depends(get_db)):
    db_report = db.query(TransitionChecklistReport).filter(TransitionChecklistReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Checklist not found")
    try:
        # Update metadata fields
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            if key != "sections":
                setattr(db_report, key, value)

        # Replace checklist items if provided
        if 'sections' in update_dict:
            db.query(ChecklistItem).filter(ChecklistItem.report_id == report_id).delete(synchronize_session=False)
            for section_name, section_content in update_dict['sections'].items():
                for item_data in section_content['documents_to_be_customised']:
                    db_item = ChecklistItem(report_id=report_id, section=section_name, **item_data)
                    db.add(db_item)

        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return TransitionChecklistResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating checklist: {str(e)}")

@app.delete("/transition-checklists/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=[TAG])
def delete_checklist(report_id: str, db: Session = Depends(get_db)):
    report = db.query(TransitionChecklistReport).filter(TransitionChecklistReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Checklist not found")
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting checklist: {str(e)}")

# ============================================================================
# POST TRANSITION CHECKLISTS - SEPARATE DATABASE
# ============================================================================

# Separate database for post transition checklists
POST_DATABASE_URL = "sqlite:///./post_transition.db"
post_engine = create_engine(POST_DATABASE_URL, connect_args={"check_same_thread": False})
PostSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=post_engine)
PostBase = declarative_base()

def get_post_db():
    db = PostSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Post Transition Checklist Models
class PostTransitionChecklistReport(PostBase):
    __tablename__ = "post_transition_checklist_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, index=True, nullable=False)
    # Metadata fields
    company_logo = Column(String)
    client_logo = Column(String)
    site_name = Column(String)
    transition_details = Column(String)
    prepared_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-many relationship to a unified checklist table
    checklist_items = relationship("PostChecklistItem", back_populates="report", cascade="all, delete-orphan")

class PostChecklistItem(PostBase):
    __tablename__ = "post_checklist_items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("post_transition_checklist_reports.id"), nullable=False)
    section = Column(String, index=True) # e.g., "Helpdesk", "Housekeeping"
    sr_no = Column(Integer)
    description = Column(Text)
    critical_important_desirable = Column(String)
    applicable = Column(String)
    availability_status = Column(String)
    details = Column(Text)
    remarks = Column(Text)
    report = relationship("PostTransitionChecklistReport", back_populates="checklist_items")

# Post Transition Pydantic Schemas
class PostChecklistItemSchema(BaseModel):
    sr_no: int
    description: str
    critical_important_desirable: str
    applicable: str
    availability_status: str
    details: str
    remarks: str
    class Config: from_attributes = True

class PostSectionCategorySchema(BaseModel):
    documents_to_be_customised: List[PostChecklistItemSchema] = []

class PostTransitionChecklistCreate(BaseModel):
    property_id: str
    company_logo: str
    client_logo: str
    site_name: str
    transition_details: str
    prepared_by: str
    sections: Dict[str, PostSectionCategorySchema]

class PostTransitionChecklistUpdate(BaseModel):
    property_id: Optional[str] = None
    company_logo: Optional[str] = None
    client_logo: Optional[str] = None
    site_name: Optional[str] = None
    transition_details: Optional[str] = None
    prepared_by: Optional[str] = None
    sections: Optional[Dict[str, PostSectionCategorySchema]] = None

class PostTransitionChecklistResponse(BaseModel):
    id: str; property_id: str; created_at: datetime; updated_at: datetime
    company_logo: str; client_logo: str; site_name: str; transition_details: str; prepared_by: str
    sections: Dict[str, PostSectionCategorySchema]
    class Config: from_attributes = True

    @classmethod
    def from_orm_model(cls, report: PostTransitionChecklistReport):
        # Reconstruct the nested sections object from the flat list of items
        sections_data = {}
        for item in report.checklist_items:
            # Initialize the section if it's not already in our dictionary
            if item.section not in sections_data:
                sections_data[item.section] = {"documents_to_be_customised": []}
            
            item_schema = PostChecklistItemSchema.from_orm(item)
            sections_data[item.section]["documents_to_be_customised"].append(item_schema)

        return cls(
            id=report.id, property_id=report.property_id, created_at=report.created_at, updated_at=report.updated_at,
            company_logo=report.company_logo, client_logo=report.client_logo, site_name=report.site_name,
            transition_details=report.transition_details, prepared_by=report.prepared_by,
            sections=sections_data
        )

# Create tables for post transition database
PostBase.metadata.create_all(bind=post_engine)
POST_TAG = "Post Transition Checklists"

@app.post("/post/transition-checklists/", response_model=PostTransitionChecklistResponse, status_code=status.HTTP_201_CREATED, tags=[POST_TAG])
def create_post_checklist(report_data: PostTransitionChecklistCreate, db: Session = Depends(get_post_db)):
    try:
        report_dict = report_data.dict(exclude={"sections"}) # Exclude sections from main object creation
        db_report = PostTransitionChecklistReport(**report_dict)
        db.add(db_report)
        db.flush()

        # Iterate through the sections dictionary and add items to the unified table
        for section_name, section_content in report_data.sections.items():
            for item_data in section_content.documents_to_be_customised:
                db_item = PostChecklistItem(
                    report_id=db_report.id,
                    section=section_name,
                    **item_data.dict()
                )
                db.add(db_item)
        
        db.commit()
        db.refresh(db_report)
        return PostTransitionChecklistResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating post checklist: {str(e)}")

@app.get("/post/transition-checklists/", response_model=List[PostTransitionChecklistResponse], tags=[POST_TAG])
def get_all_post_checklists(skip: int = 0, limit: int = 10, property_id: Optional[str] = None, db: Session = Depends(get_post_db)):
    query = db.query(PostTransitionChecklistReport)
    if property_id:
        query = query.filter(PostTransitionChecklistReport.property_id == property_id)
    reports = query.offset(skip).limit(limit).all()
    return [PostTransitionChecklistResponse.from_orm_model(r) for r in reports]

@app.get("/post/transition-checklists/{report_id}", response_model=PostTransitionChecklistResponse, tags=[POST_TAG])
def get_post_checklist_by_id(report_id: str, db: Session = Depends(get_post_db)):
    report = db.query(PostTransitionChecklistReport).filter(PostTransitionChecklistReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Post checklist not found")
    return PostTransitionChecklistResponse.from_orm_model(report)

@app.put("/post/transition-checklists/{report_id}", response_model=PostTransitionChecklistResponse, tags=[POST_TAG])
def update_post_checklist(report_id: str, update_data: PostTransitionChecklistUpdate, db: Session = Depends(get_post_db)):
    db_report = db.query(PostTransitionChecklistReport).filter(PostTransitionChecklistReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Post checklist not found")
    try:
        # Update metadata fields
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            if key != "sections":
                setattr(db_report, key, value)

        # Replace checklist items if provided
        if 'sections' in update_dict:
            db.query(PostChecklistItem).filter(PostChecklistItem.report_id == report_id).delete(synchronize_session=False)
            for section_name, section_content in update_dict['sections'].items():
                for item_data in section_content['documents_to_be_customised']:
                    db_item = PostChecklistItem(report_id=report_id, section=section_name, **item_data)
                    db.add(db_item)

        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return PostTransitionChecklistResponse.from_orm_model(db_report)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating post checklist: {str(e)}")

@app.delete("/post/transition-checklists/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=[POST_TAG])
def delete_post_checklist(report_id: str, db: Session = Depends(get_post_db)):
    report = db.query(PostTransitionChecklistReport).filter(PostTransitionChecklistReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Post checklist not found")
    try:
        db.delete(report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting post checklist: {str(e)}")

@app.get("/post-transition-checklist/", response_model=List[PostTransitionChecklistResponse], tags=[POST_TAG])
def get_post_transition_checklist_by_property(property_id: str = Query(..., description="Property ID to filter checklists"), db: Session = Depends(get_post_db)):
    """Get post transition checklists by property ID"""
    try:
        reports = db.query(PostTransitionChecklistReport).filter(PostTransitionChecklistReport.property_id == property_id).all()
        return [PostTransitionChecklistResponse.from_orm_model(r) for r in reports]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching post transition checklists: {str(e)}")


class ShiftEnum(str, Enum):
    """Enum for the shift types."""
    morning = "Morning"
    evening = "Evening"
    night = "Night"

class Task(BaseModel):
    """Schema for a single task within a department."""
    time: str = Field(..., example="07:00")
    task_description: str = Field(..., example="Shift Handover")
    person_responsible: str = Field(..., example="Supervisor")
    status_remarks: str = Field(..., example="Completed, logbook signed")

class Departments(BaseModel):
    """Schema for the departments object containing lists of tasks."""
    security: List[Task]
    housekeeping: List[Task]
    technical_maintenance: List[Task]
    facility_soft_services: List[Task]

class WorkSummary(BaseModel):
    """Schema for the summary of work updates."""
    department: str = Field(..., example="Security")
    tasks_planned: int = Field(..., example=6)
    completed: int = Field(..., example=6)
    pending: int = Field(..., example=0)
    remarks: str = Field(..., example="Smooth day")

class SiteReportBase(BaseModel):
    """Base schema for a site report."""
    property_id: str = Field(..., example="P-001")
    date: str = Field(..., example="12/08/2025")
    site_name: str = Field(..., example="ABC Tower")
    prepared_by: str = Field(..., example="Supervisor Name")
    shift: ShiftEnum
    departments: Departments
    summary_of_work_updates: List[WorkSummary]

class SiteReportCreate(SiteReportBase):
    """Schema used for creating a new report. Inherits all fields from Base."""
    pass

class SiteReport(SiteReportBase):
    """Schema used for reading a report from the DB. Includes the DB record ID."""
    id: int

    class Config:
        orm_mode = True # Enables Pydantic to read data from ORM models

# --- SQLAlchemy Model (Database Table) ---

class ReportDB(Base):
    """Database ORM model for the 'reports' table."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    date = Column(String)
    site_name = Column(String)
    prepared_by = Column(String)
    shift = Column(String)
    # Storing complex objects as JSON is efficient for this kind of nested data
    departments = Column(JSON)
    summary_of_work_updates = Column(JSON)

# Create the database tables
Base.metadata.create_all(bind=engine)
# --- Dependency for DB Session ---

def get_db():
    """Dependency to get a DB session for each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- API Endpoints ---

@app.post("/reports/", response_model=SiteReport, status_code=status.HTTP_201_CREATED, tags=["Reports"])
def create_report(report: SiteReportCreate, db: Session = Depends(get_db)):
    """
    Create a new site report.
    
    The request body must contain all the details of the report as per the JSON structure.
    """
    # Pydantic's .dict() method converts the model to a Python dictionary
    report_data = report.dict()
    db_report = ReportDB(**report_data)
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@app.get("/reports/", response_model=List[SiteReport], tags=["Reports"])
def read_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all site reports.
    
    Supports pagination with `skip` and `limit` query parameters.
    """
    reports = db.query(ReportDB).offset(skip).limit(limit).all()
    return reports

@app.get("/reports/{report_id}", response_model=SiteReport, tags=["Reports"])
def read_report_by_id(report_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single site report by its unique ID.
    """
    db_report = db.query(ReportDB).filter(ReportDB.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return db_report

@app.put("/reports/{report_id}", response_model=SiteReport, tags=["Reports"])
def update_report(report_id: int, report: SiteReportCreate, db: Session = Depends(get_db)):
    """
    Update an existing site report by its ID.
    
    The request body must contain the full updated report data.
    """
    db_report = db.query(ReportDB).filter(ReportDB.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    # Update the model fields
    update_data = report.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_report, key, value)
        
    db.commit()
    db.refresh(db_report)
    return db_report

@app.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Reports"])
def delete_report(report_id: int, db: Session = Depends(get_db)):
    """
    Delete a site report by its ID.
    """
    db_report = db.query(ReportDB).filter(ReportDB.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    db.delete(db_report)
    db.commit()
    # No body is returned for a 204 response
    return {"ok": True}

class StatusEnum(str, Enum):
    """Enum for the status types."""
    yes = "Yes"
    no = "No"

class TypeEnum(str, Enum):
    """Enum for the training types."""
    theory = "Theory"
    practical = "Practical"

class TrainingItemBase(BaseModel):
    """Schema for a single training item in the schedule list (for INPUT)."""
    Month: str = Field(..., example="January")
    Week: int = Field(..., example=1)
    type: TypeEnum
    Topics: str = Field(..., example="About the Company.& It's Benefits.")
    status: StatusEnum

class ScheduleBase(BaseModel):
    """Base schema for a training schedule (for INPUT)."""
    property_id: str = Field(..., example="PROP-789")
    year: int = Field(..., example=2025)
    training_schedule: List[TrainingItemBase]

class ScheduleCreate(ScheduleBase):
    """Schema used for creating a new schedule."""
    pass

class ScheduleUpdate(ScheduleBase):
    """Schema used for updating an existing schedule."""
    pass

class Schedule(ScheduleBase):
    """
    Main schema for a training schedule (for OUTPUT).
    It includes the auto-generated database fields.
    """
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True # Enables Pydantic to read data from ORM models

# --- SQLAlchemy Model (Database Table) ---

class ScheduleDB(Base):
    """Database ORM model for the 'schedules' table."""
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    year = Column(Integer, index=True)
    
    # The entire list of training items is stored in a single JSON column
    training_schedule = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database tables if they don't exist
Base.metadata.create_all(bind=engine)


# --- Dependency for DB Session ---
def get_db():
    """Dependency to get a DB session for each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API Endpoints ---

@app.post("/schedules/", response_model=Schedule, status_code=status.HTTP_201_CREATED, tags=["Schedules"])
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    """
    Create a new annual training schedule.
    
    The request body must contain `property_id`, `year`, and the list of `training_schedule` items.
    The `id`, `created_at`, and `updated_at` fields will be auto-generated.
    """
    schedule_data = schedule.dict()
    db_schedule = ScheduleDB(**schedule_data)
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@app.get("/schedules/", response_model=List[Schedule], tags=["Schedules"])
def read_schedules(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve a list of all training schedules.
    
    Supports pagination with `skip` and `limit` query parameters.
    """
    schedules = db.query(ScheduleDB).offset(skip).limit(limit).all()
    return schedules

@app.get("/schedules/{schedule_id}", response_model=Schedule, tags=["Schedules"])
def read_schedule_by_id(schedule_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single training schedule by its unique ID.
    """
    db_schedule = db.query(ScheduleDB).filter(ScheduleDB.id == schedule_id).first()
    if db_schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return db_schedule

@app.put("/schedules/{schedule_id}", response_model=Schedule, tags=["Schedules"])
def update_schedule(schedule_id: int, schedule: ScheduleUpdate, db: Session = Depends(get_db)):
    """
    Update an existing training schedule by its ID.
    
    The request body must contain the full updated schedule data.
    """
    db_schedule = db.query(ScheduleDB).filter(ScheduleDB.id == schedule_id).first()
    if db_schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    
    update_data = schedule.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_schedule, key, value)
        
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@app.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Schedules"])
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """
    Delete a training schedule by its ID.
    """
    db_schedule = db.query(ScheduleDB).filter(ScheduleDB.id == schedule_id).first()
    if db_schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    
    db.delete(db_schedule)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Training Details ---

class ConductedByBase(BaseModel):
    """Schema for trainer details."""
    trainer_name: str = Field(..., example="Ravi Kumar")
    designation: str = Field(..., example="Senior Security Trainer")

class AttendanceDetailsBase(BaseModel):
    """Schema for individual attendance details."""
    employee_name: str = Field(..., example="Amit Sharma")
    employee_code: str = Field(..., example="SEC101")
    designation: str = Field(..., example="Security Guard")
    shift: str = Field(..., example="Day")
    attendance: str = Field(..., example="Present")
    signature: str = Field(..., example="Signed")

class TrainingContentBase(BaseModel):
    """Schema for training content modules."""
    module_topic: str = Field(..., example="Fire Safety")
    key_points_discussed: str = Field(..., example="Identifying fire hazards, Using fire extinguishers, Evacuation routes")
    materials_used: str = Field(..., example="PPT, Video")

class PhotosProofBase(BaseModel):
    """Schema for training photos proof."""
    description: str = Field(..., example="Trainer explaining evacuation route using floor plan")
    file_name_or_link: str = Field(..., example="https://example.com/photos/training_evacuations_001.jpg")

class FeedbackSummaryBase(BaseModel):
    """Schema for employee feedback."""
    employee_name: str = Field(..., example="Amit Sharma")
    clarity_of_content: int = Field(..., ge=1, le=5, example=5)
    trainer_knowledge: int = Field(..., ge=1, le=5, example=5)
    usefulness: int = Field(..., ge=1, le=5, example=5)
    suggestions_comments: str = Field(..., example="Very helpful and practical session.")

class TrainerEvaluationBase(BaseModel):
    """Schema for trainer's evaluation of employees."""
    employee_name: str = Field(..., example="Amit Sharma")
    participation: str = Field(..., example="Active")
    understanding_level: str = Field(..., example="Good")
    improvement_area: str = Field(..., example="None")

class SignOffBase(BaseModel):
    """Schema for training sign-off."""
    trainer_name: str = Field(..., example="Ravi Kumar")
    signature: str = Field(..., example="Signed")
    date: str = Field(..., example="2025-08-13")
    verified_by: str = Field(..., example="Sandeep Mehra (Site Head)")
    remarks: str = Field(..., example="Training completed successfully with good engagement.")

class TrainingDetailsBase(BaseModel):
    """Schema for training details."""
    s_no: str = Field(..., example="001")
    date_of_training: str = Field(..., example="2025-08-13")
    site_name: str = Field(..., example="Sunrise Corporate Tower")
    client_name: str = Field(..., example="TechNova Solutions Pvt. Ltd.")
    location: str = Field(..., example="Bengaluru, India")
    conducted_by: ConductedByBase
    department: str = Field(..., example="Security")
    training_topic: str = Field(..., example="Emergency Response & Evacuation Procedures")
    mode_of_training: str = Field(..., example="Offline")
    duration_hrs: str = Field(..., example="2")

class TrainingDetailsCreate(BaseModel):
    """Schema for creating training details."""
    property_id: str = Field(..., example="PROP-001")
    training_details: TrainingDetailsBase
    attendance_details: List[AttendanceDetailsBase]
    training_content: List[TrainingContentBase]
    photos_proof: List[PhotosProofBase]
    feedback_summary: List[FeedbackSummaryBase]
    trainer_evaluation: List[TrainerEvaluationBase]
    sign_off: SignOffBase

class TrainingDetailsUpdate(BaseModel):
    """Schema for updating training details."""
    property_id: Optional[str] = None
    training_details: Optional[TrainingDetailsBase] = None
    attendance_details: Optional[List[AttendanceDetailsBase]] = None
    training_content: Optional[List[TrainingContentBase]] = None
    photos_proof: Optional[List[PhotosProofBase]] = None
    feedback_summary: Optional[List[FeedbackSummaryBase]] = None
    trainer_evaluation: Optional[List[TrainerEvaluationBase]] = None
    sign_off: Optional[SignOffBase] = None

class TrainingDetails(TrainingDetailsCreate):
    """Schema for reading training details from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Training Details ---

class TrainingDetailsDB(Base):
    """Database ORM model for the 'training_details' table."""
    __tablename__ = "training_details"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    
    # Store all the nested objects as JSON fields
    training_details = Column(JSON)
    attendance_details = Column(JSON)
    training_content = Column(JSON)
    photos_proof = Column(JSON)
    feedback_summary = Column(JSON)
    trainer_evaluation = Column(JSON)
    sign_off = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Training Details ---

@app.post("/training-details/", response_model=TrainingDetails, status_code=status.HTTP_201_CREATED, tags=["Training Details"])
def create_training_details(training: TrainingDetailsCreate, db: Session = Depends(get_db)):
    """
    Create a new training details record.
    """
    training_data = training.dict()
    db_training = TrainingDetailsDB(**training_data)
    db.add(db_training)
    db.commit()
    db.refresh(db_training)
    return db_training

@app.get("/training-details/", response_model=List[TrainingDetails], tags=["Training Details"])
def read_training_details(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all training details with pagination.
    """
    training_records = db.query(TrainingDetailsDB).offset(skip).limit(limit).all()
    return training_records

@app.get("/training-details/{training_id}", response_model=TrainingDetails, tags=["Training Details"])
def read_training_details_by_id(training_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single training details record by its ID.
    """
    db_training = db.query(TrainingDetailsDB).filter(TrainingDetailsDB.id == training_id).first()
    if db_training is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training details not found")
    return db_training

@app.get("/training-details/property/{property_id}", response_model=List[TrainingDetails], tags=["Training Details"])
def read_training_details_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all training details for a specific property.
    """
    training_records = db.query(TrainingDetailsDB).filter(TrainingDetailsDB.property_id == property_id).all()
    return training_records

@app.put("/training-details/{training_id}", response_model=TrainingDetails, tags=["Training Details"])
def update_training_details(training_id: int, training: TrainingDetailsUpdate, db: Session = Depends(get_db)):
    """
    Update an existing training details record.
    """
    db_training = db.query(TrainingDetailsDB).filter(TrainingDetailsDB.id == training_id).first()
    if db_training is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training details not found")

    update_data = training.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_training, key, value)
        
    db.commit()
    db.refresh(db_training)
    return db_training

@app.delete("/training-details/{training_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Training Details"])
def delete_training_details(training_id: int, db: Session = Depends(get_db)):
    """
    Delete a training details record by its ID.
    """
    db_training = db.query(TrainingDetailsDB).filter(TrainingDetailsDB.id == training_id).first()
    if db_training is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training details not found")
    
    db.delete(db_training)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Patrolling Details ---

class ReportedByBase(BaseModel):
    """Schema for person reporting the patrol."""
    name: str = Field(..., example="Arjun Singh")
    designation: str = Field(..., example="Security Supervisor")

class PatrollingDetailsBase(BaseModel):
    """Schema for basic patrolling information."""
    s_no: str = Field(..., example="001")
    date: str = Field(..., example="2025-08-13")
    site_name: str = Field(..., example="Sunrise Corporate Tower")
    client_name: str = Field(..., example="TechNova Solutions Pvt. Ltd.")
    location: str = Field(..., example="Bengaluru, India")
    shift_timing: str = Field(..., example="22:00 - 06:00")
    reported_by: ReportedByBase

class CheckpointLogBase(BaseModel):
    """Schema for individual checkpoint logs."""
    checkpoint_no: int = Field(..., example=1)
    area_location_name: str = Field(..., example="Main Gate")
    time_checked: str = Field(..., example="22:15")
    checked_by: str = Field(..., example="Ravi Kumar")
    observations: str = Field(..., example="Gate lock functioning properly")
    status: str = Field(..., example="Clear")
    action_taken: str = Field(..., example="None")

class PatrolRouteFrequencyBase(BaseModel):
    """Schema for patrol route frequency details."""
    route_covered: str = Field(..., example="Tower A to B")
    no_of_rounds_completed: int = Field(..., example=3)
    time_of_each_round: List[str] = Field(..., example=["22:00", "00:30", "03:00"])
    any_skipped_area: str = Field(..., example="No")
    reason_if_skipped: str = Field(..., example="")

class IncidentsObservationsBase(BaseModel):
    """Schema for incidents and observations during patrol."""
    time: str = Field(..., example="00:45")
    location: str = Field(..., example="Basement 1")
    description: str = Field(..., example="Suspicious parked vehicle without sticker")
    severity: str = Field(..., example="Medium")
    immediate_action_taken: str = Field(..., example="Noted vehicle number and informed supervisor")
    escalated_to: str = Field(..., example="Duty Manager")

class PhotoVideoEvidenceBase(BaseModel):
    """Schema for photo/video evidence."""
    checkpoint_location: str = Field(..., example="Basement 1")
    file_name_or_link: str = Field(..., example="https://example.com/photos/vehicle_incident_001.jpg")
    type: str = Field(..., example="Photo")
    purpose: str = Field(..., example="Incident Proof")

class ChecklistSummaryBase(BaseModel):
    """Schema for checklist summary items."""
    description: str = Field(..., example="All Entry/Exit Points Checked")
    status: str = Field(..., example="Yes")
    remarks: str = Field(..., example="All gates secure")

class SignOffPatrolBase(BaseModel):
    """Schema for patrol sign-off."""
    patrolling_guard_name: str = Field(..., example="Ravi Kumar")
    patrolling_guard_signature: str = Field(..., example="Signed")
    supervisor_name: str = Field(..., example="Arjun Singh")
    supervisor_signature: str = Field(..., example="Signed")
    date_time_submission: str = Field(..., example="2025-08-13T06:05:00")

class PatrollingDetailsCreate(BaseModel):
    """Schema for creating patrolling details."""
    property_id: str = Field(..., example="PROP-001")
    patrolling_details: PatrollingDetailsBase
    checkpoint_log: List[CheckpointLogBase]
    patrol_route_frequency: List[PatrolRouteFrequencyBase]
    incidents_observations: List[IncidentsObservationsBase]
    photo_video_evidence: List[PhotoVideoEvidenceBase]
    checklist_summary: List[ChecklistSummaryBase]
    final_remarks: str = Field(..., example="Overall night patrol completed successfully. Only issue found was basement light flicker and unregistered vehicle. Both escalated for action.")
    sign_off: SignOffPatrolBase

class PatrollingDetailsUpdate(BaseModel):
    """Schema for updating patrolling details."""
    property_id: Optional[str] = None
    patrolling_details: Optional[PatrollingDetailsBase] = None
    checkpoint_log: Optional[List[CheckpointLogBase]] = None
    patrol_route_frequency: Optional[List[PatrolRouteFrequencyBase]] = None
    incidents_observations: Optional[List[IncidentsObservationsBase]] = None
    photo_video_evidence: Optional[List[PhotoVideoEvidenceBase]] = None
    checklist_summary: Optional[List[ChecklistSummaryBase]] = None
    final_remarks: Optional[str] = None
    sign_off: Optional[SignOffPatrolBase] = None

class PatrollingDetails(PatrollingDetailsCreate):
    """Schema for reading patrolling details from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Patrolling Details ---

class PatrollingDetailsDB(Base):
    """Database ORM model for the 'patrolling_details' table."""
    __tablename__ = "patrolling_details"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    
    # Store all the nested objects as JSON fields
    patrolling_details = Column(JSON)
    checkpoint_log = Column(JSON)
    patrol_route_frequency = Column(JSON)
    incidents_observations = Column(JSON)
    photo_video_evidence = Column(JSON)
    checklist_summary = Column(JSON)
    final_remarks = Column(Text)
    sign_off = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Patrolling Details ---

@app.post("/patrolling-details/", response_model=PatrollingDetails, status_code=status.HTTP_201_CREATED, tags=["Patrolling Details"])
def create_patrolling_details(patrol: PatrollingDetailsCreate, db: Session = Depends(get_db)):
    """
    Create a new patrolling details record.
    """
    patrol_data = patrol.dict()
    db_patrol = PatrollingDetailsDB(**patrol_data)
    db.add(db_patrol)
    db.commit()
    db.refresh(db_patrol)
    return db_patrol

@app.get("/patrolling-details/", response_model=List[PatrollingDetails], tags=["Patrolling Details"])
def read_patrolling_details(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all patrolling details with pagination.
    """
    patrol_records = db.query(PatrollingDetailsDB).offset(skip).limit(limit).all()
    return patrol_records

@app.get("/patrolling-details/{patrol_id}", response_model=PatrollingDetails, tags=["Patrolling Details"])
def read_patrolling_details_by_id(patrol_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single patrolling details record by its ID.
    """
    db_patrol = db.query(PatrollingDetailsDB).filter(PatrollingDetailsDB.id == patrol_id).first()
    if db_patrol is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patrolling details not found")
    return db_patrol

@app.get("/patrolling-details/property/{property_id}", response_model=List[PatrollingDetails], tags=["Patrolling Details"])
def read_patrolling_details_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all patrolling details for a specific property.
    """
    patrol_records = db.query(PatrollingDetailsDB).filter(PatrollingDetailsDB.property_id == property_id).all()
    return patrol_records

@app.get("/patrolling-details/date/{date}", response_model=List[PatrollingDetails], tags=["Patrolling Details"])
def read_patrolling_details_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all patrolling details for a specific date.
    """
    patrol_records = db.query(PatrollingDetailsDB).filter(PatrollingDetailsDB.patrolling_details.contains({"date": date})).all()
    return patrol_records

@app.put("/patrolling-details/{patrol_id}", response_model=PatrollingDetails, tags=["Patrolling Details"])
def update_patrolling_details(patrol_id: int, patrol: PatrollingDetailsUpdate, db: Session = Depends(get_db)):
    """
    Update an existing patrolling details record.
    """
    db_patrol = db.query(PatrollingDetailsDB).filter(PatrollingDetailsDB.id == patrol_id).first()
    if db_patrol is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patrolling details not found")

    update_data = patrol.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patrol, key, value)
        
    db.commit()
    db.refresh(db_patrol)
    return db_patrol

@app.delete("/patrolling-details/{patrol_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Patrolling Details"])
def delete_patrolling_details(patrol_id: int, db: Session = Depends(get_db)):
    """
    Delete a patrolling details record by its ID.
    """
    db_patrol = db.query(PatrollingDetailsDB).filter(PatrollingDetailsDB.id == patrol_id).first()
    if db_patrol is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patrolling details not found")
    
    db.delete(db_patrol)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Escalation Matrix ---

class ClientDetailsBase(BaseModel):
    """Schema for client and site details."""
    client_name: str = Field(..., example="TechNova Solutions Pvt. Ltd.")
    site_name: str = Field(..., example="Sunrise Corporate Tower")
    location: str = Field(..., example="Bengaluru, India")
    service_type: str = Field(..., example="Security")
    prepared_by: str = Field(..., example="Arjun Singh")
    date: str = Field(..., example="2025-08-13")

class EscalationMatrixBase(BaseModel):
    """Schema for individual escalation level details."""
    escalation_level: str = Field(..., example="Level 1")
    name: str = Field(..., example="Ravi Kumar")
    designation: str = Field(..., example="Security Supervisor")
    department: str = Field(..., example="Security")
    contact_number: str = Field(..., example="+91-9876543210")
    email_id: str = Field(..., example="ravi.kumar@technova.com")
    response_time_max: str = Field(..., example="2 hours")
    availability: str = Field(..., example="Night Shift / All Days")
    remarks: str = Field(..., example="Handles immediate onsite issues")

class EscalationGuidelinesBase(BaseModel):
    """Schema for escalation guidelines by issue type."""
    issue_type: str = Field(..., example="Minor Complaint (e.g., light out)")
    direct_escalation_level: str = Field(..., example="Level 1")
    expected_resolution_time: str = Field(..., example="4 hours")
    mode_of_escalation: str = Field(..., example="Call / WhatsApp")

class SignOffEscalationBase(BaseModel):
    """Schema for escalation matrix sign-off."""
    prepared_by: str = Field(..., example="Arjun Singh")
    verified_by: str = Field(..., example="Sandeep Mehra")
    approved_by: str = Field(..., example="Rohit Khanna")
    date_of_approval: str = Field(..., example="2025-08-13")

class EscalationMatrixCreate(BaseModel):
    """Schema for creating escalation matrix."""
    property_id: str = Field(..., example="PROP-001")
    client_details: ClientDetailsBase
    escalation_matrix: List[EscalationMatrixBase]
    escalation_guidelines: List[EscalationGuidelinesBase]
    sign_off: SignOffEscalationBase

class EscalationMatrixUpdate(BaseModel):
    """Schema for updating escalation matrix."""
    property_id: Optional[str] = None
    client_details: Optional[ClientDetailsBase] = None
    escalation_matrix: Optional[List[EscalationMatrixBase]] = None
    escalation_guidelines: Optional[List[EscalationGuidelinesBase]] = None
    sign_off: Optional[SignOffEscalationBase] = None

class EscalationMatrix(EscalationMatrixCreate):
    """Schema for reading escalation matrix from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Escalation Matrix ---

class EscalationMatrixDB(Base):
    """Database ORM model for the 'escalation_matrix' table."""
    __tablename__ = "escalation_matrix"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    
    # Store all the nested objects as JSON fields
    client_details = Column(JSON)
    escalation_matrix = Column(JSON)
    escalation_guidelines = Column(JSON)
    sign_off = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Escalation Matrix ---

@app.post("/escalation-matrix/", response_model=EscalationMatrix, status_code=status.HTTP_201_CREATED, tags=["Escalation Matrix"])
def create_escalation_matrix(escalation: EscalationMatrixCreate, db: Session = Depends(get_db)):
    """
    Create a new escalation matrix record.
    """
    escalation_data = escalation.dict()
    db_escalation = EscalationMatrixDB(**escalation_data)
    db.add(db_escalation)
    db.commit()
    db.refresh(db_escalation)
    return db_escalation

@app.get("/escalation-matrix/", response_model=List[EscalationMatrix], tags=["Escalation Matrix"])
def read_escalation_matrix(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all escalation matrix records with pagination.
    """
    escalation_records = db.query(EscalationMatrixDB).offset(skip).limit(limit).all()
    return escalation_records

@app.get("/escalation-matrix/{escalation_id}", response_model=EscalationMatrix, tags=["Escalation Matrix"])
def read_escalation_matrix_by_id(escalation_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single escalation matrix record by its ID.
    """
    db_escalation = db.query(EscalationMatrixDB).filter(EscalationMatrixDB.id == escalation_id).first()
    if db_escalation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation matrix not found")
    return db_escalation

@app.get("/escalation-matrix/property/{property_id}", response_model=EscalationMatrix, tags=["Escalation Matrix"])
def read_escalation_matrix_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve escalation matrix for a specific property.
    """
    db_escalation = db.query(EscalationMatrixDB).filter(EscalationMatrixDB.property_id == property_id).first()
    if db_escalation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation matrix not found for this property")
    return db_escalation

@app.get("/escalation-matrix/service/{service_type}", response_model=List[EscalationMatrix], tags=["Escalation Matrix"])
def read_escalation_matrix_by_service(service_type: str, db: Session = Depends(get_db)):
    """
    Retrieve all escalation matrices for a specific service type.
    """
    escalation_records = db.query(EscalationMatrixDB).filter(EscalationMatrixDB.client_details.contains({"service_type": service_type})).all()
    return escalation_records

@app.put("/escalation-matrix/{escalation_id}", response_model=EscalationMatrix, tags=["Escalation Matrix"])
def update_escalation_matrix(escalation_id: int, escalation: EscalationMatrixUpdate, db: Session = Depends(get_db)):
    """
    Update an existing escalation matrix record.
    """
    db_escalation = db.query(EscalationMatrixDB).filter(EscalationMatrixDB.id == escalation_id).first()
    if db_escalation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation matrix not found")

    update_data = escalation.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_escalation, key, value)
        
    db.commit()
    db.refresh(db_escalation)
    return db_escalation

@app.delete("/escalation-matrix/{escalation_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Escalation Matrix"])
def delete_escalation_matrix(escalation_id: int, db: Session = Depends(get_db)):
    """
    Delete an escalation matrix record by its ID.
    """
    db_escalation = db.query(EscalationMatrixDB).filter(EscalationMatrixDB.id == escalation_id).first()
    if db_escalation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation matrix not found")
    
    db.delete(db_escalation)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Meeting Details ---

class MeetingDetailsBase(BaseModel):
    """Schema for basic meeting information."""
    s_no: str = Field(..., example="001")
    date_of_meeting: str = Field(..., example="2025-08-13")
    time: str = Field(..., example="15:00 - 16:30")
    venue_mode: str = Field(..., example="Online (Zoom)")
    conducted_by: str = Field(..., example="Arjun Singh")
    client_department_project: str = Field(..., example="TechNova Solutions - Security Upgrade Project")

class AttendanceListBase(BaseModel):
    """Schema for meeting attendees."""
    name: str = Field(..., example="Ravi Kumar")
    designation: str = Field(..., example="Security Supervisor")
    department: str = Field(..., example="Security")
    email_contact: str = Field(..., example="ravi.kumar@technova.com")
    signature: str = Field(..., example="")

class AgendaBase(BaseModel):
    """Schema for meeting agenda items."""
    agenda_point_no: int = Field(..., example=1)
    topic_description: str = Field(..., example="Review of last month's incident reports")
    lead_person: str = Field(..., example="Priya Nair")
    time_allocated_min: int = Field(..., example=30)

class DiscussionPointsBase(BaseModel):
    """Schema for discussion points and decisions."""
    topic_agenda: str = Field(..., example="Incident report review")
    discussion_summary: str = Field(..., example="Discussed 3 incidents reported last month, focusing on security breaches at Tower B.")
    decision_taken: str = Field(..., example="Increase night patrolling frequency and upgrade main gate locks.")
    responsible_person: str = Field(..., example="Ravi Kumar")
    deadline: str = Field(..., example="2025-08-31")

class ActionItemsBase(BaseModel):
    """Schema for action items and follow-ups."""
    action_point_no: int = Field(..., example=1)
    action_item: str = Field(..., example="Procure and install 20 new CCTV cameras")
    assigned_to: str = Field(..., example="Sandeep Mehra")
    priority: str = Field(..., example="High")
    target_completion_date: str = Field(..., example="2025-09-15")
    remarks_status: str = Field(..., example="Pending vendor confirmation")

class DocumentsSharedBase(BaseModel):
    """Schema for documents shared during meeting."""
    document_name: str = Field(..., example="Incident_Report_July2025.pdf")
    type: str = Field(..., example="PDF")
    shared_by: str = Field(..., example="Priya Nair")
    remarks_purpose: str = Field(..., example="Reference for security discussion")

class ClientCommentsBase(BaseModel):
    """Schema for client feedback and comments."""
    name: str = Field(..., example="Rohit Khanna")
    comments_suggestions: str = Field(..., example="Ensure the CCTV upgrade also covers parking areas.")

class PreparedByBase(BaseModel):
    """Schema for meeting preparation details."""
    name: str = Field(..., example="Arjun Singh")
    designation: str = Field(..., example="Security Supervisor")
    signature: str = Field(..., example="Signed")
    date: str = Field(..., example="2025-08-13")

class ApprovedByBase(BaseModel):
    """Schema for meeting approval details."""
    name: str = Field(..., example="Rohit Khanna")
    designation: str = Field(..., example="Client RM")
    signature: str = Field(..., example="Signed")
    date: str = Field(..., example="2025-08-13")

class SignOffMeetingBase(BaseModel):
    """Schema for meeting sign-off."""
    prepared_by: PreparedByBase
    approved_by: ApprovedByBase

class MeetingDetailsCreate(BaseModel):
    """Schema for creating meeting details."""
    property_id: str = Field(..., example="PROP-001")
    meeting_details: MeetingDetailsBase
    attendance_list: List[AttendanceListBase]
    agenda: List[AgendaBase]
    discussion_points: List[DiscussionPointsBase]
    action_items: List[ActionItemsBase]
    documents_shared: List[DocumentsSharedBase]
    client_comments: List[ClientCommentsBase]
    sign_off: SignOffMeetingBase

class MeetingDetailsUpdate(BaseModel):
    """Schema for updating meeting details."""
    property_id: Optional[str] = None
    meeting_details: Optional[MeetingDetailsBase] = None
    attendance_list: Optional[List[AttendanceListBase]] = None
    agenda: Optional[List[AgendaBase]] = None
    discussion_points: Optional[List[DiscussionPointsBase]] = None
    action_items: Optional[List[ActionItemsBase]] = None
    documents_shared: Optional[List[DocumentsSharedBase]] = None
    client_comments: Optional[List[ClientCommentsBase]] = None
    sign_off: Optional[SignOffMeetingBase] = None

class MeetingDetails(MeetingDetailsCreate):
    """Schema for reading meeting details from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Meeting Details ---

class MeetingDetailsDB(Base):
    """Database ORM model for the 'meeting_details' table."""
    __tablename__ = "meeting_details"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    
    # Store all the nested objects as JSON fields
    meeting_details = Column(JSON)
    attendance_list = Column(JSON)
    agenda = Column(JSON)
    discussion_points = Column(JSON)
    action_items = Column(JSON)
    documents_shared = Column(JSON)
    client_comments = Column(JSON)
    sign_off = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Meeting Details ---

@app.post("/meeting-details/", response_model=MeetingDetails, status_code=status.HTTP_201_CREATED, tags=["Meeting Details"])
def create_meeting_details(meeting: MeetingDetailsCreate, db: Session = Depends(get_db)):
    """
    Create a new meeting details record.
    """
    meeting_data = meeting.dict()
    db_meeting = MeetingDetailsDB(**meeting_data)
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@app.get("/meeting-details/", response_model=List[MeetingDetails], tags=["Meeting Details"])
def read_meeting_details(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all meeting details with pagination.
    """
    meeting_records = db.query(MeetingDetailsDB).offset(skip).limit(limit).all()
    return meeting_records

@app.get("/meeting-details/{meeting_id}", response_model=MeetingDetails, tags=["Meeting Details"])
def read_meeting_details_by_id(meeting_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single meeting details record by its ID.
    """
    db_meeting = db.query(MeetingDetailsDB).filter(MeetingDetailsDB.id == meeting_id).first()
    if db_meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting details not found")
    return db_meeting

@app.get("/meeting-details/property/{property_id}", response_model=List[MeetingDetails], tags=["Meeting Details"])
def read_meeting_details_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all meeting details for a specific property.
    """
    meeting_records = db.query(MeetingDetailsDB).filter(MeetingDetailsDB.property_id == property_id).all()
    return meeting_records

@app.get("/meeting-details/date/{date}", response_model=List[MeetingDetails], tags=["Meeting Details"])
def read_meeting_details_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all meeting details for a specific date.
    """
    meeting_records = db.query(MeetingDetailsDB).filter(MeetingDetailsDB.meeting_details.contains({"date_of_meeting": date})).all()
    return meeting_records

@app.get("/meeting-details/conducted-by/{conducted_by}", response_model=List[MeetingDetails], tags=["Meeting Details"])
def read_meeting_details_by_conductor(conducted_by: str, db: Session = Depends(get_db)):
    """
    Retrieve all meeting details conducted by a specific person.
    """
    meeting_records = db.query(MeetingDetailsDB).filter(MeetingDetailsDB.meeting_details.contains({"conducted_by": conducted_by})).all()
    return meeting_records

@app.put("/meeting-details/{meeting_id}", response_model=MeetingDetails, tags=["Meeting Details"])
def update_meeting_details(meeting_id: int, meeting: MeetingDetailsUpdate, db: Session = Depends(get_db)):
    """
    Update an existing meeting details record.
    """
    db_meeting = db.query(MeetingDetailsDB).filter(MeetingDetailsDB.id == meeting_id).first()
    if db_meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting details not found")

    update_data = meeting.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_meeting, key, value)
        
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@app.delete("/meeting-details/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Meeting Details"])
def delete_meeting_details(meeting_id: int, db: Session = Depends(get_db)):
    """
    Delete a meeting details record by its ID.
    """
    db_meeting = db.query(MeetingDetailsDB).filter(MeetingDetailsDB.id == meeting_id).first()
    if db_meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting details not found")
    
    db.delete(db_meeting)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Site Visit Details ---

class VisitedByBase(BaseModel):
    """Schema for person conducting the site visit."""
    name: str = Field(..., example="Arjun Singh")
    designation: str = Field(..., example="Senior Facility Manager")

class SiteVisitDetailsBase(BaseModel):
    """Schema for basic site visit information."""
    s_no: str = Field(..., example="001")
    date_of_visit: str = Field(..., example="2025-08-13")
    site_name: str = Field(..., example="Sunrise Corporate Tower")
    client_name: str = Field(..., example="TechNova Solutions Pvt. Ltd.")
    location: str = Field(..., example="Bengaluru, India")
    visited_by: VisitedByBase
    visit_purpose: str = Field(..., example="Monthly site inspection and compliance audit")
    time_in: str = Field(..., example="10:00")
    time_out: str = Field(..., example="13:00")
    duration_hrs: int = Field(..., example=3)

class ObservationInteractionSummaryBase(BaseModel):
    """Schema for department observations and interactions."""
    department_visited: str = Field(..., example="Security")
    staff_met: str = Field(..., example="Ravi Kumar - Security Supervisor")
    observation_summary: str = Field(..., example="Guards attentive, checkpoint logs updated")
    compliance_with_sop: str = Field(..., example="Yes")
    remarks_issues_found: str = Field(..., example="Main gate lock slightly loose")
    corrective_action_required: str = Field(..., example="Tighten lock within 24 hours")

class ChecklistReviewBase(BaseModel):
    """Schema for checklist review items."""
    checklist_item: str = Field(..., example="Staff Attendance Register Maintained")
    status: str = Field(..., example="Yes")
    remarks: str = Field(..., example="Updated daily")

class PhotosCapturedBase(BaseModel):
    """Schema for photos captured during site visit."""
    location_area: str = Field(..., example="Main Gate")
    photo_description: str = Field(..., example="Security guard on duty at main gate")
    photo_file_link: str = Field(..., example="https://example.com/photos/main_gate_001.jpg")

class FollowUpActionPlanBase(BaseModel):
    """Schema for follow-up action items."""
    issue_observed: str = Field(..., example="Main gate lock loose")
    assigned_to: str = Field(..., example="Ravi Kumar")
    target_completion_date: str = Field(..., example="2025-08-14")
    status_update: str = Field(..., example="Pending")

class FinalCommentsSummaryBase(BaseModel):
    """Schema for final visit summary and feedback."""
    team_observations: str = Field(..., example="Overall site maintenance is satisfactory. Minor maintenance tasks noted.")
    client_feedback: str = Field(..., example="Appreciates proactive reporting and prompt follow-ups.")
    suggestions_recommendations: str = Field(..., example="Consider adding extra lighting in parking area.")

class ReportedByBase(BaseModel):
    """Schema for person reporting the site visit."""
    name: str = Field(..., example="Arjun Singh")
    designation: str = Field(..., example="Senior Facility Manager")
    signature: str = Field(..., example="Signed")
    date: str = Field(..., example="2025-08-13")

class SignOffSiteVisitBase(BaseModel):
    """Schema for site visit sign-off."""
    reported_by: ReportedByBase

class SiteVisitDetailsCreate(BaseModel):
    """Schema for creating site visit details."""
    property_id: str = Field(..., example="PROP-001")
    site_visit_details: SiteVisitDetailsBase
    observation_interaction_summary: List[ObservationInteractionSummaryBase]
    checklist_review: List[ChecklistReviewBase]
    photos_captured: List[PhotosCapturedBase]
    follow_up_action_plan: List[FollowUpActionPlanBase]
    final_comments_summary: FinalCommentsSummaryBase
    sign_off: SignOffSiteVisitBase

class SiteVisitDetailsUpdate(BaseModel):
    """Schema for updating site visit details."""
    property_id: Optional[str] = None
    site_visit_details: Optional[SiteVisitDetailsBase] = None
    observation_interaction_summary: Optional[List[ObservationInteractionSummaryBase]] = None
    checklist_review: Optional[List[ChecklistReviewBase]] = None
    photos_captured: Optional[List[PhotosCapturedBase]] = None
    follow_up_action_plan: Optional[List[FollowUpActionPlanBase]] = None
    final_comments_summary: Optional[FinalCommentsSummaryBase] = None
    sign_off: Optional[SignOffSiteVisitBase] = None

class SiteVisitDetails(SiteVisitDetailsCreate):
    """Schema for reading site visit details from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Site Visit Details ---

class SiteVisitDetailsDB(Base):
    """Database ORM model for the 'site_visit_details' table."""
    __tablename__ = "site_visit_details"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    
    # Store all the nested objects as JSON fields
    site_visit_details = Column(JSON)
    observation_interaction_summary = Column(JSON)
    checklist_review = Column(JSON)
    photos_captured = Column(JSON)
    follow_up_action_plan = Column(JSON)
    final_comments_summary = Column(JSON)
    sign_off = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Site Visit Details ---

@app.post("/site-visit-details/", response_model=SiteVisitDetails, status_code=status.HTTP_201_CREATED, tags=["Site Visit Details"])
def create_site_visit_details(site_visit: SiteVisitDetailsCreate, db: Session = Depends(get_db)):
    """
    Create a new site visit details record.
    """
    site_visit_data = site_visit.dict()
    db_site_visit = SiteVisitDetailsDB(**site_visit_data)
    db.add(db_site_visit)
    db.commit()
    db.refresh(db_site_visit)
    return db_site_visit

@app.get("/site-visit-details/", response_model=List[SiteVisitDetails], tags=["Site Visit Details"])
def read_site_visit_details(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all site visit details with pagination.
    """
    site_visit_records = db.query(SiteVisitDetailsDB).offset(skip).limit(limit).all()
    return site_visit_records

@app.get("/site-visit-details/{site_visit_id}", response_model=SiteVisitDetails, tags=["Site Visit Details"])
def read_site_visit_details_by_id(site_visit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single site visit details record by its ID.
    """
    db_site_visit = db.query(SiteVisitDetailsDB).filter(SiteVisitDetailsDB.id == site_visit_id).first()
    if db_site_visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site visit details not found")
    return db_site_visit

@app.get("/site-visit-details/property/{property_id}", response_model=List[SiteVisitDetails], tags=["Site Visit Details"])
def read_site_visit_details_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all site visit details for a specific property.
    """
    site_visit_records = db.query(SiteVisitDetailsDB).filter(SiteVisitDetailsDB.property_id == property_id).all()
    return site_visit_records

@app.get("/site-visit-details/date/{date}", response_model=List[SiteVisitDetails], tags=["Site Visit Details"])
def read_site_visit_details_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all site visit details for a specific date.
    """
    site_visit_records = db.query(SiteVisitDetailsDB).filter(SiteVisitDetailsDB.site_visit_details.contains({"date_of_visit": date})).all()
    return site_visit_records

@app.get("/site-visit-details/visitor/{visitor_name}", response_model=List[SiteVisitDetails], tags=["Site Visit Details"])
def read_site_visit_details_by_visitor(visitor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all site visit details conducted by a specific visitor.
    """
    site_visit_records = db.query(SiteVisitDetailsDB).filter(SiteVisitDetailsDB.site_visit_details.contains({"visited_by": {"name": visitor_name}})).all()
    return site_visit_records

@app.get("/site-visit-details/department/{department}", response_model=List[SiteVisitDetails], tags=["Site Visit Details"])
def read_site_visit_details_by_department(department: str, db: Session = Depends(get_db)):
    """
    Retrieve all site visit details that include observations for a specific department.
    """
    site_visit_records = db.query(SiteVisitDetailsDB).filter(SiteVisitDetailsDB.observation_interaction_summary.contains([{"department_visited": department}])).all()
    return site_visit_records

@app.put("/site-visit-details/{site_visit_id}", response_model=SiteVisitDetails, tags=["Site Visit Details"])
def update_site_visit_details(site_visit_id: int, site_visit: SiteVisitDetailsUpdate, db: Session = Depends(get_db)):
    """
    Update an existing site visit details record.
    """
    db_site_visit = db.query(SiteVisitDetailsDB).filter(SiteVisitDetailsDB.id == site_visit_id).first()
    if db_site_visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site visit details not found")

    update_data = site_visit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_site_visit, key, value)
        
    db.commit()
    db.refresh(db_site_visit)
    return db_site_visit

@app.delete("/site-visit-details/{site_visit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Site Visit Details"])
def delete_site_visit_details(site_visit_id: int, db: Session = Depends(get_db)):
    """
    Delete a site visit details record by its ID.
    """
    db_site_visit = db.query(SiteVisitDetailsDB).filter(SiteVisitDetailsDB.id == site_visit_id).first()
    if db_site_visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site visit details not found")
    
    db.delete(db_site_visit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Hot Work Permit ---

class HotWorkPermitCreate(BaseModel):
    """Schema for creating hot work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_no: str = Field(..., example="HWP-2025-045")
    date_of_issue: str = Field(..., example="2025-08-13")
    location_of_work: str = Field(..., example="Building A / Floor 3 / Zone C")
    description_of_hot_work: str = Field(..., example="Welding of support beams near HVAC duct")
    person_or_agency_performing_work: str = Field(..., example="SteelFix Contractors Pvt. Ltd.")
    supervisor_or_project_incharge_name: str = Field(..., example="Rajesh Sharma")
    contact_number_worker: str = Field(..., example="+91-9876543210")
    contact_number_supervisor: str = Field(..., example="+91-9123456780")
    start_date_time: str = Field(..., example="2025-08-13T10:00:00")
    end_date_time: str = Field(..., example="2025-08-13T14:30:00")
    fire_watch_personnel_assigned: str = Field(..., example="Yes")
    name_of_fire_watch_personnel: str = Field(..., example="Amit Verma")
    fire_extinguisher_available: str = Field(..., example="Yes")
    type_of_fire_extinguisher_provided: str = Field(..., example="CO2 4.5kg")
    fire_blanket_or_shielding_used: str = Field(..., example="Yes")
    nearby_flammable_materials_removed_or_covered: str = Field(..., example="Yes")
    gas_cylinders_condition_verified: str = Field(..., example="Yes")
    work_area_ventilation_verified: str = Field(..., example="Yes")
    sparks_and_heat_barriers_installed: str = Field(..., example="Yes")
    area_wet_down_if_required: str = Field(..., example="No")
    gas_detector_used: str = Field(..., example="Yes")
    last_gas_test_reading_ppm: int = Field(..., example=12)
    ppe_verified: List[str] = Field(..., example=["Helmet", "Goggles", "Gloves", "Apron", "Shoes"])
    permit_validity_period: str = Field(..., example="2025-08-13T10:00:00 to 2025-08-13T14:30:00")
    emergency_procedure_explained_to_workers: str = Field(..., example="Yes")
    area_inspected_before_work_by: str = Field(..., example="Vikram Singh")
    area_inspected_after_work_by: str = Field(..., example="Pooja Nair")
    work_completed_time: str = Field(..., example="2025-08-13T14:20:00")
    post_work_fire_watch_time: str = Field(..., example="30 minutes")
    final_area_clearance_given_by: str = Field(..., example="Safety Officer - Anil Kumar")
    signature_of_worker: str = Field(..., example="Rajeev Kumar")
    signature_of_fire_watcher: str = Field(..., example="Amit Verma")
    signature_of_safety_officer: str = Field(..., example="Anil Kumar")
    remarks_or_precautions: str = Field(..., example="Ensure all tools are stored safely and conduct one more gas test after 15 minutes.")

class HotWorkPermitUpdate(BaseModel):
    """Schema for updating hot work permit."""
    property_id: Optional[str] = None
    permit_no: Optional[str] = None
    date_of_issue: Optional[str] = None
    location_of_work: Optional[str] = None
    description_of_hot_work: Optional[str] = None
    person_or_agency_performing_work: Optional[str] = None
    supervisor_or_project_incharge_name: Optional[str] = None
    contact_number_worker: Optional[str] = None
    contact_number_supervisor: Optional[str] = None
    start_date_time: Optional[str] = None
    end_date_time: Optional[str] = None
    fire_watch_personnel_assigned: Optional[str] = None
    name_of_fire_watch_personnel: Optional[str] = None
    fire_extinguisher_available: Optional[str] = None
    type_of_fire_extinguisher_provided: Optional[str] = None
    fire_blanket_or_shielding_used: Optional[str] = None
    nearby_flammable_materials_removed_or_covered: Optional[str] = None
    gas_cylinders_condition_verified: Optional[str] = None
    work_area_ventilation_verified: Optional[str] = None
    sparks_and_heat_barriers_installed: Optional[str] = None
    area_wet_down_if_required: Optional[str] = None
    gas_detector_used: Optional[str] = None
    last_gas_test_reading_ppm: Optional[int] = None
    ppe_verified: Optional[List[str]] = None
    permit_validity_period: Optional[str] = None
    emergency_procedure_explained_to_workers: Optional[str] = None
    area_inspected_before_work_by: Optional[str] = None
    area_inspected_after_work_by: Optional[str] = None
    work_completed_time: Optional[str] = None
    post_work_fire_watch_time: Optional[str] = None
    final_area_clearance_given_by: Optional[str] = None
    signature_of_worker: Optional[str] = None
    signature_of_fire_watcher: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    remarks_or_precautions: Optional[str] = None

class HotWorkPermit(HotWorkPermitCreate):
    """Schema for reading hot work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Hot Work Permit ---

class HotWorkPermitDB(Base):
    """Database ORM model for the 'hot_work_permit' table."""
    __tablename__ = "hot_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_no = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    location_of_work = Column(String)
    description_of_hot_work = Column(Text)
    person_or_agency_performing_work = Column(String)
    supervisor_or_project_incharge_name = Column(String)
    contact_number_worker = Column(String)
    contact_number_supervisor = Column(String)
    start_date_time = Column(String, index=True)
    end_date_time = Column(String, index=True)
    fire_watch_personnel_assigned = Column(String)
    name_of_fire_watch_personnel = Column(String)
    fire_extinguisher_available = Column(String)
    type_of_fire_extinguisher_provided = Column(String)
    fire_blanket_or_shielding_used = Column(String)
    nearby_flammable_materials_removed_or_covered = Column(String)
    gas_cylinders_condition_verified = Column(String)
    work_area_ventilation_verified = Column(String)
    sparks_and_heat_barriers_installed = Column(String)
    area_wet_down_if_required = Column(String)
    gas_detector_used = Column(String)
    last_gas_test_reading_ppm = Column(Integer)
    ppe_verified = Column(JSON)
    permit_validity_period = Column(String)
    emergency_procedure_explained_to_workers = Column(String)
    area_inspected_before_work_by = Column(String)
    area_inspected_after_work_by = Column(String)
    work_completed_time = Column(String)
    post_work_fire_watch_time = Column(String)
    final_area_clearance_given_by = Column(String)
    signature_of_worker = Column(String)
    signature_of_fire_watcher = Column(String)
    signature_of_safety_officer = Column(String)
    remarks_or_precautions = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Hot Work Permit ---

@app.post("/hot-work-permit/", response_model=HotWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Hot Work Permit"])
def create_hot_work_permit(permit: HotWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new hot work permit record.
    """
    permit_data = permit.dict()
    db_permit = HotWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/hot-work-permit/", response_model=List[HotWorkPermit], tags=["Hot Work Permit"])
def read_hot_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all hot work permits with pagination.
    """
    permit_records = db.query(HotWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/hot-work-permit/{permit_id}", response_model=HotWorkPermit, tags=["Hot Work Permit"])
def read_hot_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single hot work permit record by its ID.
    """
    db_permit = db.query(HotWorkPermitDB).filter(HotWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hot work permit not found")
    return db_permit

@app.get("/hot-work-permit/permit/{permit_no}", response_model=HotWorkPermit, tags=["Hot Work Permit"])
def read_hot_work_permit_by_permit_no(permit_no: str, db: Session = Depends(get_db)):
    """
    Retrieve a hot work permit by its permit number.
    """
    db_permit = db.query(HotWorkPermitDB).filter(HotWorkPermitDB.permit_no == permit_no).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hot work permit not found")
    return db_permit

@app.get("/hot-work-permit/property/{property_id}", response_model=List[HotWorkPermit], tags=["Hot Work Permit"])
def read_hot_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all hot work permits for a specific property.
    """
    permit_records = db.query(HotWorkPermitDB).filter(HotWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/hot-work-permit/date/{date}", response_model=List[HotWorkPermit], tags=["Hot Work Permit"])
def read_hot_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all hot work permits for a specific date.
    """
    permit_records = db.query(HotWorkPermitDB).filter(HotWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/hot-work-permit/status/active", response_model=List[HotWorkPermit], tags=["Hot Work Permit"])
def read_active_hot_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active hot work permits (current date within validity period).
    """
    from datetime import datetime
    current_date = datetime.now().strftime("%Y-%m-%d")
    permit_records = db.query(HotWorkPermitDB).filter(HotWorkPermitDB.date_of_issue == current_date).all()
    return permit_records

@app.get("/hot-work-permit/contractor/{contractor_name}", response_model=List[HotWorkPermit], tags=["Hot Work Permit"])
def read_hot_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all hot work permits for a specific contractor.
    """
    permit_records = db.query(HotWorkPermitDB).filter(HotWorkPermitDB.person_or_agency_performing_work.contains(contractor_name)).all()
    return permit_records

@app.put("/hot-work-permit/{permit_id}", response_model=HotWorkPermit, tags=["Hot Work Permit"])
def update_hot_work_permit(permit_id: int, permit: HotWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing hot work permit record.
    """
    db_permit = db.query(HotWorkPermitDB).filter(HotWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hot work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/hot-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Hot Work Permit"])
def delete_hot_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a hot work permit record by its ID.
    """
    db_permit = db.query(HotWorkPermitDB).filter(HotWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hot work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Cold Work Permit ---

class ColdWorkPermitCreate(BaseModel):
    """Schema for creating cold work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="CWP-2025-019")
    date_of_issue: str = Field(..., example="2025-08-13")
    valid_from: str = Field(..., example="2025-08-13T09:00:00")
    valid_to: str = Field(..., example="2025-08-13T18:00:00")
    site_location_of_work: str = Field(..., example="Building B / Maintenance Wing")
    floor_zone_area_details: str = Field(..., example="Floor 2 / Zone D / Corridor Section")
    description_of_work: str = Field(..., example="Painting and minor wall repair")
    nature_of_tools_used: List[str] = Field(..., example=["Paint rollers", "Ladders", "Scrapers"])
    person_or_agency_performing_work: str = Field(..., example="BrightCoat Painters Pvt. Ltd.")
    number_of_workers_assigned: int = Field(..., example=4)
    contact_details_of_contractor: str = Field(..., example="+91-9876543211")
    work_supervisor_name: str = Field(..., example="Sunil Mehta")
    supervisor_contact_number: str = Field(..., example="+91-9123456782")
    type_of_safety_gear_required: List[str] = Field(..., example=["Helmet", "Shoes", "Gloves", "Safety Goggles"])
    safety_instructions_explained_to_team: str = Field(..., example="Yes")
    risk_assessment_attached: str = Field(..., example="Yes")
    msds_required: str = Field(..., example="No")
    work_area_inspected_before_start: str = Field(..., example="Yes")
    nearby_sensitive_equipment_covered_or_protected: str = Field(..., example="Yes")
    floor_corridor_wall_protection_arranged: str = Field(..., example="Yes")
    emergency_exit_access_ensured: str = Field(..., example="Yes")
    fire_safety_equipment_nearby: str = Field(..., example="Yes")
    waste_disposal_method: str = Field(..., example="Contractor")
    permit_approved_by: str = Field(..., example="Facility Officer - Ramesh Iyer")
    date_time_of_approval: str = Field(..., example="2025-08-13T08:45:00")
    security_team_notified: str = Field(..., example="Yes")
    post_work_area_inspection_done_by: str = Field(..., example="Facility Supervisor - Manish Gupta")
    final_clearance_given: str = Field(..., example="Yes")
    signature_of_contractor: str = Field(..., example="Arvind Kumar")
    signature_of_approving_officer: str = Field(..., example="Ramesh Iyer")
    remarks_or_precautions: str = Field(..., example="Ensure proper ventilation during painting and store leftover materials securely.")

class ColdWorkPermitUpdate(BaseModel):
    """Schema for updating cold work permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    site_location_of_work: Optional[str] = None
    floor_zone_area_details: Optional[str] = None
    description_of_work: Optional[str] = None
    nature_of_tools_used: Optional[List[str]] = None
    person_or_agency_performing_work: Optional[str] = None
    number_of_workers_assigned: Optional[int] = None
    contact_details_of_contractor: Optional[str] = None
    work_supervisor_name: Optional[str] = None
    supervisor_contact_number: Optional[str] = None
    type_of_safety_gear_required: Optional[List[str]] = None
    safety_instructions_explained_to_team: Optional[str] = None
    risk_assessment_attached: Optional[str] = None
    msds_required: Optional[str] = None
    work_area_inspected_before_start: Optional[str] = None
    nearby_sensitive_equipment_covered_or_protected: Optional[str] = None
    floor_corridor_wall_protection_arranged: Optional[str] = None
    emergency_exit_access_ensured: Optional[str] = None
    fire_safety_equipment_nearby: Optional[str] = None
    waste_disposal_method: Optional[str] = None
    permit_approved_by: Optional[str] = None
    date_time_of_approval: Optional[str] = None
    security_team_notified: Optional[str] = None
    post_work_area_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    signature_of_approving_officer: Optional[str] = None
    remarks_or_precautions: Optional[str] = None

class ColdWorkPermit(ColdWorkPermitCreate):
    """Schema for reading cold work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Cold Work Permit ---

class ColdWorkPermitDB(Base):
    """Database ORM model for the 'cold_work_permit' table."""
    __tablename__ = "cold_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    valid_from = Column(String, index=True)
    valid_to = Column(String, index=True)
    site_location_of_work = Column(String)
    floor_zone_area_details = Column(String)
    description_of_work = Column(Text)
    nature_of_tools_used = Column(JSON)
    person_or_agency_performing_work = Column(String)
    number_of_workers_assigned = Column(Integer)
    contact_details_of_contractor = Column(String)
    work_supervisor_name = Column(String)
    supervisor_contact_number = Column(String)
    type_of_safety_gear_required = Column(JSON)
    safety_instructions_explained_to_team = Column(String)
    risk_assessment_attached = Column(String)
    msds_required = Column(String)
    work_area_inspected_before_start = Column(String)
    nearby_sensitive_equipment_covered_or_protected = Column(String)
    floor_corridor_wall_protection_arranged = Column(String)
    emergency_exit_access_ensured = Column(String)
    fire_safety_equipment_nearby = Column(String)
    waste_disposal_method = Column(String)
    permit_approved_by = Column(String)
    date_time_of_approval = Column(String)
    security_team_notified = Column(String)
    post_work_area_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    signature_of_contractor = Column(String)
    signature_of_approving_officer = Column(String)
    remarks_or_precautions = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Cold Work Permit ---

@app.post("/cold-work-permit/", response_model=ColdWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Cold Work Permit"])
def create_cold_work_permit(permit: ColdWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new cold work permit record.
    """
    permit_data = permit.dict()
    db_permit = ColdWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/cold-work-permit/", response_model=List[ColdWorkPermit], tags=["Cold Work Permit"])
def read_cold_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all cold work permits with pagination.
    """
    permit_records = db.query(ColdWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/cold-work-permit/{permit_id}", response_model=ColdWorkPermit, tags=["Cold Work Permit"])
def read_cold_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single cold work permit record by its ID.
    """
    db_permit = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cold work permit not found")
    return db_permit

@app.get("/cold-work-permit/permit/{permit_number}", response_model=ColdWorkPermit, tags=["Cold Work Permit"])
def read_cold_work_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a cold work permit by its permit number.
    """
    db_permit = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cold work permit not found")
    return db_permit

@app.get("/cold-work-permit/property/{property_id}", response_model=List[ColdWorkPermit], tags=["Cold Work Permit"])
def read_cold_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all cold work permits for a specific property.
    """
    permit_records = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/cold-work-permit/date/{date}", response_model=List[ColdWorkPermit], tags=["Cold Work Permit"])
def read_cold_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all cold work permits for a specific date.
    """
    permit_records = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/cold-work-permit/status/active", response_model=List[ColdWorkPermit], tags=["Cold Work Permit"])
def read_active_cold_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active cold work permits (current date within validity period).
    """
    from datetime import datetime
    current_date = datetime.now().strftime("%Y-%m-%d")
    permit_records = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.date_of_issue == current_date).all()
    return permit_records

@app.get("/cold-work-permit/contractor/{contractor_name}", response_model=List[ColdWorkPermit], tags=["Cold Work Permit"])
def read_cold_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all cold work permits for a specific contractor.
    """
    permit_records = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.person_or_agency_performing_work.contains(contractor_name)).all()
    return permit_records

@app.get("/cold-work-permit/location/{location}", response_model=List[ColdWorkPermit], tags=["Cold Work Permit"])
def read_cold_work_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all cold work permits for a specific work location.
    """
    permit_records = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.site_location_of_work.contains(location)).all()
    return permit_records

@app.get("/cold-work-permit/validity/current", response_model=List[ColdWorkPermit], tags=["Cold Work Permit"])
def read_currently_valid_cold_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all currently valid cold work permits (current time within valid_from and valid_to).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(ColdWorkPermitDB).filter(
        ColdWorkPermitDB.valid_from <= current_time,
        ColdWorkPermitDB.valid_to >= current_time
    ).all()
    return permit_records

@app.put("/cold-work-permit/{permit_id}", response_model=ColdWorkPermit, tags=["Cold Work Permit"])
def update_cold_work_permit(permit_id: int, permit: ColdWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing cold work permit record.
    """
    db_permit = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cold work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/cold-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Cold Work Permit"])
def delete_cold_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a cold work permit record by its ID.
    """
    db_permit = db.query(ColdWorkPermitDB).filter(ColdWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cold work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Electrical Work Permit ---

class ElectricalWorkPermitCreate(BaseModel):
    """Schema for creating electrical work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="EWP-2025-032")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-13T10:00:00")
    permit_valid_to: str = Field(..., example="2025-08-13T15:00:00")
    work_location: str = Field(..., example="Building C / Floor 1 / Zone B")
    nature_of_work: str = Field(..., example="Maintenance")
    equipment_panel_area_to_be_worked_on: str = Field(..., example="Main Distribution Panel - MDP-01")
    voltage_level: str = Field(..., example="High")
    description_of_electrical_task: str = Field(..., example="Inspection and replacement of faulty circuit breakers")
    contractor_agency_name: str = Field(..., example="PowerSafe Electrical Services")
    name_of_electrician_or_technician: str = Field(..., example="Prakash Yadav")
    electrician_contact_number: str = Field(..., example="+91-9812345678")
    supervisor_name: str = Field(..., example="Deepak Sharma")
    supervisor_contact_number: str = Field(..., example="+91-9123456789")
    number_of_persons_involved: int = Field(..., example=3)
    work_isolate_point_identified: str = Field(..., example="Yes")
    lockout_tagout_applied: str = Field(..., example="Yes")
    isolation_verified: str = Field(..., example="Yes")
    earthing_discharge_done: str = Field(..., example="Yes")
    ppe_checked: List[str] = Field(..., example=["Insulated Gloves", "Safety Shoes", "Insulated Tools", "Face Shield"])
    multimeter_or_electrical_tester_available: str = Field(..., example="Yes")
    danger_board_displayed: str = Field(..., example="Yes")
    safety_barricading_done: str = Field(..., example="Yes")
    emergency_contact_details_available: str = Field(..., example="Yes")
    work_authorized_by: str = Field(..., example="Chief Engineer - Manoj Kumar")
    signature_of_contractor: str = Field(..., example="Prakash Yadav")
    signature_of_supervisor: str = Field(..., example="Deepak Sharma")
    signature_of_safety_officer: str = Field(..., example="Manoj Kumar")
    post_work_area_inspection_by: str = Field(..., example="Safety Officer - Manoj Kumar")
    power_restored_on: str = Field(..., example="2025-08-13T14:45:00")
    final_clearance_given_by: str = Field(..., example="Manoj Kumar")
    remarks_or_safety_observations: str = Field(..., example="All replaced breakers tested successfully. Ensure next preventive maintenance is logged for December 2025.")

class ElectricalWorkPermitUpdate(BaseModel):
    """Schema for updating electrical work permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    work_location: Optional[str] = None
    nature_of_work: Optional[str] = None
    equipment_panel_area_to_be_worked_on: Optional[str] = None
    voltage_level: Optional[str] = None
    description_of_electrical_task: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    name_of_electrician_or_technician: Optional[str] = None
    electrician_contact_number: Optional[str] = None
    supervisor_name: Optional[str] = None
    supervisor_contact_number: Optional[str] = None
    number_of_persons_involved: Optional[int] = None
    work_isolate_point_identified: Optional[str] = None
    lockout_tagout_applied: Optional[str] = None
    isolation_verified: Optional[str] = None
    earthing_discharge_done: Optional[str] = None
    ppe_checked: Optional[List[str]] = None
    multimeter_or_electrical_tester_available: Optional[str] = None
    danger_board_displayed: Optional[str] = None
    safety_barricading_done: Optional[str] = None
    emergency_contact_details_available: Optional[str] = None
    work_authorized_by: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    post_work_area_inspection_by: Optional[str] = None
    power_restored_on: Optional[str] = None
    final_clearance_given_by: Optional[str] = None
    remarks_or_safety_observations: Optional[str] = None

class ElectricalWorkPermit(ElectricalWorkPermitCreate):
    """Schema for reading electrical work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Electrical Work Permit ---

class ElectricalWorkPermitDB(Base):
    """Database ORM model for the 'electrical_work_permit' table."""
    __tablename__ = "electrical_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    work_location = Column(String)
    nature_of_work = Column(String)
    equipment_panel_area_to_be_worked_on = Column(String)
    voltage_level = Column(String)
    description_of_electrical_task = Column(Text)
    contractor_agency_name = Column(String)
    name_of_electrician_or_technician = Column(String)
    electrician_contact_number = Column(String)
    supervisor_name = Column(String)
    supervisor_contact_number = Column(String)
    number_of_persons_involved = Column(Integer)
    work_isolate_point_identified = Column(String)
    lockout_tagout_applied = Column(String)
    isolation_verified = Column(String)
    earthing_discharge_done = Column(String)
    ppe_checked = Column(JSON)
    multimeter_or_electrical_tester_available = Column(String)
    danger_board_displayed = Column(String)
    safety_barricading_done = Column(String)
    emergency_contact_details_available = Column(String)
    work_authorized_by = Column(String)
    signature_of_contractor = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    post_work_area_inspection_by = Column(String)
    power_restored_on = Column(String)
    final_clearance_given_by = Column(String)
    remarks_or_safety_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Electrical Work Permit ---

@app.post("/electrical-work-permit/", response_model=ElectricalWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Electrical Work Permit"])
def create_electrical_work_permit(permit: ElectricalWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new electrical work permit record.
    """
    permit_data = permit.dict()
    db_permit = ElectricalWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/electrical-work-permit/", response_model=List[ElectricalWorkPermit], tags=["Electrical Work Permit"])
def read_electrical_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all electrical work permits with pagination.
    """
    permit_records = db.query(ElectricalWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/electrical-work-permit/{permit_id}", response_model=ElectricalWorkPermit, tags=["Electrical Work Permit"])
def read_electrical_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single electrical work permit record by its ID.
    """
    db_permit = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Electrical work permit not found")
    return db_permit

@app.get("/electrical-work-permit/permit/{permit_number}", response_model=ElectricalWorkPermit, tags=["Electrical Work Permit"])
def read_electrical_work_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve an electrical work permit by its permit number.
    """
    db_permit = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Electrical work permit not found")
    return db_permit

@app.get("/electrical-work-permit/property/{property_id}", response_model=List[ElectricalWorkPermit], tags=["Electrical Work Permit"])
def read_electrical_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all electrical work permits for a specific property.
    """
    permit_records = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/electrical-work-permit/date/{date}", response_model=List[ElectricalWorkPermit], tags=["Electrical Work Permit"])
def read_electrical_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all electrical work permits for a specific date.
    """
    permit_records = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/electrical-work-permit/status/active", response_model=List[ElectricalWorkPermit], tags=["Electrical Work Permit"])
def read_active_electrical_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active electrical work permits (current date within validity period).
    """
    from datetime import datetime
    current_date = datetime.now().strftime("%Y-%m-%d")
    permit_records = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.date_of_issue == current_date).all()
    return permit_records

@app.get("/electrical-work-permit/contractor/{contractor_name}", response_model=List[ElectricalWorkPermit], tags=["Electrical Work Permit"])
def read_electrical_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all electrical work permits for a specific contractor.
    """
    permit_records = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/electrical-work-permit/voltage/{voltage_level}", response_model=List[ElectricalWorkPermit], tags=["Electrical Work Permit"])
def read_electrical_work_permit_by_voltage(voltage_level: str, db: Session = Depends(get_db)):
    """
    Retrieve all electrical work permits for a specific voltage level.
    """
    permit_records = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.voltage_level == voltage_level).all()
    return permit_records

@app.get("/electrical-work-permit/equipment/{equipment_panel}", response_model=List[ElectricalWorkPermit], tags=["Electrical Work Permit"])
def read_electrical_work_permit_by_equipment(equipment_panel: str, db: Session = Depends(get_db)):
    """
    Retrieve all electrical work permits for a specific equipment or panel area.
    """
    permit_records = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.equipment_panel_area_to_be_worked_on.contains(equipment_panel)).all()
    return permit_records

@app.get("/electrical-work-permit/validity/current", response_model=List[ElectricalWorkPermit], tags=["Electrical Work Permit"])
def read_currently_valid_electrical_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all currently valid electrical work permits (current time within valid_from and valid_to).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(ElectricalWorkPermitDB).filter(
        ElectricalWorkPermitDB.permit_valid_from <= current_time,
        ElectricalWorkPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.put("/electrical-work-permit/{permit_id}", response_model=ElectricalWorkPermit, tags=["Electrical Work Permit"])
def update_electrical_work_permit(permit_id: int, permit: ElectricalWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing electrical work permit record.
    """
    db_permit = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Electrical work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/electrical-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Electrical Work Permit"])
def delete_electrical_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete an electrical work permit record by its ID.
    """
    db_permit = db.query(ElectricalWorkPermitDB).filter(ElectricalWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Electrical work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# from datetime import datetime
# from typing import List

# # --- Pydantic Schemas (Data Validation Models) ---
# # We create a model for each nested object in the JSON.

# class VisitedBy(BaseModel):
#     name: str = Field(..., example="Ravi Kumar")
#     designation: str = Field(..., example="Senior Facility Manager")

# class VisitDetails(BaseModel):
#     serial_no: str = Field(..., example="001")
#     date_of_visit: str = Field(..., example="2025-08-13")
#     site_name: str = Field(..., example="Tech Park Tower A")
#     client_name: str = Field(..., example="ABC Corp Ltd.")
#     location: str = Field(..., example="Bengaluru, India")
#     visited_by: VisitedBy
#     visit_purpose: str = Field(..., example="Monthly Compliance Check")
#     time_in: str = Field(..., example="10:00 AM")
#     time_out: str = Field(..., example="1:30 PM")
#     duration_hours: str = Field(..., example="3.5")

# class ObservationItem(BaseModel):
#     department: str = Field(..., example="Security")
#     staff_met: str = Field(..., example="Ajay Sharma")
#     observation_summary: str = Field(..., example="Security guards were attentive...")
#     compliance_with_SOP: str = Field(..., example="Yes")
#     remarks: str
#     corrective_action_required: str

# class ChecklistItem(BaseModel):
#     item: str = Field(..., example="Staff Attendance Register Maintained")
#     status: str = Field(..., example="Yes")
#     remarks: str

# class PhotoItem(BaseModel):
#     location_area: str = Field(..., example="Main Lobby")
#     photo_description: str = Field(..., example="Clean lobby with reception desk")
#     photo_file_link: str = Field(..., example="https://example.com/photos/lobby.jpg")

# class ActionPlanItem(BaseModel):
#     issue_observed: str = Field(..., example="Washroom basin leakage")
#     assigned_to: str = Field(..., example="Rahul Singh - Maintenance")
#     target_completion_date: str = Field(..., example="2025-08-13")
#     status_update: str = Field(..., example="Pending")

# class FinalComments(BaseModel):
#     team_observations: str
#     client_feedback: str
#     suggestions_recommendations: str

# class ReportedBy(BaseModel):
#     name: str = Field(..., example="Ravi Kumar")
#     designation: str = Field(..., example="Senior Facility Manager")

# class SignOff(BaseModel):
#     reported_by: ReportedBy
#     signature: str = Field(..., example="Ravi_K_Signature.png")
#     date: str = Field(..., example="2025-08-13")

# class SiteVisitReportContent(BaseModel):
#     """The main nested object containing all report details."""
#     visit_details: VisitDetails
#     observation_interaction_summary: List[ObservationItem]
#     checklist_review: List[ChecklistItem]
#     photos: List[PhotoItem]
#     follow_up_action_plan: List[ActionPlanItem]
#     final_comments_summary: FinalComments
#     sign_off: SignOff

# class ReportBase(BaseModel):
#     """The root model for creating a report (INPUT)."""
#     property_id: str = Field(..., example="PROP-999")
#     site_visit_report: SiteVisitReportContent

# class ReportCreate(ReportBase):
#     pass

# class ReportUpdate(ReportBase):
#     pass

# class Report(ReportBase):
#     """The model for reading a report from the DB (OUTPUT)."""
#     id: int
#     created_at: datetime
#     updated_at: datetime

#     class Config:
#         orm_mode = True

# # --- SQLAlchemy Model (Database Table) ---

# class VisitReportDB(Base):
#     __tablename__ = "simple_visit_reports"

#     id = Column(Integer, primary_key=True, index=True)
#     property_id = Column(String, index=True)
    
#     # Store the complex, nested site_visit_report object as a single JSON field
#     site_visit_report = Column(JSON)
    
#     created_at = Column(DateTime, default=datetime.now)
#     updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

# # Create the database table
# Base.metadata.create_all(bind=engine)



# # --- API Endpoints ---

# @app.post("/simple-visit-reports/", response_model=Report, status_code=status.HTTP_201_CREATED, tags=["Simple Visit Reports"])
# def create_visit_report(report: ReportCreate, db: Session = Depends(get_db)):
#     """
#     Create a new Site Visit Report.
#     """
#     # Pydantic's .dict() method is perfect for converting the nested model to a JSON-compatible dict
#     report_data = report.dict()
#     db_report = VisitReportDB(**report_data)
#     db.add(db_report)
#     db.commit()
#     db.refresh(db_report)
#     return db_report

# @app.get("/simple-visit-reports/", response_model=List[Report], tags=["Simple Visit Reports"])
# def read_visit_reports(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
#     """
#     Retrieve all Site Visit Reports with pagination.
#     """
#     reports = db.query(VisitReportDB).offset(skip).limit(limit).all()
#     return reports

# @app.get("/simple-visit-reports/{report_id}", response_model=Report, tags=["Simple Visit Reports"])
# def read_visit_report_by_id(report_id: int, db: Session = Depends(get_db)):
#     """
#     Retrieve a single Site Visit Report by its ID.
#     """
#     db_report = db.query(VisitReportDB).filter(VisitReportDB.id == report_id).first()
#     if db_report is None:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
#     return db_report

# @app.put("/simple-visit-reports/{report_id}", response_model=Report, tags=["Simple Visit Reports"])
# def update_visit_report(report_id: int, report: ReportUpdate, db: Session = Depends(get_db)):
#     """
#     Update an existing Site Visit Report.
#     """
#     db_report = db.query(VisitReportDB).filter(VisitReportDB.id == report_id).first()
#     if db_report is None:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

#     update_data = report.dict(exclude_unset=True)
#     for key, value in update_data.items():
#         setattr(db_report, key, value)
        
#     db.commit()
#     db.refresh(db_report)
#     return db_report

# @app.delete("/simple-visit-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Simple Visit Reports"])
# def delete_visit_report(report_id: int, db: Session = Depends(get_db)):
#     """
#     Delete a Site Visit Report by its ID.
#     """
#     db_report = db.query(VisitReportDB).filter(VisitReportDB.id == report_id).first()
#     if db_report is None:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
#     db.delete(db_report)
#     db.commit()
#     return {"ok": True}

# --- Pydantic Schemas for Height Work Permit ---

class HeightWorkPermitCreate(BaseModel):
    """Schema for creating height work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="HWP-2025-014")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-13T08:30:00")
    permit_valid_to: str = Field(..., example="2025-08-13T16:30:00")
    site_location_of_work: str = Field(..., example="Building D / Exterior Facade")
    exact_height_of_work_meters: int = Field(..., example=18)
    description_of_task: str = Field(..., example="Glass facade cleaning and minor sealant repair")
    contractor_agency_name: str = Field(..., example="SkyReach Maintenance Services")
    worker_names_involved: List[str] = Field(..., example=["Ravi Singh", "Mohit Kumar", "Arun Verma"])
    contact_details_contractor: str = Field(..., example="+91-9876543215")
    contact_details_supervisor: str = Field(..., example="+91-9123456784")
    supervisor_name_on_site: str = Field(..., example="Sanjay Mehta")
    number_of_persons_working_at_height: int = Field(..., example=3)
    scaffolding_or_ladder_type_used: str = Field(..., example="Suspended Platform (Gondola)")
    scaffolding_certified_and_tagged: str = Field(..., example="Yes")
    full_body_harness_worn: str = Field(..., example="Yes")
    harness_lanyard_double_hooked: str = Field(..., example="Yes")
    lifeline_or_anchorage_provided: str = Field(..., example="Yes")
    safety_helmet_and_non_slip_shoes: str = Field(..., example="Yes")
    work_platform_with_guardrails_provided: str = Field(..., example="Yes")
    tools_secured_to_prevent_falling: str = Field(..., example="Yes")
    fall_protection_equipment_checked_before_use: str = Field(..., example="Yes")
    emergency_plan_in_place: str = Field(..., example="Yes")
    first_aid_kit_available_onsite: str = Field(..., example="Yes")
    weather_conditions_verified: str = Field(..., example="Yes")
    area_barricaded_below: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Safety Officer - Ajay Sharma")
    pre_work_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Sanjay Mehta")
    signature_of_safety_officer: str = Field(..., example="Ajay Sharma")
    signature_of_contractor: str = Field(..., example="Vikram Malhotra")
    work_completion_time: str = Field(..., example="2025-08-13T16:10:00")
    post_work_inspection_done_by: str = Field(..., example="Ajay Sharma")
    final_clearance_given: str = Field(..., example="Yes")
    remarks_or_observations: str = Field(..., example="All fall protection measures were in place. No incidents reported.")

class HeightWorkPermitUpdate(BaseModel):
    """Schema for updating height work permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    site_location_of_work: Optional[str] = None
    exact_height_of_work_meters: Optional[int] = None
    description_of_task: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    worker_names_involved: Optional[List[str]] = None
    contact_details_contractor: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    number_of_persons_working_at_height: Optional[int] = None
    scaffolding_or_ladder_type_used: Optional[str] = None
    scaffolding_certified_and_tagged: Optional[str] = None
    full_body_harness_worn: Optional[str] = None
    harness_lanyard_double_hooked: Optional[str] = None
    lifeline_or_anchorage_provided: Optional[str] = None
    safety_helmet_and_non_slip_shoes: Optional[str] = None
    work_platform_with_guardrails_provided: Optional[str] = None
    tools_secured_to_prevent_falling: Optional[str] = None
    fall_protection_equipment_checked_before_use: Optional[str] = None
    emergency_plan_in_place: Optional[str] = None
    first_aid_kit_available_onsite: Optional[str] = None
    weather_conditions_verified: Optional[str] = None
    area_barricaded_below: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_work_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    work_completion_time: Optional[str] = None
    post_work_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class HeightWorkPermit(HeightWorkPermitCreate):
    """Schema for reading height work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Height Work Permit ---

class HeightWorkPermitDB(Base):
    """Database ORM model for the 'height_work_permit' table."""
    __tablename__ = "height_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    site_location_of_work = Column(String)
    exact_height_of_work_meters = Column(Integer)
    description_of_task = Column(Text)
    contractor_agency_name = Column(String)
    worker_names_involved = Column(JSON)
    contact_details_contractor = Column(String)
    contact_details_supervisor = Column(String)
    supervisor_name_on_site = Column(String)
    number_of_persons_working_at_height = Column(Integer)
    scaffolding_or_ladder_type_used = Column(String)
    scaffolding_certified_and_tagged = Column(String)
    full_body_harness_worn = Column(String)
    harness_lanyard_double_hooked = Column(String)
    lifeline_or_anchorage_provided = Column(String)
    safety_helmet_and_non_slip_shoes = Column(String)
    work_platform_with_guardrails_provided = Column(String)
    tools_secured_to_prevent_falling = Column(String)
    fall_protection_equipment_checked_before_use = Column(String)
    emergency_plan_in_place = Column(String)
    first_aid_kit_available_onsite = Column(String)
    weather_conditions_verified = Column(String)
    area_barricaded_below = Column(String)
    work_authorization_by = Column(String)
    pre_work_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    signature_of_contractor = Column(String)
    work_completion_time = Column(String)
    post_work_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Height Work Permit ---

@app.post("/height-work-permit/", response_model=HeightWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Height Work Permit"])
def create_height_work_permit(permit: HeightWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new height work permit record.
    """
    permit_data = permit.dict()
    db_permit = HeightWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/height-work-permit/", response_model=List[HeightWorkPermit], tags=["Height Work Permit"])
def read_height_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all height work permits with pagination.
    """
    permit_records = db.query(HeightWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/height-work-permit/{permit_id}", response_model=HeightWorkPermit, tags=["Height Work Permit"])
def read_height_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single height work permit record by its ID.
    """
    db_permit = db.query(HeightWorkPermitDB).filter(HeightWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Height work permit not found")
    return db_permit

@app.get("/height-work-permit/permit/{permit_number}", response_model=HeightWorkPermit, tags=["Height Work Permit"])
def read_height_work_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a height work permit by its permit number.
    """
    db_permit = db.query(HeightWorkPermitDB).filter(HeightWorkPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Height work permit not found")
    return db_permit

@app.get("/height-work-permit/property/{property_id}", response_model=List[HeightWorkPermit], tags=["Height Work Permit"])
def read_height_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all height work permits for a specific property.
    """
    permit_records = db.query(HeightWorkPermitDB).filter(HeightWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/height-work-permit/date/{date}", response_model=List[HeightWorkPermit], tags=["Height Work Permit"])
def read_height_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all height work permits for a specific date.
    """
    permit_records = db.query(HeightWorkPermitDB).filter(HeightWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/height-work-permit/contractor/{contractor_name}", response_model=List[HeightWorkPermit], tags=["Height Work Permit"])
def read_height_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all height work permits for a specific contractor.
    """
    permit_records = db.query(HeightWorkPermitDB).filter(HeightWorkPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/height-work-permit/validity/current", response_model=List[HeightWorkPermit], tags=["Height Work Permit"])
def read_currently_valid_height_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all currently valid height work permits (current time within valid_from and valid_to).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(HeightWorkPermitDB).filter(
        HeightWorkPermitDB.permit_valid_from <= current_time,
        HeightWorkPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/height-work-permit/height/min/{min_height}", response_model=List[HeightWorkPermit], tags=["Height Work Permit"])
def read_height_work_permit_by_min_height(min_height: int, db: Session = Depends(get_db)):
    """
    Retrieve all height work permits where exact height is greater than or equal to min_height.
    """
    permit_records = db.query(HeightWorkPermitDB).filter(HeightWorkPermitDB.exact_height_of_work_meters >= min_height).all()
    return permit_records

@app.put("/height-work-permit/{permit_id}", response_model=HeightWorkPermit, tags=["Height Work Permit"])
def update_height_work_permit(permit_id: int, permit: HeightWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing height work permit record.
    """
    db_permit = db.query(HeightWorkPermitDB).filter(HeightWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Height work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/height-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Height Work Permit"])
def delete_height_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a height work permit record by its ID.
    """
    db_permit = db.query(HeightWorkPermitDB).filter(HeightWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Height work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Confined Space Work Permit ---

class GasTestConductedByBase(BaseModel):
    """Schema for gas test conductor details."""
    name: str = Field(..., example="Sandeep Kumar")
    designation: str = Field(..., example="Safety Engineer")

class PermitIssuedByBase(BaseModel):
    """Schema for permit issuer details."""
    name: str = Field(..., example="Ravi Kapoor")
    designation: str = Field(..., example="Plant Manager")

class AuthorizedByBase(BaseModel):
    """Schema for authorization details."""
    name: str = Field(..., example="Ajay Sharma")
    designation: str = Field(..., example="Safety Officer")

class ConfinedSpaceWorkPermitCreate(BaseModel):
    """Schema for creating confined space work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="CSWP-2025-007")
    date_of_issue: str = Field(..., example="2025-08-13")
    site_location_of_confined_space: str = Field(..., example="Water Treatment Plant / Basement Section")
    specific_space_name_or_number: str = Field(..., example="Tank #2")
    nature_of_work: str = Field(..., example="Maintenance and sludge removal")
    contractor_agency_name: str = Field(..., example="SafeEntry Industrial Services")
    name_of_person_in_charge: str = Field(..., example="Rohit Verma")
    contact_number: str = Field(..., example="+91-9876543218")
    names_of_workers_entering: List[str] = Field(..., example=["Amit Sharma", "Vikas Singh"])
    number_of_persons_entering: int = Field(..., example=2)
    entry_time: str = Field(..., example="2025-08-13T09:15:00")
    expected_exit_time: str = Field(..., example="2025-08-13T12:30:00")
    work_start_date_time: str = Field(..., example="2025-08-13T09:30:00")
    work_end_date_time: str = Field(..., example="2025-08-13T12:10:00")
    atmospheric_testing_done: str = Field(..., example="Yes")
    oxygen_level_percent: float = Field(..., example=20.9)
    explosive_gases_lel_percent: float = Field(..., example=0.0)
    toxic_gases_ppm: dict = Field(..., example={"CO": 2, "H2S": 0})
    gas_test_conducted_by: GasTestConductedByBase
    ventilation_arranged: str = Field(..., example="Yes")
    continuous_gas_monitoring_required: str = Field(..., example="Yes")
    type_of_ppe_provided: List[str] = Field(..., example=["Helmet", "Gloves", "Chemical Resistant Suit", "Full Face Mask"])
    communication_device_used: str = Field(..., example="Walkie-Talkie")
    rescue_equipment_available: List[str] = Field(..., example=["Tripod", "Winch", "Safety Rope"])
    emergency_contact_details_posted: str = Field(..., example="Yes")
    trained_standby_person_present: str = Field(..., example="Yes")
    lockout_tagout_implemented: str = Field(..., example="Yes")
    barricading_and_signages_installed: str = Field(..., example="Yes")
    permit_issued_by: PermitIssuedByBase
    authorized_by: AuthorizedByBase
    signature_of_worker: str = Field(..., example="Amit Sharma")
    signature_of_supervisor: str = Field(..., example="Rohit Verma")
    post_work_gas_test_done: str = Field(..., example="Yes")
    work_completion_time: str = Field(..., example="2025-08-13T12:10:00")
    final_clearance_given_by: str = Field(..., example="Ajay Sharma")
    remarks_or_precautions: str = Field(..., example="Ensure follow-up gas test after 1 hour; PPE to be cleaned before storage.")

class ConfinedSpaceWorkPermitUpdate(BaseModel):
    """Schema for updating confined space work permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    site_location_of_confined_space: Optional[str] = None
    specific_space_name_or_number: Optional[str] = None
    nature_of_work: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    name_of_person_in_charge: Optional[str] = None
    contact_number: Optional[str] = None
    names_of_workers_entering: Optional[List[str]] = None
    number_of_persons_entering: Optional[int] = None
    entry_time: Optional[str] = None
    expected_exit_time: Optional[str] = None
    work_start_date_time: Optional[str] = None
    work_end_date_time: Optional[str] = None
    atmospheric_testing_done: Optional[str] = None
    oxygen_level_percent: Optional[float] = None
    explosive_gases_lel_percent: Optional[float] = None
    toxic_gases_ppm: Optional[dict] = None
    gas_test_conducted_by: Optional[GasTestConductedByBase] = None
    ventilation_arranged: Optional[str] = None
    continuous_gas_monitoring_required: Optional[str] = None
    type_of_ppe_provided: Optional[List[str]] = None
    communication_device_used: Optional[str] = None
    rescue_equipment_available: Optional[List[str]] = None
    emergency_contact_details_posted: Optional[str] = None
    trained_standby_person_present: Optional[str] = None
    lockout_tagout_implemented: Optional[str] = None
    barricading_and_signages_installed: Optional[str] = None
    permit_issued_by: Optional[PermitIssuedByBase] = None
    authorized_by: Optional[AuthorizedByBase] = None
    signature_of_worker: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    post_work_gas_test_done: Optional[str] = None
    work_completion_time: Optional[str] = None
    final_clearance_given_by: Optional[str] = None
    remarks_or_precautions: Optional[str] = None

class ConfinedSpaceWorkPermit(ConfinedSpaceWorkPermitCreate):
    """Schema for reading confined space work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Confined Space Work Permit ---

class ConfinedSpaceWorkPermitDB(Base):
    """Database ORM model for the 'confined_space_work_permit' table."""
    __tablename__ = "confined_space_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    site_location_of_confined_space = Column(String)
    specific_space_name_or_number = Column(String)
    nature_of_work = Column(String)
    contractor_agency_name = Column(String)
    name_of_person_in_charge = Column(String)
    contact_number = Column(String)
    names_of_workers_entering = Column(JSON)
    number_of_persons_entering = Column(Integer)
    entry_time = Column(String, index=True)
    expected_exit_time = Column(String, index=True)
    work_start_date_time = Column(String, index=True)
    work_end_date_time = Column(String, index=True)
    atmospheric_testing_done = Column(String)
    oxygen_level_percent = Column(Float)
    explosive_gases_lel_percent = Column(Float)
    toxic_gases_ppm = Column(JSON)
    gas_test_conducted_by = Column(JSON)
    ventilation_arranged = Column(String)
    continuous_gas_monitoring_required = Column(String)
    type_of_ppe_provided = Column(JSON)
    communication_device_used = Column(String)
    rescue_equipment_available = Column(JSON)
    emergency_contact_details_posted = Column(String)
    trained_standby_person_present = Column(String)
    lockout_tagout_implemented = Column(String)
    barricading_and_signages_installed = Column(String)
    permit_issued_by = Column(JSON)
    authorized_by = Column(JSON)
    signature_of_worker = Column(String)
    signature_of_supervisor = Column(String)
    post_work_gas_test_done = Column(String)
    work_completion_time = Column(String)
    final_clearance_given_by = Column(String)
    remarks_or_precautions = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Confined Space Work Permit ---

@app.post("/confined-space-work-permit/", response_model=ConfinedSpaceWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Confined Space Work Permit"])
def create_confined_space_work_permit(permit: ConfinedSpaceWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new confined space work permit record.
    """
    permit_data = permit.dict()
    db_permit = ConfinedSpaceWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/confined-space-work-permit/", response_model=List[ConfinedSpaceWorkPermit], tags=["Confined Space Work Permit"])
def read_confined_space_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all confined space work permits with pagination.
    """
    permit_records = db.query(ConfinedSpaceWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/confined-space-work-permit/{permit_id}", response_model=ConfinedSpaceWorkPermit, tags=["Confined Space Work Permit"])
def read_confined_space_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single confined space work permit record by its ID.
    """
    db_permit = db.query(ConfinedSpaceWorkPermitDB).filter(ConfinedSpaceWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confined space work permit not found")
    return db_permit

@app.get("/confined-space-work-permit/permit/{permit_number}", response_model=ConfinedSpaceWorkPermit, tags=["Confined Space Work Permit"])
def read_confined_space_work_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a confined space work permit by its permit number.
    """
    db_permit = db.query(ConfinedSpaceWorkPermitDB).filter(ConfinedSpaceWorkPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confined space work permit not found")
    return db_permit

@app.get("/confined-space-work-permit/property/{property_id}", response_model=List[ConfinedSpaceWorkPermit], tags=["Confined Space Work Permit"])
def read_confined_space_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all confined space work permits for a specific property.
    """
    permit_records = db.query(ConfinedSpaceWorkPermitDB).filter(ConfinedSpaceWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/confined-space-work-permit/date/{date}", response_model=List[ConfinedSpaceWorkPermit], tags=["Confined Space Work Permit"])
def read_confined_space_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all confined space work permits for a specific date.
    """
    permit_records = db.query(ConfinedSpaceWorkPermitDB).filter(ConfinedSpaceWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/confined-space-work-permit/contractor/{contractor_name}", response_model=List[ConfinedSpaceWorkPermit], tags=["Confined Space Work Permit"])
def read_confined_space_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all confined space work permits for a specific contractor.
    """
    permit_records = db.query(ConfinedSpaceWorkPermitDB).filter(ConfinedSpaceWorkPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/confined-space-work-permit/space/{space_name}", response_model=List[ConfinedSpaceWorkPermit], tags=["Confined Space Work Permit"])
def read_confined_space_work_permit_by_space(space_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all confined space work permits for a specific space name or number.
    """
    permit_records = db.query(ConfinedSpaceWorkPermitDB).filter(ConfinedSpaceWorkPermitDB.specific_space_name_or_number.contains(space_name)).all()
    return permit_records

@app.get("/confined-space-work-permit/status/active", response_model=List[ConfinedSpaceWorkPermit], tags=["Confined Space Work Permit"])
def read_active_confined_space_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active confined space work permits (current time within work start and end times).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(ConfinedSpaceWorkPermitDB).filter(
        ConfinedSpaceWorkPermitDB.work_start_date_time <= current_time,
        ConfinedSpaceWorkPermitDB.work_end_date_time >= current_time
    ).all()
    return permit_records

@app.get("/confined-space-work-permit/oxygen/safe", response_model=List[ConfinedSpaceWorkPermit], tags=["Confined Space Work Permit"])
def read_confined_space_work_permit_with_safe_oxygen(db: Session = Depends(get_db)):
    """
    Retrieve all confined space work permits with safe oxygen levels (19.5% - 23.5%).
    """
    permit_records = db.query(ConfinedSpaceWorkPermitDB).filter(
        ConfinedSpaceWorkPermitDB.oxygen_level_percent >= 19.5,
        ConfinedSpaceWorkPermitDB.oxygen_level_percent <= 23.5
    ).all()
    return permit_records

@app.put("/confined-space-work-permit/{permit_id}", response_model=ConfinedSpaceWorkPermit, tags=["Confined Space Work Permit"])
def update_confined_space_work_permit(permit_id: int, permit: ConfinedSpaceWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing confined space work permit record.
    """
    db_permit = db.query(ConfinedSpaceWorkPermitDB).filter(ConfinedSpaceWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confined space work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/confined-space-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Confined Space Work Permit"])
def delete_confined_space_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a confined space work permit record by its ID.
    """
    db_permit = db.query(ConfinedSpaceWorkPermitDB).filter(ConfinedSpaceWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Confined space work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for General Maintenance Permit ---

class GeneralMaintenancePermitCreate(BaseModel):
    """Schema for creating general maintenance permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="GM-2025-021")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T09:00:00")
    permit_valid_until: str = Field(..., example="2025-08-14T17:00:00")
    requesting_department_or_resident_name: str = Field(..., example="Apartment 402 - Mr. Sunil Kapoor")
    contact_number: str = Field(..., example="+91-9988776655")
    apartment_block_building: str = Field(..., example="Block B, Tower 2")
    nature_of_work: str = Field(..., example="Plumbing")
    detailed_description_of_work: str = Field(..., example="Replacement of leaking kitchen sink pipeline and tap fixture.")
    location_of_work: str = Field(..., example="Apartment 402 - Kitchen Area")
    contractor_or_maintenance_agency_name: str = Field(..., example="QuickFix Maintenance Services")
    contractor_contact_person: str = Field(..., example="Ramesh Kumar")
    contractor_contact_number: str = Field(..., example="+91-9876543210")
    no_of_workers_involved: int = Field(..., example=2)
    workers_id_proof_submitted: str = Field(..., example="Yes")
    list_of_tools_equipment_used: List[str] = Field(..., example=["Pipe Wrench", "Adjustable Spanner", "Teflon Tape", "PVC Cutter"])
    electrical_isolation_required: str = Field(..., example="No")
    water_supply_shutdown_required: str = Field(..., example="Yes")
    ppe_required: str = Field(..., example="Yes")
    safety_briefing_given: str = Field(..., example="Yes")
    material_movement_permission_required: str = Field(..., example="No")
    precautionary_measures_taken: str = Field(..., example="Floor covered with plastic sheet; water supply isolated before work.")
    waste_disposal_method: str = Field(..., example="Old pipeline and fittings disposed via building waste collection system.")
    work_start_date_time: str = Field(..., example="2025-08-14T09:30:00")
    expected_work_completion_date_time: str = Field(..., example="2025-08-14T12:30:00")
    supervisor_or_facility_in_charge_name: str = Field(..., example="Anil Mehra")
    supervisor_signature: str = Field(..., example="Signed")
    security_informed: str = Field(..., example="Yes")
    security_personnel_name_signature: str = Field(..., example="K. Singh - Signed")
    final_inspection_done: str = Field(..., example="Yes")
    final_inspection_done_by: str = Field(..., example="Anil Mehra")
    clearance_given: str = Field(..., example="Yes")
    remarks_observations: str = Field(..., example="Work completed as per scope; no leakage found after testing.")
    signature_of_requester: str = Field(..., example="Sunil Kapoor")
    signature_of_approving_authority: str = Field(..., example="Anil Mehra")

class GeneralMaintenancePermitUpdate(BaseModel):
    """Schema for updating general maintenance permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_until: Optional[str] = None
    requesting_department_or_resident_name: Optional[str] = None
    contact_number: Optional[str] = None
    apartment_block_building: Optional[str] = None
    nature_of_work: Optional[str] = None
    detailed_description_of_work: Optional[str] = None
    location_of_work: Optional[str] = None
    contractor_or_maintenance_agency_name: Optional[str] = None
    contractor_contact_person: Optional[str] = None
    contractor_contact_number: Optional[str] = None
    no_of_workers_involved: Optional[int] = None
    workers_id_proof_submitted: Optional[str] = None
    list_of_tools_equipment_used: Optional[List[str]] = None
    electrical_isolation_required: Optional[str] = None
    water_supply_shutdown_required: Optional[str] = None
    ppe_required: Optional[str] = None
    safety_briefing_given: Optional[str] = None
    material_movement_permission_required: Optional[str] = None
    precautionary_measures_taken: Optional[str] = None
    waste_disposal_method: Optional[str] = None
    work_start_date_time: Optional[str] = None
    expected_work_completion_date_time: Optional[str] = None
    supervisor_or_facility_in_charge_name: Optional[str] = None
    supervisor_signature: Optional[str] = None
    security_informed: Optional[str] = None
    security_personnel_name_signature: Optional[str] = None
    final_inspection_done: Optional[str] = None
    final_inspection_done_by: Optional[str] = None
    clearance_given: Optional[str] = None
    remarks_observations: Optional[str] = None
    signature_of_requester: Optional[str] = None
    signature_of_approving_authority: Optional[str] = None

class GeneralMaintenancePermit(GeneralMaintenancePermitCreate):
    """Schema for reading general maintenance permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for General Maintenance Permit ---

class GeneralMaintenancePermitDB(Base):
    """Database ORM model for the 'general_maintenance_permit' table."""
    __tablename__ = "general_maintenance_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_until = Column(String, index=True)
    requesting_department_or_resident_name = Column(String)
    contact_number = Column(String)
    apartment_block_building = Column(String)
    nature_of_work = Column(String, index=True)
    detailed_description_of_work = Column(Text)
    location_of_work = Column(String)
    contractor_or_maintenance_agency_name = Column(String)
    contractor_contact_person = Column(String)
    contractor_contact_number = Column(String)
    no_of_workers_involved = Column(Integer)
    workers_id_proof_submitted = Column(String)
    list_of_tools_equipment_used = Column(JSON)
    electrical_isolation_required = Column(String)
    water_supply_shutdown_required = Column(String)
    ppe_required = Column(String)
    safety_briefing_given = Column(String)
    material_movement_permission_required = Column(String)
    precautionary_measures_taken = Column(Text)
    waste_disposal_method = Column(Text)
    work_start_date_time = Column(String, index=True)
    expected_work_completion_date_time = Column(String, index=True)
    supervisor_or_facility_in_charge_name = Column(String)
    supervisor_signature = Column(String)
    security_informed = Column(String)
    security_personnel_name_signature = Column(String)
    final_inspection_done = Column(String)
    final_inspection_done_by = Column(String)
    clearance_given = Column(String)
    remarks_observations = Column(Text)
    signature_of_requester = Column(String)
    signature_of_approving_authority = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for General Maintenance Permit ---

@app.post("/general-maintenance-permit/", response_model=GeneralMaintenancePermit, status_code=status.HTTP_201_CREATED, tags=["General Maintenance Permit"])
def create_general_maintenance_permit(permit: GeneralMaintenancePermitCreate, db: Session = Depends(get_db)):
    """
    Create a new general maintenance permit record.
    """
    permit_data = permit.dict()
    db_permit = GeneralMaintenancePermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/general-maintenance-permit/", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_general_maintenance_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all general maintenance permits with pagination.
    """
    permit_records = db.query(GeneralMaintenancePermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/general-maintenance-permit/{permit_id}", response_model=GeneralMaintenancePermit, tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single general maintenance permit record by its ID.
    """
    db_permit = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="General maintenance permit not found")
    return db_permit

@app.get("/general-maintenance-permit/permit/{permit_number}", response_model=GeneralMaintenancePermit, tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a general maintenance permit by its permit number.
    """
    db_permit = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="General maintenance permit not found")
    return db_permit

@app.get("/general-maintenance-permit/property/{property_id}", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all general maintenance permits for a specific property.
    """
    permit_records = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.property_id == property_id).all()
    return permit_records

@app.get("/general-maintenance-permit/date/{date}", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all general maintenance permits for a specific date.
    """
    permit_records = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/general-maintenance-permit/nature/{nature_of_work}", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_nature(nature_of_work: str, db: Session = Depends(get_db)):
    """
    Retrieve all general maintenance permits for a specific nature of work.
    """
    permit_records = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.nature_of_work == nature_of_work).all()
    return permit_records

@app.get("/general-maintenance-permit/contractor/{contractor_name}", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all general maintenance permits for a specific contractor.
    """
    permit_records = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.contractor_or_maintenance_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/general-maintenance-permit/resident/{resident_name}", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_resident(resident_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all general maintenance permits for a specific resident or department.
    """
    permit_records = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.requesting_department_or_resident_name.contains(resident_name)).all()
    return permit_records

@app.get("/general-maintenance-permit/status/active", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_active_general_maintenance_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active general maintenance permits (current time within permit validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(GeneralMaintenancePermitDB).filter(
        GeneralMaintenancePermitDB.permit_valid_from <= current_time,
        GeneralMaintenancePermitDB.permit_valid_until >= current_time
    ).all()
    return permit_records

@app.get("/general-maintenance-permit/workers/min/{min_workers}", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_min_workers(min_workers: int, db: Session = Depends(get_db)):
    """
    Retrieve all general maintenance permits where number of workers is greater than or equal to min_workers.
    """
    permit_records = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.no_of_workers_involved >= min_workers).all()
    return permit_records

@app.get("/general-maintenance-permit/clearance/{clearance_status}", response_model=List[GeneralMaintenancePermit], tags=["General Maintenance Permit"])
def read_general_maintenance_permit_by_clearance(clearance_status: str, db: Session = Depends(get_db)):
    """
    Retrieve all general maintenance permits by clearance status.
    """
    permit_records = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.clearance_given == clearance_status).all()
    return permit_records

@app.put("/general-maintenance-permit/{permit_id}", response_model=GeneralMaintenancePermit, tags=["General Maintenance Permit"])
def update_general_maintenance_permit(permit_id: int, permit: GeneralMaintenancePermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing general maintenance permit record.
    """
    db_permit = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="General maintenance permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/general-maintenance-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["General Maintenance Permit"])
def delete_general_maintenance_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a general maintenance permit record by its ID.
    """
    db_permit = db.query(GeneralMaintenancePermitDB).filter(GeneralMaintenancePermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="General maintenance permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Working Alone Permit ---

class WorkingAlonePermitCreate(BaseModel):
    """Schema for creating working alone permit."""
    property_id: str = Field(..., example="PROP-001")
    S_No: int = Field(..., example=1)
    Date: str = Field(..., example="2025-08-13")
    Employee_Name: str = Field(..., example="Rahul Verma")
    Employee_ID: str = Field(..., example="EMP-045")
    Department: str = Field(..., example="Maintenance")
    Designation: str = Field(..., example="Technician")
    Contact_Number: str = Field(..., example="+91-9876543210")
    Site_Location_of_Work: str = Field(..., example="Basement Electrical Room")
    Nature_of_Task: str = Field(..., example="Electrical panel inspection and maintenance")
    Reason_for_Working_Alone: str = Field(..., example="Urgent repair during off-hours")
    Work_Start_Time: str = Field(..., example="21:00")
    Estimated_Completion_Time: str = Field(..., example="23:30")
    Supervisor_Name: str = Field(..., example="Vikram Singh")
    Supervisor_Contact_Number: str = Field(..., example="+91-9123456780")
    Communication_Method: str = Field(..., example="Radio")
    Last_Check_In_Time: str = Field(..., example="21:30")
    Next_Check_In_Schedule: str = Field(..., example="22:30")
    Emergency_Contact_Name: str = Field(..., example="Suresh Mehta")
    Emergency_Contact_Number: str = Field(..., example="+91-9012345678")
    First_Aid_Kit_Available: str = Field(..., example="Yes")
    Personal_Protective_Equipment_Used: str = Field(..., example="Yes")
    Lone_Worker_Training_Completed: str = Field(..., example="Yes")
    Risk_Assessment_Completed: str = Field(..., example="Yes")
    Emergency_Procedures_Explained: str = Field(..., example="Yes")
    Safety_Hazards_Identified: str = Field(..., example="High voltage exposure, confined space, poor lighting")
    Control_Measures_Implemented: str = Field(..., example="Lockout/Tagout, portable lighting, insulated tools")
    Special_Instructions: str = Field(..., example="Maintain constant radio communication and follow emergency shutdown protocol")
    Approved_By: str = Field(..., example="Anil Sharma")
    Approver_Designation: str = Field(..., example="Safety Officer")
    Approver_Signature: str = Field(..., example="Anil Sharma")
    Employee_Signature: str = Field(..., example="Rahul Verma")
    Remarks: str = Field(..., example="Work authorized for tonight only; follow all safety guidelines")

class WorkingAlonePermitUpdate(BaseModel):
    """Schema for updating working alone permit."""
    property_id: Optional[str] = None
    S_No: Optional[int] = None
    Date: Optional[str] = None
    Employee_Name: Optional[str] = None
    Employee_ID: Optional[str] = None
    Department: Optional[str] = None
    Designation: Optional[str] = None
    Contact_Number: Optional[str] = None
    Site_Location_of_Work: Optional[str] = None
    Nature_of_Task: Optional[str] = None
    Reason_for_Working_Alone: Optional[str] = None
    Work_Start_Time: Optional[str] = None
    Estimated_Completion_Time: Optional[str] = None
    Supervisor_Name: Optional[str] = None
    Supervisor_Contact_Number: Optional[str] = None
    Communication_Method: Optional[str] = None
    Last_Check_In_Time: Optional[str] = None
    Next_Check_In_Schedule: Optional[str] = None
    Emergency_Contact_Name: Optional[str] = None
    Emergency_Contact_Number: Optional[str] = None
    First_Aid_Kit_Available: Optional[str] = None
    Personal_Protective_Equipment_Used: Optional[str] = None
    Lone_Worker_Training_Completed: Optional[str] = None
    Risk_Assessment_Completed: Optional[str] = None
    Emergency_Procedures_Explained: Optional[str] = None
    Safety_Hazards_Identified: Optional[str] = None
    Control_Measures_Implemented: Optional[str] = None
    Special_Instructions: Optional[str] = None
    Approved_By: Optional[str] = None
    Approver_Designation: Optional[str] = None
    Approver_Signature: Optional[str] = None
    Employee_Signature: Optional[str] = None
    Remarks: Optional[str] = None

class WorkingAlonePermit(WorkingAlonePermitCreate):
    """Schema for reading working alone permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Working Alone Permit ---

class WorkingAlonePermitDB(Base):
    """Database ORM model for the 'working_alone_permit' table."""
    __tablename__ = "working_alone_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    S_No = Column(Integer, index=True)
    Date = Column(String, index=True)
    Employee_Name = Column(String, index=True)
    Employee_ID = Column(String, index=True)
    Department = Column(String, index=True)
    Designation = Column(String, index=True)
    Contact_Number = Column(String)
    Site_Location_of_Work = Column(String, index=True)
    Nature_of_Task = Column(String, index=True)
    Reason_for_Working_Alone = Column(Text)
    Work_Start_Time = Column(String, index=True)
    Estimated_Completion_Time = Column(String, index=True)
    Supervisor_Name = Column(String, index=True)
    Supervisor_Contact_Number = Column(String)
    Communication_Method = Column(String)
    Last_Check_In_Time = Column(String)
    Next_Check_In_Schedule = Column(String)
    Emergency_Contact_Name = Column(String)
    Emergency_Contact_Number = Column(String)
    First_Aid_Kit_Available = Column(String)
    Personal_Protective_Equipment_Used = Column(String)
    Lone_Worker_Training_Completed = Column(String)
    Risk_Assessment_Completed = Column(String)
    Emergency_Procedures_Explained = Column(String)
    Safety_Hazards_Identified = Column(Text)
    Control_Measures_Implemented = Column(Text)
    Special_Instructions = Column(Text)
    Approved_By = Column(String, index=True)
    Approver_Designation = Column(String)
    Approver_Signature = Column(String)
    Employee_Signature = Column(String)
    Remarks = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Working Alone Permit ---

@app.post("/working-alone-permit/", response_model=WorkingAlonePermit, status_code=status.HTTP_201_CREATED, tags=["Working Alone Permit"])
def create_working_alone_permit(permit: WorkingAlonePermitCreate, db: Session = Depends(get_db)):
    """
    Create a new working alone permit record.
    """
    permit_data = permit.dict()
    db_permit = WorkingAlonePermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/working-alone-permit/", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits with pagination.
    """
    permit_records = db.query(WorkingAlonePermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/working-alone-permit/{permit_id}", response_model=WorkingAlonePermit, tags=["Working Alone Permit"])
def read_working_alone_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single working alone permit record by its ID.
    """
    db_permit = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Working alone permit not found")
    return db_permit

@app.get("/working-alone-permit/property/{property_id}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific property.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.property_id == property_id).all()
    return permit_records

@app.get("/working-alone-permit/date/{date}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific date.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Date == date).all()
    return permit_records

@app.get("/working-alone-permit/employee/{employee_name}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_employee(employee_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific employee.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Employee_Name.contains(employee_name)).all()
    return permit_records

@app.get("/working-alone-permit/employee-id/{employee_id}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_employee_id(employee_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific employee ID.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Employee_ID == employee_id).all()
    return permit_records

@app.get("/working-alone-permit/department/{department}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_department(department: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific department.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Department == department).all()
    return permit_records

@app.get("/working-alone-permit/designation/{designation}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_designation(designation: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific designation.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Designation == designation).all()
    return permit_records

@app.get("/working-alone-permit/location/{location}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific work location.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Site_Location_of_Work.contains(location)).all()
    return permit_records

@app.get("/working-alone-permit/task/{task_type}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_task(task_type: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific nature of task.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Nature_of_Task.contains(task_type)).all()
    return permit_records

@app.get("/working-alone-permit/supervisor/{supervisor_name}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_supervisor(supervisor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits supervised by a specific supervisor.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Supervisor_Name.contains(supervisor_name)).all()
    return permit_records

@app.get("/working-alone-permit/communication/{communication_method}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_communication(communication_method: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits using a specific communication method.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Communication_Method == communication_method).all()
    return permit_records

@app.get("/working-alone-permit/emergency-contact/{contact_name}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_emergency_contact(contact_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits with a specific emergency contact.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Emergency_Contact_Name.contains(contact_name)).all()
    return permit_records

@app.get("/working-alone-permit/approver/{approver_name}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_approver(approver_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits approved by a specific person.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Approved_By.contains(approver_name)).all()
    return permit_records

@app.get("/working-alone-permit/approver-designation/{designation}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_approver_designation(designation: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits approved by a specific designation.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Approver_Designation == designation).all()
    return permit_records

@app.get("/working-alone-permit/training/{training_status}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_training(training_status: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits by lone worker training completion status.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Lone_Worker_Training_Completed == training_status).all()
    return permit_records

@app.get("/working-alone-permit/risk-assessment/{assessment_status}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_risk_assessment(assessment_status: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits by risk assessment completion status.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Risk_Assessment_Completed == assessment_status).all()
    return permit_records

@app.get("/working-alone-permit/emergency-procedures/{procedures_status}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_emergency_procedures(procedures_status: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits by emergency procedures explanation status.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Emergency_Procedures_Explained == procedures_status).all()
    return permit_records

@app.get("/working-alone-permit/first-aid/{first_aid_status}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_first_aid(first_aid_status: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits by first aid kit availability status.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.First_Aid_Kit_Available == first_aid_status).all()
    return permit_records

@app.get("/working-alone-permit/ppe/{ppe_status}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_ppe(ppe_status: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits by personal protective equipment usage status.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Personal_Protective_Equipment_Used == ppe_status).all()
    return permit_records

@app.get("/working-alone-permit/start-time/{start_time}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_start_time(start_time: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific work start time.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Work_Start_Time == start_time).all()
    return permit_records

@app.get("/working-alone-permit/completion-time/{completion_time}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_completion_time(completion_time: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific estimated completion time.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Estimated_Completion_Time == completion_time).all()
    return permit_records

@app.get("/working-alone-permit/check-in/{check_in_time}", response_model=List[WorkingAlonePermit], tags=["Working Alone Permit"])
def read_working_alone_permit_by_check_in_time(check_in_time: str, db: Session = Depends(get_db)):
    """
    Retrieve all working alone permits for a specific last check-in time.
    """
    permit_records = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.Last_Check_In_Time == check_in_time).all()
    return permit_records

@app.put("/working-alone-permit/{permit_id}", response_model=WorkingAlonePermit, tags=["Working Alone Permit"])
def update_working_alone_permit(permit_id: int, permit: WorkingAlonePermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing working alone permit record.
    """
    db_permit = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Working alone permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/working-alone-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Working Alone Permit"])
def delete_working_alone_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a working alone permit record by its ID.
    """
    db_permit = db.query(WorkingAlonePermitDB).filter(WorkingAlonePermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Working alone permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Excavation Work Permit ---

class ExcavationWorkPermitCreate(BaseModel):
    """Schema for creating excavation work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="EWP-2025-008")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T08:00:00")
    permit_valid_to: str = Field(..., example="2025-08-16T18:00:00")
    site_location_of_excavation: str = Field(..., example="Parking Lot A - North Section")
    purpose_of_excavation: str = Field(..., example="Underground cable laying for new electrical connection")
    contractor_agency_name: str = Field(..., example="GroundWorks Construction Ltd.")
    contact_details_contractor: str = Field(..., example="+91-9876543212")
    supervisor_name_on_site: str = Field(..., example="Rajesh Kumar")
    contact_details_supervisor: str = Field(..., example="+91-9123456785")
    number_of_workers_involved: int = Field(..., example=6)
    depth_of_excavation_meters: float = Field(..., example=2.5)
    length_of_excavation_meters: float = Field(..., example=15.0)
    width_of_excavation_meters: float = Field(..., example=1.2)
    soil_type: str = Field(..., example="Clay and Sandy Soil")
    underground_utilities_identified: str = Field(..., example="Yes")
    utilities_marked_and_protected: str = Field(..., example="Yes")
    shoring_or_sloping_required: str = Field(..., example="Yes")
    shoring_equipment_installed: str = Field(..., example="Yes")
    barricading_and_signages_installed: str = Field(..., example="Yes")
    safety_helmet_and_ppe_worn: str = Field(..., example="Yes")
    first_aid_kit_available_onsite: str = Field(..., example="Yes")
    emergency_contact_details_posted: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Safety Officer - Priya Sharma")
    pre_work_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Rajesh Kumar")
    signature_of_safety_officer: str = Field(..., example="Priya Sharma")
    signature_of_contractor: str = Field(..., example="Vikram Malhotra")
    work_completion_time: str = Field(..., example="2025-08-16T17:30:00")
    post_work_inspection_done_by: str = Field(..., example="Priya Sharma")
    final_clearance_given: str = Field(..., example="Yes")
    remarks_or_observations: str = Field(..., example="Excavation completed safely. All utilities protected. Site restored.")

class ExcavationWorkPermitUpdate(BaseModel):
    """Schema for updating excavation work permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    site_location_of_excavation: Optional[str] = None
    purpose_of_excavation: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    contact_details_contractor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    number_of_workers_involved: Optional[int] = None
    depth_of_excavation_meters: Optional[float] = None
    length_of_excavation_meters: Optional[float] = None
    width_of_excavation_meters: Optional[float] = None
    soil_type: Optional[str] = None
    underground_utilities_identified: Optional[str] = None
    utilities_marked_and_protected: Optional[str] = None
    shoring_or_sloping_required: Optional[str] = None
    shoring_equipment_installed: Optional[str] = None
    barricading_and_signages_installed: Optional[str] = None
    safety_helmet_and_ppe_worn: Optional[str] = None
    first_aid_kit_available_onsite: Optional[str] = None
    emergency_contact_details_posted: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_work_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    work_completion_time: Optional[str] = None
    post_work_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class ExcavationWorkPermit(ExcavationWorkPermitCreate):
    """Schema for reading excavation work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Excavation Work Permit ---

class ExcavationWorkPermitDB(Base):
    """Database ORM model for the 'excavation_work_permit' table."""
    __tablename__ = "excavation_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    site_location_of_excavation = Column(String)
    purpose_of_excavation = Column(String)
    contractor_agency_name = Column(String)
    contact_details_contractor = Column(String)
    supervisor_name_on_site = Column(String)
    contact_details_supervisor = Column(String)
    number_of_workers_involved = Column(Integer)
    depth_of_excavation_meters = Column(Float)
    length_of_excavation_meters = Column(Float)
    width_of_excavation_meters = Column(Float)
    soil_type = Column(String)
    underground_utilities_identified = Column(String)
    utilities_marked_and_protected = Column(String)
    shoring_or_sloping_required = Column(String)
    shoring_equipment_installed = Column(String)
    barricading_and_signages_installed = Column(String)
    safety_helmet_and_ppe_worn = Column(String)
    first_aid_kit_available_onsite = Column(String)
    emergency_contact_details_posted = Column(String)
    work_authorization_by = Column(String)
    pre_work_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    signature_of_contractor = Column(String)
    work_completion_time = Column(String)
    post_work_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Excavation Work Permit ---

@app.post("/excavation-work-permit/", response_model=ExcavationWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Excavation Work Permit"])
def create_excavation_work_permit(permit: ExcavationWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new excavation work permit record.
    """
    permit_data = permit.dict()
    db_permit = ExcavationWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/excavation-work-permit/", response_model=List[ExcavationWorkPermit], tags=["Excavation Work Permit"])
def read_excavation_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all excavation work permits with pagination.
    """
    permit_records = db.query(ExcavationWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/excavation-work-permit/{permit_id}", response_model=ExcavationWorkPermit, tags=["Excavation Work Permit"])
def read_excavation_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single excavation work permit record by its ID.
    """
    db_permit = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Excavation work permit not found")
    return db_permit

@app.get("/excavation-work-permit/permit/{permit_number}", response_model=ExcavationWorkPermit, tags=["Excavation Work Permit"])
def read_excavation_work_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve an excavation work permit by its permit number.
    """
    db_permit = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Excavation work permit not found")
    return db_permit

@app.get("/excavation-work-permit/property/{property_id}", response_model=List[ExcavationWorkPermit], tags=["Excavation Work Permit"])
def read_excavation_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all excavation work permits for a specific property.
    """
    permit_records = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/excavation-work-permit/date/{date}", response_model=List[ExcavationWorkPermit], tags=["Excavation Work Permit"])
def read_excavation_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all excavation work permits for a specific date.
    """
    permit_records = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/excavation-work-permit/contractor/{contractor_name}", response_model=List[ExcavationWorkPermit], tags=["Excavation Work Permit"])
def read_excavation_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all excavation work permits for a specific contractor.
    """
    permit_records = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/excavation-work-permit/purpose/{purpose}", response_model=List[ExcavationWorkPermit], tags=["Excavation Work Permit"])
def read_excavation_work_permit_by_purpose(purpose: str, db: Session = Depends(get_db)):
    """
    Retrieve all excavation work permits for a specific purpose.
    """
    permit_records = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.purpose_of_excavation.contains(purpose)).all()
    return permit_records

@app.get("/excavation-work-permit/status/active", response_model=List[ExcavationWorkPermit], tags=["Excavation Work Permit"])
def read_active_excavation_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active excavation work permits (current time within validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(ExcavationWorkPermitDB).filter(
        ExcavationWorkPermitDB.permit_valid_from <= current_time,
        ExcavationWorkPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/excavation-work-permit/depth/min/{min_depth}", response_model=List[ExcavationWorkPermit], tags=["Excavation Work Permit"])
def read_excavation_work_permit_by_min_depth(min_depth: float, db: Session = Depends(get_db)):
    """
    Retrieve all excavation work permits where depth is greater than or equal to min_depth.
    """
    permit_records = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.depth_of_excavation_meters >= min_depth).all()
    return permit_records

@app.put("/excavation-work-permit/{permit_id}", response_model=ExcavationWorkPermit, tags=["Excavation Work Permit"])
def update_excavation_work_permit(permit_id: int, permit: ExcavationWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing excavation work permit record.
    """
    db_permit = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Excavation work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/excavation-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Excavation Work Permit"])
def delete_excavation_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete an excavation work permit record by its ID.
    """
    db_permit = db.query(ExcavationWorkPermitDB).filter(ExcavationWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Excavation work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Lockout/Tagout (LOTO) Permit ---

class LockoutTagoutPermitCreate(BaseModel):
    """Schema for creating lockout/tagout permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="LOTO-2025-009")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T08:00:00")
    permit_valid_to: str = Field(..., example="2025-08-14T16:00:00")
    equipment_system_to_be_isolated: str = Field(..., example="Main Electrical Panel - Sub Station A")
    location_of_equipment: str = Field(..., example="Basement Level - Electrical Room")
    reason_for_lockout_tagout: str = Field(..., example="Preventive maintenance of circuit breakers")
    contractor_agency_name: str = Field(..., example="PowerTech Maintenance Services")
    contact_details_contractor: str = Field(..., example="+91-9876543213")
    supervisor_name_on_site: str = Field(..., example="Amit Patel")
    contact_details_supervisor: str = Field(..., example="+91-9123456786")
    number_of_workers_involved: int = Field(..., example=3)
    energy_sources_to_be_isolated: List[str] = Field(..., example=["Electrical", "Hydraulic", "Pneumatic"])
    isolation_points_identified: str = Field(..., example="Yes")
    lockout_devices_installed: str = Field(..., example="Yes")
    tagout_devices_installed: str = Field(..., example="Yes")
    energy_isolation_verified: str = Field(..., example="Yes")
    zero_energy_state_confirmed: str = Field(..., example="Yes")
    lockout_tagout_procedure_followed: str = Field(..., example="Yes")
    authorized_personnel_only: str = Field(..., example="Yes")
    communication_protocol_established: str = Field(..., example="Yes")
    emergency_procedures_explained: str = Field(..., example="Yes")
    first_aid_kit_available_onsite: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Safety Officer - Neha Singh")
    pre_work_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Amit Patel")
    signature_of_safety_officer: str = Field(..., example="Neha Singh")
    signature_of_contractor: str = Field(..., example="Rajesh Verma")
    work_completion_time: str = Field(..., example="2025-08-14T15:30:00")
    post_work_inspection_done_by: str = Field(..., example="Neha Singh")
    final_clearance_given: str = Field(..., example="Yes")
    energy_restoration_authorized_by: str = Field(..., example="Neha Singh")
    remarks_or_observations: str = Field(..., example="All isolation points properly secured. Equipment tested after restoration.")

class LockoutTagoutPermitUpdate(BaseModel):
    """Schema for updating lockout/tagout permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    equipment_system_to_be_isolated: Optional[str] = None
    location_of_equipment: Optional[str] = None
    reason_for_lockout_tagout: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    contact_details_contractor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    number_of_workers_involved: Optional[int] = None
    energy_sources_to_be_isolated: Optional[List[str]] = None
    isolation_points_identified: Optional[str] = None
    lockout_devices_installed: Optional[str] = None
    tagout_devices_installed: Optional[str] = None
    energy_isolation_verified: Optional[str] = None
    zero_energy_state_confirmed: Optional[str] = None
    lockout_tagout_procedure_followed: Optional[str] = None
    authorized_personnel_only: Optional[str] = None
    communication_protocol_established: Optional[str] = None
    emergency_procedures_explained: Optional[str] = None
    first_aid_kit_available_onsite: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_work_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    work_completion_time: Optional[str] = None
    post_work_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    energy_restoration_authorized_by: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class LockoutTagoutPermit(LockoutTagoutPermitCreate):
    """Schema for reading lockout/tagout permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Lockout/Tagout Permit ---

class LockoutTagoutPermitDB(Base):
    """Database ORM model for the 'lockout_tagout_permit' table."""
    __tablename__ = "lockout_tagout_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    equipment_system_to_be_isolated = Column(String)
    location_of_equipment = Column(String)
    reason_for_lockout_tagout = Column(String)
    contractor_agency_name = Column(String)
    contact_details_contractor = Column(String)
    supervisor_name_on_site = Column(String)
    contact_details_supervisor = Column(String)
    number_of_workers_involved = Column(Integer)
    energy_sources_to_be_isolated = Column(JSON)
    isolation_points_identified = Column(String)
    lockout_devices_installed = Column(String)
    tagout_devices_installed = Column(String)
    energy_isolation_verified = Column(String)
    zero_energy_state_confirmed = Column(String)
    lockout_tagout_procedure_followed = Column(String)
    authorized_personnel_only = Column(String)
    communication_protocol_established = Column(String)
    emergency_procedures_explained = Column(String)
    first_aid_kit_available_onsite = Column(String)
    work_authorization_by = Column(String)
    pre_work_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    signature_of_contractor = Column(String)
    work_completion_time = Column(String)
    post_work_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    energy_restoration_authorized_by = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Lockout/Tagout Permit ---

@app.post("/lockout-tagout-permit/", response_model=LockoutTagoutPermit, status_code=status.HTTP_201_CREATED, tags=["Lockout/Tagout Permit"])
def create_lockout_tagout_permit(permit: LockoutTagoutPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new lockout/tagout permit record.
    """
    permit_data = permit.dict()
    db_permit = LockoutTagoutPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/lockout-tagout-permit/", response_model=List[LockoutTagoutPermit], tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all lockout/tagout permits with pagination.
    """
    permit_records = db.query(LockoutTagoutPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/lockout-tagout-permit/{permit_id}", response_model=LockoutTagoutPermit, tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single lockout/tagout permit record by its ID.
    """
    db_permit = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lockout/tagout permit not found")
    return db_permit

@app.get("/lockout-tagout-permit/permit/{permit_number}", response_model=LockoutTagoutPermit, tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a lockout/tagout permit by its permit number.
    """
    db_permit = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lockout/tagout permit not found")
    return db_permit

@app.get("/lockout-tagout-permit/property/{property_id}", response_model=List[LockoutTagoutPermit], tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all lockout/tagout permits for a specific property.
    """
    permit_records = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/lockout-tagout-permit/date/{date}", response_model=List[LockoutTagoutPermit], tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all lockout/tagout permits for a specific date.
    """
    permit_records = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/lockout-tagout-permit/contractor/{contractor_name}", response_model=List[LockoutTagoutPermit], tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all lockout/tagout permits for a specific contractor.
    """
    permit_records = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/lockout-tagout-permit/equipment/{equipment_name}", response_model=List[LockoutTagoutPermit], tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit_by_equipment(equipment_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all lockout/tagout permits for a specific equipment.
    """
    permit_records = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.equipment_system_to_be_isolated.contains(equipment_name)).all()
    return permit_records

@app.get("/lockout-tagout-permit/location/{location}", response_model=List[LockoutTagoutPermit], tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all lockout/tagout permits for a specific location.
    """
    permit_records = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.location_of_equipment.contains(location)).all()
    return permit_records

@app.get("/lockout-tagout-permit/status/active", response_model=List[LockoutTagoutPermit], tags=["Lockout/Tagout Permit"])
def read_active_lockout_tagout_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active lockout/tagout permits (current time within validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(LockoutTagoutPermitDB).filter(
        LockoutTagoutPermitDB.permit_valid_from <= current_time,
        LockoutTagoutPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/lockout-tagout-permit/workers/min/{min_workers}", response_model=List[LockoutTagoutPermit], tags=["Lockout/Tagout Permit"])
def read_lockout_tagout_permit_by_min_workers(min_workers: int, db: Session = Depends(get_db)):
    """
    Retrieve all lockout/tagout permits where number of workers is greater than or equal to min_workers.
    """
    permit_records = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.number_of_workers_involved >= min_workers).all()
    return permit_records

@app.put("/lockout-tagout-permit/{permit_id}", response_model=LockoutTagoutPermit, tags=["Lockout/Tagout Permit"])
def update_lockout_tagout_permit(permit_id: int, permit: LockoutTagoutPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing lockout/tagout permit record.
    """
    db_permit = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lockout/tagout permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/lockout-tagout-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Lockout/Tagout Permit"])
def delete_lockout_tagout_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a lockout/tagout permit record by its ID.
    """
    db_permit = db.query(LockoutTagoutPermitDB).filter(LockoutTagoutPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lockout/tagout permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Chemical Handling Permit ---

class ChemicalHandlingPermitCreate(BaseModel):
    """Schema for creating chemical handling permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="CHP-2025-010")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T09:00:00")
    permit_valid_to: str = Field(..., example="2025-08-14T17:00:00")
    site_location_of_work: str = Field(..., example="Laboratory Building - Room 205")
    nature_of_chemical_work: str = Field(..., example="Acid neutralization and disposal")
    contractor_agency_name: str = Field(..., example="ChemSafe Environmental Services")
    contact_details_contractor: str = Field(..., example="+91-9876543214")
    supervisor_name_on_site: str = Field(..., example="Dr. Priya Sharma")
    contact_details_supervisor: str = Field(..., example="+91-9123456787")
    number_of_workers_involved: int = Field(..., example=4)
    chemicals_to_be_handled: List[str] = Field(..., example=["Sulfuric Acid", "Sodium Hydroxide", "Hydrochloric Acid"])
    chemical_concentrations: List[str] = Field(..., example=["98%", "50%", "37%"])
    quantities_involved: List[str] = Field(..., example=["5 liters", "10 liters", "3 liters"])
    msds_available_and_reviewed: str = Field(..., example="Yes")
    chemical_compatibility_checked: str = Field(..., example="Yes")
    ventilation_system_operational: str = Field(..., example="Yes")
    fume_hood_available: str = Field(..., example="Yes")
    emergency_shower_eyewash_available: str = Field(..., example="Yes")
    spill_containment_equipment_available: str = Field(..., example="Yes")
    chemical_resistant_ppe_provided: str = Field(..., example="Yes")
    type_of_ppe_provided: List[str] = Field(..., example=["Chemical Resistant Gloves", "Lab Coat", "Safety Goggles", "Face Shield"])
    emergency_procedures_explained: str = Field(..., example="Yes")
    first_aid_kit_available_onsite: str = Field(..., example="Yes")
    fire_extinguisher_available: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Safety Officer - Rajesh Kumar")
    pre_work_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Dr. Priya Sharma")
    signature_of_safety_officer: str = Field(..., example="Rajesh Kumar")
    signature_of_contractor: str = Field(..., example="Vikram Malhotra")
    work_completion_time: str = Field(..., example="2025-08-14T16:30:00")
    post_work_inspection_done_by: str = Field(..., example="Rajesh Kumar")
    final_clearance_given: str = Field(..., example="Yes")
    chemical_waste_disposal_verified: str = Field(..., example="Yes")
    remarks_or_observations: str = Field(..., example="All chemicals properly neutralized and disposed. Area cleaned and decontaminated.")

class ChemicalHandlingPermitUpdate(BaseModel):
    """Schema for updating chemical handling permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    site_location_of_work: Optional[str] = None
    nature_of_chemical_work: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    contact_details_contractor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    number_of_workers_involved: Optional[int] = None
    chemicals_to_be_handled: Optional[List[str]] = None
    chemical_concentrations: Optional[List[str]] = None
    quantities_involved: Optional[List[str]] = None
    msds_available_and_reviewed: Optional[str] = None
    chemical_compatibility_checked: Optional[str] = None
    ventilation_system_operational: Optional[str] = None
    fume_hood_available: Optional[str] = None
    emergency_shower_eyewash_available: Optional[str] = None
    spill_containment_equipment_available: Optional[str] = None
    chemical_resistant_ppe_provided: Optional[str] = None
    type_of_ppe_provided: Optional[List[str]] = None
    emergency_procedures_explained: Optional[str] = None
    first_aid_kit_available_onsite: Optional[str] = None
    fire_extinguisher_available: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_work_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    work_completion_time: Optional[str] = None
    post_work_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    chemical_waste_disposal_verified: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class ChemicalHandlingPermit(ChemicalHandlingPermitCreate):
    """Schema for reading chemical handling permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Chemical Handling Permit ---

class ChemicalHandlingPermitDB(Base):
    """Database ORM model for the 'chemical_handling_permit' table."""
    __tablename__ = "chemical_handling_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    site_location_of_work = Column(String)
    nature_of_chemical_work = Column(String)
    contractor_agency_name = Column(String)
    contact_details_contractor = Column(String)
    supervisor_name_on_site = Column(String)
    contact_details_supervisor = Column(String)
    number_of_workers_involved = Column(Integer)
    chemicals_to_be_handled = Column(JSON)
    chemical_concentrations = Column(JSON)
    quantities_involved = Column(JSON)
    msds_available_and_reviewed = Column(String)
    chemical_compatibility_checked = Column(String)
    ventilation_system_operational = Column(String)
    fume_hood_available = Column(String)
    emergency_shower_eyewash_available = Column(String)
    spill_containment_equipment_available = Column(String)
    chemical_resistant_ppe_provided = Column(String)
    type_of_ppe_provided = Column(JSON)
    emergency_procedures_explained = Column(String)
    first_aid_kit_available_onsite = Column(String)
    fire_extinguisher_available = Column(String)
    work_authorization_by = Column(String)
    pre_work_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    signature_of_contractor = Column(String)
    work_completion_time = Column(String)
    post_work_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    chemical_waste_disposal_verified = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Chemical Handling Permit ---

@app.post("/chemical-handling-permit/", response_model=ChemicalHandlingPermit, status_code=status.HTTP_201_CREATED, tags=["Chemical Handling Permit"])
def create_chemical_handling_permit(permit: ChemicalHandlingPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new chemical handling permit record.
    """
    permit_data = permit.dict()
    db_permit = ChemicalHandlingPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/chemical-handling-permit/", response_model=List[ChemicalHandlingPermit], tags=["Chemical Handling Permit"])
def read_chemical_handling_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all chemical handling permits with pagination.
    """
    permit_records = db.query(ChemicalHandlingPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/chemical-handling-permit/{permit_id}", response_model=ChemicalHandlingPermit, tags=["Chemical Handling Permit"])
def read_chemical_handling_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single chemical handling permit record by its ID.
    """
    db_permit = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chemical handling permit not found")
    return db_permit

@app.get("/chemical-handling-permit/permit/{permit_number}", response_model=ChemicalHandlingPermit, tags=["Chemical Handling Permit"])
def read_chemical_handling_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a chemical handling permit by its permit number.
    """
    db_permit = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chemical handling permit not found")
    return db_permit

@app.get("/chemical-handling-permit/property/{property_id}", response_model=List[ChemicalHandlingPermit], tags=["Chemical Handling Permit"])
def read_chemical_handling_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all chemical handling permits for a specific property.
    """
    permit_records = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/chemical-handling-permit/date/{date}", response_model=List[ChemicalHandlingPermit], tags=["Chemical Handling Permit"])
def read_chemical_handling_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all chemical handling permits for a specific date.
    """
    permit_records = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/chemical-handling-permit/contractor/{contractor_name}", response_model=List[ChemicalHandlingPermit], tags=["Chemical Handling Permit"])
def read_chemical_handling_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all chemical handling permits for a specific contractor.
    """
    permit_records = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/chemical-handling-permit/location/{location}", response_model=List[ChemicalHandlingPermit], tags=["Chemical Handling Permit"])
def read_chemical_handling_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all chemical handling permits for a specific location.
    """
    permit_records = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.site_location_of_work.contains(location)).all()
    return permit_records

@app.get("/chemical-handling-permit/nature/{nature_of_work}", response_model=List[ChemicalHandlingPermit], tags=["Chemical Handling Permit"])
def read_chemical_handling_permit_by_nature(nature_of_work: str, db: Session = Depends(get_db)):
    """
    Retrieve all chemical handling permits for a specific nature of chemical work.
    """
    permit_records = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.nature_of_chemical_work.contains(nature_of_work)).all()
    return permit_records

@app.get("/chemical-handling-permit/status/active", response_model=List[ChemicalHandlingPermit], tags=["Chemical Handling Permit"])
def read_active_chemical_handling_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active chemical handling permits (current time within validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(ChemicalHandlingPermitDB).filter(
        ChemicalHandlingPermitDB.permit_valid_from <= current_time,
        ChemicalHandlingPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/chemical-handling-permit/workers/min/{min_workers}", response_model=List[ChemicalHandlingPermit], tags=["Chemical Handling Permit"])
def read_chemical_handling_permit_by_min_workers(min_workers: int, db: Session = Depends(get_db)):
    """
    Retrieve all chemical handling permits where number of workers is greater than or equal to min_workers.
    """
    permit_records = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.number_of_workers_involved >= min_workers).all()
    return permit_records

@app.put("/chemical-handling-permit/{permit_id}", response_model=ChemicalHandlingPermit, tags=["Chemical Handling Permit"])
def update_chemical_handling_permit(permit_id: int, permit: ChemicalHandlingPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing chemical handling permit record.
    """
    db_permit = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chemical handling permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/chemical-handling-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Chemical Handling Permit"])
def delete_chemical_handling_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a chemical handling permit record by its ID.
    """
    db_permit = db.query(ChemicalHandlingPermitDB).filter(ChemicalHandlingPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chemical handling permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Lifting Work Permit ---

class LiftingWorkPermitCreate(BaseModel):
    """Schema for creating lifting work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="LWP-2025-011")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T08:00:00")
    permit_valid_to: str = Field(..., example="2025-08-14T16:00:00")
    site_location_of_lifting: str = Field(..., example="Warehouse A - Loading Bay")
    nature_of_lifting_work: str = Field(..., example="Heavy machinery installation")
    contractor_agency_name: str = Field(..., example="HeavyLift Industrial Services")
    contact_details_contractor: str = Field(..., example="+91-9876543215")
    supervisor_name_on_site: str = Field(..., example="Ramesh Singh")
    contact_details_supervisor: str = Field(..., example="+91-9123456788")
    number_of_workers_involved: int = Field(..., example=6)
    equipment_to_be_lifted: str = Field(..., example="Industrial Compressor Unit")
    weight_of_equipment_kg: float = Field(..., example=2500.0)
    dimensions_of_equipment: str = Field(..., example="3m x 2m x 2.5m")
    lifting_equipment_used: str = Field(..., example="Mobile Crane - 50 Ton Capacity")
    crane_capacity_tonnes: float = Field(..., example=50.0)
    crane_certification_valid: str = Field(..., example="Yes")
    crane_operator_certified: str = Field(..., example="Yes")
    rigging_equipment_checked: str = Field(..., example="Yes")
    slings_and_chains_certified: str = Field(..., example="Yes")
    lifting_plan_prepared: str = Field(..., example="Yes")
    ground_conditions_assessed: str = Field(..., example="Yes")
    overhead_obstacles_identified: str = Field(..., example="Yes")
    exclusion_zone_established: str = Field(..., example="Yes")
    signal_person_assigned: str = Field(..., example="Yes")
    communication_method: str = Field(..., example="Radio")
    weather_conditions_suitable: str = Field(..., example="Yes")
    wind_speed_acceptable: str = Field(..., example="Yes")
    emergency_procedures_explained: str = Field(..., example="Yes")
    first_aid_kit_available_onsite: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Safety Officer - Amit Kumar")
    pre_work_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Ramesh Singh")
    signature_of_safety_officer: str = Field(..., example="Amit Kumar")
    signature_of_contractor: str = Field(..., example="Vikram Malhotra")
    work_completion_time: str = Field(..., example="2025-08-14T15:30:00")
    post_work_inspection_done_by: str = Field(..., example="Amit Kumar")
    final_clearance_given: str = Field(..., example="Yes")
    equipment_installed_safely: str = Field(..., example="Yes")
    remarks_or_observations: str = Field(..., example="Lifting completed successfully. Equipment properly secured and installed.")

class LiftingWorkPermitUpdate(BaseModel):
    """Schema for updating lifting work permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    site_location_of_lifting: Optional[str] = None
    nature_of_lifting_work: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    contact_details_contractor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    number_of_workers_involved: Optional[int] = None
    equipment_to_be_lifted: Optional[str] = None
    weight_of_equipment_kg: Optional[float] = None
    dimensions_of_equipment: Optional[str] = None
    lifting_equipment_used: Optional[str] = None
    crane_capacity_tonnes: Optional[float] = None
    crane_certification_valid: Optional[str] = None
    crane_operator_certified: Optional[str] = None
    rigging_equipment_checked: Optional[str] = None
    slings_and_chains_certified: Optional[str] = None
    lifting_plan_prepared: Optional[str] = None
    ground_conditions_assessed: Optional[str] = None
    overhead_obstacles_identified: Optional[str] = None
    exclusion_zone_established: Optional[str] = None
    signal_person_assigned: Optional[str] = None
    communication_method: Optional[str] = None
    weather_conditions_suitable: Optional[str] = None
    wind_speed_acceptable: Optional[str] = None
    emergency_procedures_explained: Optional[str] = None
    first_aid_kit_available_onsite: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_work_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    work_completion_time: Optional[str] = None
    post_work_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    equipment_installed_safely: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class LiftingWorkPermit(LiftingWorkPermitCreate):
    """Schema for reading lifting work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Lifting Work Permit ---

class LiftingWorkPermitDB(Base):
    """Database ORM model for the 'lifting_work_permit' table."""
    __tablename__ = "lifting_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    site_location_of_lifting = Column(String)
    nature_of_lifting_work = Column(String)
    contractor_agency_name = Column(String)
    contact_details_contractor = Column(String)
    supervisor_name_on_site = Column(String)
    contact_details_supervisor = Column(String)
    number_of_workers_involved = Column(Integer)
    equipment_to_be_lifted = Column(String)
    weight_of_equipment_kg = Column(Float)
    dimensions_of_equipment = Column(String)
    lifting_equipment_used = Column(String)
    crane_capacity_tonnes = Column(Float)
    crane_certification_valid = Column(String)
    crane_operator_certified = Column(String)
    rigging_equipment_checked = Column(String)
    slings_and_chains_certified = Column(String)
    lifting_plan_prepared = Column(String)
    ground_conditions_assessed = Column(String)
    overhead_obstacles_identified = Column(String)
    exclusion_zone_established = Column(String)
    signal_person_assigned = Column(String)
    communication_method = Column(String)
    weather_conditions_suitable = Column(String)
    wind_speed_acceptable = Column(String)
    emergency_procedures_explained = Column(String)
    first_aid_kit_available_onsite = Column(String)
    work_authorization_by = Column(String)
    pre_work_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    signature_of_contractor = Column(String)
    work_completion_time = Column(String)
    post_work_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    equipment_installed_safely = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Lifting Work Permit ---

@app.post("/lifting-work-permit/", response_model=LiftingWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Lifting Work Permit"])
def create_lifting_work_permit(permit: LiftingWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new lifting work permit record.
    """
    permit_data = permit.dict()
    db_permit = LiftingWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/lifting-work-permit/", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits with pagination.
    """
    permit_records = db.query(LiftingWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/lifting-work-permit/{permit_id}", response_model=LiftingWorkPermit, tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single lifting work permit record by its ID.
    """
    db_permit = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lifting work permit not found")
    return db_permit

@app.get("/lifting-work-permit/permit/{permit_number}", response_model=LiftingWorkPermit, tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a lifting work permit by its permit number.
    """
    db_permit = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lifting work permit not found")
    return db_permit

@app.get("/lifting-work-permit/property/{property_id}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits for a specific property.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/lifting-work-permit/date/{date}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits for a specific date.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/lifting-work-permit/contractor/{contractor_name}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits for a specific contractor.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/lifting-work-permit/location/{location}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits for a specific location.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.site_location_of_lifting.contains(location)).all()
    return permit_records

@app.get("/lifting-work-permit/nature/{nature_of_work}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_nature(nature_of_work: str, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits for a specific nature of lifting work.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.nature_of_lifting_work.contains(nature_of_work)).all()
    return permit_records

@app.get("/lifting-work-permit/equipment/{equipment_name}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_equipment(equipment_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits for a specific equipment.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.equipment_to_be_lifted.contains(equipment_name)).all()
    return permit_records

@app.get("/lifting-work-permit/status/active", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_active_lifting_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active lifting work permits (current time within validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(LiftingWorkPermitDB).filter(
        LiftingWorkPermitDB.permit_valid_from <= current_time,
        LiftingWorkPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/lifting-work-permit/workers/min/{min_workers}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_min_workers(min_workers: int, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits where number of workers is greater than or equal to min_workers.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.number_of_workers_involved >= min_workers).all()
    return permit_records

@app.get("/lifting-work-permit/weight/min/{min_weight}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_min_weight(min_weight: float, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits where equipment weight is greater than or equal to min_weight.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.weight_of_equipment_kg >= min_weight).all()
    return permit_records

@app.get("/lifting-work-permit/crane-capacity/min/{min_capacity}", response_model=List[LiftingWorkPermit], tags=["Lifting Work Permit"])
def read_lifting_work_permit_by_min_crane_capacity(min_capacity: float, db: Session = Depends(get_db)):
    """
    Retrieve all lifting work permits where crane capacity is greater than or equal to min_capacity.
    """
    permit_records = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.crane_capacity_tonnes >= min_capacity).all()
    return permit_records

@app.put("/lifting-work-permit/{permit_id}", response_model=LiftingWorkPermit, tags=["Lifting Work Permit"])
def update_lifting_work_permit(permit_id: int, permit: LiftingWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing lifting work permit record.
    """
    db_permit = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lifting work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/lifting-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Lifting Work Permit"])
def delete_lifting_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a lifting work permit record by its ID.
    """
    db_permit = db.query(LiftingWorkPermitDB).filter(LiftingWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lifting work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Demolition Work Permit ---

class DemolitionWorkPermitCreate(BaseModel):
    """Schema for creating demolition work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="DWP-2025-012")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T08:00:00")
    permit_valid_to: str = Field(..., example="2025-08-20T18:00:00")
    site_location_of_demolition: str = Field(..., example="Building C - Ground Floor")
    nature_of_demolition_work: str = Field(..., example="Interior wall demolition and structural modifications")
    contractor_agency_name: str = Field(..., example="DemolitionPro Construction Services")
    contact_details_contractor: str = Field(..., example="+91-9876543216")
    supervisor_name_on_site: str = Field(..., example="Suresh Kumar")
    contact_details_supervisor: str = Field(..., example="+91-9123456789")
    number_of_workers_involved: int = Field(..., example=8)
    structure_to_be_demolished: str = Field(..., example="Interior partition walls and false ceiling")
    area_to_be_demolished_sqm: float = Field(..., example=150.0)
    height_of_structure_meters: float = Field(..., example=3.5)
    demolition_method: str = Field(..., example="Manual demolition with hand tools")
    heavy_equipment_required: str = Field(..., example="Yes")
    equipment_to_be_used: List[str] = Field(..., example=["Jack Hammer", "Concrete Cutter", "Excavator"])
    structural_analysis_done: str = Field(..., example="Yes")
    load_bearing_walls_identified: str = Field(..., example="Yes")
    utilities_disconnected: str = Field(..., example="Yes")
    electrical_isolation_done: str = Field(..., example="Yes")
    water_supply_isolated: str = Field(..., example="Yes")
    gas_supply_isolated: str = Field(..., example="Yes")
    asbestos_survey_done: str = Field(..., example="Yes")
    hazardous_materials_identified: str = Field(..., example="No")
    dust_control_measures: str = Field(..., example="Yes")
    noise_control_measures: str = Field(..., example="Yes")
    vibration_monitoring: str = Field(..., example="Yes")
    barricading_and_signages: str = Field(..., example="Yes")
    safety_helmet_and_ppe_worn: str = Field(..., example="Yes")
    first_aid_kit_available_onsite: str = Field(..., example="Yes")
    emergency_procedures_explained: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Safety Officer - Neha Sharma")
    pre_work_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Suresh Kumar")
    signature_of_safety_officer: str = Field(..., example="Neha Sharma")
    signature_of_contractor: str = Field(..., example="Vikram Malhotra")
    work_completion_time: str = Field(..., example="2025-08-20T17:30:00")
    post_work_inspection_done_by: str = Field(..., example="Neha Sharma")
    final_clearance_given: str = Field(..., example="Yes")
    debris_removal_verified: str = Field(..., example="Yes")
    remarks_or_observations: str = Field(..., example="Demolition completed safely. All debris removed and site cleaned.")

class DemolitionWorkPermitUpdate(BaseModel):
    """Schema for updating demolition work permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    site_location_of_demolition: Optional[str] = None
    nature_of_demolition_work: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    contact_details_contractor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    number_of_workers_involved: Optional[int] = None
    structure_to_be_demolished: Optional[str] = None
    area_to_be_demolished_sqm: Optional[float] = None
    height_of_structure_meters: Optional[float] = None
    demolition_method: Optional[str] = None
    heavy_equipment_required: Optional[str] = None
    equipment_to_be_used: Optional[List[str]] = None
    structural_analysis_done: Optional[str] = None
    load_bearing_walls_identified: Optional[str] = None
    utilities_disconnected: Optional[str] = None
    electrical_isolation_done: Optional[str] = None
    water_supply_isolated: Optional[str] = None
    gas_supply_isolated: Optional[str] = None
    asbestos_survey_done: Optional[str] = None
    hazardous_materials_identified: Optional[str] = None
    dust_control_measures: Optional[str] = None
    noise_control_measures: Optional[str] = None
    vibration_monitoring: Optional[str] = None
    barricading_and_signages: Optional[str] = None
    safety_helmet_and_ppe_worn: Optional[str] = None
    first_aid_kit_available_onsite: Optional[str] = None
    emergency_procedures_explained: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_work_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    work_completion_time: Optional[str] = None
    post_work_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    debris_removal_verified: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class DemolitionWorkPermit(DemolitionWorkPermitCreate):
    """Schema for reading demolition work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Demolition Work Permit ---

class DemolitionWorkPermitDB(Base):
    """Database ORM model for the 'demolition_work_permit' table."""
    __tablename__ = "demolition_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    site_location_of_demolition = Column(String)
    nature_of_demolition_work = Column(String)
    contractor_agency_name = Column(String)
    contact_details_contractor = Column(String)
    supervisor_name_on_site = Column(String)
    contact_details_supervisor = Column(String)
    number_of_workers_involved = Column(Integer)
    structure_to_be_demolished = Column(String)
    area_to_be_demolished_sqm = Column(Float)
    height_of_structure_meters = Column(Float)
    demolition_method = Column(String)
    heavy_equipment_required = Column(String)
    equipment_to_be_used = Column(JSON)
    structural_analysis_done = Column(String)
    load_bearing_walls_identified = Column(String)
    utilities_disconnected = Column(String)
    electrical_isolation_done = Column(String)
    water_supply_isolated = Column(String)
    gas_supply_isolated = Column(String)
    asbestos_survey_done = Column(String)
    hazardous_materials_identified = Column(String)
    dust_control_measures = Column(String)
    noise_control_measures = Column(String)
    vibration_monitoring = Column(String)
    barricading_and_signages = Column(String)
    safety_helmet_and_ppe_worn = Column(String)
    first_aid_kit_available_onsite = Column(String)
    emergency_procedures_explained = Column(String)
    work_authorization_by = Column(String)
    pre_work_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    signature_of_contractor = Column(String)
    work_completion_time = Column(String)
    post_work_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    debris_removal_verified = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Demolition Work Permit ---

@app.post("/demolition-work-permit/", response_model=DemolitionWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Demolition Work Permit"])
def create_demolition_work_permit(permit: DemolitionWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new demolition work permit record.
    """
    permit_data = permit.dict()
    db_permit = DemolitionWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/demolition-work-permit/", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits with pagination.
    """
    permit_records = db.query(DemolitionWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/demolition-work-permit/{permit_id}", response_model=DemolitionWorkPermit, tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single demolition work permit record by its ID.
    """
    db_permit = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demolition work permit not found")
    return db_permit

@app.get("/demolition-work-permit/permit/{permit_number}", response_model=DemolitionWorkPermit, tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a demolition work permit by its permit number.
    """
    db_permit = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demolition work permit not found")
    return db_permit

@app.get("/demolition-work-permit/property/{property_id}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits for a specific property.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/demolition-work-permit/date/{date}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits for a specific date.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/demolition-work-permit/contractor/{contractor_name}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits for a specific contractor.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/demolition-work-permit/location/{location}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits for a specific location.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.site_location_of_demolition.contains(location)).all()
    return permit_records

@app.get("/demolition-work-permit/nature/{nature_of_work}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_nature(nature_of_work: str, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits for a specific nature of demolition work.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.nature_of_demolition_work.contains(nature_of_work)).all()
    return permit_records

@app.get("/demolition-work-permit/structure/{structure_name}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_structure(structure_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits for a specific structure.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.structure_to_be_demolished.contains(structure_name)).all()
    return permit_records

@app.get("/demolition-work-permit/status/active", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_active_demolition_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active demolition work permits (current time within validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(DemolitionWorkPermitDB).filter(
        DemolitionWorkPermitDB.permit_valid_from <= current_time,
        DemolitionWorkPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/demolition-work-permit/workers/min/{min_workers}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_min_workers(min_workers: int, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits where number of workers is greater than or equal to min_workers.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.number_of_workers_involved >= min_workers).all()
    return permit_records

@app.get("/demolition-work-permit/area/min/{min_area}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_min_area(min_area: float, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits where area to be demolished is greater than or equal to min_area.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.area_to_be_demolished_sqm >= min_area).all()
    return permit_records

@app.get("/demolition-work-permit/height/min/{min_height}", response_model=List[DemolitionWorkPermit], tags=["Demolition Work Permit"])
def read_demolition_work_permit_by_min_height(min_height: float, db: Session = Depends(get_db)):
    """
    Retrieve all demolition work permits where structure height is greater than or equal to min_height.
    """
    permit_records = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.height_of_structure_meters >= min_height).all()
    return permit_records

@app.put("/demolition-work-permit/{permit_id}", response_model=DemolitionWorkPermit, tags=["Demolition Work Permit"])
def update_demolition_work_permit(permit_id: int, permit: DemolitionWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing demolition work permit record.
    """
    db_permit = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demolition work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/demolition-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Demolition Work Permit"])
def delete_demolition_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a demolition work permit record by its ID.
    """
    db_permit = db.query(DemolitionWorkPermitDB).filter(DemolitionWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demolition work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Temporary Structure Installation Permit ---

class TemporaryStructureInstallationPermitCreate(BaseModel):
    """Schema for creating temporary structure installation permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="TSIP-2025-013")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T08:00:00")
    permit_valid_to: str = Field(..., example="2025-09-14T18:00:00")
    site_location_of_installation: str = Field(..., example="Construction Site - Zone B")
    nature_of_temporary_structure: str = Field(..., example="Modular office complex and storage facility")
    contractor_agency_name: str = Field(..., example="ModularBuild Solutions Ltd.")
    contact_details_contractor: str = Field(..., example="+91-9876543217")
    supervisor_name_on_site: str = Field(..., example="Arun Singh")
    contact_details_supervisor: str = Field(..., example="+91-9123456790")
    number_of_workers_involved: int = Field(..., example=12)
    type_of_temporary_structure: str = Field(..., example="Modular Buildings")
    number_of_units: int = Field(..., example=8)
    total_area_covered_sqm: float = Field(..., example=320.0)
    height_of_structure_meters: float = Field(..., example=3.0)
    foundation_type: str = Field(..., example="Concrete Pads")
    foundation_analysis_done: str = Field(..., example="Yes")
    structural_engineering_approval: str = Field(..., example="Yes")
    wind_load_calculations: str = Field(..., example="Yes")
    seismic_considerations: str = Field(..., example="Yes")
    fire_safety_measures: str = Field(..., example="Yes")
    emergency_exits_planned: str = Field(..., example="Yes")
    utilities_connection_plan: str = Field(..., example="Yes")
    electrical_installation_plan: str = Field(..., example="Yes")
    water_supply_connection: str = Field(..., example="Yes")
    sewage_disposal_arrangement: str = Field(..., example="Yes")
    access_roads_planned: str = Field(..., example="Yes")
    parking_arrangement: str = Field(..., example="Yes")
    security_measures: str = Field(..., example="Yes")
    lighting_arrangement: str = Field(..., example="Yes")
    first_aid_facility: str = Field(..., example="Yes")
    emergency_contact_details: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Safety Officer - Priya Verma")
    pre_work_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Arun Singh")
    signature_of_safety_officer: str = Field(..., example="Priya Verma")
    signature_of_contractor: str = Field(..., example="Vikram Malhotra")
    installation_completion_time: str = Field(..., example="2025-09-10T17:30:00")
    post_installation_inspection_done_by: str = Field(..., example="Priya Verma")
    final_clearance_given: str = Field(..., example="Yes")
    structure_handover_verified: str = Field(..., example="Yes")
    remarks_or_observations: str = Field(..., example="Temporary structure installed successfully. All safety measures in place.")

class TemporaryStructureInstallationPermitUpdate(BaseModel):
    """Schema for updating temporary structure installation permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    site_location_of_installation: Optional[str] = None
    nature_of_temporary_structure: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    contact_details_contractor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    number_of_workers_involved: Optional[int] = None
    type_of_temporary_structure: Optional[str] = None
    number_of_units: Optional[int] = None
    total_area_covered_sqm: Optional[float] = None
    height_of_structure_meters: Optional[float] = None
    foundation_type: Optional[str] = None
    foundation_analysis_done: Optional[str] = None
    structural_engineering_approval: Optional[str] = None
    wind_load_calculations: Optional[str] = None
    seismic_considerations: Optional[str] = None
    fire_safety_measures: Optional[str] = None
    emergency_exits_planned: Optional[str] = None
    utilities_connection_plan: Optional[str] = None
    electrical_installation_plan: Optional[str] = None
    water_supply_connection: Optional[str] = None
    sewage_disposal_arrangement: Optional[str] = None
    access_roads_planned: Optional[str] = None
    parking_arrangement: Optional[str] = None
    security_measures: Optional[str] = None
    lighting_arrangement: Optional[str] = None
    first_aid_facility: Optional[str] = None
    emergency_contact_details: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_work_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    installation_completion_time: Optional[str] = None
    post_installation_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    structure_handover_verified: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class TemporaryStructureInstallationPermit(TemporaryStructureInstallationPermitCreate):
    """Schema for reading temporary structure installation permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Temporary Structure Installation Permit ---

class TemporaryStructureInstallationPermitDB(Base):
    """Database ORM model for the 'temporary_structure_installation_permit' table."""
    __tablename__ = "temporary_structure_installation_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    site_location_of_installation = Column(String)
    nature_of_temporary_structure = Column(String)
    contractor_agency_name = Column(String)
    contact_details_contractor = Column(String)
    supervisor_name_on_site = Column(String)
    contact_details_supervisor = Column(String)
    number_of_workers_involved = Column(Integer)
    type_of_temporary_structure = Column(String)
    number_of_units = Column(Integer)
    total_area_covered_sqm = Column(Float)
    height_of_structure_meters = Column(Float)
    foundation_type = Column(String)
    foundation_analysis_done = Column(String)
    structural_engineering_approval = Column(String)
    wind_load_calculations = Column(String)
    seismic_considerations = Column(String)
    fire_safety_measures = Column(String)
    emergency_exits_planned = Column(String)
    utilities_connection_plan = Column(String)
    electrical_installation_plan = Column(String)
    water_supply_connection = Column(String)
    sewage_disposal_arrangement = Column(String)
    access_roads_planned = Column(String)
    parking_arrangement = Column(String)
    security_measures = Column(String)
    lighting_arrangement = Column(String)
    first_aid_facility = Column(String)
    emergency_contact_details = Column(String)
    work_authorization_by = Column(String)
    pre_work_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    signature_of_contractor = Column(String)
    installation_completion_time = Column(String)
    post_installation_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    structure_handover_verified = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Temporary Structure Installation Permit ---

@app.post("/temporary-structure-installation-permit/", response_model=TemporaryStructureInstallationPermit, status_code=status.HTTP_201_CREATED, tags=["Temporary Structure Installation Permit"])
def create_temporary_structure_installation_permit(permit: TemporaryStructureInstallationPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new temporary structure installation permit record.
    """
    permit_data = permit.dict()
    db_permit = TemporaryStructureInstallationPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/temporary-structure-installation-permit/", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits with pagination.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/{permit_id}", response_model=TemporaryStructureInstallationPermit, tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single temporary structure installation permit record by its ID.
    """
    db_permit = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temporary structure installation permit not found")
    return db_permit

@app.get("/temporary-structure-installation-permit/permit/{permit_number}", response_model=TemporaryStructureInstallationPermit, tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a temporary structure installation permit by its permit number.
    """
    db_permit = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temporary structure installation permit not found")
    return db_permit

@app.get("/temporary-structure-installation-permit/property/{property_id}", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits for a specific property.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/date/{date}", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits for a specific date.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/contractor/{contractor_name}", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits for a specific contractor.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/location/{location}", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits for a specific location.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.site_location_of_installation.contains(location)).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/type/{structure_type}", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_type(structure_type: str, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits for a specific structure type.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.type_of_temporary_structure.contains(structure_type)).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/status/active", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_active_temporary_structure_installation_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active temporary structure installation permits (current time within validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(
        TemporaryStructureInstallationPermitDB.permit_valid_from <= current_time,
        TemporaryStructureInstallationPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/workers/min/{min_workers}", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_min_workers(min_workers: int, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits where number of workers is greater than or equal to min_workers.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.number_of_workers_involved >= min_workers).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/area/min/{min_area}", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_min_area(min_area: float, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits where total area covered is greater than or equal to min_area.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.total_area_covered_sqm >= min_area).all()
    return permit_records

@app.get("/temporary-structure-installation-permit/height/min/{min_height}", response_model=List[TemporaryStructureInstallationPermit], tags=["Temporary Structure Installation Permit"])
def read_temporary_structure_installation_permit_by_min_height(min_height: float, db: Session = Depends(get_db)):
    """
    Retrieve all temporary structure installation permits where structure height is greater than or equal to min_height.
    """
    permit_records = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.height_of_structure_meters >= min_height).all()
    return permit_records

@app.put("/temporary-structure-installation-permit/{permit_id}", response_model=TemporaryStructureInstallationPermit, tags=["Temporary Structure Installation Permit"])
def update_temporary_structure_installation_permit(permit_id: int, permit: TemporaryStructureInstallationPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing temporary structure installation permit record.
    """
    db_permit = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temporary structure installation permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/temporary-structure-installation-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Temporary Structure Installation Permit"])
def delete_temporary_structure_installation_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a temporary structure installation permit record by its ID.
    """
    db_permit = db.query(TemporaryStructureInstallationPermitDB).filter(TemporaryStructureInstallationPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temporary structure installation permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Vehicle Entry Permit ---

class VehicleEntryPermitCreate(BaseModel):
    """Schema for creating vehicle entry permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="VEP-2025-014")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T08:00:00")
    permit_valid_to: str = Field(..., example="2025-08-14T18:00:00")
    site_location_of_entry: str = Field(..., example="Main Gate - Security Checkpoint")
    nature_of_vehicle_work: str = Field(..., example="Material delivery and equipment transport")
    contractor_agency_name: str = Field(..., example="LogiTrans Freight Services")
    contact_details_contractor: str = Field(..., example="+91-9876543218")
    supervisor_name_on_site: str = Field(..., example="Mohan Das")
    contact_details_supervisor: str = Field(..., example="+91-9123456791")
    number_of_vehicles_involved: int = Field(..., example=3)
    vehicle_types: List[str] = Field(..., example=["Truck", "Pickup Van", "Crane"])
    vehicle_registration_numbers: List[str] = Field(..., example=["MH-12-AB-1234", "MH-12-CD-5678", "MH-12-EF-9012"])
    driver_names: List[str] = Field(..., example=["Rajesh Kumar", "Amit Singh", "Vikram Patel"])
    driver_license_numbers: List[str] = Field(..., example=["DL-1234567890", "DL-0987654321", "DL-1122334455"])
    driver_contact_numbers: List[str] = Field(..., example=["+91-9876543210", "+91-9876543211", "+91-9876543212"])
    vehicle_insurance_valid: str = Field(..., example="Yes")
    vehicle_fitness_certificate_valid: str = Field(..., example="Yes")
    vehicle_pollution_certificate_valid: str = Field(..., example="Yes")
    vehicle_permit_valid: str = Field(..., example="Yes")
    driver_license_valid: str = Field(..., example="Yes")
    driver_medical_certificate_valid: str = Field(..., example="Yes")
    vehicle_safety_equipment_checked: str = Field(..., example="Yes")
    fire_extinguisher_available: str = Field(..., example="Yes")
    first_aid_kit_available: str = Field(..., example="Yes")
    emergency_contact_details: str = Field(..., example="Yes")
    route_plan_approved: str = Field(..., example="Yes")
    speed_limit_restrictions: str = Field(..., example="Yes")
    parking_area_assigned: str = Field(..., example="Yes")
    security_clearance_given: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Security Officer - Sunita Sharma")
    pre_entry_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Mohan Das")
    signature_of_security_officer: str = Field(..., example="Sunita Sharma")
    signature_of_contractor: str = Field(..., example="Vikram Malhotra")
    entry_time: str = Field(..., example="2025-08-14T08:30:00")
    exit_time: str = Field(..., example="2025-08-14T17:30:00")
    post_exit_inspection_done_by: str = Field(..., example="Sunita Sharma")
    final_clearance_given: str = Field(..., example="Yes")
    vehicle_exit_verified: str = Field(..., example="Yes")
    remarks_or_observations: str = Field(..., example="All vehicles entered and exited safely. No incidents reported.")

class VehicleEntryPermitUpdate(BaseModel):
    """Schema for updating vehicle entry permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    site_location_of_entry: Optional[str] = None
    nature_of_vehicle_work: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    contact_details_contractor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    number_of_vehicles_involved: Optional[int] = None
    vehicle_types: Optional[List[str]] = None
    vehicle_registration_numbers: Optional[List[str]] = None
    driver_names: Optional[List[str]] = None
    driver_license_numbers: Optional[List[str]] = None
    driver_contact_numbers: Optional[List[str]] = None
    vehicle_insurance_valid: Optional[str] = None
    vehicle_fitness_certificate_valid: Optional[str] = None
    vehicle_pollution_certificate_valid: Optional[str] = None
    vehicle_permit_valid: Optional[str] = None
    driver_license_valid: Optional[str] = None
    driver_medical_certificate_valid: Optional[str] = None
    vehicle_safety_equipment_checked: Optional[str] = None
    fire_extinguisher_available: Optional[str] = None
    first_aid_kit_available: Optional[str] = None
    emergency_contact_details: Optional[str] = None
    route_plan_approved: Optional[str] = None
    speed_limit_restrictions: Optional[str] = None
    parking_area_assigned: Optional[str] = None
    security_clearance_given: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_entry_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_security_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    entry_time: Optional[str] = None
    exit_time: Optional[str] = None
    post_exit_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    vehicle_exit_verified: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class VehicleEntryPermit(VehicleEntryPermitCreate):
    """Schema for reading vehicle entry permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Vehicle Entry Permit ---

class VehicleEntryPermitDB(Base):
    """Database ORM model for the 'vehicle_entry_permit' table."""
    __tablename__ = "vehicle_entry_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    site_location_of_entry = Column(String)
    nature_of_vehicle_work = Column(String)
    contractor_agency_name = Column(String)
    contact_details_contractor = Column(String)
    supervisor_name_on_site = Column(String)
    contact_details_supervisor = Column(String)
    number_of_vehicles_involved = Column(Integer)
    vehicle_types = Column(JSON)
    vehicle_registration_numbers = Column(JSON)
    driver_names = Column(JSON)
    driver_license_numbers = Column(JSON)
    driver_contact_numbers = Column(JSON)
    vehicle_insurance_valid = Column(String)
    vehicle_fitness_certificate_valid = Column(String)
    vehicle_pollution_certificate_valid = Column(String)
    vehicle_permit_valid = Column(String)
    driver_license_valid = Column(String)
    driver_medical_certificate_valid = Column(String)
    vehicle_safety_equipment_checked = Column(String)
    fire_extinguisher_available = Column(String)
    first_aid_kit_available = Column(String)
    emergency_contact_details = Column(String)
    route_plan_approved = Column(String)
    speed_limit_restrictions = Column(String)
    parking_area_assigned = Column(String)
    security_clearance_given = Column(String)
    work_authorization_by = Column(String)
    pre_entry_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_security_officer = Column(String)
    signature_of_contractor = Column(String)
    entry_time = Column(String)
    exit_time = Column(String)
    post_exit_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    vehicle_exit_verified = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Vehicle Entry Permit ---

@app.post("/vehicle-entry-permit/", response_model=VehicleEntryPermit, status_code=status.HTTP_201_CREATED, tags=["Vehicle Entry Permit"])
def create_vehicle_entry_permit(permit: VehicleEntryPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new vehicle entry permit record.
    """
    permit_data = permit.dict()
    db_permit = VehicleEntryPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/vehicle-entry-permit/", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits with pagination.
    """
    permit_records = db.query(VehicleEntryPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/vehicle-entry-permit/{permit_id}", response_model=VehicleEntryPermit, tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single vehicle entry permit record by its ID.
    """
    db_permit = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle entry permit not found")
    return db_permit

@app.get("/vehicle-entry-permit/permit/{permit_number}", response_model=VehicleEntryPermit, tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve a vehicle entry permit by its permit number.
    """
    db_permit = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle entry permit not found")
    return db_permit

@app.get("/vehicle-entry-permit/property/{property_id}", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits for a specific property.
    """
    permit_records = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/vehicle-entry-permit/date/{date}", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits for a specific date.
    """
    permit_records = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/vehicle-entry-permit/contractor/{contractor_name}", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits for a specific contractor.
    """
    permit_records = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/vehicle-entry-permit/location/{location}", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits for a specific location.
    """
    permit_records = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.site_location_of_entry.contains(location)).all()
    return permit_records

@app.get("/vehicle-entry-permit/nature/{nature_of_work}", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_nature(nature_of_work: str, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits for a specific nature of vehicle work.
    """
    permit_records = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.nature_of_vehicle_work.contains(nature_of_work)).all()
    return permit_records

@app.get("/vehicle-entry-permit/vehicle-type/{vehicle_type}", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_vehicle_type(vehicle_type: str, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits for a specific vehicle type.
    """
    permit_records = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.vehicle_types.contains(vehicle_type)).all()
    return permit_records

@app.get("/vehicle-entry-permit/driver/{driver_name}", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_driver(driver_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits for a specific driver.
    """
    permit_records = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.driver_names.contains(driver_name)).all()
    return permit_records

@app.get("/vehicle-entry-permit/status/active", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_active_vehicle_entry_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active vehicle entry permits (current time within validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(VehicleEntryPermitDB).filter(
        VehicleEntryPermitDB.permit_valid_from <= current_time,
        VehicleEntryPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/vehicle-entry-permit/vehicles/min/{min_vehicles}", response_model=List[VehicleEntryPermit], tags=["Vehicle Entry Permit"])
def read_vehicle_entry_permit_by_min_vehicles(min_vehicles: int, db: Session = Depends(get_db)):
    """
    Retrieve all vehicle entry permits where number of vehicles is greater than or equal to min_vehicles.
    """
    permit_records = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.number_of_vehicles_involved >= min_vehicles).all()
    return permit_records

@app.put("/vehicle-entry-permit/{permit_id}", response_model=VehicleEntryPermit, tags=["Vehicle Entry Permit"])
def update_vehicle_entry_permit(permit_id: int, permit: VehicleEntryPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing vehicle entry permit record.
    """
    db_permit = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle entry permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/vehicle-entry-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Vehicle Entry Permit"])
def delete_vehicle_entry_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete a vehicle entry permit record by its ID.
    """
    db_permit = db.query(VehicleEntryPermitDB).filter(VehicleEntryPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle entry permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}

# --- Pydantic Schemas for Interior Work Permit ---

class InteriorWorkPermitCreate(BaseModel):
    """Schema for creating interior work permit."""
    property_id: str = Field(..., example="PROP-001")
    permit_number: str = Field(..., example="IWP-2025-015")
    date_of_issue: str = Field(..., example="2025-08-13")
    permit_valid_from: str = Field(..., example="2025-08-14T08:00:00")
    permit_valid_to: str = Field(..., example="2025-08-25T18:00:00")
    site_location_of_interior_work: str = Field(..., example="Office Building - 3rd Floor")
    nature_of_interior_work: str = Field(..., example="Renovation and interior finishing work")
    contractor_agency_name: str = Field(..., example="InteriorCraft Design Solutions")
    contact_details_contractor: str = Field(..., example="+91-9876543219")
    supervisor_name_on_site: str = Field(..., example="Sanjay Verma")
    contact_details_supervisor: str = Field(..., example="+91-9123456792")
    number_of_workers_involved: int = Field(..., example=15)
    type_of_interior_work: List[str] = Field(..., example=["Painting", "Flooring", "Ceiling", "Electrical", "Plumbing"])
    area_to_be_worked_sqm: float = Field(..., example=450.0)
    existing_finishes_to_be_removed: str = Field(..., example="Yes")
    new_materials_to_be_installed: str = Field(..., example="Yes")
    dust_control_measures: str = Field(..., example="Yes")
    noise_control_measures: str = Field(..., example="Yes")
    ventilation_system_operational: str = Field(..., example="Yes")
    electrical_safety_measures: str = Field(..., example="Yes")
    fire_safety_measures: str = Field(..., example="Yes")
    emergency_exits_accessible: str = Field(..., example="Yes")
    first_aid_kit_available: str = Field(..., example="Yes")
    emergency_contact_details: str = Field(..., example="Yes")
    work_authorization_by: str = Field(..., example="Safety Officer - Rajesh Kumar")
    pre_work_site_inspection_done: str = Field(..., example="Yes")
    signature_of_supervisor: str = Field(..., example="Sanjay Verma")
    signature_of_safety_officer: str = Field(..., example="Rajesh Kumar")
    signature_of_contractor: str = Field(..., example="Vikram Malhotra")
    work_completion_time: str = Field(..., example="2025-08-25T17:30:00")
    post_work_inspection_done_by: str = Field(..., example="Rajesh Kumar")
    final_clearance_given: str = Field(..., example="Yes")
    interior_work_quality_verified: str = Field(..., example="Yes")
    remarks_or_observations: str = Field(..., example="Interior work completed successfully. All finishes properly installed and site cleaned.")

class InteriorWorkPermitUpdate(BaseModel):
    """Schema for updating interior work permit."""
    property_id: Optional[str] = None
    permit_number: Optional[str] = None
    date_of_issue: Optional[str] = None
    permit_valid_from: Optional[str] = None
    permit_valid_to: Optional[str] = None
    site_location_of_interior_work: Optional[str] = None
    nature_of_interior_work: Optional[str] = None
    contractor_agency_name: Optional[str] = None
    contact_details_contractor: Optional[str] = None
    supervisor_name_on_site: Optional[str] = None
    contact_details_supervisor: Optional[str] = None
    number_of_workers_involved: Optional[int] = None
    type_of_interior_work: Optional[List[str]] = None
    area_to_be_worked_sqm: Optional[float] = None
    existing_finishes_to_be_removed: Optional[str] = None
    new_materials_to_be_installed: Optional[str] = None
    dust_control_measures: Optional[str] = None
    noise_control_measures: Optional[str] = None
    ventilation_system_operational: Optional[str] = None
    electrical_safety_measures: Optional[str] = None
    fire_safety_measures: Optional[str] = None
    emergency_exits_accessible: Optional[str] = None
    first_aid_kit_available: Optional[str] = None
    emergency_contact_details: Optional[str] = None
    work_authorization_by: Optional[str] = None
    pre_work_site_inspection_done: Optional[str] = None
    signature_of_supervisor: Optional[str] = None
    signature_of_safety_officer: Optional[str] = None
    signature_of_contractor: Optional[str] = None
    work_completion_time: Optional[str] = None
    post_work_inspection_done_by: Optional[str] = None
    final_clearance_given: Optional[str] = None
    interior_work_quality_verified: Optional[str] = None
    remarks_or_observations: Optional[str] = None

class InteriorWorkPermit(InteriorWorkPermitCreate):
    """Schema for reading interior work permit from database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SQLAlchemy Model for Interior Work Permit ---

class InteriorWorkPermitDB(Base):
    """Database ORM model for the 'interior_work_permit' table."""
    __tablename__ = "interior_work_permit"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(String, index=True)
    permit_number = Column(String, unique=True, index=True)
    date_of_issue = Column(String, index=True)
    permit_valid_from = Column(String, index=True)
    permit_valid_to = Column(String, index=True)
    site_location_of_interior_work = Column(String)
    nature_of_interior_work = Column(String)
    contractor_agency_name = Column(String)
    contact_details_contractor = Column(String)
    supervisor_name_on_site = Column(String)
    contact_details_supervisor = Column(String)
    number_of_workers_involved = Column(Integer)
    type_of_interior_work = Column(JSON)
    area_to_be_worked_sqm = Column(Float)
    existing_finishes_to_be_removed = Column(String)
    new_materials_to_be_installed = Column(String)
    dust_control_measures = Column(String)
    noise_control_measures = Column(String)
    ventilation_system_operational = Column(String)
    electrical_safety_measures = Column(String)
    fire_safety_measures = Column(String)
    emergency_exits_accessible = Column(String)
    first_aid_kit_available = Column(String)
    emergency_contact_details = Column(String)
    work_authorization_by = Column(String)
    pre_work_site_inspection_done = Column(String)
    signature_of_supervisor = Column(String)
    signature_of_safety_officer = Column(String)
    signature_of_contractor = Column(String)
    work_completion_time = Column(String)
    post_work_inspection_done_by = Column(String)
    final_clearance_given = Column(String)
    interior_work_quality_verified = Column(String)
    remarks_or_observations = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create the database table
Base.metadata.create_all(bind=engine)

# --- API Endpoints for Interior Work Permit ---

@app.post("/interior-work-permit/", response_model=InteriorWorkPermit, status_code=status.HTTP_201_CREATED, tags=["Interior Work Permit"])
def create_interior_work_permit(permit: InteriorWorkPermitCreate, db: Session = Depends(get_db)):
    """
    Create a new interior work permit record.
    """
    permit_data = permit.dict()
    db_permit = InteriorWorkPermitDB(**permit_data)
    db.add(db_permit)
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.get("/interior-work-permit/", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits with pagination.
    """
    permit_records = db.query(InteriorWorkPermitDB).offset(skip).limit(limit).all()
    return permit_records

@app.get("/interior-work-permit/{permit_id}", response_model=InteriorWorkPermit, tags=["Interior Work Permit"])
def read_interior_work_permit_by_id(permit_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single interior work permit record by its ID.
    """
    db_permit = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interior work permit not found")
    return db_permit

@app.get("/interior-work-permit/permit/{permit_number}", response_model=InteriorWorkPermit, tags=["Interior Work Permit"])
def read_interior_work_permit_by_permit_number(permit_number: str, db: Session = Depends(get_db)):
    """
    Retrieve an interior work permit by its permit number.
    """
    db_permit = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.permit_number == permit_number).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interior work permit not found")
    return db_permit

@app.get("/interior-work-permit/property/{property_id}", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit_by_property(property_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits for a specific property.
    """
    permit_records = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.property_id == property_id).all()
    return permit_records

@app.get("/interior-work-permit/date/{date}", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit_by_date(date: str, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits for a specific date.
    """
    permit_records = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.date_of_issue == date).all()
    return permit_records

@app.get("/interior-work-permit/contractor/{contractor_name}", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit_by_contractor(contractor_name: str, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits for a specific contractor.
    """
    permit_records = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.contractor_agency_name.contains(contractor_name)).all()
    return permit_records

@app.get("/interior-work-permit/location/{location}", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit_by_location(location: str, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits for a specific location.
    """
    permit_records = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.site_location_of_interior_work.contains(location)).all()
    return permit_records

@app.get("/interior-work-permit/nature/{nature_of_work}", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit_by_nature(nature_of_work: str, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits for a specific nature of interior work.
    """
    permit_records = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.nature_of_interior_work.contains(nature_of_work)).all()
    return permit_records

@app.get("/interior-work-permit/type/{work_type}", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit_by_work_type(work_type: str, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits for a specific type of interior work.
    """
    permit_records = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.type_of_interior_work.contains(work_type)).all()
    return permit_records

@app.get("/interior-work-permit/status/active", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_active_interior_work_permit(db: Session = Depends(get_db)):
    """
    Retrieve all active interior work permits (current time within validity period).
    """
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    permit_records = db.query(InteriorWorkPermitDB).filter(
        InteriorWorkPermitDB.permit_valid_from <= current_time,
        InteriorWorkPermitDB.permit_valid_to >= current_time
    ).all()
    return permit_records

@app.get("/interior-work-permit/workers/min/{min_workers}", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit_by_min_workers(min_workers: int, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits where number of workers is greater than or equal to min_workers.
    """
    permit_records = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.number_of_workers_involved >= min_workers).all()
    return permit_records

@app.get("/interior-work-permit/area/min/{min_area}", response_model=List[InteriorWorkPermit], tags=["Interior Work Permit"])
def read_interior_work_permit_by_min_area(min_area: float, db: Session = Depends(get_db)):
    """
    Retrieve all interior work permits where area to be worked is greater than or equal to min_area.
    """
    permit_records = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.area_to_be_worked_sqm >= min_area).all()
    return permit_records

@app.put("/interior-work-permit/{permit_id}", response_model=InteriorWorkPermit, tags=["Interior Work Permit"])
def update_interior_work_permit(permit_id: int, permit: InteriorWorkPermitUpdate, db: Session = Depends(get_db)):
    """
    Update an existing interior work permit record.
    """
    db_permit = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interior work permit not found")

    update_data = permit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permit, key, value)
        
    db.commit()
    db.refresh(db_permit)
    return db_permit

@app.delete("/interior-work-permit/{permit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Interior Work Permit"])
def delete_interior_work_permit(permit_id: int, db: Session = Depends(get_db)):
    """
    Delete an interior work permit record by its ID.
    """
    db_permit = db.query(InteriorWorkPermitDB).filter(InteriorWorkPermitDB.id == permit_id).first()
    if db_permit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interior work permit not found")
    
    db.delete(db_permit)
    db.commit()
    return {"ok": True}