@echo off

REM Ensure backend venv311 is activated and all dependencies are installed before starting
cd backend
if not exist .venv311\Scripts\activate.bat (
    echo Creating Python 3.11 virtual environment...
    py -3.11 -m venv .venv311
)
call .venv311\Scripts\activate.bat
pip show sweetviz >nul 2>&1
if errorlevel 1 (
    echo Installing sweetviz...
    pip install sweetviz
)
pip show uvicorn >nul 2>&1
if errorlevel 1 (
    echo Installing uvicorn...
    pip install uvicorn
)
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installing fastapi...
    pip install fastapi
)
pip show pyyaml >nul 2>&1
if errorlevel 1 (
    echo Installing pyyaml...
    pip install pyyaml
)
pip show setuptools >nul 2>&1
if errorlevel 1 (
    echo Installing setuptools...
    pip install setuptools
)
pip show python-multipart >nul 2>&1
if errorlevel 1 (
    echo Installing python-multipart...
    pip install python-multipart
)
pip show sqlalchemy >nul 2>&1
if errorlevel 1 (
    echo Installing sqlalchemy...
    pip install sqlalchemy
)
pip show passlib >nul 2>&1
if errorlevel 1 (
    echo Installing passlib...
    pip install passlib
)
REM Downgrade numpy if version is 2.x (for sweetviz compatibility)
pip show numpy >nul 2>&1
if not errorlevel 1 (
    pip show numpy | findstr /C:"Version: 2." >nul
    if not errorlevel 1 (
        echo Downgrading numpy to 1.26.x for compatibility...
        pip install "numpy<2.0.0"
    )
)
cd ..

REM Start FastAPI backend in a new terminal window using venv311's python
start "FastAPI Backend" cmd /k "cd /d %~dp0 && backend\.venv311\Scripts\python.exe -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload"

REM Start frontend as before
cd /d "%~dp0"
npm run start:frontend

pause 