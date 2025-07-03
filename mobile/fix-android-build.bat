@echo off
echo ==========================================
echo  Fixing Android Build for MasterMarket
echo ==========================================

echo.
echo Step 1: Checking current directory...
cd /d "%~dp0"
echo Current directory: %CD%

echo.
echo Step 2: Removing existing Android folder...
if exist "android" (
    echo Removing android folder...
    rmdir /s /q android
    echo Android folder removed.
) else (
    echo No android folder found.
)

echo.
echo Step 3: Clearing Expo cache...
echo Running expo start --clear...
set CI=1
npx expo start --clear
echo.
echo Press Ctrl+C when you see "Metro waiting on exp://..." message
echo Then press Y to confirm stopping
pause
echo Cache cleared.

echo.
echo Step 4: Regenerating Android configuration...
echo Running expo prebuild...
npx expo prebuild --clean --platform android 

echo.
echo Step 5: Checking Android environment...
echo Running expo doctor...
npx expo doctor

echo.
echo Step 6: Attempting to build Android app...
echo Running expo run:android...
npx expo run:android

echo.
echo ==========================================
echo  Build process completed!
echo ==========================================
echo.
echo If the build failed, check the error messages above.
echo Common issues:
echo - Android SDK not installed or configured
echo - Java/JDK version issues
echo - Gradle configuration problems
echo.
pause