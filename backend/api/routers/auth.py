"""
Enterprise Authentication System for Sygnify Financial Analytics Platform
- Database-backed user management
- Role-based access control (RBAC)
- JWT authentication with refresh tokens
- Password policies and security measures
- Audit logging and session management
- OAuth2/SSO integration ready
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, validator
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import jwt
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum
import secrets
import hashlib
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password policy
MIN_PASSWORD_LENGTH = 8
REQUIRE_UPPERCASE = True
REQUIRE_LOWERCASE = True
REQUIRE_NUMBERS = True
REQUIRE_SPECIAL_CHARS = True

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sygnify_users.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"
    EXECUTIVE = "executive"

class AuditAction(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    ROLE_CHANGE = "role_change"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    DATA_ACCESS = "data_access"
    EXPORT_DATA = "export_data"

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    details = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False)
    refresh_token = Column(String(255), unique=True, nullable=False)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.VIEWER
    
    @validator('username')
    def username_validation(cls, v):
        if len(v) < 3 or len(v) > 50:
            raise ValueError('Username must be between 3 and 50 characters')
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v.lower()
    
    @validator('password')
    def password_validation(cls, v):
        if len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(f'Password must be at least {MIN_PASSWORD_LENGTH} characters')
        if REQUIRE_UPPERCASE and not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letters')
        if REQUIRE_LOWERCASE and not any(c.islower() for c in v):
            raise ValueError('Password must contain lowercase letters')
        if REQUIRE_NUMBERS and not any(c.isdigit() for c in v):
            raise ValueError('Password must contain numbers')
        if REQUIRE_SPECIAL_CHARS and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError('Password must contain special characters')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def password_validation(cls, v):
        if len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(f'Password must be at least {MIN_PASSWORD_LENGTH} characters')
        return v

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str, token_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def log_audit_event(db: Session, user_id: int, action: AuditAction, details: str = None, 
                   ip_address: str = None, user_agent: str = None):
    audit_log = AuditLog(
        user_id=user_id,
        action=action.value,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(audit_log)
    db.commit()

def is_account_locked(user: User) -> bool:
    if user.locked_until and user.locked_until > datetime.utcnow():
        return True
    return False

def lock_account(db: Session, user: User, duration_minutes: int = 30):
    user.locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
    user.failed_login_attempts += 1
    db.commit()
    log_audit_event(db, user.id, AuditAction.ACCOUNT_LOCKED, 
                   f"Account locked for {duration_minutes} minutes")

def unlock_account(db: Session, user: User):
    user.locked_until = None
    user.failed_login_attempts = 0
    db.commit()
    log_audit_event(db, user.id, AuditAction.ACCOUNT_UNLOCKED)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = get_user_by_username(db, username)
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user

def require_role(required_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in [role.value for role in required_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Router initialization
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/health")
def health_check():
    """Enhanced health check with security status"""
    return {
        "status": "healthy",
        "service": "enterprise_auth",
        "timestamp": datetime.utcnow().isoformat(),
        "security_features": {
            "rbac_enabled": True,
            "audit_logging": True,
            "session_management": True,
            "password_policies": True,
            "account_lockout": True
        },
        "endpoints": [
            "/register", "/login", "/refresh", "/logout",
            "/profile", "/change-password", "/users"
        ]
    }

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register a new user with enterprise security"""
    # Check if user already exists
    if get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    db_user = create_user(db, user)
    
    # Log registration
    log_audit_event(
        db, db_user.id, AuditAction.LOGIN, 
        "User registered", 
        request.client.host, 
        request.headers.get("user-agent")
    )
    
    logger.info(f"New user registered: {user.username}")
    return db_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), 
         request: Request = None, db: Session = Depends(get_db)):
    """Enhanced login with security features"""
    user = get_user_by_username(db, form_data.username)
    
    if not user:
        log_audit_event(db, None, AuditAction.LOGIN, 
                       f"Failed login attempt for non-existent user: {form_data.username}",
                       request.client.host if request else None, 
                       request.headers.get("user-agent") if request else None)
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Check if account is locked
    if is_account_locked(user):
        raise HTTPException(status_code=423, detail="Account is temporarily locked")
    
    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            lock_account(db, user)
            raise HTTPException(status_code=423, detail="Account locked due to multiple failed attempts")
        
        db.commit()
        log_audit_event(db, user.id, AuditAction.LOGIN, 
                       f"Failed login attempt #{user.failed_login_attempts}",
                       request.client.host if request else None, 
                       request.headers.get("user-agent") if request else None)
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Reset failed attempts on successful login
    user.failed_login_attempts = 0
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    # Create session record
    session = UserSession(
        user_id=user.id,
        session_token=hashlib.sha256(access_token.encode()).hexdigest(),
        refresh_token=hashlib.sha256(refresh_token.encode()).hexdigest(),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None,
        expires_at=datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    db.add(session)
    db.commit()
    
    # Log successful login
    log_audit_event(db, user.id, AuditAction.LOGIN, "Successful login",
                   request.client.host if request else None, 
                   request.headers.get("user-agent") if request else None)
    
    logger.info(f"User logged in: {user.username}")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    payload = verify_token(refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = get_user_by_username(db, payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    # Create new tokens
    new_access_token = create_access_token(data={"sub": user.username, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout and invalidate session"""
    # Invalidate all user sessions
    db.query(UserSession).filter(UserSession.user_id == current_user.id).update({"is_active": False})
    db.commit()
    
    log_audit_event(db, current_user.id, AuditAction.LOGOUT, "User logged out")
    
    return {"message": "Successfully logged out"}

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(user_update: UserUpdate, current_user: User = Depends(get_current_user), 
                  db: Session = Depends(get_db)):
    """Update user profile"""
    if user_update.email:
        existing_user = get_user_by_email(db, user_update.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_update.email
    
    if user_update.full_name:
        current_user.full_name = user_update.full_name
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return current_user

@router.post("/change-password")
def change_password(password_change: PasswordChange, 
                   current_user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """Change user password"""
    if not verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    current_user.hashed_password = get_password_hash(password_change.new_password)
    current_user.password_changed_at = datetime.utcnow()
    db.commit()
    
    log_audit_event(db, current_user.id, AuditAction.PASSWORD_CHANGE, "Password changed")
    
    return {"message": "Password changed successfully"}

@router.get("/users", response_model=List[UserResponse])
def list_users(skip: int = 0, limit: int = 100, 
              current_user: User = Depends(require_role([UserRole.ADMIN])),
              db: Session = Depends(get_db)):
    """List all users (Admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate,
               current_user: User = Depends(require_role([UserRole.ADMIN])),
               db: Session = Depends(get_db)):
    """Update user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.email:
        user.email = user_update.email
    if user_update.full_name:
        user.full_name = user_update.full_name
    if user_update.role:
        old_role = user.role
        user.role = user_update.role
        log_audit_event(db, current_user.id, AuditAction.ROLE_CHANGE, 
                       f"Changed user {user.username} role from {old_role} to {user_update.role}")
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return user

@router.get("/audit-logs")
def get_audit_logs(skip: int = 0, limit: int = 100, 
                  current_user: User = Depends(require_role([UserRole.ADMIN])),
                  db: Session = Depends(get_db)):
    """Get audit logs (Admin only)"""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

# Initialize default admin user
def create_default_admin():
    db = SessionLocal()
    try:
        admin_user = get_user_by_username(db, "admin")
        if not admin_user:
            admin_data = UserCreate(
                username="admin",
                email="admin@sygnify.com",
                password="Admin123!@#",
                full_name="System Administrator",
                role=UserRole.ADMIN
            )
            create_user(db, admin_data)
            logger.info("Default admin user created")
    except Exception as e:
        logger.error(f"Error creating default admin: {e}")
    finally:
        db.close()

# Create default admin on startup
create_default_admin() 