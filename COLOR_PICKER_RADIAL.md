# 🎨 Selector de Color Radial (Long Press)

## 📋 Descripción

Sistema de selector de color radial que se activa al mantener presionado el mouse o touch por más de 2 segundos. Permite seleccionar colores de forma rápida y visual sin necesidad de abrir menús.

## ✨ Características

### 🎯 Activación
- **Long Press:** Mantén presionado 2 segundos **SIN MOVER** el cursor
- **Indicador de progreso:** Círculo que se llena mientras presionas (solo si estás quieto)
- **Posición:** Aparece donde haces el long press
- **Cancelación:** 
  - Suelta antes de 2 segundos
  - Mueve el cursor más de 10 píxeles
- **Texto:** Muestra "Mantén quieto" durante el progreso

### 🌈 Estructura del Selector

```
        ┌─────────────────┐
        │ Anillo Exterior │ ← 16 colores adicionales
        ├─────────────────┤
        │ Anillo Interior │ ← 17 colores principales
        ├─────────────────┤
        │ Centro          │ ← Color actual
        └─────────────────┘
```

**Anillo Interior (17 colores principales):**
- Rojo, Naranja, Amarillo, Lima, Verde
- Verde agua, Cian, Azul cielo, Azul
- Violeta, Magenta, Rosa
- Blanco, Gris claro, Gris, Gris oscuro, Negro

**Anillo Exterior (16 colores adicionales):**
- Rojo oscuro, Naranja rojizo, Dorado, Lima brillante
- Verde bosque, Turquesa, Azul real, Azul medio
- Violeta azulado, Púrpura, Rosa fuerte, Carmesí
- Beige, Marrón claro, Marrón, Marrón oscuro

### 🎨 Interacción

**Hover:**
- El segmento bajo el cursor se resalta con borde blanco
- Fácil de ver qué color vas a seleccionar

**Selección:**
- Haz click en cualquier segmento
- El color se aplica inmediatamente
- El selector se cierra automáticamente

**Cerrar:**
- Click fuera del selector
- Tecla ESC
- Seleccionar un color

## 🔧 Archivos Creados/Modificados

### 1. **`public/js/colorPicker.js`** (NUEVO)

**Clase `ColorPicker`:**
```javascript
class ColorPicker {
    constructor()
    startLongPress(x, y)    // Iniciar temporizador
    cancelLongPress()        // Cancelar temporizador
    show(x, y)              // Mostrar selector
    hide()                  // Ocultar selector
    isPointInside(x, y)     // Verificar si punto está dentro
    getColorAt(x, y)        // Obtener color en posición
    handleClick(x, y)       // Manejar click
    updateHover(x, y)       // Actualizar hover
    display(buffer)         // Dibujar selector
}
```

**Propiedades:**
- `radius`: 120px (radio del círculo principal)
- `innerRadius`: 30px (radio del centro)
- `longPressThreshold`: 2000ms (2 segundos)
- `colors`: Array de 17 colores principales
- `outerColors`: Array de 16 colores adicionales

### 2. **`public/index.html`**
- ✅ Agregado `<script src='js/colorPicker.js'></script>`

### 3. **`public/js/sketch.js`**

**Función `draw()`:**
- ✅ Dibuja el color picker en guiBuffer
- ✅ Actualiza hover
- ✅ Previene dibujo cuando está visible

**Función `mousePressed()`:**
- ✅ Inicia temporizador de long press
- ✅ Maneja clicks en el selector

**Función `mouseReleased()`:**
- ✅ Cancela temporizador

**Función `keyPressed()`:**
- ✅ ESC cierra el selector

**Funciones Touch (NUEVO):**
- ✅ `touchStarted()` - Soporte para móviles
- ✅ `touchEnded()` - Soporte para móviles
- ✅ `touchMoved()` - Actualiza hover en móviles

## 🎮 Uso

### Desktop (Mouse):
1. Mantén presionado el botón del mouse **sin mover**
2. Aparece un círculo de progreso con "Mantén quieto"
3. Después de 2 segundos se despliega el selector
4. Ahora sí puedes mover el mouse para ver los colores
5. Haz click en el color deseado

### Móvil (Touch):
1. Mantén presionado el dedo **sin mover**
2. Aparece el indicador de progreso
3. Después de 2 segundos aparece el selector
4. Ahora puedes deslizar el dedo para ver colores
5. Levanta el dedo sobre el color deseado

### Teclado:
- **ESC:** Cerrar selector sin seleccionar

## 🎨 Diseño Visual

### Indicador de Progreso:
```
    ⊙  (0%)
    ◔  (25%)
    ◑  (50%)
    ◕  (75%)
    ⊕  (100%) → Aparece selector
```

### Selector Completo:
```
         ┌───────────────────┐
         │  Selecciona color │
         └───────────────────┘
                  ↓
    ╔═══════════════════════╗
    ║  Anillo Exterior      ║
    ║  ┌─────────────────┐  ║
    ║  │ Anillo Interior │  ║
    ║  │  ┌───────────┐  │  ║
    ║  │  │  Actual   │  │  ║
    ║  │  └───────────┘  │  ║
    ║  └─────────────────┘  ║
    ╚═══════════════════════╝
```

## 📊 Flujo de Eventos

