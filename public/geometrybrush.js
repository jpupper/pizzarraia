// geometrybrush.js - Implementación del pincel de geometría (polígonos)

/**
 * Función básica para dibujar un polígono
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del polígono (radio)
 * @param {number} sides - Número de lados del polígono (2-10)
 * @param {p5.Color} color - Color del polígono
 */
function drawBasicGeometry(buffer, x, y, size, sides, color) {
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

/**
 * Dibuja un polígono en la posición especificada con posible efecto caleidoscopio
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del polígono (radio)
 * @param {number} sides - Número de lados del polígono (2-10)
 * @param {p5.Color} color - Color del polígono
 * @param {number} segments - Número de segmentos para el efecto caleidoscopio
 */
function drawGeometryBrush(buffer, x, y, size, sides, color, segments = 1) {
    // Obtener el número de segmentos para el efecto caleidoscopio
    segments = segments || 1;
    
    if (segments <= 1) {
        // Sin efecto caleidoscopio, dibujar normalmente
        drawBasicGeometry(buffer, x, y, size, sides, color);
    } else {
        // Con efecto caleidoscopio
        const centerX = windowWidth / 2;
        const centerY = windowHeight / 2;
        
        // Calcular la distancia y ángulo desde el centro
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Calcular el ángulo entre cada segmento
        const angleStep = (Math.PI * 2) / segments;
        
        // Dibujar en cada segmento
        for (let i = 0; i < segments; i++) {
            const segmentAngle = angleStep * i;
            
            // Calcular nueva posición
            const newX = centerX + Math.cos(angle + segmentAngle) * distance;
            const newY = centerY + Math.sin(angle + segmentAngle) * distance;
            
            // Dibujar el polígono en la nueva posición
            drawBasicGeometry(buffer, newX, newY, size, sides, color);
        }
    }
}
