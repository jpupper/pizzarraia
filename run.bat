@echo off
echo Iniciando el servidor...

:: Matar cualquier proceso que est  usando el puerto 3025
echo Verificando si hay procesos usando el puerto 3025...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3025 ^| findstr LISTENING') DO (
    IF NOT "%%P"=="" (
        echo Terminando proceso con PID: %%P
        taskkill /F /PID %%P
    )
)

:: Cambiar al directorio del script
cd /d %~dp0

:: Iniciar el servidor
echo Iniciando node server.js...
node server.js
pause