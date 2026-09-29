@echo off
cd /d "%~dp0"
node -e "fetch('http://127.0.0.1:4173/',{signal:AbortSignal.timeout(1000)}).then(r=>r.text()).then(t=>process.exit(t.includes('Daimeng Technology')?0:1)).catch(()=>process.exit(1))"
if errorlevel 1 goto runsite
start "" "http://127.0.0.1:4173/"
exit /b
:runsite
echo Daimeng website: http://127.0.0.1:4173/
echo Keep this window open while using the local website.
start "" "http://127.0.0.1:4173/"
node server.mjs
pause
