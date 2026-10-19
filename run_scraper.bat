@echo off
echo ========================================================
echo Running Second-Hand Book Scraper & Normalization Pipeline
echo ========================================================
cd scraper
python scraper.py %*
cd ..
pause
