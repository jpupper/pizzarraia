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
 * Dibuja una línea recta entre dos puntos
 */
function drawLineBrush(buffer, x, y, startX, startY, size, color) {
    // Configurar estilo
    buffer.stroke(color);
    buffer.strokeWeight(size);
    buffer.strokeCap(ROUND);
    
    // Dibujar línea
    buffer.line(startX, startY, x, y);
    
    console.log('Line drawn:', startX, startY, 'to', x, y);
}

/**
 * Resetea el punto inicial
 */
function resetLineBrush() {
    lineStartX = null;
    lineStartY = null;
}
