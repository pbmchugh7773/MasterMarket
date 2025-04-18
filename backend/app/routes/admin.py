from fastapi import APIRouter, Depends
from app.auth import require_role  # ajustá el import según tu estructura real
from app import models

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

@router.get("/secret")
def get_admin_data(current_user: models.User = Depends(require_role("admin"))):
    return {"message": f"Hola {current_user.email}, tenés acceso como admin"}
