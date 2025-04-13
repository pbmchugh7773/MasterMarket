# Forzamos a usar PATH del sistema
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine")

# Nos movemos al directorio del proyecto
Set-Location "C:\Repository\MasterMarket_Project\mobile"

# Iniciamos Expo en modo túnel
npx expo start --tunnel
