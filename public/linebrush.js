// linebrush.js - Implementación del pincel de líneas rectas (punto a punto)
// Este pincel dibuja una línea recta desde el punto donde se presiona hasta donde se suelta

// Variables globales para almacenar el punto inicial de la línea
var lineStartX = null;
var lineStartY = null;
var isDrawingLine = false;

/**
 * Inicia el trazo de una línea (cuando se presiona el mouse/touch)
 * @param {number} x - Posición X inicial
 * @param {number} y - Posición Y inicial
 */
function startLineBrush(x, y) {
    lineStartX = x;
    lineStartY = y;
    isDrawingLine = true;
}

/**
 * Finaliza y dibuja la línea (cuando se suelta el mouse/touch)
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X final
 * @param {number} y - Posición Y final
 * @param {number} size - Grosor de la línea
 * @param {p5.Color} color - Color de la línea
 */
function drawLineBrush(buffer, x, y, pmouseX, pmouseY, size, color) {
    if (lineStartX !== null && lineStartY !== null) {
        // Configurar el estilo de la línea
        buffer.stroke(color);
        buffer.strokeWeight(size);
        buffer.strokeCap(ROUND);
        
        // Dibujar la línea desde el punto inicial hasta el punto final
        buffer.line(lineStartX, lineStartY, x, y);
    }
}

/**
 * Resetea el estado del line brush
 */
function resetLineBrush() {
    lineStartX = null;
    lineStartY = null;
    isDrawingLine = false;
}
