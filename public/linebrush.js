// linebrush.js - Implementación del pincel de líneas

/**
 * Dibuja una línea entre la posición anterior y la actual
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X actual del mouse
 * @param {number} y - Posición Y actual del mouse
 * @param {number} pmouseX - Posición X anterior del mouse
 * @param {number} pmouseY - Posición Y anterior del mouse
 * @param {number} size - Grosor de la línea
 * @param {p5.Color} color - Color de la línea
 */
function drawLineBrush(buffer, x, y, pmouseX, pmouseY, size, color) {
    // Configurar el estilo de la línea
    buffer.stroke(color);
    buffer.strokeWeight(size);
    buffer.strokeCap(ROUND); // Extremos redondeados para una línea más suave
    
    // Dibujar la línea desde la posición anterior a la actual
    buffer.line(pmouseX, pmouseY, x, y);
}
