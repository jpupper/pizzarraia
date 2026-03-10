@echo off
echo ===================================================
echo Iniciando proceso COMPLETO de Deploy (NUEVO ORDEN)...
echo ===================================================

echo.
echo [1/2] DESPLEGANDO EN EL VPS (149.50.139.152) POR SSH...
echo Primero actualizamos desde Github y luego corremos el script en el VPS.
echo.
ssh -p 5752 root@149.50.139.152 "cd pizzarraia && echo 'Bajando cambios al VPS...' && git fetch origin main && git reset --hard origin/main && echo 'Corriendo el deploy de backend...' && bash deploy_scripts/server_update.sh"

echo.
echo [2/2] SUBIENDO ARCHIVOS DE FRONTEND AL FTP (c1700065.ferozo.com)...
node "%~dp0upload_ftp.js"
if %ERRORLEVEL% neq 0 (
    echo Error al subir archivos por FTP. Revisa la consola.
    pause
    exit /b
)

echo.
echo ===================================================
echo ¡El proceso de deploy ha finalizado!
echo VPS y FTP estan completamente actualizados.
echo ===================================================
pause
