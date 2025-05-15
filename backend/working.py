from fastapi import FastAPI, HTTPException, Depends, Query
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