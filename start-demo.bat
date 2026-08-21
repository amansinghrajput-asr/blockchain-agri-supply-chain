@echo off
title AgriChain - Hackathon Presentation Launcher
color 0A

echo =======================================================
echo          AgriChain - Hackathon Demo Launcher
echo =======================================================
echo.
echo Starting AI Quality Service (Port 8000)...
start "AgriChain AI Service" /B uvicorn main:app --host 0.0.0.0 --port 8000 --app-dir ai-service

echo Starting Backend API ^& Frontend (Port 4000)...
start "AgriChain Express Backend" /B node backend/src/server.js

echo.
echo Starting Public Tunnel for Mobile QR Scanning...
start "AgriChain Public Tunnel" npx tunnelmole 4000

timeout /t 3 /nobreak >nul

echo.
echo =======================================================
echo  AgriChain is LIVE!
echo  Local Dashboard:  http://localhost:4000
echo =======================================================
echo.
start http://localhost:4000
