@echo off
echo ========================================================
echo Launching Second-Hand Book Price Comparison System
echo ========================================================
echo Starting Backend (Port 5000)...
start "Second-Hand Book Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Port 5173)...
start "Second-Hand Book Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services launched!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo ========================================================
