
# Dockerfile para FastAPI
FROM python:3.11-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements y código
COPY ./app /app/app
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Comando para iniciar FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
