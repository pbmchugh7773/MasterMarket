# ---- auth.py

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi import Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from . import crud, models


# Clave secreta para firmar los tokens (guardala en .env en producción)
SECRET_KEY = "supersecretkey123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ----------- Crear token JWT -----------

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    # Convertir "sub" a string para asegurar consistencia en el token
    to_encode.update({"sub": str(data["sub"]), "exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ----------- Obtener usuario autenticado desde el token -----------

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    print(f"🔐 Token recibido: {token[:20]}..." if token else "❌ No token")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Token decodificado: {payload}")
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            print("❌ No se encontró 'sub' en el payload")
            raise credentials_exception
        user_id = int(user_id_str)
        print(f"📍 User ID extraído: {user_id}")
    except JWTError as e:
        print(f"❌ Error JWT: {e}")
        raise credentials_exception
    except ValueError as e:
        print(f"❌ Error de valor: {e}")
        raise credentials_exception

    user = crud.get_user_by_id(db, user_id=user_id)
    if user is None:
        print(f"❌ Usuario con ID {user_id} no encontrado en la BD")
        raise credentials_exception
    print(f"✅ Usuario autenticado: {user.email}")
    return user

# ----------- Verificar rol -----------



def require_role(required_role: str):
    def checker(user: models.User = Depends(get_current_user)):
        if user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You need role '{required_role}'"
            )
        return user
    return checker
