// geometrybrush.js - Implementación del pincel de geometría (polígonos)

/**
 * Dibuja un polígono en la posición especificada
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del polígono (radio)
 * @param {number} sides - Número de lados del polígono (2-10)
 * @param {p5.Color} color - Color del polígono
 */
function drawGeometryBrush(buffer, x, y, size, sides, color) {
    // Asegurar que sides esté entre 2 y 10
    sides = constrain(sides, 2, 10);
    
    // Configurar el estilo
    buffer.fill(color);
    buffer.noStroke();
    
    // Dibujar el polígono
    buffer.push();
    buffer.translate(x, y);
    
    // Caso especial para 2 lados (línea)
    if (sides === 2) {
        buffer.stroke(color);
        buffer.strokeWeight(size / 10);
        buffer.line(-size / 2, 0, size / 2, 0);
    } else {
        // Dibujar polígono regular
        buffer.beginShape();
        const angle = TWO_PI / sides;
        for (let a = 0; a < TWO_PI; a += angle) {
            const sx = cos(a - HALF_PI) * size / 2;
            const sy = sin(a - HALF_PI) * size / 2;
            buffer.vertex(sx, sy);
        }
        buffer.endShape(CLOSE);
    }
    
    buffer.pop();
}
