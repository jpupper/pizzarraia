# Sistema de Pinceles Personalizados

Este directorio contiene el sistema de pinceles modulares para PizarraCollab.

## Estructura

```
brushes/
├── BrushTemplate.js      # Plantilla base para crear nuevos pinceles
├── brushRegistry.js      # Registro central de pinceles
├── ParticleBrush.js      # Ejemplo de pincel personalizado
└── README.md            # Esta documentación
```

## Cómo Crear un Nuevo Pincel

### 1. Copiar la Plantilla

Copia `BrushTemplate.js` y renómbralo según tu pincel:

```bash
cp BrushTemplate.js MyCustomBrush.js
```

### 2. Definir la Clase

```javascript
class MyCustomBrush {
    constructor(params = {}) {
        // Parámetros básicos (siempre incluir)
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.color = params.color || color(255, 255, 255);
        this.size = params.size || 20;
        
        // Tus parámetros personalizados
        this.rotation = params.rotation || 0;
        this.speed = params.speed || 1;
        this.customValue = params.customValue || 10;
    }
}
```

### 3. Implementar display()

Esta función dibuja el pincel en el buffer:

```javascript
display(buffer) {
    buffer.push();
    
    // Configurar color
    const c = color(this.color);
    c.setAlpha(this.alpha);
    buffer.fill(c);
    buffer.noStroke();
    
    // Dibujar tu forma personalizada
    buffer.ellipse(this.x, this.y, this.size, this.size);
    
    buffer.pop();
}
```

### 4. Implementar update() (Opcional)

Si tu pincel es animado, implementa la lógica de actualización:

```javascript
update() {
    // Actualizar posición
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Actualizar vida
    this.life -= 1;
    
    // Marcar como muerto
    if (this.life <= 0) {
        this.isDead = true;
    }
}
```

### 5. Registrar el Pincel

Al final de tu archivo:

```javascript
if (typeof window !== 'undefined') {
    window.MyCustomBrush = MyCustomBrush;
    
    // Auto-registrar
    if (window.brushRegistry) {
        window.brushRegistry.register('mycustom', MyCustomBrush, {
            rotation: 0,
            speed: 1,
            customValue: 10
        });
    }
}
```

### 6. Incluir en index.html

Agrega el script antes del cierre de `</body>`:

```html
<script src="js/brushes/brushRegistry.js"></script>
<script src="js/brushes/MyCustomBrush.js"></script>
```

## Usar un Pincel

### Crear Instancia

```javascript
// Opción 1: Directamente
const brush = new MyCustomBrush({
    x: 100,
    y: 200,
    size: 30,
    customValue: 15
});

// Opción 2: Desde el registro
const brush = brushRegistry.create('mycustom', {
    x: 100,
    y: 200,
    size: 30
});
```

### Dibujar

```javascript
// En tu loop de dibujo
brush.display(getActiveLayer());

// Si es animado
brush.update();

// Verificar si terminó
if (brush.isDone()) {
    // Eliminar del array de pinceles activos
}
```

## Parámetros Estándar

Todos los pinceles deberían soportar estos parámetros básicos:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `x` | Number | Posición X |
| `y` | Number | Posición Y |
| `pmouseX` | Number | Posición X anterior |
| `pmouseY` | Number | Posición Y anterior |
| `color` | p5.Color | Color del pincel |
| `alpha` | Number | Transparencia (0-255) |
| `size` | Number | Tamaño del pincel |
| `kaleidoSegments` | Number | Segmentos de caleidoscopio |
| `kaleidoCenterX` | Number | Centro X del caleidoscopio |
| `kaleidoCenterY` | Number | Centro Y del caleidoscopio |

## Parámetros Personalizados

Define tus propios parámetros según las necesidades de tu pincel:

```javascript
// Ejemplo: Pincel de espiral
this.spiralTurns = params.spiralTurns || 3;
this.spiralRadius = params.spiralRadius || 50;

// Ejemplo: Pincel de texto
this.text = params.text || 'Hello';
this.font = params.font || 'Arial';

// Ejemplo: Pincel de imagen
this.imagePath = params.imagePath || null;
this.imageScale = params.imageScale || 1;
```

## Funciones Requeridas

### display(buffer)
- **Obligatoria**: Sí
- **Propósito**: Dibujar el pincel en el buffer
- **Parámetros**: `buffer` (p5.Graphics)

### update()
- **Obligatoria**: No (solo para pinceles animados)
- **Propósito**: Actualizar el estado del pincel
- **Parámetros**: Ninguno

