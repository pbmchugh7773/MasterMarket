from app.database import engine
from app.models import Base  # if your models are inside a separate module, adjust this

print("Creating all tables...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("Done.")
