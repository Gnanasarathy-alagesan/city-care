from datetime import datetime, timedelta, timezone

from auth import get_current_user
from constants import ACCESS_TOKEN_EXPIRE_MINUTES
from dao import User
from dto import UserCreate, UserLogin
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from utils import create_access_token, get_db, get_password_hash, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login")
async def authenticate_user_login(
    user_credentials: UserLogin, db: Session = Depends(get_db)
):
    """
    Authenticate user login and return access token.

    Args:
        user_credentials: Login credentials including:
            - email: User's email address
            - password: User's password

    Returns:
        dict: Authentication response including:
            - token: JWT access token
            - user: User information
            - isAdmin: Whether user has admin privileges
    """
    # Check for admin credentials
    if user_credentials.email == "admin" and user_credentials.password == "admin":
        user = db.query(User).filter(User.email == "admin@admin.com").first()
    else:
        user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Update last active
    user.last_active = datetime.now(timezone.utc)
    db.commit()

    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "email": user.email,
            "isAdmin": user.is_admin,
        },
        "isAdmin": user.is_admin,
    }


@router.post("/register")
async def register_new_user_account(
    user_data: UserCreate, db: Session = Depends(get_db)
):
    """
    Register a new user account in the system.

    Args:
        user_data: User registration data including:
            - firstName: User's first name
            - lastName: User's last name
            - email: User's email address
            - password: User's password

    Returns:
        dict: Registration response with token and user info
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        first_name=user_data.firstName,
        last_name=user_data.lastName,
        email=user_data.email,
        password_hash=hashed_password,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )

    return {
        "token": access_token,
        "user": {
            "id": new_user.id,
            "firstName": new_user.first_name,
            "lastName": new_user.last_name,
            "email": new_user.email,
            "isAdmin": new_user.is_admin,
        },
        "isAdmin": new_user.is_admin,
    }


@router.get("/me")
async def get_current_authenticated_user(
    current_user: User = Depends(get_current_user),
):
    """
    Get information about the currently authenticated user.

    Args:
        current_user: Authenticated user from JWT token

    Returns:
        dict: Current user information and admin status
    """
    return {
        "user": {
            "id": current_user.id,
            "firstName": current_user.first_name,
            "lastName": current_user.last_name,
            "email": current_user.email,
            "isAdmin": current_user.is_admin,
        },
        "isAdmin": current_user.is_admin,
    }


@router.post("/logout")
async def logout_current_user():
    """
    Logout the current user (client-side token removal).

    Returns:
        dict: Logout confirmation message
    """
    return {"message": "Successfully logged out"}
