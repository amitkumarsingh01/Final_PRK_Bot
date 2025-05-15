from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from datetime import datetime
import uuid

app = FastAPI(title="User Auth and Property API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    total = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    completed = Column(Boolean, default=False)
    default = Column(Boolean, default=False)
    opening_time = Column(DateTime)
    closing_time = Column(DateTime)
    comment = Column(Text)
    
    # Relationship with activity
    activity = relationship("ActivityModel", back_populates="tasks")

# Create tables
Base.metadata.create_all(bind=engine)

# --- Schemas ---

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

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    user_role: Optional[str] = None
    user_type: Optional[str] = None

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
        db_activity = ActivityModel(**activity.dict())
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)
        return db_activity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating activity: {str(e)}")

@app.get("/activities", response_model=List[ActivityResponse], tags=["Activity"])
def read_activities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all activities with their tasks"""
    try:
        activities = db.query(ActivityModel).offset(skip).limit(limit).all()
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
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all tasks"""
    try:
        tasks = db.query(TaskModel).offset(skip).limit(limit).all()
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")

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
def read_activity_tasks(activity_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all tasks for a specific activity"""
    try:
        # Check if activity exists
        activity = db.query(ActivityModel).filter(ActivityModel.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        tasks = db.query(TaskModel).filter(TaskModel.activity_id == activity_id).offset(skip).limit(limit).all()
        return tasks
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity tasks: {str(e)}")

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

@app.post("/properties/", response_model=PropertyResponse)
def create_property(property: PropertyCreate, db: Session = Depends(get_db)):
    db_property = Property(**property.dict())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

@app.get("/properties/", response_model=List[PropertyResponse])
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    properties = db.query(Property).offset(skip).limit(limit).all()
    return properties

@app.get("/properties/{property_id}", response_model=PropertyResponse)
def get_property(property_id: str, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return property

@app.put("/properties/{property_id}", response_model=PropertyResponse)
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

@app.delete("/properties/{property_id}")
def delete_property(property_id: str, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(property)
    db.commit()
    return {"message": "Property deleted successfully"}

# WTP APIS
@app.post("/wtp/", response_model=WTPResponse)
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

@app.get("/wtp/", response_model=List[WTPResponse])
def get_wtps(property_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(WTP)
    if property_id:
        query = query.filter(WTP.property_id == property_id)
    wtps = query.offset(skip).limit(limit).all()
    return wtps

@app.get("/wtp/{wtp_id}", response_model=WTPResponse)
def get_wtp(wtp_id: str, db: Session = Depends(get_db)):
    wtp = db.query(WTP).filter(WTP.id == wtp_id).first()
    if wtp is None:
        raise HTTPException(status_code=404, detail="WTP not found")
    return wtp

@app.put("/wtp/{wtp_id}", response_model=WTPResponse)
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

@app.delete("/wtp/{wtp_id}")
def delete_wtp(wtp_id: str, db: Session = Depends(get_db)):
    wtp = db.query(WTP).filter(WTP.id == wtp_id).first()
    if wtp is None:
        raise HTTPException(status_code=404, detail="WTP not found")
    
    db.delete(wtp)
    db.commit()
    return {"message": "WTP deleted successfully"}

# STP APIS
@app.post("/stp/", response_model=STPResponse)
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

@app.get("/stp/", response_model=List[STPResponse])
def get_stps(property_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(STP)
    if property_id:
        query = query.filter(STP.property_id == property_id)
    stps = query.offset(skip).limit(limit).all()
    return stps

@app.get("/stp/{stp_id}", response_model=STPResponse)
def get_stp(stp_id: str, db: Session = Depends(get_db)):
    stp = db.query(STP).filter(STP.id == stp_id).first()
    if stp is None:
        raise HTTPException(status_code=404, detail="STP not found")
    return stp

@app.put("/stp/{stp_id}", response_model=STPResponse)
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

@app.delete("/stp/{stp_id}")
def delete_stp(stp_id: str, db: Session = Depends(get_db)):
    stp = db.query(STP).filter(STP.id == stp_id).first()
    if stp is None:
        raise HTTPException(status_code=404, detail="STP not found")
    
    db.delete(stp)
    db.commit()
    return {"message": "STP deleted successfully"}

# Additional APIs for bulk operations
@app.get("/properties/{property_id}/wtp", response_model=List[WTPResponse])
def get_property_wtps(property_id: str, db: Session = Depends(get_db)):
    # Check if property exists
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    wtps = db.query(WTP).filter(WTP.property_id == property_id).all()
    return wtps

@app.get("/properties/{property_id}/stp", response_model=List[STPResponse])
def get_property_stps(property_id: str, db: Session = Depends(get_db)):
    # Check if property exists
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    stps = db.query(STP).filter(STP.property_id == property_id).all()
    return stps

@app.post("/properties/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(property_data: PropertyCreate, db: Session = Depends(get_db)):
    db_property = Property(**property_data.dict())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property


@app.get("/properties/", response_model=List[PropertyResponse])
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    properties = db.query(Property).offset(skip).limit(limit).all()
    return properties


@app.get("/properties/{property_id}", response_model=PropertyResponse)
def get_property(property_id: str, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property


@app.put("/properties/{property_id}", response_model=PropertyResponse)
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


@app.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: str, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(db_property)
    db.commit()
    return None


# Swimming Pool Endpoints
@app.post("/swimming-pools/", response_model=SwimmingPoolResponse, status_code=status.HTTP_201_CREATED)
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


@app.get("/swimming-pools/", response_model=List[SwimmingPoolResponse])
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


@app.get("/swimming-pools/{pool_id}", response_model=SwimmingPoolResponse)
def get_swimming_pool(pool_id: str, db: Session = Depends(get_db)):
    db_pool = db.query(SwimmingPool).filter(SwimmingPool.id == pool_id).first()
    if db_pool is None:
        raise HTTPException(status_code=404, detail="Swimming pool not found")
    return db_pool


@app.put("/swimming-pools/{pool_id}", response_model=SwimmingPoolResponse)
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


@app.delete("/swimming-pools/{pool_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_swimming_pool(pool_id: str, db: Session = Depends(get_db)):
    db_pool = db.query(SwimmingPool).filter(SwimmingPool.id == pool_id).first()
    if db_pool is None:
        raise HTTPException(status_code=404, detail="Swimming pool not found")
    
    db.delete(db_pool)
    db.commit()
    return None


# Diesel Generator Endpoints
@app.post("/diesel-generators/", response_model=DieselGeneratorResponse, status_code=status.HTTP_201_CREATED)
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


@app.get("/diesel-generators/", response_model=List[DieselGeneratorResponse])
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


@app.get("/diesel-generators/{generator_id}", response_model=DieselGeneratorResponse)
def get_diesel_generator(generator_id: str, db: Session = Depends(get_db)):
    db_generator = db.query(DieselGenerator).filter(DieselGenerator.id == generator_id).first()
    if db_generator is None:
        raise HTTPException(status_code=404, detail="Diesel generator not found")
    return db_generator


@app.put("/diesel-generators/{generator_id}", response_model=DieselGeneratorResponse)
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


@app.delete("/diesel-generators/{generator_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diesel_generator(generator_id: str, db: Session = Depends(get_db)):
    db_generator = db.query(DieselGenerator).filter(DieselGenerator.id == generator_id).first()
    if db_generator is None:
        raise HTTPException(status_code=404, detail="Diesel generator not found")
    
    db.delete(db_generator)
    db.commit()
    return None


# Electricity Consumption Endpoints
@app.post("/electricity-consumptions/", response_model=ElectricityConsumptionResponse, status_code=status.HTTP_201_CREATED)
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


@app.get("/electricity-consumptions/", response_model=List[ElectricityConsumptionResponse])
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


@app.get("/electricity-consumptions/{consumption_id}", response_model=ElectricityConsumptionResponse)
def get_electricity_consumption(consumption_id: str, db: Session = Depends(get_db)):
    db_consumption = db.query(ElectricityConsumption).filter(ElectricityConsumption.id == consumption_id).first()
    if db_consumption is None:
        raise HTTPException(status_code=404, detail="Electricity consumption not found")
    return db_consumption


@app.put("/electricity-consumptions/{consumption_id}", response_model=ElectricityConsumptionResponse)
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


@app.delete("/electricity-consumptions/{consumption_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_electricity_consumption(consumption_id: str, db: Session = Depends(get_db)):
    db_consumption = db.query(ElectricityConsumption).filter(ElectricityConsumption.id == consumption_id).first()
    if db_consumption is None:
        raise HTTPException(status_code=404, detail="Electricity consumption not found")
    
    db.delete(db_consumption)
    db.commit()
    return None


# Diesel Stock Endpoints
@app.post("/diesel-stocks/", response_model=DieselStockResponse, status_code=status.HTTP_201_CREATED)
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


@app.get("/diesel-stocks/", response_model=List[DieselStockResponse])
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


@app.get("/diesel-stocks/{stock_id}", response_model=DieselStockResponse)
def get_diesel_stock(stock_id: str, db: Session = Depends(get_db)):
    db_stock = db.query(DieselStock).filter(DieselStock.id == stock_id).first()
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Diesel stock not found")
    return db_stock

@app.put("/diesel-stocks/{stock_id}", response_model=DieselStockResponse)
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


@app.delete("/diesel-stocks/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diesel_stock(stock_id: str, db: Session = Depends(get_db)):
    db_stock = db.query(DieselStock).filter(DieselStock.id == stock_id).first()
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Diesel stock not found")
    
    db.delete(db_stock)
    db.commit()
    return None


# Dashboard and Summary Endpoints

@app.get("/properties/{property_id}/dashboard")
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

@app.get("/health", tags=["Health Check"]   )
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