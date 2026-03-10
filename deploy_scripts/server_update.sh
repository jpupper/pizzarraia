#!/bin/bash

# 1. SOLUCIÓN AL ERROR DE WINDOWS (CRLF to LF)
# Se ajustó la ruta para el nuevo nombre de este archivo
sed -i 's/\r$//' deploy_scripts/server_update.sh 2>/dev/null

# Configuración: no pongas tokens aquí para que no se bloquee el push. 
# Si el servidor necesita el token, úsalo como variable de entorno.
REPO_URL="https://github.com/jpupper/pizzarraia"
APP_NAME="pizzarraia"

echo "------------------------------------------------"
echo "🚀 INICIANDO DEPLOY INTEGRAL: $APP_NAME"
echo "------------------------------------------------"

# 2. INICIALIZACIÓN O ACTUALIZACIÓN DE GIT
# Corremos estos comandos asumiendo que el usuario está parado en `jpshadereditor` (root)
if [ ! -d ".git" ]; then
    echo "📦 No se detectó Git. Inicializando repositorio..."
    git init
    git remote add origin "$REPO_URL"
    git fetch origin main
    git checkout -f main
    git branch --set-upstream-to=origin/main main
else
    echo "🔄 Repositorio detectado. Actualizando..."
    git remote set-url origin "$REPO_URL"
    # Forzamos el reset para evitar conflictos con archivos locales modificados
    git fetch origin main
    git reset --hard origin/main
fi

# 3. INSTALACIÓN DE DEPENDENCIAS
echo "npm install..."
npm install --production

# 4. REINICIO DE PM2
echo "Reiniciando PM2..."
pm2 restart "$APP_NAME" || pm2 start server.js --name "$APP_NAME"
pm2 save

echo "------------------------------------------------"
echo "✅ DEPLOY FINALIZADO CON ÉXITO EN EL VPS"
echo "------------------------------------------------"
echo "ESTADO DE LAS APLICACIONES PM2:"
pm2 list
echo "------------------------------------------------"