```
Usuario presiona mouse/touch
    ↓
startLongPress() inicia timer
    ↓
Cada frame: updatePosition() verifica movimiento
    ↓
¿Se movió más de 10px?
    ├─ SÍ → cancelLongPress() cancela
    │
    └─ NO → Continúa...
            ↓
        Dibuja indicador de progreso
            ↓
        ¿Pasan 2 segundos Y está quieto?
            ├─ SÍ → show() muestra selector
            │         ↓
            │    Usuario mueve mouse
            │         ↓
            │    updateHover() resalta color
            │         ↓
            │    Usuario hace click
            │         ↓
            │    handleClick() aplica color
            │         ↓
            │    hide() cierra selector
            │
            └─ NO → cancelLongPress() cancela
```

## 💡 Ventajas

1. **Rápido:** No necesitas abrir menús
2. **Visual:** Ves todos los colores de una vez
3. **Intuitivo:** Diseño circular natural
4. **Accesible:** Funciona en desktop y móvil
5. **No invasivo:** Solo aparece cuando lo necesitas
6. **Preciso:** Hover muestra qué vas a seleccionar
7. **Inteligente:** No interfiere al dibujar (detecta movimiento)

## 🔧 Personalización

### Cambiar Tiempo de Activación:

```javascript
// En colorPicker.js
this.longPressThreshold = 1500; // 1.5 segundos
this.longPressThreshold = 3000; // 3 segundos
```

### Agregar Más Colores:

```javascript
// En colorPicker.js, constructor
this.colors.push('#FF69B4'); // Rosa fuerte
this.outerColors.push('#2F4F4F'); // Gris pizarra
```

### Cambiar Tamaño:

```javascript
// En colorPicker.js, constructor
this.radius = 150;      // Más grande
this.innerRadius = 40;  // Centro más grande
```

### Cambiar Posición del Texto:

```javascript
// En display(), cambiar:
buffer.text('Selecciona un color', 
    this.centerX, 
    this.centerY + this.radius + 60  // Más abajo
);
```

### Colores Personalizados:

```javascript
// Reemplazar arrays completos
this.colors = [
    '#FF0000', '#00FF00', '#0000FF',  // RGB básicos
    '#FFFF00', '#FF00FF', '#00FFFF',  // CMY
    '#FFFFFF', '#000000'               // Blanco/Negro
];
```

## 🐛 Solución de Problemas

### El selector no aparece:
**Verificar:**
1. Que estés presionando 2 segundos completos
2. Que no estés sobre la GUI (`isOverGui`)
3. Que `colorPicker` esté inicializado
4. Consola del navegador para errores

### El selector aparece en posición incorrecta:
**Ajustar:**
```javascript
// Considerar offset del canvas
const offsetX = canvas.offsetLeft;
const offsetY = canvas.offsetTop;
colorPicker.show(mouseX + offsetX, mouseY + offsetY);
```

### Colores no se aplican:
**Verificar:**
```javascript
// Que el input existe
const colorInput = document.getElementById('c1');
console.log('Color input:', colorInput);
```

### Interfiere con el dibujo:
**Solución implementada:**
```javascript
// En draw(), previene dibujo cuando está visible
if (window.colorPicker && colorPicker.isVisible) {
    return; // No dibuja
}
```

## 📈 Mejoras Futuras

1. **Paletas guardadas:** Guardar colores favoritos
2. **Historial:** Últimos colores usados
3. **Gradientes:** Selector de gradientes
4. **Opacidad:** Anillo adicional para alpha
5. **Nombres:** Mostrar nombre del color
6. **Animación:** Transición suave al aparecer
7. **Temas:** Paletas predefinidas (pastel, neón, etc.)
8. **Compartir:** Compartir paletas con otros usuarios

## 🎯 Casos de Uso

### Dibujo Rápido:
```
1. Presiona 2 segundos
2. Selecciona color
3. Continúa dibujando
```

### Cambio Frecuente:
```
- Dibuja con rojo
- Long press → Azul
- Dibuja con azul
- Long press → Verde
- Dibuja con verde
```

### Móvil:
```
- Touch largo
- Selector aparece
- Desliza para ver
- Suelta en color
```

## 🎨 Paleta de Colores Completa

**Anillo Interior (17):**
```
🔴 #FF0000  🟠 #FF7F00  🟡 #FFFF00  🟢 #7FFF00
🟢 #00FF00  🟢 #00FF7F  🔵 #00FFFF  🔵 #007FFF
🔵 #0000FF  🟣 #7F00FF  🟣 #FF00FF  🔴 #FF007F
⚪ #FFFFFF  ⚪ #CCCCCC  ⚫ #888888  ⚫ #444444
⚫ #000000
```

**Anillo Exterior (16):**
```
🔴 #8B0000  🟠 #FF4500  🟡 #FFD700  🟢 #ADFF2F
🟢 #32CD32  🔵 #20B2AA  🔵 #1E90FF  🔵 #4169E1
🟣 #8A2BE2  🟣 #9932CC  🔴 #FF1493  🔴 #DC143C
🟤 #F5F5DC  🟤 #D2B48C  🟤 #A0522D  🟤 #654321
```

## 🚀 Resultado

¡Ahora puedes cambiar de color rápidamente sin interrumpir tu flujo creativo! Mantén presionado 2 segundos en cualquier lugar del canvas y selecciona tu color favorito.

```
🎨 Flujo de Trabajo Mejorado:
├─ Dibuja libremente
├─ Long press (2s) → Selector aparece
├─ Selecciona nuevo color
└─ Continúa dibujando sin interrupciones
```

¡Disfruta de la nueva forma de seleccionar colores! 🌈✨
