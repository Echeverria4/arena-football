@echo off
setlocal
cd /d "%~dp0"
C:\Progra~1\nodejs\node.exe scripts\serve-dist.js > serve.log 2>&1
