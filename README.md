# 🎨 PizarraCollab - Pizarra Colaborativa en Tiempo Real

## Parámetros de URL

- shownames
  - Controla la visualización de los nombres y los cursores remotos en el lienzo.
  - Valor por defecto: `true` (si no se especifica, se muestran).
  - Para ocultarlos: añade el parámetro en la URL con un valor "falso".
    - Acepta: `shownames=false`, `shownames=0` o `shownames=no`.
  - Ejemplos:
    - `index.html?shownames=false`
    - `/?session=abcdef&shownames=no`
  - Comportamiento: cuando `shownames` es falso, no se dibujan ni los nombres ni los punteros/cursos remotos en el buffer GUI.


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

## 🌐 Parámetros URL

La aplicación soporta los siguientes parámetros en la URL:

### `?session=ID` o `?sesion=ID`
Conecta a una sesión específica.
```
https://tu-dominio.com/pizarraia/index.html?session=ABC123
```

### `?intromodal=false` o `?modalintro=false`
Oculta el modal de bienvenida al cargar la página.
```
https://tu-dominio.com/pizarraia/index.html?intromodal=false
```

### `?intromodal=true` o `?modalintro=true`
Fuerza mostrar el modal de bienvenida (incluso si el usuario está logueado).
```
https://tu-dominio.com/pizarraia/index.html?intromodal=true
```

### `?showgui=false`
Oculta por defecto el botón de interfaz y los controles de zoom. Útil para presentaciones o capturas limpias.
```
https://tu-dominio.com/pizarraia/index.html?showgui=false
```
**Nota:** Puedes presionar la tecla **G** para mostrar/ocultar estos controles en cualquier momento.

### Combinación de parámetros
Puedes combinar múltiples parámetros:
```
https://tu-dominio.com/pizarraia/index.html?sesion=ABC123&intromodal=false&showgui=false
```

## 🎨 Personalización de Sesiones (Session Workspace)

Cada sesión puede personalizarse completamente:

- **Logo**: Aparece en el header de la galería y en la interfaz de dibujo
- **Background**: Imagen de fondo para la galería
- **Colores personalizados**:
  - Color de fondo
  - Color primario (botones, highlights)
  - Color secundario (acentos, gradientes)
  - Color de tipografía
- **Control de acceso**: Usuarios no logueados, logueados, o específicos
- **Brushes permitidos**: Selección de qué herramientas están disponibles
- **Restricciones**: Kaleidoscopio, capas, limpiar canvas

## 🚀 Tecnologías

- **Frontend**: P5.js, HTML5 Canvas, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Base de datos**: MongoDB
- **Tiempo real**: Socket.IO
- **Autenticación**: JWT (JSON Web Tokens)

## 📦 Estructura del Proyecto

```
pizarraia/
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
│       ├── profile.js      # Gestión de sesiones
│       ├── gallery.js      # Galería de imágenes
│       └── brushes/        # Sistema de brushes
│           ├── BaseBrush.js
│           ├── BrushRegistry.js
│           ├── standardbrush.js
│           ├── linebrush.js
│           ├── artbrush.js
│           └── ...
├── models/
│   ├── Session.js          # Modelo de sesión
│   ├── User.js             # Modelo de usuario
│   └── Image.js            # Modelo de imagen
├── server.js               # Servidor Express + Socket.IO
└── README.md

```

## 🔧 Instalación

```bash
# Clonar repositorio
git clone [tu-repo]

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con:
# MONGODB_URI=tu_mongodb_uri
# JWT_SECRET=tu_secret_key
# PORT=3025

# Iniciar servidor
npm start
```

## 👨‍💻 Autor

Creado por **JPupper** - [https://fullscreencode.com/jpupper](https://fullscreencode.com/jpupper/)

## 📄 Licencia

Este proyecto es privado y propietario.
