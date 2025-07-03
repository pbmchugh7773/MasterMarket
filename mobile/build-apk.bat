@echo off
echo Building APK for MasterMarket...
cd android
call gradlew assembleDebug
echo.
echo APK built successfully!
echo Location: android\app\build\outputs\apk\debug\app-debug.apk
pause