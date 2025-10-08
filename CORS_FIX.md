# 🔧 Solución al Error de CORS

## ❌ Error Original
```
Access to fetch at 'https://vps-4455523-x.dattaweb.com/pizarraia/api/check-session' 
from origin 'https://jeyder.com.ar' has been blocked by CORS policy
```

## 🎯 Causa
El frontend está en `https://jeyder.com.ar` pero hace peticiones al backend en `https://vps-4455523-x.dattaweb.com`, lo cual es un **dominio diferente** y requiere configuración CORS.

## ✅ Solución Aplicada

### 1. Actualizado `server.js` con CORS
Se agregó middleware CORS **ANTES** de cualquier otra configuración:

```javascript
// CORS Configuration - MUST be before other middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3025',
    'https://vps-4455523-x.dattaweb.com',
    'https://jeyder.com.ar',  // ← Tu dominio
    'http://127.0.0.1:3025'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

### 2. Actualizado Socket.IO con CORS
```javascript
const io = socketIo(server, {
  path: '/pizarraia/socket.io',
  cors: {
    origin: [
      'http://localhost:3025',
      'https://vps-4455523-x.dattaweb.com',
      'https://jeyder.com.ar',  // ← Tu dominio
      'http://127.0.0.1:3025'
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

## 🚀 Pasos para Desplegar

### 1. Subir el archivo actualizado al VPS
```bash
scp server.js root@vps-4455523-x.dattaweb.com:/root/pizarraia/
```

### 2. Conectarse al VPS
```bash
ssh root@vps-4455523-x.dattaweb.com
```

### 3. Ir al directorio y reiniciar
```bash
cd /root/pizarraia
pm2 restart pizarraia
```

### 4. Verificar logs
```bash
pm2 logs pizarraia --lines 50
```

Deberías ver:
```
MongoDB connected successfully
Server running at http://0.0.0.0:3025/
Socket.IO path: /pizarraia/socket.io
```

### 5. Probar desde el navegador
1. Abre `https://jeyder.com.ar/pizarraia`
2. Abre la consola del navegador (F12)
3. Ya **NO** deberías ver errores de CORS
4. Verifica que las APIs funcionan:
   - Registro/Login
   - Guardado de imágenes
   - Socket.IO conectado

## 🔍 Verificación Rápida

### Comando de prueba desde terminal:
```bash
curl -H "Origin: https://jeyder.com.ar" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://vps-4455523-x.dattaweb.com/pizarraia/api/check-session \
     -v
```

Deberías ver en la respuesta:
```
< Access-Control-Allow-Origin: https://jeyder.com.ar
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
< Access-Control-Allow-Credentials: true
```

## 📝 Notas Importantes

### Si agregas más dominios en el futuro:
Simplemente agrega el nuevo dominio al array `allowedOrigins` en ambos lugares (Express y Socket.IO).

### Cookies y Credenciales:
La configuración incluye `credentials: true`, lo cual es **necesario** para que las cookies de sesión funcionen entre dominios.

### Seguridad:
- ❌ NO uses `origin: "*"` en producción con `credentials: true`
- ✅ Lista explícitamente los dominios permitidos
- ✅ Mantén la lista actualizada

## ⚡ Problema Resuelto

Después de estos cambios:
- ✅ Las peticiones desde `jeyder.com.ar` funcionarán
- ✅ Las peticiones desde `vps-4455523-x.dattaweb.com` funcionarán
- ✅ Socket.IO se conectará correctamente
- ✅ Las sesiones persistirán entre peticiones
- ✅ Login, registro y guardado de imágenes funcionarán

---

**Última actualización**: 2025-10-08
