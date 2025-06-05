from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
import shutil
from uuid import uuid4
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError
import os
from app import crud
from app.models import Product as ProductModel, Price, GenericProduct
from app.schemas import Product as ProductSchema, ProductCreate, ProductUpdate, ProductOrGenericOut
from app.database import get_db
from app.crud import get_all_simple_products
from PIL import Image
import io

print("✅ Se cargó el router de productos")

router = APIRouter(prefix="/products", tags=["products"])

# Ruta absoluta a static/images
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "static", "images"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

#  AWS S3 config
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "eu-west-1")

s3 = boto3.client("s3",
                  region_name=AWS_REGION,
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

def upload_to_s3(file: UploadFile, filename: str) -> str:
    try:
        # 🧼 Open the uploaded image
        image = Image.open(file.file)

        # 🎯 Resize or compress as needed (e.g., convert to JPEG and lower quality)
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", optimize=True, quality=70)  # quality: 1-95
        buffer.seek(0)

        # 🔼 Upload to S3 from buffer
        s3.upload_fileobj(
            buffer,
            AWS_S3_BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": "image/jpeg"}
        )

        url = f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"
        return url
    except Exception as e:
        print(f"❌ Error uploading to S3: {e}")
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")

# Get all products
@router.get("/", response_model=list[ProductSchema])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

# Get products and generic products

@router.get("/all-simple", response_model=list[ProductOrGenericOut])
def all_simple_products(db: Session = Depends(get_db)):
    return get_all_simple_products(db)

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


# ✅ Upload image to S3 and create product
@router.post("/with-image", summary="Create product with image or external image URL")
async def create_product_with_image(
    name: str = Form(...),
    barcode: str = Form(...),
    category: str = Form(...),
    brand: str = Form(...),
    description: str = Form(...),
    quantity: int = Form(...),
    image: UploadFile = File(None),
    image_url: str = Form(None),
    db: Session = Depends(get_db)
):
    print("📸 Uploading image using S3")
    existing_product = db.query(ProductModel).filter(ProductModel.barcode == barcode).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this barcode already exists.")

    final_image_url = None

    if image:
        filename = f"{uuid4().hex}_{image.filename}"
        final_image_url = upload_to_s3(image, filename)
    elif image_url:
        final_image_url = image_url

    new_product = ProductModel(
        name=name,
        barcode=barcode,
        category=category,
        brand=brand,
        description=description,
        quantity=quantity,
        image_url=final_image_url
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
