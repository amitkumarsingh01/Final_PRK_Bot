from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from datetime import datetime
import uuid

app = FastAPI(title="Property Phase Management API")

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

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database models
class Property(Base):
    __tablename__ = "properties"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    phases = relationship("Phase", back_populates="property")

class Phase(Base):
    __tablename__ = "phases"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id"))
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    property = relationship("Property", back_populates="phases")
    sump_levels = relationship("SumpLevel", back_populates="phase")
    water_qualities = relationship("WaterQuality", back_populates="phase")
    meter_readings = relationship("MeterReading", back_populates="phase")
    salt_usages = relationship("SaltUsage", back_populates="phase")

class SumpLevel(Base):
    __tablename__ = "sump_levels"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phase_id = Column(String, ForeignKey("phases.id"))
    raw_sump = Column(Integer)  # Percentage
    treated_water_sump = Column(Integer)  # Percentage
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    phase = relationship("Phase", back_populates="sump_levels")

class WaterQuality(Base):
    __tablename__ = "water_qualities"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phase_id = Column(String, ForeignKey("phases.id"))
    raw_water_hardness = Column(Integer)  # ppm
    treated_water_hardness_morning = Column(Integer)  # ppm
    treated_water_hardness_evening = Column(Integer)  # ppm
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    phase = relationship("Phase", back_populates="water_qualities")

class MeterReading(Base):
    __tablename__ = "meter_readings"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phase_id = Column(String, ForeignKey("phases.id"))
    treated_water = Column(Float)  # KL
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    phase = relationship("Phase", back_populates="meter_readings")

class SaltUsage(Base):
    __tablename__ = "salt_usages"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phase_id = Column(String, ForeignKey("phases.id"))
    todays_usage = Column(Integer)  # Number of bags
    stock = Column(Integer)  # Number of bags
    bag_weight = Column(Integer, default=50)  # Weight in Kg
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    phase = relationship("Phase", back_populates="salt_usages")

# Create all tables
Base.metadata.create_all(bind=engine)

# Pydantic models for request/response
class PropertyBase(BaseModel):
    name: str

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    id: str
    created_at: datetime
    
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
    
    class Config:
        orm_mode = True

class SumpLevelBase(BaseModel):
    raw_sump: int
    treated_water_sump: int

class SumpLevelCreate(SumpLevelBase):
    phase_id: str

class SumpLevelResponse(SumpLevelBase):
    id: str
    phase_id: str
    timestamp: datetime
    
    class Config:
        orm_mode = True

class WaterQualityBase(BaseModel):
    raw_water_hardness: int
    treated_water_hardness_morning: int
    treated_water_hardness_evening: int

class WaterQualityCreate(WaterQualityBase):
    phase_id: str

class WaterQualityResponse(WaterQualityBase):
    id: str
    phase_id: str
    timestamp: datetime
    
    class Config:
        orm_mode = True

class MeterReadingBase(BaseModel):
    treated_water: float

class MeterReadingCreate(MeterReadingBase):
    phase_id: str

class MeterReadingResponse(MeterReadingBase):
    id: str
    phase_id: str
    timestamp: datetime
    
    class Config:
        orm_mode = True

class SaltUsageBase(BaseModel):
    todays_usage: int
    stock: int
    bag_weight: Optional[int] = 50

class SaltUsageCreate(SaltUsageBase):
    phase_id: str

class SaltUsageResponse(SaltUsageBase):
    id: str
    phase_id: str
    timestamp: datetime
    
    class Config:
        orm_mode = True

class PhaseDashboardResponse(BaseModel):
    phase: PhaseResponse
    sump_levels: Optional[SumpLevelResponse] = None
    water_quality: Optional[WaterQualityResponse] = None
    meter_reading: Optional[MeterReadingResponse] = None
    salt_usage: Optional[SaltUsageResponse] = None
    
    class Config:
        orm_mode = True