### isDone()
- **Obligatoria**: No (solo para pinceles animados)
- **Propósito**: Verificar si el pincel terminó su ciclo de vida
- **Retorna**: Boolean

### getParams()
- **Obligatoria**: Recomendada
- **Propósito**: Obtener parámetros para sincronización por sockets
- **Retorna**: Object

### fromParams(params) [static]
- **Obligatoria**: Recomendada
- **Propósito**: Crear instancia desde parámetros (para sockets)
- **Parámetros**: `params` (Object)
- **Retorna**: Instancia del pincel

## Soporte de Caleidoscopio

Para soportar el efecto caleidoscopio, implementa `drawKaleidoscope()`:

```javascript
drawKaleidoscope(buffer) {
    const centerX = this.kaleidoCenterX;
    const centerY = this.kaleidoCenterY;
    
    const dx = this.x - centerX;
    const dy = this.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const angleStep = (Math.PI * 2) / this.kaleidoSegments;
    
    for (let i = 0; i < this.kaleidoSegments; i++) {
        const segmentAngle = angleStep * i;
        const newX = centerX + Math.cos(angle + segmentAngle) * distance;
        const newY = centerY + Math.sin(angle + segmentAngle) * distance;
        
        // Dibujar en nueva posición
        // ...
    }
}
```

## Ejemplos de Pinceles

### Pincel Simple (Círculo)
```javascript
display(buffer) {
    buffer.fill(this.color);
    buffer.noStroke();
    buffer.ellipse(this.x, this.y, this.size, this.size);
}
```

### Pincel de Línea
```javascript
display(buffer) {
    buffer.stroke(this.color);
    buffer.strokeWeight(this.size);
    buffer.line(this.pmouseX, this.pmouseY, this.x, this.y);
}
```

### Pincel de Polígono
```javascript
display(buffer) {
    buffer.fill(this.color);
    buffer.noStroke();
    buffer.push();
    buffer.translate(this.x, this.y);
    buffer.rotate(this.rotation);
    buffer.beginShape();
    for (let i = 0; i < this.sides; i++) {
        const angle = (TWO_PI / this.sides) * i;
        const x = cos(angle) * this.size;
        const y = sin(angle) * this.size;
        buffer.vertex(x, y);
    }
    buffer.endShape(CLOSE);
    buffer.pop();
}
```

## Registro de Pinceles

### Listar Pinceles Disponibles
```javascript
const brushes = brushRegistry.list();
console.log(brushes); // ['particle', 'mycustom', ...]
```

### Verificar si Existe
```javascript
if (brushRegistry.has('mycustom')) {
    // El pincel existe
}
```

### Obtener Parámetros por Defecto
```javascript
const defaults = brushRegistry.getDefaultParams('particle');
console.log(defaults); // { gravity: 0.1, friction: 0.98, ... }
```

## Sincronización por Sockets

Para que tu pincel funcione con sockets:

1. Implementa `getParams()` para serializar el estado
2. Implementa `fromParams()` para deserializar
3. Asegúrate de que todos los parámetros sean serializables (no funciones)

```javascript
// Enviar por socket
const params = brush.getParams();
socket.emit('brush_data', params);

// Recibir por socket
socket.on('brush_data', (params) => {
    const brush = MyCustomBrush.fromParams(params);
    brush.display(getActiveLayer());
});
```

## Tips y Mejores Prácticas

1. **Usa `buffer.push()` y `buffer.pop()`** para aislar transformaciones
2. **Normaliza coordenadas** para sincronización entre diferentes resoluciones
3. **Usa `map()`** para interpolar valores (vida, tamaño, alpha)
4. **Implementa `isDone()`** para pinceles que se eliminan automáticamente
5. **Documenta tus parámetros** en comentarios
6. **Prueba con caleidoscopio** activado
7. **Optimiza el rendimiento** - evita cálculos pesados en `display()`

## Troubleshooting

### El pincel no aparece
- Verifica que `display()` esté implementado
- Asegúrate de que el color tenga alpha > 0
- Revisa que las coordenadas estén dentro del canvas

### El pincel no se actualiza
- Verifica que `update()` esté siendo llamado en el loop
- Asegúrate de que `isDone()` no retorne `true` prematuramente

### Errores de sincronización
- Verifica que `getParams()` retorne todos los parámetros necesarios
- Asegúrate de que `fromParams()` reconstruya el pincel correctamente
- No incluyas funciones o referencias circulares en los parámetros
