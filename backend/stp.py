from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from datetime import datetime
import uuid

app = FastAPI(title="Water Quality Monitoring System API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = "sqlite:///./water_quality.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Property(Base):
    __tablename__ = "properties"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    address = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    phases = relationship("Phase", back_populates="property", cascade="all, delete-orphan")

class Phase(Base):
    __tablename__ = "phases"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    property = relationship("Property", back_populates="phases")
    water_quality_records = relationship("WaterQuality", back_populates="phase", cascade="all, delete-orphan")
    meter_readings = relationship("MeterReading", back_populates="phase", cascade="all, delete-orphan")
    tank_levels = relationship("TankLevel", back_populates="phase", cascade="all, delete-orphan")
    air_quality_records = relationship("AirQuality", back_populates="phase", cascade="all, delete-orphan")

class WaterQuality(Base):
    __tablename__ = "water_quality"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phase_id = Column(String, ForeignKey("phases.id", ondelete="CASCADE"), nullable=False)
    tank1_mlss = Column(Float)
    tank2_mlss = Column(Float)
    ph = Column(Float)
    chlorine = Column(Float)
    smell = Column(String)
    record_date = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    phase = relationship("Phase", back_populates="water_quality_records")

class MeterReading(Base):
    __tablename__ = "meter_readings"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phase_id = Column(String, ForeignKey("phases.id", ondelete="CASCADE"), nullable=False)
    energy_consumption = Column(Float, default=0)
    energy_consumption_previous = Column(Float)
    energy_consumption_current = Column(Float)
    raw_sewage_flow = Column(Float, default=0)
    raw_sewage_flow_previous = Column(Float)
    raw_sewage_flow_current = Column(Float)
    treated_water = Column(Float, default=0)
    treated_water_previous = Column(Float)
    treated_water_current = Column(Float)
    previous_date = Column(DateTime)
    current_date = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    phase = relationship("Phase", back_populates="meter_readings")

class TankLevel(Base):
    __tablename__ = "tank_levels"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phase_id = Column(String, ForeignKey("phases.id", ondelete="CASCADE"), nullable=False)
    raw_sewage_tank = Column(Float)  # Percentage
    filter_feed_tank = Column(Float)  # Percentage
    flush_water_tank = Column(Float)  # Percentage
    record_date = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    phase = relationship("Phase", back_populates="tank_levels")

class AirQuality(Base):
    __tablename__ = "air_quality"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phase_id = Column(String, ForeignKey("phases.id", ondelete="CASCADE"), nullable=False)
    smell = Column(String)
    record_date = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    phase = relationship("Phase", back_populates="air_quality_records")

# Create all tables
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for request/response
class PropertyBase(BaseModel):
    name: str
    address: str

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class PhaseBase(BaseModel):
    name: str
    property_id: str

class PhaseCreate(PhaseBase):
    pass

class PhaseResponse(PhaseBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class WaterQualityBase(BaseModel):
    tank1_mlss: float
    tank2_mlss: float
    ph: float
    chlorine: float
    smell: str
    record_date: datetime = Field(default_factory=datetime.now)

class WaterQualityCreate(WaterQualityBase):
    pass

class WaterQualityResponse(WaterQualityBase):
    id: str
    phase_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class MeterReadingBase(BaseModel):
    energy_consumption_previous: float
    energy_consumption_current: float
    raw_sewage_flow_previous: float
    raw_sewage_flow_current: float
    treated_water_previous: float
    treated_water_current: float
    previous_date: datetime
    current_date: datetime = Field(default_factory=datetime.now)

class MeterReadingCreate(MeterReadingBase):
    pass

class MeterReadingResponse(BaseModel):
    id: str
    phase_id: str
    energy_consumption: float
    energy_consumption_previous: float
    energy_consumption_current: float
    raw_sewage_flow: float
    raw_sewage_flow_previous: float
    raw_sewage_flow_current: float
    treated_water: float
    treated_water_previous: float
    treated_water_current: float
    previous_date: datetime
    current_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class TankLevelBase(BaseModel):
    raw_sewage_tank: float  # Percentage
    filter_feed_tank: float  # Percentage
    flush_water_tank: float  # Percentage
    record_date: datetime = Field(default_factory=datetime.now)

class TankLevelCreate(TankLevelBase):
    pass

class TankLevelResponse(TankLevelBase):
    id: str
    phase_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class AirQualityBase(BaseModel):
    smell: str
    record_date: datetime = Field(default_factory=datetime.now)

class AirQualityCreate(AirQualityBase):
    pass

class AirQualityResponse(AirQualityBase):
    id: str
    phase_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# API Routes for Properties
@app.post("/properties/", response_model=PropertyResponse)
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
def update_property(property_id: str, property_data: PropertyCreate, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    for key, value in property_data.dict().items():
        setattr(db_property, key, value)
    
    db_property.updated_at = datetime.now()
    db.commit()
    db.refresh(db_property)
    return db_property

@app.delete("/properties/{property_id}")
def delete_property(property_id: str, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(db_property)
    db.commit()
    return {"message": "Property deleted successfully"}

# API Routes for Phases
@app.post("/phases/", response_model=PhaseResponse)
def create_phase(phase_data: PhaseCreate, db: Session = Depends(get_db)):
    # Verify property exists
    db_property = db.query(Property).filter(Property.id == phase_data.property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db_phase = Phase(**phase_data.dict())
    db.add(db_phase)
    db.commit()
    db.refresh(db_phase)
    return db_phase

@app.get("/phases/", response_model=List[PhaseResponse])
def get_phases(property_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Phase)
    if property_id:
        query = query.filter(Phase.property_id == property_id)
    phases = query.offset(skip).limit(limit).all()
    return phases

@app.get("/phases/{phase_id}", response_model=PhaseResponse)
def get_phase(phase_id: str, db: Session = Depends(get_db)):
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    return db_phase

@app.put("/phases/{phase_id}", response_model=PhaseResponse)
def update_phase(phase_id: str, phase_data: PhaseCreate, db: Session = Depends(get_db)):
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    # Verify property exists if property_id is being updated
    if phase_data.property_id != db_phase.property_id:
        db_property = db.query(Property).filter(Property.id == phase_data.property_id).first()
        if db_property is None:
            raise HTTPException(status_code=404, detail="Property not found")
    
    for key, value in phase_data.dict().items():
        setattr(db_phase, key, value)
    
    db_phase.updated_at = datetime.now()
    db.commit()
    db.refresh(db_phase)
    return db_phase

@app.delete("/phases/{phase_id}")
def delete_phase(phase_id: str, db: Session = Depends(get_db)):
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db.delete(db_phase)
    db.commit()
    return {"message": "Phase deleted successfully"}

# API Routes for Water Quality
@app.post("/water-quality/", response_model=WaterQualityResponse)
def create_water_quality(water_quality_data: WaterQualityCreate, phase_id: str, db: Session = Depends(get_db)):
    # Verify phase exists
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db_water_quality = WaterQuality(**water_quality_data.dict(), phase_id=phase_id)
    db.add(db_water_quality)
    db.commit()
    db.refresh(db_water_quality)
    return db_water_quality

@app.get("/water-quality/", response_model=List[WaterQualityResponse])
def get_water_quality_records(phase_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(WaterQuality)
    if phase_id:
        query = query.filter(WaterQuality.phase_id == phase_id)
    records = query.order_by(WaterQuality.record_date.desc()).offset(skip).limit(limit).all()
    return records

@app.get("/water-quality/{record_id}", response_model=WaterQualityResponse)
def get_water_quality(record_id: str, db: Session = Depends(get_db)):
    db_record = db.query(WaterQuality).filter(WaterQuality.id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Water quality record not found")
    return db_record

@app.put("/water-quality/{record_id}", response_model=WaterQualityResponse)
def update_water_quality(record_id: str, water_quality_data: WaterQualityCreate, db: Session = Depends(get_db)):
    db_record = db.query(WaterQuality).filter(WaterQuality.id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Water quality record not found")
    
    for key, value in water_quality_data.dict().items():
        setattr(db_record, key, value)
    
    db_record.updated_at = datetime.now()
    db.commit()
    db.refresh(db_record)
    return db_record

@app.delete("/water-quality/{record_id}")
def delete_water_quality(record_id: str, db: Session = Depends(get_db)):
    db_record = db.query(WaterQuality).filter(WaterQuality.id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Water quality record not found")
    
    db.delete(db_record)
    db.commit()
    return {"message": "Water quality record deleted successfully"}

# API Routes for Meter Readings
@app.post("/meter-readings/", response_model=MeterReadingResponse)
def create_meter_reading(meter_reading_data: MeterReadingCreate, phase_id: str, db: Session = Depends(get_db)):
    # Verify phase exists
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    # Calculate consumption values
    energy_consumption = meter_reading_data.energy_consumption_current - meter_reading_data.energy_consumption_previous
    raw_sewage_flow = meter_reading_data.raw_sewage_flow_current - meter_reading_data.raw_sewage_flow_previous
    treated_water = meter_reading_data.treated_water_current - meter_reading_data.treated_water_previous
    
    db_meter_reading = MeterReading(
        phase_id=phase_id,
        energy_consumption=energy_consumption,
        energy_consumption_previous=meter_reading_data.energy_consumption_previous,
        energy_consumption_current=meter_reading_data.energy_consumption_current,
        raw_sewage_flow=raw_sewage_flow,
        raw_sewage_flow_previous=meter_reading_data.raw_sewage_flow_previous,
        raw_sewage_flow_current=meter_reading_data.raw_sewage_flow_current,
        treated_water=treated_water,
        treated_water_previous=meter_reading_data.treated_water_previous,
        treated_water_current=meter_reading_data.treated_water_current,
        previous_date=meter_reading_data.previous_date,
        current_date=meter_reading_data.current_date
    )
    
    db.add(db_meter_reading)
    db.commit()
    db.refresh(db_meter_reading)
    return db_meter_reading

@app.get("/meter-readings/", response_model=List[MeterReadingResponse])
def get_meter_readings(phase_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(MeterReading)
    if phase_id:
        query = query.filter(MeterReading.phase_id == phase_id)
    readings = query.order_by(MeterReading.current_date.desc()).offset(skip).limit(limit).all()
    return readings

@app.get("/meter-readings/{reading_id}", response_model=MeterReadingResponse)
def get_meter_reading(reading_id: str, db: Session = Depends(get_db)):
    db_reading = db.query(MeterReading).filter(MeterReading.id == reading_id).first()
    if db_reading is None:
        raise HTTPException(status_code=404, detail="Meter reading not found")
    return db_reading

@app.put("/meter-readings/{reading_id}", response_model=MeterReadingResponse)
def update_meter_reading(reading_id: str, meter_reading_data: MeterReadingCreate, db: Session = Depends(get_db)):
    db_reading = db.query(MeterReading).filter(MeterReading.id == reading_id).first()
    if db_reading is None:
        raise HTTPException(status_code=404, detail="Meter reading not found")
    
    # Calculate consumption values
    energy_consumption = meter_reading_data.energy_consumption_current - meter_reading_data.energy_consumption_previous
    raw_sewage_flow = meter_reading_data.raw_sewage_flow_current - meter_reading_data.raw_sewage_flow_previous
    treated_water = meter_reading_data.treated_water_current - meter_reading_data.treated_water_previous
    
    db_reading.energy_consumption = energy_consumption
    db_reading.energy_consumption_previous = meter_reading_data.energy_consumption_previous
    db_reading.energy_consumption_current = meter_reading_data.energy_consumption_current
    db_reading.raw_sewage_flow = raw_sewage_flow
    db_reading.raw_sewage_flow_previous = meter_reading_data.raw_sewage_flow_previous
    db_reading.raw_sewage_flow_current = meter_reading_data.raw_sewage_flow_current
    db_reading.treated_water = treated_water
    db_reading.treated_water_previous = meter_reading_data.treated_water_previous
    db_reading.treated_water_current = meter_reading_data.treated_water_current
    db_reading.previous_date = meter_reading_data.previous_date
    db_reading.current_date = meter_reading_data.current_date
    db_reading.updated_at = datetime.now()
    
    db.commit()
    db.refresh(db_reading)
    return db_reading

@app.delete("/meter-readings/{reading_id}")
def delete_meter_reading(reading_id: str, db: Session = Depends(get_db)):
    db_reading = db.query(MeterReading).filter(MeterReading.id == reading_id).first()
    if db_reading is None:
        raise HTTPException(status_code=404, detail="Meter reading not found")
    
    db.delete(db_reading)
    db.commit()
    return {"message": "Meter reading deleted successfully"}

# API Routes for Tank Levels
@app.post("/tank-levels/", response_model=TankLevelResponse)
def create_tank_level(tank_level_data: TankLevelCreate, phase_id: str, db: Session = Depends(get_db)):
    # Verify phase exists
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db_tank_level = TankLevel(**tank_level_data.dict(), phase_id=phase_id)
    db.add(db_tank_level)
    db.commit()
    db.refresh(db_tank_level)
    return db_tank_level

@app.get("/tank-levels/", response_model=List[TankLevelResponse])
def get_tank_levels(phase_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(TankLevel)
    if phase_id:
        query = query.filter(TankLevel.phase_id == phase_id)
    levels = query.order_by(TankLevel.record_date.desc()).offset(skip).limit(limit).all()
    return levels

@app.get("/tank-levels/{level_id}", response_model=TankLevelResponse)
def get_tank_level(level_id: str, db: Session = Depends(get_db)):
    db_level = db.query(TankLevel).filter(TankLevel.id == level_id).first()
    if db_level is None:
        raise HTTPException(status_code=404, detail="Tank level record not found")
    return db_level

@app.put("/tank-levels/{level_id}", response_model=TankLevelResponse)
def update_tank_level(level_id: str, tank_level_data: TankLevelCreate, db: Session = Depends(get_db)):
    db_level = db.query(TankLevel).filter(TankLevel.id == level_id).first()
    if db_level is None:
        raise HTTPException(status_code=404, detail="Tank level record not found")
    
    for key, value in tank_level_data.dict().items():
        setattr(db_level, key, value)
    
    db_level.updated_at = datetime.now()
    db.commit()
    db.refresh(db_level)
    return db_level

@app.delete("/tank-levels/{level_id}")
def delete_tank_level(level_id: str, db: Session = Depends(get_db)):
    db_level = db.query(TankLevel).filter(TankLevel.id == level_id).first()
    if db_level is None:
        raise HTTPException(status_code=404, detail="Tank level record not found")
    
    db.delete(db_level)
    db.commit()
    return {"message": "Tank level record deleted successfully"}

# API Routes for Air Quality
@app.post("/air-quality/", response_model=AirQualityResponse)
def create_air_quality(air_quality_data: AirQualityCreate, phase_id: str, db: Session = Depends(get_db)):
    # Verify phase exists
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db_air_quality = AirQuality(**air_quality_data.dict(), phase_id=phase_id)
    db.add(db_air_quality)
    db.commit()
    db.refresh(db_air_quality)
    return db_air_quality

@app.get("/air-quality/", response_model=List[AirQualityResponse])
def get_air_quality_records(phase_id: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(AirQuality)
    if phase_id:
        query = query.filter(AirQuality.phase_id == phase_id)
    records = query.order_by(AirQuality.record_date.desc()).offset(skip).limit(limit).all()
    return records

@app.get("/air-quality/{record_id}", response_model=AirQualityResponse)
def get_air_quality(record_id: str, db: Session = Depends(get_db)):
    db_record = db.query(AirQuality).filter(AirQuality.id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Air quality record not found")
    return db_record

@app.put("/air-quality/{record_id}", response_model=AirQualityResponse)
def update_air_quality(record_id: str, air_quality_data: AirQualityCreate, db: Session = Depends(get_db)):
    db_record = db.query(AirQuality).filter(AirQuality.id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Air quality record not found")
    
    for key, value in air_quality_data.dict().items():
        setattr(db_record, key, value)
    
    db_record.updated_at = datetime.now()
    db.commit()
    db.refresh(db_record)
    return db_record

@app.delete("/air-quality/{record_id}")
def delete_air_quality(record_id: str, db: Session = Depends(get_db)):
    db_record = db.query(AirQuality).filter(AirQuality.id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Air quality record not found")
    
    db.delete(db_record)
    db.commit()
    return {"message": "Air quality record deleted successfully"}

# Dashboard data endpoint
@app.get("/dashboard/{phase_id}")
def get_dashboard_data(phase_id: str, db: Session = Depends(get_db)):
    # Verify phase exists
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    # Get latest water quality record
    latest_water_quality = db.query(WaterQuality).filter(
        WaterQuality.phase_id == phase_id
    ).order_by(WaterQuality.record_date.desc()).first()
    
    # Get latest meter readings
    latest_meter_reading = db.query(MeterReading).filter(
        MeterReading.phase_id == phase_id
    ).order_by(MeterReading.current_date.desc()).first()
    
    # Get latest tank levels
    latest_tank_levels = db.query(TankLevel).filter(
        TankLevel.phase_id == phase_id
    ).order_by(TankLevel.record_date.desc()).first()
    
    # Get latest air quality record
    latest_air_quality = db.query(AirQuality).filter(
        AirQuality.phase_id == phase_id
    ).order_by(AirQuality.record_date.desc()).first()
    
    return {
        "water_quality": latest_water_quality,
        "meter_readings": latest_meter_reading,
        "tank_levels": latest_tank_levels,
        "air_quality": latest_air_quality
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)