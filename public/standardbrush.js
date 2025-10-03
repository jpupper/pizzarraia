// standardbrush.js - Implementación del pincel estándar (línea continua)

/**
 * Dibuja un pincel estándar (línea continua) desde la posición anterior hasta la actual
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del pincel
 * @param {p5.Color} color - Color del pincel
 */
function drawStandardBrush(buffer, x, y, size, color) {
    buffer.stroke(color);
    buffer.strokeWeight(size);
    buffer.strokeCap(ROUND);
    buffer.line(pmouseXGlobal, pmouseYGlobal, x, y);
}
