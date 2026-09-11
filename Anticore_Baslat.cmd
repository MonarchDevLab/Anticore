@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~dp0anticore-desktop.exe' -Verb RunAs"
