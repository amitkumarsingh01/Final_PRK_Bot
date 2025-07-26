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
class InwardNonReturnableResponse(InwardNonReturnableSchema): id: str; report_id: str
class InwardReturnableResponse(InwardReturnableSchema): id: str; report_id: str
class OutwardNonReturnableResponse(OutwardNonReturnableSchema): id: str; report_id: str
class OutwardReturnableResponse(OutwardReturnableSchema): id: str; report_id: str
class MoveInResponse(MoveInSchema): id: str; report_id: str
class MoveOutResponse(MoveOutSchema): id: str; report_id: str
class InteriorWorkTrackingResponse(InteriorWorkTrackingSchema): id: str; report_id: str
class WorkPermitIssuanceResponse(WorkPermitIssuanceSchema): id: str; report_id: str
class GatePassManagementResponse(GatePassManagementSchema): id: str; report_id: str
class BlocklistManagementResponse(BlocklistManagementSchema): id: str; report_id: str
class DailyEntryDetailsResponse(DailyEntryDetailsSchema): id: str; report_id: str
class WaterTankerManagementResponse(WaterTankerManagementSchema): id: str; report_id: str
class VendorEntryManagementResponse(VendorEntryManagementSchema): id: str; report_id: str
class StaffEntryManagementResponse(StaffEntryManagementSchema): id: str; report_id: str
class EmergencyContactDetailsResponse(EmergencyContactDetailsSchema): id: str; report_id: str
class VisitorManagementLogResponse(VisitorManagementLogSchema): id: str; report_id: str

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
        for field, model in MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(report_id=db_report.id, **entry_data.dict())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return db_report

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
        return reports

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
    return report


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
        for field, model in MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                # Delete all existing entries of this type for the report.
                db.query(model).filter(model.report_id == report_id).delete(synchronize_session=False)
                # Create the new entries from the payload.
                for entry_data in update_entries:
                    db_entry = model(report_id=report_id, **entry_data.dict())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return db_report
        
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
class TicketResponse(TicketSchema): id: str; community_report_id: str
class TicketAssignmentResponse(TicketAssignmentSchema): id: str; community_report_id: str
class NoticeResponse(NoticeSchema): id: str; community_report_id: str
class ParkingStickerResponse(ParkingStickerSchema): id: str; community_report_id: str
class AnnouncementResponse(AnnouncementSchema): id: str; community_report_id: str
class MoveInCoordinationResponse(MoveInCoordinationSchema): id: str; community_report_id: str
class MoveOutCoordinationResponse(MoveOutCoordinationSchema): id: str; community_report_id: str
class InteriorWorkApprovalResponse(InteriorWorkApprovalSchema): id: str; community_report_id: str
class WorkPermitTrackingResponse(WorkPermitTrackingSchema): id: str; community_report_id: str

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

Base.metadata.create_all(bind=engine)