# API Routes
# Property API routes
@app.post("/properties/", response_model=PropertyResponse, tags=["Properties"])
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
def update_property(property_id: str, property_data: PropertyCreate, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    for key, value in property_data.dict().items():
        setattr(db_property, key, value)
    
    db.commit()
    db.refresh(db_property)
    return db_property

@app.delete("/properties/{property_id}", tags=["Properties"])
def delete_property(property_id: str, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(db_property)
    db.commit()
    return {"message": "Property deleted successfully"}

# Phase API routes
@app.post("/phases/", response_model=PhaseResponse, tags=["Phases"])
def create_phase(phase_data: PhaseCreate, db: Session = Depends(get_db)):
    # Check if property exists
    db_property = db.query(Property).filter(Property.id == phase_data.property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db_phase = Phase(**phase_data.dict())
    db.add(db_phase)
    db.commit()
    db.refresh(db_phase)
    return db_phase

@app.get("/phases/", response_model=List[PhaseResponse], tags=["Phases"])
def get_phases(
    property_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(Phase)
    if property_id:
        query = query.filter(Phase.property_id == property_id)
    phases = query.offset(skip).limit(limit).all()
    return phases

@app.get("/phases/{phase_id}", response_model=PhaseResponse, tags=["Phases"])
def get_phase(phase_id: str, db: Session = Depends(get_db)):
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    return db_phase

@app.put("/phases/{phase_id}", response_model=PhaseResponse, tags=["Phases"])
def update_phase(phase_id: str, phase_data: PhaseCreate, db: Session = Depends(get_db)):
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    # Check if property exists
    db_property = db.query(Property).filter(Property.id == phase_data.property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    for key, value in phase_data.dict().items():
        setattr(db_phase, key, value)
    
    db.commit()
    db.refresh(db_phase)
    return db_phase

@app.delete("/phases/{phase_id}", tags=["Phases"])
def delete_phase(phase_id: str, db: Session = Depends(get_db)):
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db.delete(db_phase)
    db.commit()
    return {"message": "Phase deleted successfully"}

# Sump Level API routes
@app.post("/sump-levels/", response_model=SumpLevelResponse, tags=["Sump Levels"])
def create_sump_level(sump_level_data: SumpLevelCreate, db: Session = Depends(get_db)):
    # Check if phase exists
    db_phase = db.query(Phase).filter(Phase.id == sump_level_data.phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db_sump_level = SumpLevel(**sump_level_data.dict())
    db.add(db_sump_level)
    db.commit()
    db.refresh(db_sump_level)
    return db_sump_level

@app.get("/sump-levels/", response_model=List[SumpLevelResponse], tags=["Sump Levels"])
def get_sump_levels(
    phase_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(SumpLevel)
    if phase_id:
        query = query.filter(SumpLevel.phase_id == phase_id)
    sump_levels = query.order_by(SumpLevel.timestamp.desc()).offset(skip).limit(limit).all()
    return sump_levels

@app.get("/sump-levels/latest", response_model=SumpLevelResponse, tags=["Sump Levels"])
def get_latest_sump_level(phase_id: str, db: Session = Depends(get_db)):
    db_sump_level = db.query(SumpLevel).filter(
        SumpLevel.phase_id == phase_id
    ).order_by(SumpLevel.timestamp.desc()).first()
    
    if db_sump_level is None:
        raise HTTPException(status_code=404, detail="Sump level not found for this phase")
    return db_sump_level

@app.get("/sump-levels/{sump_level_id}", response_model=SumpLevelResponse, tags=["Sump Levels"])
def get_sump_level(sump_level_id: str, db: Session = Depends(get_db)):
    db_sump_level = db.query(SumpLevel).filter(SumpLevel.id == sump_level_id).first()
    if db_sump_level is None:
        raise HTTPException(status_code=404, detail="Sump level not found")
    return db_sump_level

@app.put("/sump-levels/{sump_level_id}", response_model=SumpLevelResponse, tags=["Sump Levels"])
def update_sump_level(sump_level_id: str, sump_level_data: SumpLevelCreate, db: Session = Depends(get_db)):
    db_sump_level = db.query(SumpLevel).filter(SumpLevel.id == sump_level_id).first()
    if db_sump_level is None:
        raise HTTPException(status_code=404, detail="Sump level not found")
    
    # Check if phase exists
    db_phase = db.query(Phase).filter(Phase.id == sump_level_data.phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    for key, value in sump_level_data.dict().items():
        setattr(db_sump_level, key, value)
    
    db.commit()
    db.refresh(db_sump_level)
    return db_sump_level

@app.delete("/sump-levels/{sump_level_id}", tags=["Sump Levels"])
def delete_sump_level(sump_level_id: str, db: Session = Depends(get_db)):
    db_sump_level = db.query(SumpLevel).filter(SumpLevel.id == sump_level_id).first()
    if db_sump_level is None:
        raise HTTPException(status_code=404, detail="Sump level not found")
    
    db.delete(db_sump_level)
    db.commit()
    return {"message": "Sump level deleted successfully"}

# Water Quality API routes
@app.post("/water-qualities/", response_model=WaterQualityResponse, tags=["Water Quality"])
def create_water_quality(water_quality_data: WaterQualityCreate, db: Session = Depends(get_db)):
    # Check if phase exists
    db_phase = db.query(Phase).filter(Phase.id == water_quality_data.phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db_water_quality = WaterQuality(**water_quality_data.dict())
    db.add(db_water_quality)
    db.commit()
    db.refresh(db_water_quality)
    return db_water_quality

@app.get("/water-qualities/", response_model=List[WaterQualityResponse], tags=["Water Quality"])
def get_water_qualities(
    phase_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(WaterQuality)
    if phase_id:
        query = query.filter(WaterQuality.phase_id == phase_id)
    water_qualities = query.order_by(WaterQuality.timestamp.desc()).offset(skip).limit(limit).all()
    return water_qualities

@app.get("/water-qualities/latest", response_model=WaterQualityResponse, tags=["Water Quality"])
def get_latest_water_quality(phase_id: str, db: Session = Depends(get_db)):
    db_water_quality = db.query(WaterQuality).filter(
        WaterQuality.phase_id == phase_id
    ).order_by(WaterQuality.timestamp.desc()).first()
    
    if db_water_quality is None:
        raise HTTPException(status_code=404, detail="Water quality not found for this phase")
    return db_water_quality

@app.get("/water-qualities/{water_quality_id}", response_model=WaterQualityResponse, tags=["Water Quality"])
def get_water_quality(water_quality_id: str, db: Session = Depends(get_db)):
    db_water_quality = db.query(WaterQuality).filter(WaterQuality.id == water_quality_id).first()
    if db_water_quality is None:
        raise HTTPException(status_code=404, detail="Water quality not found")
    return db_water_quality

@app.put("/water-qualities/{water_quality_id}", response_model=WaterQualityResponse, tags=["Water Quality"])
def update_water_quality(water_quality_id: str, water_quality_data: WaterQualityCreate, db: Session = Depends(get_db)):
    db_water_quality = db.query(WaterQuality).filter(WaterQuality.id == water_quality_id).first()
    if db_water_quality is None:
        raise HTTPException(status_code=404, detail="Water quality not found")
    
    # Check if phase exists
    db_phase = db.query(Phase).filter(Phase.id == water_quality_data.phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    for key, value in water_quality_data.dict().items():
        setattr(db_water_quality, key, value)
    
    db.commit()
    db.refresh(db_water_quality)
    return db_water_quality

@app.delete("/water-qualities/{water_quality_id}", tags=["Water Quality"])
def delete_water_quality(water_quality_id: str, db: Session = Depends(get_db)):
    db_water_quality = db.query(WaterQuality).filter(WaterQuality.id == water_quality_id).first()
    if db_water_quality is None:
        raise HTTPException(status_code=404, detail="Water quality not found")
    
    db.delete(db_water_quality)
    db.commit()
    return {"message": "Water quality deleted successfully"}

# Meter Reading API routes
@app.post("/meter-readings/", response_model=MeterReadingResponse, tags=["Meter Readings"])
def create_meter_reading(meter_reading_data: MeterReadingCreate, db: Session = Depends(get_db)):
    # Check if phase exists
    db_phase = db.query(Phase).filter(Phase.id == meter_reading_data.phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db_meter_reading = MeterReading(**meter_reading_data.dict())
    db.add(db_meter_reading)
    db.commit()
    db.refresh(db_meter_reading)
    return db_meter_reading

@app.get("/meter-readings/", response_model=List[MeterReadingResponse], tags=["Meter Readings"])
def get_meter_readings(
    phase_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(MeterReading)
    if phase_id:
        query = query.filter(MeterReading.phase_id == phase_id)
    meter_readings = query.order_by(MeterReading.timestamp.desc()).offset(skip).limit(limit).all()
    return meter_readings

@app.get("/meter-readings/latest", response_model=MeterReadingResponse, tags=["Meter Readings"])
def get_latest_meter_reading(phase_id: str, db: Session = Depends(get_db)):
    db_meter_reading = db.query(MeterReading).filter(
        MeterReading.phase_id == phase_id
    ).order_by(MeterReading.timestamp.desc()).first()
    
    if db_meter_reading is None:
        raise HTTPException(status_code=404, detail="Meter reading not found for this phase")
    return db_meter_reading

@app.get("/meter-readings/{meter_reading_id}", response_model=MeterReadingResponse, tags=["Meter Readings"])
def get_meter_reading(meter_reading_id: str, db: Session = Depends(get_db)):
    db_meter_reading = db.query(MeterReading).filter(MeterReading.id == meter_reading_id).first()
    if db_meter_reading is None:
        raise HTTPException(status_code=404, detail="Meter reading not found")
    return db_meter_reading

@app.put("/meter-readings/{meter_reading_id}", response_model=MeterReadingResponse, tags=["Meter Readings"])
def update_meter_reading(meter_reading_id: str, meter_reading_data: MeterReadingCreate, db: Session = Depends(get_db)):
    db_meter_reading = db.query(MeterReading).filter(MeterReading.id == meter_reading_id).first()
    if db_meter_reading is None:
        raise HTTPException(status_code=404, detail="Meter reading not found")
    
    # Check if phase exists
    db_phase = db.query(Phase).filter(Phase.id == meter_reading_data.phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    for key, value in meter_reading_data.dict().items():
        setattr(db_meter_reading, key, value)
    
    db.commit()
    db.refresh(db_meter_reading)
    return db_meter_reading

@app.delete("/meter-readings/{meter_reading_id}", tags=["Meter Readings"])
def delete_meter_reading(meter_reading_id: str, db: Session = Depends(get_db)):
    db_meter_reading = db.query(MeterReading).filter(MeterReading.id == meter_reading_id).first()
    if db_meter_reading is None:
        raise HTTPException(status_code=404, detail="Meter reading not found")
    
    db.delete(db_meter_reading)
    db.commit()
    return {"message": "Meter reading deleted successfully"}

# Salt Usage API routes
@app.post("/salt-usages/", response_model=SaltUsageResponse, tags=["Salt Usage"])
def create_salt_usage(salt_usage_data: SaltUsageCreate, db: Session = Depends(get_db)):
    # Check if phase exists
    db_phase = db.query(Phase).filter(Phase.id == salt_usage_data.phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    db_salt_usage = SaltUsage(**salt_usage_data.dict())
    db.add(db_salt_usage)
    db.commit()
    db.refresh(db_salt_usage)
    return db_salt_usage

@app.get("/salt-usages/", response_model=List[SaltUsageResponse], tags=["Salt Usage"])
def get_salt_usages(
    phase_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(SaltUsage)
    if phase_id:
        query = query.filter(SaltUsage.phase_id == phase_id)
    salt_usages = query.order_by(SaltUsage.timestamp.desc()).offset(skip).limit(limit).all()
    return salt_usages

@app.get("/salt-usages/latest", response_model=SaltUsageResponse, tags=["Salt Usage"])
def get_latest_salt_usage(phase_id: str, db: Session = Depends(get_db)):
    db_salt_usage = db.query(SaltUsage).filter(
        SaltUsage.phase_id == phase_id
    ).order_by(SaltUsage.timestamp.desc()).first()
    
    if db_salt_usage is None:
        raise HTTPException(status_code=404, detail="Salt usage not found for this phase")
    return db_salt_usage

@app.get("/salt-usages/{salt_usage_id}", response_model=SaltUsageResponse, tags=["Salt Usage"])
def get_salt_usage(salt_usage_id: str, db: Session = Depends(get_db)):
    db_salt_usage = db.query(SaltUsage).filter(SaltUsage.id == salt_usage_id).first()
    if db_salt_usage is None:
        raise HTTPException(status_code=404, detail="Salt usage not found")
    return db_salt_usage

@app.put("/salt-usages/{salt_usage_id}", response_model=SaltUsageResponse, tags=["Salt Usage"])
def update_salt_usage(salt_usage_id: str, salt_usage_data: SaltUsageCreate, db: Session = Depends(get_db)):
    db_salt_usage = db.query(SaltUsage).filter(SaltUsage.id == salt_usage_id).first()
    if db_salt_usage is None:
        raise HTTPException(status_code=404, detail="Salt usage not found")
    
    # Check if phase exists
    db_phase = db.query(Phase).filter(Phase.id == salt_usage_data.phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    for key, value in salt_usage_data.dict().items():
        setattr(db_salt_usage, key, value)
    
    db.commit()
    db.refresh(db_salt_usage)
    return db_salt_usage

@app.delete("/salt-usages/{salt_usage_id}", tags=["Salt Usage"])
def delete_salt_usage(salt_usage_id: str, db: Session = Depends(get_db)):
    db_salt_usage = db.query(SaltUsage).filter(SaltUsage.id == salt_usage_id).first()
    if db_salt_usage is None:
        raise HTTPException(status_code=404, detail="Salt usage not found")
    
    db.delete(db_salt_usage)
    db.commit()
    return {"message": "Salt usage deleted successfully"}

# Phase Dashboard API (Get all information for a phase)
@app.get("/phases/{phase_id}/dashboard", response_model=PhaseDashboardResponse, tags=["Dashboard"])
def get_phase_dashboard(phase_id: str, db: Session = Depends(get_db)):
    # Get phase
    db_phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if db_phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    # Get latest sump level
    db_sump_level = db.query(SumpLevel).filter(
        SumpLevel.phase_id == phase_id
    ).order_by(SumpLevel.timestamp.desc()).first()
    
    # Get latest water quality
    db_water_quality = db.query(WaterQuality).filter(
        WaterQuality.phase_id == phase_id
    ).order_by(WaterQuality.timestamp.desc()).first()
    
    # Get latest meter reading
    db_meter_reading = db.query(MeterReading).filter(
        MeterReading.phase_id == phase_id
    ).order_by(MeterReading.timestamp.desc()).first()
    
    # Get latest salt usage
    db_salt_usage = db.query(SaltUsage).filter(
        SaltUsage.phase_id == phase_id
    ).order_by(SaltUsage.timestamp.desc()).first()
    
    return {
        "phase": db_phase,
        "sump_levels": db_sump_level,
        "water_quality": db_water_quality,
        "meter_reading": db_meter_reading,
        "salt_usage": db_salt_usage
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)