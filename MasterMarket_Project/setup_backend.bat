@echo off

echo Creating backend directory structure...

mkdir backend
mkdir backend\app
mkdir backend\app\routes

echo Creating essential files...

type nul > backend\.env
type nul > backend\app\__init__.py
type nul > backend\app\main.py
type nul > backend\app\database.py
type nul > backend\app\models.py
type nul > backend\app\schemas.py
type nul > backend\app\routes\__init__.py
type nul > backend\app\routes\products.py

echo Backend structure and files created successfully!

pause
