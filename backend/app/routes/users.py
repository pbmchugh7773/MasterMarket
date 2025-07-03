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
        print(f"🔄 Google auth request received: {request_data}")
        
        google_token = request_data.get("google_token")
        country = request_data.get("country")  # No default - let frontend handle it
        currency = request_data.get("currency")  # No default - let frontend handle it
        
        print(f"📝 Extracted data - token: {google_token[:20] if google_token else None}..., country: {country}, currency: {currency}")
        
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
            print(f"✅ Found existing user: {existing_user.email}")
            # Update existing user with Google info if needed
            if not existing_user.google_id:
                print("🔄 Updating existing user with Google info")
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
                "user": UserOut.from_orm(existing_user)
            }
        else:
            print(f"🆕 New user detected: {google_user_info.get('email')}")
            # For new users, country and currency are required
            if not country or not currency:
                print(f"❌ Missing required fields - country: {country}, currency: {currency}")
                raise HTTPException(
                    status_code=400, 
                    detail="Country and currency are required for new users"
                )
            
            # Create new user from Google info
            print(f"📝 Creating new user with data:")
            print(f"   - email: {google_user_info['email']}")
            print(f"   - name: {google_user_info.get('name', '')}")
            print(f"   - country: {country}")
            print(f"   - currency: {currency}")
            
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
            
            print("💾 Saving new user to database...")
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"✅ User created successfully with ID: {new_user.id}")
            
            # Generate JWT token
            access_token = create_access_token(data={"sub": new_user.email})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserOut.from_orm(new_user)
            }
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

async def verify_google_token(token: str):
    """
    Verify Google OAuth ID token and return user info
    """
    try:
        # Verify ID token with Google
        response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token}",
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"Token verification failed: {response.status_code} - {response.text}")
            return None
            
        token_info = response.json()
        
        # Extract user info from ID token
        user_info = {
            "sub": token_info.get("sub"),  # Google user ID
            "email": token_info.get("email"),
            "name": token_info.get("name"),
            "picture": token_info.get("picture"),
            "email_verified": token_info.get("email_verified")
        }
        
        return user_info
        
    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return None
