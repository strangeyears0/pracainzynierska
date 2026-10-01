@echo off
echo ========================================================
echo Uruchamianie Systemu Rezerwacji Zasobow (FastAPI + SVG)
echo ========================================================

start "Reservation Service (Port 8000)" cmd /k "cd /d %~dp0reservation-service && uvicorn app.main:app --reload --port 8000"
start "Notification Service (Port 8001)" cmd /k "cd /d %~dp0user-notification-service && uvicorn app.main:app --reload --port 8001"
start "Frontend HTTP Server (Port 3000)" cmd /k "cd /d %~dp0frontend && python -m http.server 3000"

echo.
echo Uslugi zostaly uruchomione w osobnych okienkach.
echo Przejdz do: http://localhost:3000 w przegladarce!
echo ========================================================
