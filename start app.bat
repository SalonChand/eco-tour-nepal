@echo off
color 0A
echo ===================================================
echo        STARTING ECO TOUR NEPAL PLATFORM
echo ===================================================
echo.

:: 1. Start the Node.js Backend Server
echo [1/3] Starting Backend Server...
start "Eco Tour Backend" cmd /k "cd backend && npx nodemon server.js"

:: Wait 3 seconds to give the database time to connect
timeout /t 3 /nobreak > NUL

:: 2. Start the React (Vite) Frontend
echo [2/3] Starting Frontend React App...
start "Eco Tour Frontend" cmd /k "cd frontend && npm run dev"

:: Wait 3 seconds to give Vite time to start up
timeout /t 3 /nobreak > NUL

:: 3. Open the Default Web Browser
echo [3/3] Opening your App in the Browser...
start http://localhost:5173/

echo.
echo ===================================================
echo   ✅ App Started Successfully! 
echo   (You can safely close this blue/black window)
echo ===================================================
timeout /t 5 > NUL
exit