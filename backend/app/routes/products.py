from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from fastapi.responses import JSONResponse
import os
import shutil
from uuid import uuid4

from app import crud
from app.models import Product as ProductModel
from app.schemas import Product as ProductSchema, ProductCreate, ProductUpdate
from app.database import get_db

print("✅ Se cargó el router de productos")

router = APIRouter(prefix="/products", tags=["products"])

# Ruta absoluta a static/images
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "static", "images"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Obtener todos los productos
@router.get("/", response_model=list[ProductSchema])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

# Obtener producto por ID
@router.get("/{product_id}", response_model=ProductSchema)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

# 🔍 Obtener productos por código de barras
@router.get("/barcode/{barcode}", response_model=list[ProductSchema])
def get_products_by_barcode(barcode: str, db: Session = Depends(get_db)):
    products = db.query(ProductModel).filter(ProductModel.barcode == barcode).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found with this barcode")
    return products

# Crear nuevo producto
@router.post("/", response_model=ProductSchema)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)

# Actualizar producto
@router.put("/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = crud.update_product(db, product_id, product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

# Eliminar producto
@router.delete("/{product_id}", response_model=ProductSchema)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.delete_product(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

# upload de fotos
@router.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    # Nombre único para la imagen
    filename = f"{uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # URL accesible públicamente
    image_url = f"/static/images/{filename}"
    return {"image_url": image_url}


@router.post("/with-image", summary="Crear producto con imagen")
async def create_product_with_image(
    name: str = Form(...),
    barcode: str = Form(...),
    category: str = Form(...),
    brand: str = Form(...),
    description: str = Form(...),
    quantity: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    existing_product = db.query(ProductModel).filter(ProductModel.barcode == barcode).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this barcode already exists.")

    # Guardar imagen
    filename = f"{uuid4().hex}_{image.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    image_url = f"/static/images/{filename}"

    # Crear producto
    new_product = ProductModel(
        name=name,
        barcode=barcode,
        category=category,
        brand=brand,
        description=description,
        quantity=quantity,
        image_url=image_url
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product created successfully",
        "product": {
            "id": new_product.id,
            "name": new_product.name,
            "barcode": new_product.barcode,
            "category": new_product.category,
            "brand": new_product.brand,
            "description": new_product.description,
            "quantity": new_product.quantity,
            "image_url": new_product.image_url
        }
    }
