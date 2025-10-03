# 🪣 Fill Brush (Bucket Tool) - Guía Completa

## ¿Qué es el Fill Brush?

El **Fill Brush** (también conocido como "Bucket Tool" o "Paint Bucket") es la herramienta clásica de relleno que encuentras en programas como Paint, Photoshop, GIMP, etc. 

**Funciona así:** Haces click en un área del canvas y automáticamente rellena toda el área contigua que tenga el mismo color (o colores similares según la tolerancia).

---

## 🔧 Cómo Funciona Técnicamente

### Algoritmo: Flood Fill

El Fill Brush utiliza el algoritmo **Flood Fill** (relleno por inundación), que funciona de manera similar a cómo se expande el agua:

1. **Click inicial:** Detecta el color del píxel donde hiciste click (color objetivo)
2. **Expansión:** Comienza a "expandirse" hacia los píxeles vecinos
3. **Verificación:** Solo rellena píxeles que tengan el color objetivo
4. **Propagación:** Continúa expandiéndose hasta que no encuentre más píxeles del color objetivo

### Implementación

```javascript
// Pseudocódigo simplificado
function floodFill(x, y, targetColor, fillColor) {
    queue = [(x, y)];
    visited = new Set();
    
    while (queue no está vacía) {
        (px, py) = queue.pop();
        
        if (ya visitado) continue;
        if (fuera de límites) continue;
        
        currentColor = getPixelColor(px, py);
        
        if (currentColor coincide con targetColor) {
            pintarPixel(px, py, fillColor);
            marcar como visitado;
            
            // Agregar vecinos a la cola
            queue.push((px+1, py));  // derecha
            queue.push((px-1, py));  // izquierda
            queue.push((px, py+1));  // abajo
            queue.push((px, py-1));  // arriba
        }
    }
}
```

---

## 🎨 Cómo Usar el Fill Brush

### Paso 1: Seleccionar el Pincel
1. Abre el GUI (botón de menú)
2. En "Brush Type", selecciona **"Fill/Bucket Tool"**

### Paso 2: Configurar Parámetros

**Color:**
- Usa el selector de color global para elegir el color de relleno

**Alpha (Transparencia):**
- Ajusta la transparencia del relleno (0-255)

**Tolerance (Tolerancia):**
- **0:** Solo rellena píxeles del color exacto
- **1-10:** Rellena colores muy similares (recomendado para imágenes con antialiasing)
- **10-30:** Rellena colores moderadamente similares
- **30-50:** Rellena colores bastante diferentes

### Paso 3: Hacer Click
- Simplemente haz **un click** en el área que quieres rellenar
- El relleno se ejecuta automáticamente
- **No necesitas arrastrar** el mouse (a diferencia de otros pinceles)

---

## 💡 Casos de Uso

### 1. Rellenar Fondos
```
Escenario: Tienes un dibujo con líneas y quieres rellenar el fondo
Solución: Click en el área de fondo con el color deseado
```

### 2. Colorear Dibujos
```
Escenario: Tienes un dibujo de líneas y quieres colorear las áreas internas
Solución: Click dentro de cada área cerrada con diferentes colores
```

### 3. Cambiar Colores Existentes
```
Escenario: Quieres cambiar todas las áreas rojas a azul
Solución: Click en cualquier área roja con el color azul seleccionado
```

### 4. Crear Degradados con Tolerance
```
Escenario: Tienes un degradado y quieres rellenar áreas similares
Solución: Aumenta la tolerance y click en el área deseada
```

---

## ⚠️ Consideraciones Importantes

### 1. Áreas Cerradas
- **El fill solo funciona en áreas cerradas**
- Si hay un "hueco" en las líneas, el relleno se "escapará" a otras áreas
- Asegúrate de que tus líneas estén completamente cerradas

### 2. Rendimiento
- Rellenar áreas muy grandes puede tomar unos segundos
- El algoritmo procesa píxel por píxel
- Hay un límite de seguridad para evitar bloqueos

### 3. Sincronización
- ✅ El fill está completamente sincronizado por sockets
- ✅ Todos los clientes verán el mismo resultado
- ✅ Funciona con mouse, touch y LIDAR

### 4. Un Click = Un Relleno
- A diferencia de otros pinceles, el fill se ejecuta **una sola vez** por click
- No se repite mientras mantienes presionado el mouse
- Esto es intencional para evitar múltiples rellenos accidentales

---

## 🎯 Tips y Trucos

