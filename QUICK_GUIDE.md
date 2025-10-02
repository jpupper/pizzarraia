# Pizarraia - Guía Rápida de Nuevas Funcionalidades

## 🎨 Nuevos Pinceles

### 📝 Text Brush (Pincel de Texto)

**Cómo usar:**
1. Abre el GUI (botón de menú en la esquina superior izquierda)
2. Selecciona "Text Brush" en el dropdown "Brush Type"
3. Configura:
   - **Text:** Escribe el texto que quieres dibujar
   - **Font:** Elige una tipografía (16 opciones disponibles)
   - **Text Size:** Ajusta el tamaño (10-200px)
   - **Color:** Usa el selector de color global
   - **Alfa:** Ajusta la transparencia
4. Haz clic en el canvas para dibujar el texto

**Tipografías disponibles:**
- **Sans-serif:** Arial, Roboto, Montserrat, Lato, Open Sans, Poppins
- **Display:** Quicksand, Comfortaa, Josefin Sans
- **Handwriting:** Dancing Script, Pacifico, Indie Flower, Shadows Into Light, Permanent Marker, Caveat, Satisfy

---

### 🔷 Geometry Brush (Pincel de Geometría)

**Cómo usar:**
1. Abre el GUI
2. Selecciona "Geometry Brush" en el dropdown "Brush Type"
3. Configura:
   - **Polygon Sides:** Ajusta el número de lados (2-10)
     - 2 = Línea
     - 3 = Triángulo
     - 4 = Cuadrado
     - 5 = Pentágono
     - 6 = Hexágono
     - 7 = Heptágono
     - 8 = Octágono
     - 9 = Eneágono
     - 10 = Decágono
   - **Size:** Ajusta el tamaño del polígono
   - **Color:** Usa el selector de color global
   - **Alfa:** Ajusta la transparencia
4. Haz clic en el canvas para dibujar el polígono

---

## 💾 Descargar Imagen

**Cómo usar:**
1. Abre el GUI
2. Haz clic en el botón "Download Image" al final del panel
3. La imagen se descargará automáticamente en formato PNG de alta calidad
4. Nombre del archivo: `pizarraia_YYYY-MM-DDTHH-MM-SS.png`

**Características:**
- ✅ Alta calidad (PNG sin compresión)
- ✅ Resolución completa del canvas
- ✅ Solo descarga el contenido dibujado (sin GUI ni cursores)
- ✅ Nombre de archivo con timestamp único

---

## 🔄 Sincronización

**Todos los pinceles están sincronizados:**
- ✅ Múltiples usuarios pueden dibujar simultáneamente
- ✅ Los dibujos se replican en tiempo real
- ✅ Funciona con mouse, touch y LIDAR
- ✅ Determinismo garantizado (mismo resultado en todos los clientes)

**Controles de sincronización:**
- **Sync:** Sincroniza el botón "Background" con otros usuarios
- **Lock:** Bloquea tu canvas para que otros no puedan limpiarlo

---

## 🎮 Controles Generales

### Atajos de Teclado
- **B:** Limpiar el fondo (background)
- **G:** Mostrar/ocultar el botón del GUI

### Tipos de Pincel Disponibles
1. **Classic Circle** - Círculo sólido
2. **Line Brush** - Línea continua
3. **Art Brush** - Sistema de partículas artístico
4. **Pixel Brush** - Píxeles en grilla
5. **Text Brush** - Texto personalizable ⭐ NUEVO
6. **Geometry Brush** - Polígonos regulares ⭐ NUEVO

### Controles Globales
- **Color:** Selector de color para todos los pinceles
- **Alfa:** Transparencia (0-255)
- **Size:** Tamaño del pincel

---

## 🌐 Sesiones Múltiples

**Trabajar en diferentes sesiones:**
```
http://localhost:3025/pizarraia?sesion=0  (sesión por defecto)
http://localhost:3025/pizarraia?sesion=1
http://localhost:3025/pizarraia?sesion=2
...
```

Cada sesión es independiente y tiene su propio canvas compartido.

---

## 🎯 Tips y Trucos

### Text Brush
- **Tip 1:** Usa fuentes handwriting para efectos más artísticos
- **Tip 2:** Combina diferentes tamaños para crear jerarquía visual
- **Tip 3:** Ajusta el alpha para crear efectos de superposición

### Geometry Brush
- **Tip 1:** Usa 2 lados para crear líneas decorativas
- **Tip 2:** Combina diferentes polígonos para crear patrones
- **Tip 3:** Ajusta el tamaño dinámicamente para crear variación

### Descarga de Imagen
- **Tip 1:** Limpia el fondo antes de empezar para una imagen más limpia
- **Tip 2:** El timestamp en el nombre evita sobrescribir archivos
- **Tip 3:** La imagen descargada es el canvas completo en resolución nativa

---

## 🐛 Solución de Problemas

**El texto no se ve:**
- Verifica que el color no sea negro sobre fondo negro
- Aumenta el tamaño del texto
- Aumenta el valor de alpha

**Los polígonos no se dibujan:**
- Verifica que el tamaño (size) no sea 0
- Aumenta el valor de alpha
- Verifica que el color sea visible

**La descarga no funciona:**
- Verifica que el navegador permita descargas
- Asegúrate de que hay contenido en el canvas
- Revisa la consola del navegador para errores

**Problemas de sincronización:**
- Verifica que todos los clientes estén en la misma sesión
- Revisa que el servidor esté corriendo
- Comprueba la conexión de red

---

## 📱 Compatibilidad

**Navegadores soportados:**
- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

**Dispositivos:**
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Tablets (iOS, Android)
- ✅ Móviles (iOS, Android)
- ✅ TouchDesigner + LIDAR

---

## 🚀 Inicio Rápido

```bash
# 1. Navegar al directorio
cd c:\xampp\htdocs\pizarraia

# 2. Iniciar el servidor
node server.js

# 3. Abrir en el navegador
http://localhost:3025/pizarraia

# 4. ¡Empieza a dibujar!
```

---

**¿Necesitas ayuda?** Revisa el archivo `IMPLEMENTATION_SUMMARY.md` para detalles técnicos.