MODEL_MAP = {
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

        for field, model in MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(community_report_id=db_report.id, **entry_data.dict())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return db_report
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
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/community-reports/{report_id}", response_model=CommunityReportResponse, tags=["Community Management Report"])
def get_community_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(CommunityReport).filter(CommunityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Community report not found")
    return report

@app.put("/community-reports/{report_id}", response_model=CommunityReportResponse, tags=["Community Management Report"])
def update_community_report(report_id: str, report_update: CommunityReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(CommunityReport).filter(CommunityReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Community report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, model in MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.community_report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(community_report_id=report_id, **entry_data.dict())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return db_report
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
class InventoryItemResponse(InventoryItemSchema): id: str; inventory_report_id: str
class StockTransactionResponse(StockTransactionSchema): id: str; inventory_report_id: str
class MinMaxLevelResponse(MinMaxLevelSchema): id: str; inventory_report_id: str
class ConsumptionReportResponse(ConsumptionReportSchema): id: str; inventory_report_id: str
class ExpiryDamageLogResponse(ExpiryDamageLogSchema): id: str; inventory_report_id: str

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


Base.metadata.create_all(bind=engine)

MODEL_MAP = {
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

        for field, model in MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(inventory_report_id=db_report.id, **entry_data.dict())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return db_report
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
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/inventory-reports/{report_id}", response_model=InventoryReportResponse, tags=["Inventory Management Report"])
def get_inventory_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(InventoryReport).filter(InventoryReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Inventory report not found")
    return report

@app.put("/inventory-reports/{report_id}", response_model=InventoryReportResponse, tags=["Inventory Management Report"])
def update_inventory_report(report_id: str, report_update: InventoryReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(InventoryReport).filter(InventoryReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Inventory report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, model in MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.inventory_report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(inventory_report_id=report_id, **entry_data.dict())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return db_report
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
    assets = relationship("Asset", backref="report", cascade="all, delete-orphan")
    movement_logs = relationship("AssetMovementLog", backref="report", cascade="all, delete-orphan")
    amc_warranties = relationship("AmcWarranty", backref="report", cascade="all, delete-orphan")
    maintenance_schedules = relationship("MaintenanceSchedule", backref="report", cascade="all, delete-orphan")
    audits = relationship("AssetAudit", backref="report", cascade="all, delete-orphan")
    depreciations = relationship("Depreciation", backref="report", cascade="all, delete-orphan")

# --- Child Entry Models ---
class Asset(Base):
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
    __tablename__ = 'maintenance_schedules'
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
class AssetResponse(AssetSchema): id: str; asset_report_id: str
class AssetMovementLogResponse(AssetMovementLogSchema): id: str; asset_report_id: str
class AmcWarrantyResponse(AmcWarrantySchema): id: str; asset_report_id: str
class MaintenanceScheduleResponse(MaintenanceScheduleSchema): id: str; asset_report_id: str
class AssetAuditResponse(AssetAuditSchema): id: str; asset_report_id: str
class DepreciationResponse(DepreciationSchema): id: str; asset_report_id: str

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

Base.metadata.create_all(bind=engine)

MODEL_MAP = {
    "assets": Asset,
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

        for field, model in MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(asset_report_id=db_report.id, **entry_data.dict())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return db_report
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
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/asset-reports/{report_id}", response_model=AssetReportResponse, tags=["Asset Management Report"])
def get_asset_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(AssetReport).filter(AssetReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Asset report not found")
    return report

@app.put("/asset-reports/{report_id}", response_model=AssetReportResponse, tags=["Asset Management Report"])
def update_asset_report(report_id: str, report_update: AssetReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(AssetReport).filter(AssetReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Asset report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, model in MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.asset_report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(asset_report_id=report_id, **entry_data.dict())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return db_report
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
class QualityPlanResponse(QualityPlanSchema): id: str; quality_report_id: str
class ProcessSetupResponse(ProcessSetupSchema): id: str; quality_report_id: str
class QualityAssuranceResponse(QualityAssuranceSchema): id: str; quality_report_id: str
class QualityControlResponse(QualityControlSchema): id: str; quality_report_id: str
class PerformanceMonitorResponse(PerformanceMonitorSchema): id: str; quality_report_id: str
class QualityDocumentResponse(QualityDocumentSchema): id: str; quality_report_id: str

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


Base.metadata.create_all(bind=engine)

MODEL_MAP = {
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

        for field, model in MODEL_MAP.items():
            entries = getattr(report, field, [])
            if entries:
                for entry_data in entries:
                    db_entry = model(quality_report_id=db_report.id, **entry_data.dict())
                    db.add(db_entry)
        
        db.commit()
        db.refresh(db_report)
        return db_report
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
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@app.get("/quality-reports/{report_id}", response_model=QualityReportResponse, tags=["Quality Management Report"])
def get_quality_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(QualityReport).filter(QualityReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Quality report not found")
    return report

@app.put("/quality-reports/{report_id}", response_model=QualityReportResponse, tags=["Quality Management Report"])
def update_quality_report(report_id: str, report_update: QualityReportUpdate, db: Session = Depends(get_db)):
    db_report = db.query(QualityReport).filter(QualityReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Quality report not found")

    try:
        if report_update.property_id:
            db_report.property_id = report_update.property_id

        for field, model in MODEL_MAP.items():
            update_entries = getattr(report_update, field, None)
            if update_entries is not None:
                db.query(model).filter(model.quality_report_id == report_id).delete(synchronize_session=False)
                for entry_data in update_entries:
                    db_entry = model(quality_report_id=report_id, **entry_data.dict())
                    db.add(db_entry)
        
        db_report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_report)
        return db_report
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

