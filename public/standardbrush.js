// standardbrush.js - Implementación del pincel estándar (círculo)

/**
 * Dibuja un pincel estándar (círculo) en la posición especificada
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del pincel
 * @param {p5.Color} color - Color del pincel
 */
function drawStandardBrush(buffer, x, y, size, color) {
    buffer.noStroke();
    buffer.fill(color);
    buffer.ellipse(x, y, size, size);
}
