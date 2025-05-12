from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Query, Path
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
import uuid
import os
import shutil
from enum import Enum
import uvicorn
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Database setup would be here in a real implementation
# from database import get_db, engine, Base
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Track Bot API",
    description="API for Track Bot property management system",
    version="1.0.0",
    tags=[
        {"name": "Authentication", "description": "Authentication and authorization endpoints"},
        {"name": "Users", "description": "User management endpoints"},
        {"name": "Companies", "description": "Company/Property management endpoints"},
        {"name": "Tasks", "description": "Task and category management endpoints"},
        {"name": "Dashboard", "description": "Dashboard and reporting endpoints"},
        {"name": "Staff", "description": "Staff-specific endpoints"},
        {"name": "Tickets", "description": "Ticket management endpoints"},
        {"name": "Comments", "description": "Comment management endpoints"},
        {"name": "Notifications", "description": "Notification management endpoints"},
        {"name": "Activity", "description": "Activity and activity log management endpoints"},
        {"name": "Password Reset", "description": "Password reset and recovery endpoints"}
    ]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Token settings
SECRET_KEY = "YOUR_SECRET_KEY_HERE"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Dependency to get DB session
def get_db():
    # This function would return a database session
    # For now, we're just returning None as a placeholder
    return None

# Enums for consistent data representation

class UserType(str, Enum):
    INDIVIDUAL = "individual"
    SUPER_ADMIN = "super_admin"
    COMMUNITY_ADMIN = "community_admin"
    MANAGER = "manager"
    USER = "user"
    DEVELOPER = "developer"
    PROPERTY_ADMIN = "property_admin"

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    SA_MANAGER = "sa_manager" 
    PROPERTY_ADMIN = "property_admin"
    ESTATE_MANAGER = "estate_manager"
    HELPDESK = "helpdesk"
    ELECTRICIAN = "electrician"
    FIRE_OPERATOR = "fire_operator"
    GARDENER = "gardener"
    GAS_BANK_OPERATOR = "gas_bank_operator"
    HOUSEKEEPING_STAFF = "housekeeping_staff"
    HOUSEKEEPING_SUPERVISOR = "housekeeping_supervisor"
    LIFT_TECHNICIAN = "lift_technician"
    MC_CORE_TEAM = "mc_core_team"
    MULTI_TECHNICIAN = "multi_technician"
    PEST_CONTROL = "pest_control"
    PLUMBER = "plumber"
    POOL_OPERATOR = "pool_operator"
    SECURITY_STAFF = "security_staff"
    SECURITY_SUPERVISOR = "security_supervisor"
    STP_OPERATOR = "stp_operator"
    STP_SUPERVISOR = "stp_supervisor"

class TaskStatus(str, Enum):
    ACTIVE = "active"
    COMPLETE = "complete"
    DEFAULT = "default"

# Pydantic Models for Request/Response

class TokenData(BaseModel):
    user_id: int
    email: str
    role: UserRole
    property_id: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: UserRole
    property_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: str
    password: str
    property_id: Optional[int] = None
    user_role: UserRole  # New field
    user_type: UserType  # New field

