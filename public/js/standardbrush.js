// standardbrush.js - Implementación del pincel estándar (línea continua)

/**
 * Dibuja una línea simple para el pincel estándar
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x1 - Posición X inicial
 * @param {number} y1 - Posición Y inicial
 * @param {number} x2 - Posición X final
 * @param {number} y2 - Posición Y final
 * @param {number} size - Tamaño del pincel
 * @param {p5.Color} color - Color del pincel
 */
function drawStandardLine(buffer, x1, y1, x2, y2, size, color) {
    // Usar PROJECT en lugar de ROUND para evitar doble dibujo en las uniones
    buffer.stroke(color);
    buffer.strokeWeight(size);
    buffer.strokeCap(PROJECT);
    buffer.line(x1, y1, x2, y2);
}

/**
 * Dibuja un pincel estándar (línea continua) desde la posición anterior hasta la actual
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del pincel
 * @param {p5.Color} color - Color del pincel
 * @param {number} segments - Número de segmentos para el efecto caleidoscopio
 */
function drawStandardBrush(buffer, x, y, size, color, segments = 1) {
    // Obtener el número de segmentos para el efecto caleidoscopio
    segments = segments || 1;
    
    if (segments <= 1) {
        // Sin efecto caleidoscopio, dibujar normalmente
        drawStandardLine(buffer, pmouseXGlobal, pmouseYGlobal, x, y, size, color);
    } else {
        // Con efecto caleidoscopio
        const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;
        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;
        
        drawLineKaleidoscope(
            buffer, 
            pmouseXGlobal, pmouseYGlobal, 
            x, y, 
            centerX, centerY, 
            segments, 
            drawStandardLine, 
            size, color
        );
    }
}
