@echo off
title AgriChain - Hackathon Presentation Launcher
color 0A

echo =======================================================
echo          AgriChain - Hackathon Demo Launcher
echo =======================================================
echo.
echo [1/3] Starting AI Quality Computer-Vision Service (Port 8000)...
start "AgriChain AI Service" /B uvicorn main:app --host 0.0.0.0 --port 8000 --app-dir ai-service

echo [2/3] Starting Backend API ^& Frontend (Port 4000)...
start "AgriChain Express Backend" /B node backend/src/server.js

echo.
echo [3/3] Starting High-Speed Cloudflare Tunnel for Mobile / Phone Access...
if exist "cloudflared.exe" (
    start "AgriChain Cloudflare Tunnel" .\cloudflared.exe tunnel --url http://localhost:4000
) else (
    start "AgriChain Public Tunnel" npx tunnelmole 4000
)

timeout /t 3 /nobreak >nul

echo.
echo =======================================================
echo  AgriChain is LIVE!
echo  Local Dashboard:  http://localhost:4000
echo =======================================================
echo.
start http://localhost:4000
