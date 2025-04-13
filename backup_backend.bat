@echo off
setlocal

REM Ruta absoluta de la carpeta backend
set "BACKEND_PATH=C:\Users\pbmch\OneDrive\Documentos\apps\price_tracker\MasterMarket_Project\backend"

REM Carpeta temporal donde copiamos los archivos filtrados
set "TEMP_PATH=%BACKEND_PATH%\_temp_backup"

REM Nombre del archivo zip con fecha (en carpeta padre)
set "DEST_PATH=%BACKEND_PATH%\..\mastermarket_backend_backup_%DATE:~6,4%-%DATE:~3,2%-%DATE:~0,2%.zip"

REM Borrar carpeta temporal si ya existe
if exist "%TEMP_PATH%" (
    rd /s /q "%TEMP_PATH%"
)

REM Crear carpeta temporal
mkdir "%TEMP_PATH%"

REM Copiar archivos, excluyendo cosas
robocopy "%BACKEND_PATH%" "%TEMP_PATH%" /E /XD .git __pycache__ .venv venv env docker _temp_backup /XF *.pyc *.db *.log *.sqlite3 > nul

REM Cambiar a carpeta temporal
cd /d "%TEMP_PATH%"

REM Comprimir solo el contenido, no la carpeta _temp_backup
powershell -Command "Compress-Archive -Path * -DestinationPath '%DEST_PATH%' -Force"

REM Borrar carpeta temporal
cd /d "%BACKEND_PATH%"
rd /s /q "%TEMP_PATH%"

echo Backup creado exitosamente: %DEST_PATH%
pause
