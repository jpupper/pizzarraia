# 🚀 Instrucciones de Instalación y Uso

## Paso 1: Instalar MongoDB

### Opción A: MongoDB Community (Recomendado para desarrollo local)
1. Descarga MongoDB desde: https://www.mongodb.com/try/download/community
2. Instala MongoDB siguiendo el asistente
3. Durante la instalación, marca la opción "Install MongoDB as a Service"
4. Verifica que MongoDB esté corriendo:
   ```bash
   # Abre PowerShell o CMD y ejecuta:
   mongod --version
   ```

### Opción B: MongoDB Atlas (Base de datos en la nube - GRATIS)
1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Crea una cuenta gratuita
3. Crea un cluster gratuito (M0)
4. Obtén tu connection string
5. Configura la variable de entorno:
   ```bash
   set MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/pizzarraia
   ```

## Paso 2: Instalar Dependencias

### Opción 1: Usando el script de instalación
```bash
# Haz doble clic en:
install.bat
```

### Opción 2: Manual
```bash
# Abre una terminal en la carpeta del proyecto y ejecuta:
npm install
```

Esto instalará:
- ✅ mongoose (MongoDB ODM)
- ✅ bcryptjs (Encriptación de contraseñas)
- ✅ express-session (Manejo de sesiones)
- ✅ connect-mongo (Almacenamiento de sesiones)

## Paso 3: Iniciar el Servidor

```bash
npm start
```

O simplemente haz doble clic en:
```
start.bat
```

## Paso 4: Usar la Aplicación

1. **Abre tu navegador** en: `http://localhost:3025`

2. **Registra un usuario:**
   - Haz clic en la pestaña "User"
   - Clic en "Registrarse"
   - Elige un nombre de usuario (3-20 caracteres)
   - Crea una contraseña (mínimo 6 caracteres)

3. **Inicia sesión:**
   - Usa tus credenciales para entrar
   - Tu sesión durará 7 días

4. **Dibuja y guarda:**
   - Dibuja algo increíble en el canvas
   - Haz clic en el botón "Save to Gallery" (icono de guardar)
   - Dale un título a tu obra
   - ¡Listo! Tu dibujo está guardado

5. **Ver tu galería:**
   - Haz clic en "Ver Mi Galería" en la pestaña User
   - O ve directamente a: `http://localhost:3025/profile.html`
   - Aquí verás todos tus dibujos guardados
   - Puedes ver o eliminar cualquier imagen

## 🔧 Solución de Problemas

### Error: "Cannot find module 'mongoose'"
**Solución:** Ejecuta `npm install` en la carpeta del proyecto

### Error: "MongooseServerSelectionError"
**Problema:** MongoDB no está corriendo
**Solución:** 
- Si instalaste MongoDB localmente, abre una terminal y ejecuta: `mongod`
- Si usas MongoDB Atlas, verifica tu connection string

### Error: "Port 3025 already in use"
**Solución:** 
1. Cierra cualquier instancia anterior del servidor
2. O cambia el puerto en `server.js` (línea 14)

### Las imágenes no se guardan
**Verifica:**
1. Que estés logueado (pestaña User debe mostrar tu nombre)
2. Que MongoDB esté corriendo
3. Que tengas espacio en disco

### No puedo registrarme
**Verifica:**
- Usuario: debe tener entre 3 y 20 caracteres
- Contraseña: debe tener al menos 6 caracteres
- El usuario no debe existir ya

## 📱 Características del Sistema

### ✅ Registro y Login
- Contraseñas encriptadas con bcrypt
- Validación de datos en cliente y servidor
- Sesiones persistentes (7 días)

### ✅ Guardar Dibujos
- Formato PNG de alta calidad
- Título personalizable
- Almacenamiento en MongoDB
- Límite de 50MB por imagen

### ✅ Galería Personal
- Ver todos tus dibujos
- Ordenados por fecha (más recientes primero)
- Eliminar imágenes
- Modal para ver en tamaño completo

### ✅ Seguridad
- Contraseñas hasheadas (nunca en texto plano)
- Sesiones seguras
- Rutas protegidas
- Validación de permisos

## 🎨 Interfaz

### Pestaña "User" en la App Principal
- **No logueado:** Botones para Login/Registro
- **Logueado:** 
  - Muestra tu nombre de usuario
  - Botón "Ver Mi Galería"
  - Botón "Cerrar Sesión"

### Botón "Save to Gallery"
- Ubicado en la barra de herramientas (junto a Download)
- Solo funciona si estás logueado
- Te pide un título para el dibujo
- Muestra confirmación al guardar

## 🗄️ Estructura de la Base de Datos

### Colección: users
```javascript
{
  _id: ObjectId,
  username: "artista123",
  password: "$2a$10$...", // Encriptado
  createdAt: ISODate("2025-10-06T...")
}
```

### Colección: images
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Referencia al usuario
  username: "artista123",
  title: "Mi obra maestra",
  imageData: "data:image/png;base64,...",
  createdAt: ISODate("2025-10-06T...")
}
```

## 🔐 API Endpoints

### Autenticación
- `POST /api/register` - Crear cuenta
- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/check-session` - Verificar sesión
- `GET /api/user` - Datos del usuario

### Imágenes (requieren autenticación)
- `POST /api/images` - Guardar imagen
- `GET /api/images` - Listar mis imágenes
- `GET /api/images/:id` - Ver imagen específica
- `DELETE /api/images/:id` - Eliminar imagen

## 💡 Tips

1. **Desarrollo:** Usa MongoDB local para desarrollo
2. **Producción:** Usa MongoDB Atlas para producción
3. **Seguridad:** Cambia el `secret` en server.js antes de producción
4. **Backup:** Exporta tu base de datos regularmente
5. **Performance:** Considera agregar índices si tienes muchos usuarios

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Revisa la consola del servidor
3. Verifica que MongoDB esté corriendo
4. Lee el archivo `USER_SYSTEM_README.md` para más detalles

## 🎉 ¡Listo!

Ahora tienes un sistema completo de usuarios. Puedes:
- ✅ Registrar usuarios
- ✅ Iniciar sesión
- ✅ Guardar dibujos
- ✅ Ver tu galería personal
- ✅ Compartir tu arte con el mundo

¡Disfruta creando! 🎨✨
