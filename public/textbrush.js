// textbrush.js - Implementación del pincel de texto

/**
 * Función básica para dibujar texto
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {string} text - Texto a dibujar
 * @param {number} textSize - Tamaño del texto
 * @param {string} fontFamily - Familia de fuente
 * @param {p5.Color} color - Color del texto
 */
function drawBasicText(buffer, x, y, text, textSize, fontFamily, color) {
    // Configurar el texto
    buffer.textFont(fontFamily);
    buffer.textSize(textSize);
    buffer.textAlign(CENTER, CENTER);
    buffer.fill(color);
    buffer.noStroke();
    
    // Dibujar el texto
    buffer.text(text, x, y);
}

/**
 * Dibuja texto en la posición especificada con posible efecto caleidoscopio
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {string} text - Texto a dibujar
 * @param {number} textSize - Tamaño del texto
 * @param {string} fontFamily - Familia de fuente
 * @param {p5.Color} color - Color del texto
 * @param {number} segments - Número de segmentos para el efecto caleidoscopio
 */
function drawTextBrush(buffer, x, y, text, textSize, fontFamily, color, segments = 1) {
    // Obtener el número de segmentos para el efecto caleidoscopio
    segments = segments || 1;
    
    if (segments <= 1) {
        // Sin efecto caleidoscopio, dibujar normalmente
        drawBasicText(buffer, x, y, text, textSize, fontFamily, color);
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
            
            // Dibujar el texto en la nueva posición
            drawBasicText(buffer, newX, newY, text, textSize, fontFamily, color);
        }
    }
}
