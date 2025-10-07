# Sistema de Usuarios - Pizzarr.IA

## 📋 Descripción

Se ha implementado un sistema completo de usuarios con MongoDB que permite:
- ✅ Registro de nuevos usuarios
- ✅ Inicio de sesión
- ✅ Gestión de perfil de usuario
- ✅ Guardar dibujos en la base de datos
- ✅ Galería personal de imágenes
- ✅ Eliminar imágenes guardadas

## 🚀 Instalación

### 1. Instalar MongoDB

Descarga e instala MongoDB desde: https://www.mongodb.com/try/download/community

Para Windows, asegúrate de que MongoDB esté corriendo:
```bash
# Iniciar MongoDB (si no está corriendo como servicio)
mongod
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará las nuevas dependencias:
- `mongoose` - ODM para MongoDB
- `bcryptjs` - Encriptación de contraseñas
- `express-session` - Manejo de sesiones
- `connect-mongo` - Almacenamiento de sesiones en MongoDB

### 3. Configurar MongoDB (Opcional)

Por defecto, la aplicación se conecta a:
```
mongodb://localhost:27017/pizzarraia
```

Para cambiar la URI de MongoDB, establece la variable de entorno:
```bash
set MONGODB_URI=mongodb://tu-uri-aqui
```

### 4. Iniciar el Servidor

```bash
npm start
```

El servidor correrá en: http://localhost:3025

## 📁 Estructura de Archivos Nuevos

```
pizarraia/
├── models/
│   ├── User.js          # Modelo de usuario
│   └── Image.js         # Modelo de imagen
├── public/
│   ├── login.html       # Página de inicio de sesión
│   ├── register.html    # Página de registro
│   └── profile.html     # Página de perfil y galería
└── server.js            # Actualizado con rutas de API
```

## 🔐 Funcionalidades de Usuario

### Registro
- URL: `/register.html`
- Campos: Usuario (3-20 caracteres), Contraseña (mínimo 6 caracteres)
- Las contraseñas se encriptan con bcrypt antes de guardarse

### Inicio de Sesión
- URL: `/login.html`
- Mantiene la sesión activa por 7 días
- Redirección automática si ya está logueado

### Perfil y Galería
- URL: `/profile.html`
- Muestra todas las imágenes guardadas del usuario
- Permite ver y eliminar imágenes
- Muestra fecha de creación de cada dibujo

### Guardar Dibujos
- Botón "Save to Gallery" en la interfaz principal
- Solo disponible para usuarios logueados
- Permite agregar un título al dibujo
- Guarda la imagen en formato PNG (base64)

## 🔌 API Endpoints

### Autenticación
- `POST /api/register` - Registrar nuevo usuario
- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/check-session` - Verificar sesión actual
- `GET /api/user` - Obtener datos del usuario actual

### Imágenes
- `POST /api/images` - Guardar nueva imagen
- `GET /api/images` - Obtener lista de imágenes del usuario
- `GET /api/images/:id` - Obtener imagen específica
- `DELETE /api/images/:id` - Eliminar imagen

## 🎨 Interfaz de Usuario

### Pestaña "User" en la Aplicación Principal
- Muestra el estado de autenticación
- Botones para login/registro si no está logueado
- Información del usuario y acceso a galería si está logueado
- Botón de cerrar sesión

### Botón "Save to Gallery"
- Icono de guardar en la barra de herramientas
- Solicita título para el dibujo
- Muestra confirmación al guardar exitosamente

## 🔒 Seguridad

- Contraseñas encriptadas con bcrypt (salt rounds: 10)
- Sesiones almacenadas en MongoDB
- Validación de datos en servidor y cliente
- Protección de rutas con middleware de autenticación

## 📊 Modelos de Datos

### Usuario
```javascript
{
  username: String (único, 3-20 caracteres),
  password: String (encriptado),
  createdAt: Date
}
```

### Imagen
```javascript
{
  userId: ObjectId (referencia a User),
  username: String,
  title: String,
  imageData: String (base64),
  createdAt: Date
}
```

## 🐛 Solución de Problemas

### MongoDB no se conecta
- Verifica que MongoDB esté corriendo: `mongod`
- Comprueba la URI de conexión en las variables de entorno

### Error al guardar imágenes grandes
- El límite está configurado en 50MB
- Si necesitas más, modifica `limit: '50mb'` en server.js

### Sesión no persiste
- Verifica que las cookies estén habilitadas en el navegador
- Comprueba que MongoDB esté guardando las sesiones

## 🎯 Próximos Pasos Sugeridos

1. **Recuperación de contraseña** - Sistema de reset por email
2. **Perfil de usuario** - Avatar, biografía, etc.
3. **Compartir dibujos** - URLs públicas para compartir
4. **Likes y comentarios** - Interacción social
5. **Categorías/Tags** - Organización de dibujos
6. **Búsqueda** - Buscar dibujos por título o fecha

## 📝 Notas

- Las imágenes se guardan en base64 en MongoDB
- Para producción, considera usar un servicio de almacenamiento como AWS S3
- Cambia el `secret` de sesión en producción (server.js línea 29)
- Considera agregar límites de rate limiting para las APIs

## 🤝 Uso

1. Abre la aplicación en `http://localhost:3025`
2. Haz clic en la pestaña "User"
3. Regístrate o inicia sesión
4. Dibuja algo increíble
5. Haz clic en el botón "Save to Gallery"
6. Ve a tu perfil para ver todas tus creaciones

¡Disfruta creando y guardando tus obras de arte! 🎨✨
