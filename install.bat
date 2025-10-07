@echo off
echo ========================================
echo Instalando Sistema de Usuarios - Pizzarr.IA
echo ========================================
echo.

echo [1/3] Instalando dependencias de Node.js...
call npm install

echo.
echo [2/3] Verificando MongoDB...
echo Asegurate de que MongoDB este corriendo en tu sistema
echo Si no lo tienes instalado, descargalo de: https://www.mongodb.com/try/download/community
echo.

echo [3/3] Instalacion completa!
echo.
echo ========================================
echo Para iniciar el servidor, ejecuta:
echo   npm start
echo.
echo Luego abre: http://localhost:3025
echo ========================================
pause
