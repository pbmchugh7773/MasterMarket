from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import UserCreate, UserOut, GoogleOAuthCreate
from app.models import User as UserModel
from app.database import get_db
from app.auth import create_access_token
import app.crud as crud
import requests
import os

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# Crear usuario
@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

# Listar usuarios
@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(UserModel).all()

# Google OAuth Login
@router.post("/google-auth", response_model=dict)
async def google_oauth_login(request_data: dict, db: Session = Depends(get_db)):
    """
    Authenticate user with Google OAuth token
    """
    try:
        google_token = request_data.get("google_token")
        country = request_data.get("country")  # No default - let frontend handle it
        currency = request_data.get("currency")  # No default - let frontend handle it
        
        if not google_token:
            raise HTTPException(status_code=400, detail="Google token is required")
            
        # Verify Google token
        google_user_info = await verify_google_token(google_token)
        
        if not google_user_info:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        
        # Check if user exists
        existing_user = db.query(UserModel).filter(
            (UserModel.email == google_user_info["email"]) |
            (UserModel.google_id == google_user_info["sub"])
        ).first()
        
        if existing_user:
            # Update existing user with Google info if needed
            if not existing_user.google_id:
                existing_user.google_id = google_user_info["sub"]
                existing_user.provider = "google"
                existing_user.avatar_url = google_user_info.get("picture")
                db.commit()
                db.refresh(existing_user)
            
            # Generate JWT token
            access_token = create_access_token(data={"sub": existing_user.email})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": existing_user
            }
        else:
            # For new users, country and currency are required
            if not country or not currency:
                raise HTTPException(
                    status_code=400, 
                    detail="Country and currency are required for new users"
                )
            
            # Create new user from Google info
            new_user_data = GoogleOAuthCreate(
                email=google_user_info["email"],
                full_name=google_user_info.get("name", ""),
                google_id=google_user_info["sub"],
                avatar_url=google_user_info.get("picture"),
                country=country,
                currency=currency
            )
            
            new_user = UserModel(
                email=new_user_data.email,
                full_name=new_user_data.full_name,
                google_id=new_user_data.google_id,
                avatar_url=new_user_data.avatar_url,
                provider="google",
                country=new_user_data.country,
                currency=new_user_data.currency,
                is_active=True
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            # Generate JWT token
            access_token = create_access_token(data={"sub": new_user.email})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": new_user
            }
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

async def verify_google_token(token: str):
    """
    Verify Google OAuth token and return user info
    """
    try:
        # Verify token with Google
        response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?access_token={token}",
            timeout=10
        )
        
        if response.status_code != 200:
            return None
            
        token_info = response.json()
        
        # Get user info
        user_response = requests.get(
            f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={token}",
            timeout=10
        )
        
        if user_response.status_code != 200:
            return None
            
        return user_response.json()
        
    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return None