class UserCreate(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: str
    role: UserRole
    password: str
    property_id: Optional[int] = None
    user_type: UserType

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    property_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    role: UserRole
    property_id: Optional[int] = None
    property_name: Optional[str] = None
    is_approved: bool
    is_active: bool
    created_at: datetime
    user_type: UserType

    class Config:
        orm_mode = True

class PendingUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    property_id: Optional[int] = None
    created_at: datetime
    user_type: UserType
    user_role: UserRole

    class Config:
        orm_mode = True

class CompanyCreate(BaseModel):
    name: str
    address: str
    contact_email: EmailStr
    contact_phone: str
    description: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None

class CompanyResponse(BaseModel):
    id: int
    name: str
    address: str
    contact_email: EmailStr
    contact_phone: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class TaskCreate(BaseModel):
    name: str
    deadline_time: str  # Format: "HH:MM", e.g., "13:00" for 1:00 PM
    description: Optional[str] = None
    assigned_to: Optional[int] = None  # User ID
    is_daily: bool = True

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    deadline_time: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    is_daily: Optional[bool] = None

class TaskResponse(BaseModel):
    id: int
    name: str
    category_id: int
    category_name: str
    deadline_time: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    assigned_user_name: Optional[str] = None
    is_daily: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class TaskStatusUpdate(BaseModel):
    status: TaskStatus
    message: Optional[str] = None
    # image will be handled separately

class TaskStatusResponse(BaseModel):
    id: int
    task_id: int
    task_name: str
    user_id: int
    user_name: str
    status: TaskStatus
    message: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class ActivityLogCreate(BaseModel):
    task_id: int
    status: TaskStatus
    message: Optional[str] = None

class ActivityLogResponse(BaseModel):
    id: int
    task_id: int
    task_name: str
    user_id: int
    user_name: str
    status: TaskStatus
    message: Optional[str] = None
    image_url: Optional[str] = None
    timestamp: datetime

    class Config:
        orm_mode = True

class DashboardSummary(BaseModel):
    total_users: int
    total_companies: int
    total_tasks: int
    completed_tasks_today: int
    pending_tasks_today: int
    recent_activities: List[Dict[str, Any]]

# Add new models for password reset
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetToken(BaseModel):
    token: str
    new_password: str

# Helper Functions

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        property_id: Optional[int] = payload.get("property_id")
        
        if user_id is None or email is None:
            raise credentials_exception
        
        token_data = TokenData(user_id=user_id, email=email, role=role, property_id=property_id)
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    # In real implementation, this would query the database
    # user = get_user_by_id(db, user_id=token_data.user_id)
    # if user is None:
    #     raise credentials_exception
    
    # For now, we'll use a mock user object
    user = UserResponse(
        id=token_data.user_id,
        name="Test User",
        email=token_data.email,
        phone="1234567890",
        role=token_data.role,
        property_id=token_data.property_id,
        property_name="Test Property" if token_data.property_id else None,
        is_approved=True,
        is_active=True,
        created_at=datetime.now()
    )
    
    return user

async def get_current_active_user(current_user: UserResponse = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_active_approved_user(current_user: UserResponse = Depends(get_current_active_user)):
    if not current_user.is_approved:
        raise HTTPException(status_code=400, detail="Inactive user - awaiting approval")
    return current_user

async def get_super_admin(current_user: UserResponse = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SA_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_property_admin(current_user: UserResponse = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SA_MANAGER, UserRole.PROPERTY_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Save uploaded images
def save_image(image: UploadFile) -> str:
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    # Create a unique filename
    filename = f"{uuid.uuid4()}{os.path.splitext(image.filename)[1]}"
    filepath = os.path.join(upload_dir, filename)
    
    # Save the file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    return f"/uploads/{filename}"

# Add password reset helper functions
def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)

async def send_reset_email(email: str, token: str):
    # Get SMTP configuration
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM")

    # Log SMTP configuration (without password)
    print(f"SMTP Configuration: Host={smtp_host}, Port={smtp_port}, User={smtp_user}, From={smtp_from}")

    # Validate SMTP configuration
    if not all([smtp_host, smtp_port, smtp_user, smtp_password, smtp_from]):
        error_msg = "SMTP configuration is incomplete"
        print(f"Error: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

    try:
        # Convert port to integer
        port = int(smtp_port)
    except ValueError:
        error_msg = f"Invalid SMTP port configuration: {smtp_port}"
        print(f"Error: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

    reset_link = f"https://server.magicvignesh.com/public/reset-password.html?token={token}"
    message = MIMEMultipart()
    message["From"] = smtp_from
    message["To"] = email
    message["Subject"] = "Reset Your Password - Magic App"

    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1227ff;">Forgot your password?</h2>
                <p>Don't worry! We've got you covered. Click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background-color: #1227ff; 
                              color: white; 
                              padding: 12px 24px; 
                              text-decoration: none; 
                              border-radius: 4px;
                              display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>If you didn't request this password reset, you can safely ignore this email.</p>
                <p>This link will expire in {os.getenv('PASSWORD_RESET_TOKEN_EXPIRE_MINUTES', '15')} minutes.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="font-size: 12px; color: #666;">
                    This is an automated message, please do not reply to this email.
                    If you have any questions, please contact our support team.
                </p>
            </div>
        </body>
    </html>
    """
    message.attach(MIMEText(body, "html"))

    try:
        print(f"Attempting to connect to SMTP server: {smtp_host}:{port}")
        with smtplib.SMTP(smtp_host, port) as server:
            print("Starting TLS...")
            server.starttls()
            print("Logging in...")
            server.login(smtp_user, smtp_password)
            print("Sending email...")
            server.send_message(message)
            print(f"Email sent successfully to {email}")
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP Authentication failed: {str(e)}"
        print(f"Error: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate with SMTP server. Please check your SMTP credentials."
        )
    except smtplib.SMTPException as e:
        error_msg = f"SMTP Error: {str(e)}"
        print(f"Error: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send reset email: {str(e)}"
        )
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"Error: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

# 1. Authentication & Authorization APIs

@app.post("/auth/login", response_model=Token, tags=["Authentication"])
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user_id = 1
    role = UserRole.SUPER_ADMIN
    property_id = None
    
    access_token = create_access_token(
        data={"user_id": user_id, "email": login_data.email, "role": role, "property_id": property_id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_role": role,
        "property_id": property_id
    }

@app.post("/auth/signup", status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def signup(signup_data: SignupRequest, db: Session = Depends(get_db)):
    # You might want to add validation logic here
    # For example, ensure certain roles can only be assigned by specific users
    
    # Create user in database with new fields
    # This is a placeholder - you'll need to implement the actual database logic
    new_user = UserCreate(
        user_id=signup_data.user_id,
        name=signup_data.name,
        email=signup_data.email,
        phone=signup_data.phone,
        password=signup_data.password,
        property_id=signup_data.property_id,
        role=signup_data.user_role,
        user_type=signup_data.user_type
    )
    
    # Save to database (implement your database logic here)
    # db.add(new_user)
    # db.commit()
    
    return {
        "message": "Signup successful! Your account is awaiting approval.",
        "user_id": signup_data.user_id,
        "email": signup_data.email,
        "user_role": signup_data.user_role,
        "user_type": signup_data.user_type
    }

@app.get("/auth/pending-approvals", response_model=List[PendingUserResponse], tags=["Authentication"])
async def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    # Update the mock response to include the new fields
    return [
        PendingUserResponse(
            id=1,
            name="Pending User",
            email="pending@example.com",
            phone="1234567890",
            property_id=current_user.property_id,
            created_at=datetime.now(),
            user_role=UserRole.STAFF,  # Add mock user role
            user_type=UserType.INDIVIDUAL  # Add mock user type
        )
    ]

@app.patch("/auth/approve/{user_id}", tags=["Authentication"])
async def approve_user(
    user_id: int = Path(..., title="The ID of the user to approve"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    
    return {"message": f"User {user_id} has been approved successfully"}

# 2. User Management APIs

@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    # In real implementation, this would:
    # 1. Check if email already exists
    # 2. Hash the password
    # 3. Create new user
    # 4. Return created user
    
    # Property admins can only create users for their property
    if current_user.role == UserRole.PROPERTY_ADMIN and user_data.property_id != current_user.property_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create users for your property"
        )
    
    # For now, we'll return mock data
    return UserResponse(
        id=1,
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        property_id=user_data.property_id,
        property_name="Test Property" if user_data.property_id else None,
        is_approved=True,
        is_active=True,
        created_at=datetime.now()
    )

@app.get("/users", response_model=List[UserResponse], tags=["Users"])
async def list_users(
    role: Optional[UserRole] = None,
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # In real implementation, this would:
    # 1. Get users based on filters
    # 2. Apply permissions (super admin sees all, property admin sees only property users)
    # 3. Return filtered list
    
    # Property admins can only see users from their property
    if current_user.role == UserRole.PROPERTY_ADMIN:
        property_id = current_user.property_id
    
    # For now, we'll return mock data
    return [
        UserResponse(
            id=1,
            name="Test User",
            email="test@example.com",
            phone="1234567890",
            role=UserRole.PROPERTY_ADMIN if role is None else role,
            property_id=property_id or 1,
            property_name="Test Property",
            is_approved=True,
            is_active=True,
            created_at=datetime.now()
        )
    ]

@app.get("/users/{user_id}", response_model=UserResponse, tags=["Users"])
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # In real implementation, this would:
    # 1. Get user by ID
    # 2. Check permissions (super admin sees all, property admin sees only property users)
    # 3. Return user or 404
    
    # For now, we'll return mock data
    return UserResponse(
        id=user_id,
        name="Test User",
        email="test@example.com",
        phone="1234567890",
        role=UserRole.PROPERTY_ADMIN,
        property_id=1,
        property_name="Test Property",
        is_approved=True,
        is_active=True,
        created_at=datetime.now()
    )

@app.put("/users/{user_id}", response_model=UserResponse, tags=["Users"])
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    # In real implementation, this would:
    # 1. Get user by ID
    # 2. Check permissions
    # 3. Update user
    # 4. Return updated user
    
    # Property admins can only update users from their property
    if current_user.role == UserRole.PROPERTY_ADMIN:
        # Check if user belongs to admin's property
        pass
    
    # For now, we'll return mock data
    return UserResponse(
        id=user_id,
        name=user_data.name or "Updated User",
        email=user_data.email or "updated@example.com",
        phone=user_data.phone or "9876543210",
        role=user_data.role or UserRole.PROPERTY_ADMIN,
        property_id=user_data.property_id or 1,
        property_name="Test Property",
        is_approved=True,
        is_active=user_data.is_active if user_data.is_active is not None else True,
        created_at=datetime.now()
    )

@app.delete("/users/{user_id}", tags=["Users"])
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    # In real implementation, this would:
    # 1. Get user by ID
    # 2. Check permissions
    # 3. Delete or deactivate user
    # 4. Return success/failure
    
    # Property admins can only delete users from their property
    if current_user.role == UserRole.PROPERTY_ADMIN:
        # Check if user belongs to admin's property
        pass
    
    return {"message": f"User {user_id} has been deleted successfully"}

# 3. Company / Property Management APIs

@app.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED, tags=["Companies"])
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_super_admin)
):
    # In real implementation, this would:
    # 1. Create new company
    # 2. Return created company
    
    # For now, we'll return mock data
    return CompanyResponse(
        id=1,
        name=company_data.name,
        address=company_data.address,
        contact_email=company_data.contact_email,
        contact_phone=company_data.contact_phone,
        description=company_data.description,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@app.get("/companies", response_model=List[CompanyResponse], tags=["Companies"])
async def list_companies(
    name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # In real implementation, this would:
    # 1. Get companies based on filters
    # 2. Return filtered list
    
    # For now, we'll return mock data
    return [
        CompanyResponse(
            id=1,
            name="Test Company" if name is None else name,
            address="123 Test Street",
            contact_email="contact@example.com",
            contact_phone="1234567890",
            description="A test company",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    ]

@app.get("/companies/{company_id}", response_model=CompanyResponse, tags=["Companies"])
async def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # In real implementation, this would:
    # 1. Get company by ID
    # 2. Return company or 404
    
    # For now, we'll return mock data
    return CompanyResponse(
        id=company_id,
        name="Test Company",
        address="123 Test Street",
        contact_email="contact@example.com",
        contact_phone="1234567890",
        description="A test company",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@app.put("/companies/{company_id}", response_model=CompanyResponse, tags=["Companies"])
async def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_super_admin)
):
    # In real implementation, this would:
    # 1. Get company by ID
    # 2. Update company
    # 3. Return updated company
    
    # For now, we'll return mock data
    return CompanyResponse(
        id=company_id,
        name=company_data.name or "Updated Company",
        address=company_data.address or "456 Updated Street",
        contact_email=company_data.contact_email or "updated@example.com",
        contact_phone=company_data.contact_phone or "9876543210",
        description=company_data.description or "An updated company",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

# 4. Task Category & Task Management APIs

@app.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    # In real implementation, this would:
    # 1. Create new category
    # 2. Return created category
    
    # For now, we'll return mock data
    return CategoryResponse(
        id=1,
        name=category_data.name,
        description=category_data.description,
        created_at=datetime.now()
    )

@app.get("/categories", response_model=List[CategoryResponse], tags=["Tasks"])
async def list_categories(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # In real implementation, this would:
    # 1. Get all categories
    # 2. Return list of categories
    
    # For now, we'll return mock data for the categories mentioned in the doc
    categories = [
        "Housekeeping", "Plumber Tasks", "Electrician Tasks", "Lift Tasks", 
        "Security Department", "Common Area Set-1", "Common Area Set-2", 
        "Block Housekeeping", "Clubhouse Housekeeping", "Pool Operator",
        "Pest Control Department", "Electrical Department", "Gas Bank",
        "Helpdesk", "Fire and Safety", "Garden Department", "STP Operator"
    ]
    
    return [
        CategoryResponse(
            id=i+1,
            name=category,
            description=f"Tasks for {category}",
            created_at=datetime.now()
        )
        for i, category in enumerate(categories)
    ]

@app.post("/categories/{category_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
async def create_task(
    category_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    # In real implementation, this would:
    # 1. Check if category exists
    # 2. Create new task under the category
    # 3. Return created task
    
    # Validate deadline_time format (HH:MM)
    try:
        datetime.strptime(task_data.deadline_time, "%H:%M")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid deadline_time format. Use HH:MM (24-hour format)"
        )
    
    # For now, we'll return mock data
    return TaskResponse(
        id=1,
        name=task_data.name,
        category_id=category_id,
        category_name="Test Category",
        deadline_time=task_data.deadline_time,
        description=task_data.description,
        assigned_to=task_data.assigned_to,
        assigned_user_name="Assigned User" if task_data.assigned_to else None,
        is_daily=task_data.is_daily,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@app.get("/categories/{category_id}/tasks", response_model=List[TaskResponse], tags=["Tasks"])
async def list_tasks_by_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # In real implementation, this would:
    # 1. Check if category exists
    # 2. Get all tasks under the category
    # 3. Return list of tasks
    
    # For now, we'll return mock data
    return [
        TaskResponse(
            id=1,
            name="Test Task",
            category_id=category_id,
            category_name="Test Category",
            deadline_time="13:00",
            description="A test task",
            assigned_to=1,
            assigned_user_name="Assigned User",
            is_daily=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    ]

@app.patch("/tasks/{task_id}/status", response_model=TaskStatusResponse, tags=["Tasks"])
async def update_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # In real implementation, this would:
    # 1. Check if task exists
    # 2. Check if user has permission to update the task
    # 3. Update task status
    # 4. Handle image upload if provided
    # 5. Return updated status
    
    # Handle image upload if provided
    image_url = None
    if image:
        image_url = save_image(image)
    
    # For now, we'll return mock data
    return TaskStatusResponse(
        id=1,
        task_id=task_id,
        task_name="Test Task",
        user_id=current_user.id,
        user_name=current_user.name,
        status=status_data.status,
        message=status_data.message,
        image_url=image_url,
        created_at=datetime.now()
    )

@app.delete("/tasks/{task_id}", tags=["Tasks"])
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    # In real implementation, this would:
    # 1. Check if task exists
    # 2. Delete task
    # 3. Return success/failure
    
    return {"message": f"Task {task_id} has been deleted successfully"}

# 5. Activity Log APIs

@app.post("/activity-logs", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED, tags=["Activity"])
async def create_activity_log(
    log: ActivityLogCreate,
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # Handle image upload if provided
    image_url = None
    if image:
        image_url = save_image(image)
    
    # For now, we'll return mock data
    return ActivityLogResponse(
        id=1,
        task_id=log.task_id,
        task_name="Test Task",
        user_id=current_user.id,
        user_name=current_user.name,
        status=log.status,
        message=log.message,
        image_url=image_url,
        timestamp=datetime.now()
    )

@app.get("/activity-logs", response_model=List[ActivityLogResponse], tags=["Activity"])
async def get_activity_logs(
    task_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # Convert date strings to datetime objects if provided
    start_datetime = None
    end_datetime = None
    if start_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
            # Set end_datetime to end of day
            end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    # For now, we'll return mock data
    return [
        ActivityLogResponse(
            id=1,
            task_id=task_id or 1,
            task_name="Test Task",
            user_id=user_id or current_user.id,
            user_name=current_user.name,
            status=status or TaskStatus.ACTIVE,
            message="Test activity log",
            image_url=None,
            timestamp=datetime.now()
        )
    ]

# 6. Dashboard & Reporting APIs

@app.get("/dashboard/superadmin", response_model=DashboardSummary, tags=["Dashboard"])
async def get_superadmin_dashboard(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_super_admin)
):
    # In real implementation, this would:
    # 1. Get summary counts of users, companies, tasks
    # 2. Get counts of completed and pending tasks for today
    # 3. Get recent activities
    # 4. Return dashboard summary
    
    # For now, we'll return mock data
    return DashboardSummary(
        total_users=100,
        total_companies=10,
        total_tasks=500,
        completed_tasks_today=50,
        pending_tasks_today=30,
        recent_activities=[
            {
                "id": 1,
                "task_name": "Task 1",
                "status": TaskStatus.COMPLETE,
                "user_name": "User 1",
                "timestamp": datetime.now() - timedelta(hours=1)
            },
            {
                "id": 2,
                "task_name": "Task 2",
                "status": TaskStatus.ACTIVE,
                "user_name": "User 2",
                "timestamp": datetime.now() - timedelta(hours=2)
            }
        ]
    )

@app.get("/dashboard/property-admin/{property_id}", response_model=DashboardSummary, tags=["Dashboard"])
async def get_property_admin_dashboard(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_property_admin)
):
    # In real implementation, this would:
    # 1. Check if user has access to this property
    # 2. Get summary counts for the property
    # 3. Return dashboard summary
    
    # Property admins can only see their property dashboard
    if current_user.role == UserRole.PROPERTY_ADMIN and property_id != current_user.property_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view dashboard for your property"
        )
    
    # For now, we'll return mock data
    return DashboardSummary(
        total_users=20,
        total_companies=1,
        total_tasks=100,
        completed_tasks_today=15,
        pending_tasks_today=10,
        recent_activities=[
            {
                "id": 1,
                "task_name": "Property Task 1",
                "status": TaskStatus.COMPLETE,
                "user_name": "Property User 1",
                "timestamp": datetime.now() - timedelta(hours=1)
            },
            {
                "id": 2,
                "task_name": "Property Task 2",
                "status": TaskStatus.ACTIVE,
                "user_name": "Property User 2",
                "timestamp": datetime.now() - timedelta(hours=2)
            }
        ]
    )

@app.get("/dashboard/staff", tags=["Dashboard"])
async def get_staff_dashboard(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # Get dashboard data based on user role
    return {
        "assigned_tasks": [],  # Replace with actual data
        "completed_tasks_today": 0,  # Replace with actual count
        "pending_tasks_today": 0  # Replace with actual count
    }

@app.get("/reports/activity-summary", tags=["Dashboard"])
async def get_activity_summary_report(
    start_date: str,
    end_date: str,
    property_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    # Convert date strings to datetime objects
    try:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
        # Set end_datetime to end of day
        end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Check permissions
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SA_MANAGER, UserRole.PROPERTY_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # If property admin, can only view their property
    if current_user.role == UserRole.PROPERTY_ADMIN:
        if property_id and property_id != current_user.property_id:
            raise HTTPException(status_code=403, detail="Can only view reports for your property")
        property_id = current_user.property_id
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "property_id": property_id,
        "category_id": category_id,
        "summary": []  # Replace with actual report data
    }

# Add password reset routes
@app.post("/auth/forgot-password", tags=["Password Reset"])
async def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    # In real implementation, this would:
    # 1. Check if user exists
    # 2. Generate reset token
    # 3. Store token in database
    # 4. Send reset email
    
    # For now, we'll use mock data
    user = UserResponse(
        id=1,
        name="Test User",
        email=request.email,
        phone="1234567890",
        role=UserRole.PROPERTY_ADMIN,
        property_id=1,
        property_name="Test Property",
        is_approved=True,
        is_active=True,
        created_at=datetime.now()
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )

    # Generate reset token
    reset_token = generate_reset_token()
    token_expiry = datetime.utcnow() + timedelta(
        minutes=int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", 15))
    )

    # Store token in database (mock)
    # In real implementation, this would update the user's record in the database
    print(f"Storing reset token for user {user.email}: {reset_token}")

    # Send reset email
    await send_reset_email(request.email, reset_token)

    return {"message": "Password reset link sent to your email"}

@app.post("/auth/reset-password", tags=["Password Reset"])
async def reset_password(
    reset_data: PasswordResetToken,
    db: Session = Depends(get_db)
):
    # In real implementation, this would:
    # 1. Find user with valid reset token
    # 2. Update password
    # 3. Clear reset token
    
    # For now, we'll use mock data
    user = UserResponse(
        id=1,
        name="Test User",
        email="test@example.com",
        phone="1234567890",
        role=UserRole.PROPERTY_ADMIN,
        property_id=1,
        property_name="Test Property",
        is_approved=True,
        is_active=True,
        created_at=datetime.now()
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Update password (mock)
    # In real implementation, this would update the user's password in the database
    hashed_password = get_password_hash(reset_data.new_password)
    print(f"Updating password for user {user.email}")

    return {"message": "Password reset successful"}

# The main entry point for running the application
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=7000, reload=True)
