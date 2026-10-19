@echo off
echo ========================================================
echo Populating MongoDB with Benchmark Second-Hand Books
echo ========================================================
cd scraper
python seed_database.py
cd ..
echo.
echo Database populated! Please refresh your browser (http://localhost:5173)
pause
