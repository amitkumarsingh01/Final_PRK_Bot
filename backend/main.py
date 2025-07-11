from fastapi import FastAPI, HTTPException, Depends, Query, status, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Boolean, Text, ForeignKey, Float
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

# Pydantic models for request/response

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
        return {"user_id": user.user_id, "token": token, "status": user.status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")

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