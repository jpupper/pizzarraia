#!/bin/bash

# Script de deployment para Pizzarraia en VPS
# Uso: bash deploy.sh

echo "🚀 Iniciando deployment de Pizzarraia..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Error: No se encuentra server.js${NC}"
    echo "Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

echo -e "${GREEN}✅ Directorio correcto${NC}"

# 2. Instalar/actualizar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

# 3. Verificar configuración de Nginx
echo -e "${YELLOW}🔍 Verificando configuración de Nginx...${NC}"

if [ -f "/etc/nginx/sites-available/pizzarraia" ]; then
    echo -e "${GREEN}✅ Archivo de configuración encontrado${NC}"
else
    echo -e "${RED}⚠️  No se encontró /etc/nginx/sites-available/pizzarraia${NC}"
    echo -e "${YELLOW}Copiando configuración...${NC}"
    sudo cp nginx.conf /etc/nginx/sites-available/pizzarraia
    sudo ln -sf /etc/nginx/sites-available/pizzarraia /etc/nginx/sites-enabled/
fi

# 4. Verificar configuración de Nginx
echo -e "${YELLOW}🔍 Testeando configuración de Nginx...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Configuración de Nginx correcta${NC}"
    
    # Reiniciar Nginx
    echo -e "${YELLOW}🔄 Reiniciando Nginx...${NC}"
    sudo systemctl restart nginx
    echo -e "${GREEN}✅ Nginx reiniciado${NC}"
else
    echo -e "${RED}❌ Error en configuración de Nginx${NC}"
    exit 1
fi

# 5. Reiniciar aplicación Node.js con PM2
echo -e "${YELLOW}🔄 Reiniciando aplicación...${NC}"

if command -v pm2 &> /dev/null; then
    # Si existe PM2
    if pm2 list | grep -q "pizzarraia"; then
        echo -e "${YELLOW}Reiniciando con PM2...${NC}"
        pm2 restart pizzarraia
    else
        echo -e "${YELLOW}Iniciando con PM2...${NC}"
        pm2 start server.js --name pizzarraia
        pm2 save
    fi
    
    echo -e "${GREEN}✅ Aplicación reiniciada con PM2${NC}"
    pm2 status
else
    echo -e "${RED}⚠️  PM2 no está instalado${NC}"
    echo -e "${YELLOW}Instalando PM2...${NC}"
    sudo npm install -g pm2
    pm2 start server.js --name pizzarraia
    pm2 save
    pm2 startup
fi

# 6. Verificar que el servidor está corriendo
echo -e "${YELLOW}🔍 Verificando servidor...${NC}"
sleep 2

if curl -s http://localhost:3025/ > /dev/null; then
    echo -e "${GREEN}✅ Servidor corriendo en puerto 3025${NC}"
else
    echo -e "${RED}❌ El servidor no responde${NC}"
    echo "Revisa los logs con: pm2 logs pizzarraia"
    exit 1
fi

# 7. Resumen
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment completado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📊 Estado de la aplicación:"
pm2 status
echo ""
echo "🌐 URLs disponibles:"
echo "  - http://vps-4455523-x.dattaweb.com/pizzarraia"
echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs: pm2 logs pizzarraia"
echo "  - Reiniciar: pm2 restart pizzarraia"
echo "  - Detener: pm2 stop pizzarraia"
echo "  - Ver Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
