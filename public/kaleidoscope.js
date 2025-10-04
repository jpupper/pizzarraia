/**
 * Funciones para el efecto caleidoscopio
 */

// Función para dibujar un punto con efecto caleidoscopio
function drawKaleidoscope(buffer, x, y, centerX, centerY, segments, drawFunction, ...args) {
    // Si segments es 1 o menos, dibujar normalmente sin efecto
    if (segments <= 1) {
        drawFunction(buffer, x, y, ...args);
        return;
    }
    
    // Calcular el ángulo entre cada segmento
    const angleStep = (Math.PI * 2) / segments;
    
    // Calcular la distancia y ángulo desde el centro
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Dibujar en cada segmento
    for (let i = 0; i < segments; i++) {
        const segmentAngle = angle + (angleStep * i);
        const newX = centerX + Math.cos(segmentAngle) * distance;
        const newY = centerY + Math.sin(segmentAngle) * distance;
        
        // Dibujar en la nueva posición
        drawFunction(buffer, newX, newY, ...args);
    }
}

// Función para dibujar una línea con efecto caleidoscopio
function drawLineKaleidoscope(buffer, x1, y1, x2, y2, centerX, centerY, segments, drawFunction, ...args) {
    // Si segments es 1 o menos, dibujar normalmente sin efecto
    if (segments <= 1) {
        drawFunction(buffer, x1, y1, x2, y2, ...args);
        return;
    }
    
    // Calcular el ángulo entre cada segmento
    const angleStep = (Math.PI * 2) / segments;
    
    // Calcular la distancia y ángulo desde el centro para ambos puntos
    const dx1 = x1 - centerX;
    const dy1 = y1 - centerY;
    const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const angle1 = Math.atan2(dy1, dx1);
    
    const dx2 = x2 - centerX;
    const dy2 = y2 - centerY;
    const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const angle2 = Math.atan2(dy2, dx2);
    
    // Dibujar en cada segmento
    for (let i = 0; i < segments; i++) {
        const segmentAngle = angleStep * i;
        
        // Calcular nuevas posiciones para ambos puntos
        const newX1 = centerX + Math.cos(angle1 + segmentAngle) * distance1;
        const newY1 = centerY + Math.sin(angle1 + segmentAngle) * distance1;
        
        const newX2 = centerX + Math.cos(angle2 + segmentAngle) * distance2;
        const newY2 = centerY + Math.sin(angle2 + segmentAngle) * distance2;
        
        // Dibujar la línea en la nueva posición
        drawFunction(buffer, newX1, newY1, newX2, newY2, ...args);
    }
}
