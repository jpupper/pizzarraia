# Sistema de Brushes - Arquitectura Escalable

## 📋 Descripción General

Este sistema proporciona una arquitectura escalable y orientada a objetos para gestionar brushes (pinceles) en la aplicación de dibujo colaborativo.

## 🏗️ Estructura

### Archivos Core

1. **BaseBrush.js** - Clase base abstracta que define la interfaz común para todos los brushes
2. **BrushRegistry.js** - Sistema de registro centralizado para gestionar todos los brushes
3. **init.js** - Script de inicialización que configura el sistema al cargar la página

### Implementaciones de Brushes

- **StandardBrush.class.js** - Pincel estándar de línea continua ✅
- **PixelBrush.class.js** - Pincel de píxeles/grilla ✅
- **ArtBrush.class.js** - Pincel artístico con partículas (TODO)
- **LineBrush.class.js** - Pincel de líneas rectas (TODO)
- **TextBrush.class.js** - Pincel de texto (TODO)
- **GeometryBrush.class.js** - Pincel de formas geométricas (TODO)
- **FillBrush.class.js** - Herramienta de relleno (TODO)
- **ImageBrush.class.js** - Pincel de imágenes/emojis (TODO)

## 🎯 Cómo Crear un Nuevo Brush

### Paso 1: Crear la Clase

```javascript
class MiBrush extends BaseBrush {
    constructor() {
        super({
            id: 'mi-brush',              // ID único
            name: 'Mi Brush',             // Nombre descriptivo
            title: 'Mi Brush Tooltip',   // Tooltip del botón
            icon: '<path d="..."/>',      // SVG path del icono
            supportsKaleidoscope: true,   // ¿Soporta kaleidoscopio?
            parameters: {
                // Parámetros específicos del brush
                miParametro: {
                    min: 0,
                    max: 100,
                    default: 50,
                    step: 1,
                    label: 'Mi Parámetro',
                    description: 'Descripción del parámetro'
                }
            }
        });
    }

    renderControls() {
        // Retorna HTML de los controles específicos
        return `
            <label for="miParametro">Mi Parámetro: <span id="miParametroValue">50</span></label>
            <input type="range" id="miParametro" class="jpslider" 
                   min="0" max="100" value="50" step="1"
                   oninput="document.getElementById('miParametroValue').textContent = this.value">
        `;
    }

    draw(buffer, x, y, params) {
        // Implementa la lógica de dibujo
        const { size, color, miParametro } = params;
        
        // Tu código de dibujo aquí
        buffer.fill(color);
        buffer.ellipse(x, y, size * miParametro);
    }

    getSyncData(params) {
        // Retorna datos que deben sincronizarse
        return {
            miParametro: params.miParametro
        };
    }
}

// Auto-registro
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new MiBrush());
}
```

### Paso 2: Agregar el Script al HTML

```html
<script src="js/brushes/MiBrush.class.js"></script>
```

### Paso 3: ¡Listo!

El sistema automáticamente:
- Renderiza el botón del brush
- Renderiza los controles
- Gestiona la activación/desactivación
- Maneja la sincronización

## 📦 API de BaseBrush

### Métodos que DEBES implementar:

- `draw(buffer, x, y, params)` - Lógica principal de dibujo

### Métodos opcionales para override:

- `renderControls()` - HTML de controles específicos
- `update(params)` - Preparación antes de dibujar
- `getSyncData(params)` - Datos para sincronización
- `processSyncData(data)` - Procesar datos recibidos

### Métodos heredados (NO override):

- `getId()` - Obtiene el ID del brush
- `getName()` - Obtiene el nombre
- `getIcon()` - Obtiene el SVG icon
- `getTitle()` - Obtiene el tooltip
- `getParameters()` - Obtiene los parámetros
- `supportsKaleidoscopeEffect()` - Verifica soporte de kaleidoscopio
- `renderButton()` - Renderiza el botón HTML

## 🔧 API de BrushRegistry

### Métodos principales:

```javascript
// Registrar un brush
brushRegistry.register(new MiBrush());

// Obtener un brush
const brush = brushRegistry.get('mi-brush');

// Obtener todos los brushes
const allBrushes = brushRegistry.getAll();

// Establecer brush activo
brushRegistry.setActive('mi-brush');

// Obtener brush activo
const active = brushRegistry.getActive();

// Renderizar botones
brushRegistry.renderButtons('containerId');

// Renderizar controles
brushRegistry.renderControls('containerId');
```

## 🎨 Parámetros del Brush

Los parámetros se definen en el constructor:

```javascript
parameters: {
    nombreParametro: {
        min: 0,           // Valor mínimo
        max: 100,         // Valor máximo
        default: 50,      // Valor por defecto
        step: 1,          // Incremento
        label: 'Label',   // Etiqueta visible
        description: ''   // Descripción (opcional)
    }
}
```

## 🔄 Integración con P5.js

El método `draw()` recibe:

- `buffer` - p5.Graphics donde dibujar
- `x, y` - Coordenadas del mouse
- `params` - Objeto con todos los parámetros:
  - `size` - Tamaño del pincel
  - `color` - Color (p5.Color)
  - `alpha` - Transparencia (0-255)
  - `kaleidoSegments` - Segmentos de kaleidoscopio
  - `pmouseX, pmouseY` - Posición anterior del mouse
  - ...parámetros específicos del brush

## 📡 Sincronización por Socket

Para sincronizar datos específicos:

```javascript
getSyncData(params) {
    return {
        miDato: params.miDato,
        otroDato: this.estadoInterno
    };
}

processSyncData(data) {
    // Procesar datos recibidos de otros clientes
    this.estadoInterno = data.otroDato;
}
```

## ✅ Checklist para Migrar un Brush Legacy

1. [ ] Crear archivo `NombreBrush.class.js`
2. [ ] Extender `BaseBrush`
3. [ ] Definir `id`, `name`, `icon`, `parameters`
4. [ ] Implementar `draw(buffer, x, y, params)`
5. [ ] Implementar `renderControls()` si tiene parámetros
6. [ ] Implementar `getSyncData()` si necesita sincronización
7. [ ] Auto-registrar al final del archivo
8. [ ] Agregar `<script>` en index.html
9. [ ] Probar funcionamiento
10. [ ] Eliminar archivo legacy

## 🚀 Ventajas del Sistema

- ✅ **Escalable**: Agregar brushes es trivial
- ✅ **Mantenible**: Código organizado en clases
- ✅ **Reutilizable**: Lógica común en BaseBrush
- ✅ **Dinámico**: Botones y controles se generan automáticamente
- ✅ **Type-safe**: Estructura clara y documentada
- ✅ **Extensible**: Fácil agregar nuevas funcionalidades

## 📝 Notas

- Los brushes legacy (archivos .js antiguos) seguirán funcionando hasta que se migren
- El sistema es retrocompatible
- Los parámetros de config.js se están migrando a cada brush
- El orden de carga de scripts es importante (ver index.html)
