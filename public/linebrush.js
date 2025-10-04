// linebrush.js - Implementación SIMPLIFICADA del pincel de líneas rectas

// Variables globales para almacenar el punto inicial de la línea
var lineStartX = null;
var lineStartY = null;

/**
 * Guarda el punto inicial de la línea
 */
function startLineBrush(x, y) {
    lineStartX = x;
    lineStartY = y;
    console.log('Line Start:', x, y);
}

/**
 * Función básica para dibujar una línea recta
 */
function drawBasicLine(buffer, x1, y1, x2, y2, size, color) {
    // Configurar estilo
    buffer.stroke(color);
    buffer.strokeWeight(size);
    buffer.strokeCap(ROUND);
    
    // Dibujar línea
    buffer.line(x1, y1, x2, y2);
}

/**
 * Dibuja una línea recta entre dos puntos con posible efecto caleidoscopio
 */
function drawLineBrush(buffer, x, y, startX, startY, size, color, segments = 1) {
    // Obtener el número de segmentos para el efecto caleidoscopio
    segments = segments || 1;
    
    if (segments <= 1) {
        // Sin efecto caleidoscopio, dibujar normalmente
        drawBasicLine(buffer, startX, startY, x, y, size, color);
    } else {
        // Con efecto caleidoscopio
        const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;
        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;
        
        drawLineKaleidoscope(
            buffer, 
            startX, startY, 
            x, y, 
            centerX, centerY, 
            segments, 
            drawBasicLine, 
            size, color
        );
    }
    
    console.log('Line drawn:', startX, startY, 'to', x, y, 'with', segments, 'segments');
}

/**
 * Resetea el punto inicial
 */
function resetLineBrush() {
    lineStartX = null;
    lineStartY = null;
}
