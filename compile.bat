@echo off
echo Compiling Haxe Code...
haxe build.hxml
if "%1"=="-test" (
    echo Launching program...
    npx electron .
    echo Program closed!
) else (
    echo --------------------------
    echo If you want to test the app without actually building it, run `compile -test`
)
REM npm install electron-packager --save-dev

echo Building app...
npx electron-packager . GenEmulator --platform=win32 --arch=x64 --out=build/

explorer build\GenEmulator\Genemulator.exe
echo --------------------------
echo Build complete. You can find the executable in the build folder.


