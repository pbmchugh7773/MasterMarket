@echo off
echo Cleaning previous builds...
cd android
call gradlew clean

echo.
echo Building Debug APK...
call gradlew assembleDebug --stacktrace

echo.
echo Checking for APK...
if exist app\build\outputs\apk\debug\app-debug.apk (
    echo SUCCESS! APK created at:
    echo %cd%\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Listing APK details:
    dir app\build\outputs\apk\debug\app-debug.apk
) else (
    echo ERROR: APK not found!
    echo Check the build output above for errors.
)
pause