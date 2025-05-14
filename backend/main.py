from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Boolean, Text, ForeignKey
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

class ActivityModel(Base):
    __tablename__ = "activities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    user_role = Column(String(100))
    user_type = Column(String(100))
    
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

class PropertyOut(PropertyCreate):
    id: str

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

# --- Dependency ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Auth Routes ---

@app.post("/signup")
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

@app.post("/login")
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
@app.get("/profile", response_model=List[ProfileSchema])
def get_all_profiles(db: Session = Depends(get_db)):
    try:
        return db.query(User).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profiles: {str(e)}")

@app.get("/profile/{user_id}")
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

@app.post("/profile")
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

@app.put("/profile/{user_id}")
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

@app.delete("/profile/{user_id}")
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

@app.patch("/profile/{user_id}/activate")
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

@app.get("/profile/property/{property_id}", response_model=List[ProfileSchema])
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

@app.post("/properties", response_model=PropertyOut)
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

@app.get("/properties", response_model=List[PropertyOut])
def get_all_properties(db: Session = Depends(get_db)):
    try:
        return db.query(Property).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching properties: {str(e)}")

@app.get("/properties/{id}", response_model=PropertyOut)
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

@app.put("/properties/{id}", response_model=PropertyOut)
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

@app.delete("/properties/{id}")
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

# --- Activity CRUD Routes ---

@app.post("/activities", response_model=ActivityResponse)
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

@app.get("/activities", response_model=List[ActivityResponse])
def read_activities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all activities with their tasks"""
    try:
        activities = db.query(ActivityModel).offset(skip).limit(limit).all()
        return activities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activities: {str(e)}")

@app.get("/activities/{activity_id}", response_model=ActivityResponse)
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

@app.put("/activities/{activity_id}", response_model=ActivityResponse)
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

@app.delete("/activities/{activity_id}")
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

# --- Task CRUD Routes ---

@app.post("/tasks", response_model=TaskResponse)
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
        return db_task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@app.get("/tasks", response_model=List[TaskResponse])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all tasks"""
    try:
        tasks = db.query(TaskModel).offset(skip).limit(limit).all()
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")

@app.get("/tasks/{task_id}", response_model=TaskResponse)
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

@app.get("/activities/{activity_id}/tasks", response_model=List[TaskResponse])
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

@app.put("/tasks/{task_id}", response_model=TaskResponse)
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
        return task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")

@app.delete("/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task"""
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        
        db.delete(task)
        db.commit()
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")

# --- Utility endpoints ---

@app.patch("/tasks/{task_id}/complete")
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

@app.patch("/tasks/{task_id}/activate")
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

@app.patch("/tasks/{task_id}/reset")
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

# --- Health check endpoint ---

@app.get("/health")
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