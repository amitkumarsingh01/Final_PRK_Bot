from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session
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
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

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
    id: Optional[str]
    name: Optional[str]
    email: Optional[str]
    phone_no: Optional[str]
    user_role: Optional[str]
    user_type: Optional[str]
    property_id: Optional[str]
    status: Optional[str]

    class Config:
        orm_mode = True

class PropertyCreate(BaseModel):
    name: str
    title: str
    description: Optional[str] = None

class PropertyOut(PropertyCreate):
    id: str

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

@app.post("/signup")
def signup(data: SignupSchema, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        phone_no=data.phone_no,
        password=data.password,
        user_id=str(uuid.uuid4()),
        user_role=data.user_role,
        user_type=data.user_type,
        property_id=data.property_id,
        status="pending"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "user_id": user.user_id, "status": user.status}

@app.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email, User.password == data.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = str(uuid.uuid4())  # Simulated token
    return {"user_id": user.user_id, "token": token, "status": user.status}

# --- Profile Routes ---

@app.post("/profile")
def create_profile(profile: ProfileSchema, db: Session = Depends(get_db)):
    user = User(**profile.dict(exclude_unset=True))
    user.user_id = str(uuid.uuid4())
    user.created_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.get("/profile/{user_id}", response_model=ProfileSchema)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/profile/{user_id}")
def update_profile(user_id: str, profile: ProfileSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in profile.dict(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    return {"message": "Profile updated"}

@app.delete("/profile/{user_id}")
def delete_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@app.patch("/profile/{user_id}/activate")
def activate_user(user_id: str, db: Session = Depends(get_db)):
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

@app.get("/profile", response_model=List[ProfileSchema])
def get_all_profiles(db: Session = Depends(get_db)):
    return db.query(User).all()

# --- Property CRUD Routes ---

@app.post("/properties", response_model=PropertyOut)
def create_property(data: PropertyCreate, db: Session = Depends(get_db)):
    prop = Property(**data.dict())
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop

@app.get("/properties", response_model=List[PropertyOut])
def get_all_properties(db: Session = Depends(get_db)):
    return db.query(Property).all()

@app.get("/properties/{id}", response_model=PropertyOut)
def get_property_by_id(id: str, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

@app.put("/properties/{id}", response_model=PropertyOut)
def update_property(id: str, data: PropertyCreate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    for key, value in data.dict().items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    return prop

@app.delete("/properties/{id}")
def delete_property(id: str, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"message": f"Property {id} deleted successfully"}