### Tip 1: Usa Tolerance para Imágenes con Antialiasing
Si tus líneas tienen bordes suavizados (antialiasing), usa una tolerance de 5-10 para rellenar correctamente.

### Tip 2: Rellena Áreas Pequeñas Primero
Si tienes un dibujo complejo, rellena primero las áreas pequeñas y luego las grandes.

### Tip 3: Verifica las Líneas Antes de Rellenar
Antes de usar el fill, asegúrate de que todas tus líneas estén cerradas. Un pequeño hueco puede causar que el relleno se escape.

### Tip 4: Usa Alpha para Efectos de Superposición
Reduce el alpha del fill para crear efectos de transparencia y superposición.

### Tip 5: Combina con Otros Pinceles
Usa el fill para rellenar áreas grandes y luego usa otros pinceles para agregar detalles.

---

## 🐛 Solución de Problemas

### Problema: El fill no hace nada
**Causas posibles:**
- Estás haciendo click en un color que ya es el color de relleno
- El área es demasiado pequeña (1 píxel)

**Solución:** Verifica que el color de relleno sea diferente al color del área

### Problema: El fill se "escapa" a otras áreas
**Causa:** Hay un hueco en las líneas que delimitan el área

**Solución:** 
1. Usa el Line Brush o Classic Brush para cerrar el hueco
2. Luego vuelve a intentar el fill

### Problema: El fill es muy lento
**Causa:** El área a rellenar es muy grande

**Solución:** 
- Espera unos segundos (el algoritmo está procesando)
- Si es demasiado lento, considera usar un área más pequeña

### Problema: El fill no rellena todo el área
**Causa:** La tolerance es muy baja y hay variaciones de color

**Solución:** Aumenta la tolerance a 5-15

---

## 🔬 Detalles Técnicos

### Algoritmo Utilizado
- **Flood Fill con Cola (Queue-based)**
- Complejidad: O(n) donde n = número de píxeles a rellenar
- Usa un Set para evitar visitar píxeles múltiples veces

### Optimizaciones
- Límite de seguridad: máximo `width * height` píxeles
- Verificación de límites antes de agregar a la cola
- Uso de Set para O(1) lookup de píxeles visitados

### Conectividad
- **4-way connectivity:** Solo considera vecinos arriba, abajo, izquierda, derecha
- No considera diagonales (esto evita "fugas" por las esquinas)

### Comparación de Colores
```javascript
function colorsMatch(color1, color2, tolerance) {
    return (
        Math.abs(color1[0] - color2[0]) <= tolerance &&  // R
        Math.abs(color1[1] - color2[1]) <= tolerance &&  // G
        Math.abs(color1[2] - color2[2]) <= tolerance &&  // B
        Math.abs(color1[3] - color2[3]) <= tolerance     // A
    );
}
```

---

## 📊 Comparación con Otros Pinceles

| Característica | Fill Brush | Classic Brush | Line Brush |
|---------------|------------|---------------|------------|
| Modo de uso | Click único | Arrastrar | Arrastrar |
| Área afectada | Contigua | Circular | Lineal |
| Velocidad | Variable | Rápido | Rápido |
| Precisión | Alta | Media | Alta |
| Uso típico | Rellenar | Pintar | Dibujar líneas |

---

## 🚀 Ejemplos de Uso

### Ejemplo 1: Colorear un Dibujo Simple
```
1. Dibuja un círculo con Line Brush (negro)
2. Selecciona Fill Brush
3. Elige un color (ej: rojo)
4. Click dentro del círculo
5. ¡Listo! El círculo está relleno de rojo
```

### Ejemplo 2: Cambiar el Fondo
```
1. Tienes un dibujo sobre fondo negro
2. Selecciona Fill Brush
3. Elige color blanco
4. Click en el fondo negro
5. El fondo cambia a blanco
```

### Ejemplo 3: Rellenar con Transparencia
```
1. Dibuja varias formas superpuestas
2. Selecciona Fill Brush
3. Elige un color y baja el alpha a 128
4. Click en cada forma
5. Verás efectos de transparencia y superposición
```

---

## 🎓 Historia del Flood Fill

El algoritmo Flood Fill fue inventado en los años 1960s y es uno de los algoritmos más antiguos en gráficos por computadora. Se usa en:

- **Programas de dibujo:** Paint, Photoshop, GIMP
- **Juegos:** Minesweeper (para revelar áreas vacías)
- **Visión por computadora:** Segmentación de imágenes
- **GIS:** Análisis de áreas geográficas

---

**¡Disfruta rellenando con el Fill Brush!** 🎨🪣
