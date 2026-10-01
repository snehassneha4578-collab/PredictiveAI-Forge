@echo off
title PredictiveAI Forge Launcher

cd /d C:\Users\sneha\PredictiveAI-Forge

start "PredictiveAI Backend" cmd /k "set PYTHONPATH=. && python -m uvicorn backend.main:app --reload"

timeout /t 4 /nobreak >nul

start "PredictiveAI Frontend" cmd /k "cd /d C:\Users\sneha\PredictiveAI-Forge\frontend && npm run dev -- --host 127.0.0.1"

timeout /t 5 /nobreak >nul

start "" "http://127.0.0.1:5173"

exit