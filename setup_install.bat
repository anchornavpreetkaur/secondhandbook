@echo off
echo ========================================================
echo Installing Dependencies for Second-Hand Book Application
echo ========================================================

echo.
echo [1/3] Installing Python Scraper Dependencies...
cd scraper
python -m pip install -r requirements.txt
cd ..

echo.
echo [2/3] Installing Node.js Backend Dependencies...
cd backend
call npm install
cd ..

echo.
echo [3/3] Installing React Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ========================================================
echo All Dependencies Installed Successfully!
echo ========================================================
pause
