from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import requests
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user
from app.database import get_db
from app import models

router = APIRouter()

GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class GoogleToken(BaseModel):
    id_token: str


@router.post("/google-login")
def google_login(data: GoogleToken, db: Session = Depends(get_db)):
    # Validar token con Google
    response = requests.get(GOOGLE_TOKEN_INFO_URL, params={"id_token": data.id_token})
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Token de Google inválido")

    user_info = response.json()
    email = user_info.get("email")
    name = user_info.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Email no encontrado en el token")

    # Buscar usuario en la base de datos
    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        # Crear usuario nuevo si no existe
        user = models.User(
            email=email,
            full_name=name,
            hashed_password="from_google",  # valor simbólico
            is_active=True,
            is_premium=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Crear token JWT
    jwt_token = create_access_token({"sub": user.email, "name": user.full_name})
    return {"access_token": jwt_token}


@router.get("/me")
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.full_name,
        "is_premium": current_user.is_premium
    }
