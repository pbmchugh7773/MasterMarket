from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from .. import schemas, crud, auth, models
from ..database import get_db
from typing import Dict, Any
from ..schemas import UserUpdate
 
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)



# ----------- REGISTRO DE USUARIO -----------

@router.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email ya está registrado")

    new_user = crud.create_user(db, user)
    return new_user


# ----------- LOGIN -----------

@router.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> Dict[str, Any]:
    print(f"🔐 Intentando login con email: {form_data.username}")

    user = crud.authenticate_user(db, form_data.username, form_data.password)

    if not user:
        print("❌ Usuario no encontrado o contraseña incorrecta")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"✅ Usuario autenticado: {user.email}")
    print(f"   ➤ Rol: {getattr(user, 'role', 'N/A')}")
    print(f"   ➤ Premium: {user.is_premium}")

    access_token = auth.create_access_token(data={"sub": user.id})

    try:
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,  # Descomentar si querés testear
                "is_premium": user.is_premium
            }
        }
    except Exception as e:
        print("🔥 Error al generar la respuesta:", e)
        raise HTTPException(status_code=500, detail="Error inesperado")


# ----------- OBTENER DATOS DEL USUARIO AUTENTICADO -----------

@router.get("/me", response_model=schemas.UserOut)
def get_my_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ----------- ACTUALIZAR DATOS DEL USUARIO -----------

@router.put("/me", response_model=schemas.UserOut)
def update_my_user(
    update_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    updated = crud.update_user(db, current_user.id, update_data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return updated
