// textbrush.js - Implementación del pincel de texto

/**
 * Dibuja texto en la posición especificada
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {string} text - Texto a dibujar
 * @param {number} textSize - Tamaño del texto
 * @param {string} fontFamily - Familia de fuente
 * @param {p5.Color} color - Color del texto
 */
function drawTextBrush(buffer, x, y, text, textSize, fontFamily, color) {
    // Configurar el texto
    buffer.textFont(fontFamily);
    buffer.textSize(textSize);
    buffer.textAlign(CENTER, CENTER);
    buffer.fill(color);
    buffer.noStroke();
    
    // Dibujar el texto
    buffer.text(text, x, y);
}
