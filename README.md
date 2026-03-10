# 🎨 PizarraCollab - Pizarra Colaborativa en Tiempo Real

Sistema de dibujo colaborativo en tiempo real construido con **P5.js** y **Socket.IO**.

## 📋 Descripción

PizarraCollab es una aplicación web que permite a múltiples usuarios dibujar juntos en tiempo real. Incluye sistema de sesiones personalizables, múltiples brushes, capas, y sincronización instantánea de trazos entre todos los participantes.

## ✨ Características Principales

- 🎨 **Dibujo colaborativo en tiempo real** con Socket.IO
- 🖌️ **10+ tipos de brushes**: Classic, Line, Art, Pixel, Text, Geometry, Fill, Image, Flower, Background
- 📐 **Sistema de capas** con visibilidad individual
- 🎭 **Efecto Kaleidoscopio** ajustable
- 🎨 **Paleta de colores** personalizable (5 slots)
- 💬 **Chat en vivo** entre colaboradores
- 👥 **Cursores en tiempo real** de todos los usuarios
- 🔐 **Sistema de sesiones** con control de acceso
- 🎨 **Personalización completa** (colores, logo, background)
- 🖼️ **Galería de imágenes** con filtros por sesión
- 📱 **Código QR** para compartir sesiones
- 🔒 **Autenticación de usuarios** (opcional)

## 🌐 Parámetros URL (Query Variables)

La aplicación utiliza variables en la URL para personalizar el comportamiento de la interfaz y las sesiones:

### Para el Lienzo de Dibujo (`index.html`)

| Variable | Valores | Descripción |
| :--- | :--- | :--- |
| `session` o `sesion` | `ID` (ej: `abc123`) | ID de la sesión a la que conectarse. Por defecto es `0`. |
| `shownames` | `true` / `false` | Muestra u oculta los nombres y cursores remotos de otros usuarios. |
| `showgui` | `true` / `false` | Muestra u oculta el botón "Open GUI" y los controles de zoom por defecto. |
| `intromodal` o `modalintro` | `true` / `false` | Fuerza la aparición o el ocultamiento del modal de bienvenida inicial. |

**Ejemplos:**
- Ocultar nombres y GUI: `index.html?shownames=false&showgui=false`
- Forzar ocultar modal: `index.html?intromodal=false`
- Sesión específica: `index.html?sesion=MI_SALA_DE_ARTE`

### Para la Galería (`gallery.html`)

| Variable | Valores | Descripción |
| :--- | :--- | :--- |
| `session` o `sesion` | `ID` (ej: `abc123`) | Filtra las imágenes para mostrar solo las de esa sesión y aplica el diseño/logo personalizado de la misma. |

## 🔗 Enlaces Internos

Puedes acceder a las diferentes secciones de la plataforma desde estos enlaces:

- **Lienzo Principal**: [index.html](https://fullscreencode.com/pizzarraia/index.html)
- **Galería Pública**: [gallery.html](https://fullscreencode.com/pizzarraia/gallery.html)
- **Perfil y Gestión**: [profile.html](https://fullscreencode.com/pizzarraia/profile.html) (Requiere Login)
- **Acceso**: [login.html](https://fullscreencode.com/pizzarraia/login.html)
- **Registro**: [register.html](https://fullscreencode.com/pizzarraia/register.html)

---

## 🎨 Personalización de Sesiones (Session Workspace)

Cada sesión puede personalizarse completamente desde el perfil de usuario:

- **Logo**: Aparece en el header de la galería y en la interfaz de dibujo.
- **Background**: Imagen de fondo para la galería de la sesión.
- **Colores personalizados**:
  - Color de fondo (Background UI).
  - Color primario (Botones y realces).
  - Color secundario (Acentos y gradientes).
  - Color de tipografía.
- **Control de acceso**: Público, solo registrados, o solo usuarios seleccionados.
- **Configuración de herramientas**: Selector de brushes permitidos.
- **Restricciones activas**: Bloqueo de kaleidoscopio, capas o botón de limpiar canvas.

## 🚀 Tecnologías

- **Frontend**: P5.js, HTML5 Canvas, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Base de datos**: MongoDB
- **Tiempo real**: Socket.IO
- **Autenticación**: JWT (JSON Web Tokens)

## 📦 Estructura del Proyecto

```
pizzarraia/
├── public/
│   ├── index.html          # Interfaz de dibujo principal
│   ├── gallery.html        # Galería de imágenes
│   ├── profile.html        # Perfil de usuario y gestión de sesiones
│   ├── login.html          # Login
│   ├── register.html       # Registro
│   ├── css/
│   │   └── style.css       # Estilos principales
│   └── js/
│       ├── sketch.js       # Lógica principal de dibujo (P5.js)
│       ├── config.js       # Configuración de la app
│       ├── general.js      # Funciones generales
│       ├── cursorGui.js    # Interfaz flotante de pinceles
│       └── brushes/        # Sistema de brushes dinámicos
├── models/
│   ├── Session.js          # Modelo de sesión (MongoDB)
│   ├── User.js             # Modelo de usuario
│   └── Image.js            # Modelo de imagen
├── server.js               # Servidor Express + Socket.IO
└── README.md
```

## 🔧 Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/pizzarraia.git

# Instalar dependencias
npm install

# Configurar variables de entorno (.env)
# MONGODB_URI=tu_mongodb_uri
# JWT_SECRET=tu_secret_key
# PORT=3025

# Iniciar servidor
npm start
```

## 👨‍💻 Autor

Creado por **JPupper** - [fullscreencode.com/jpupper](https://fullscreencode.com/jpupper/)

## 📄 Licencia

Este proyecto es propiedad privada de **JPupper** y **fullscreencode.com**. Todos los derechos reservados.
