// pixelbrush.js - Implementación del pincel de píxeles

/**
 * Función básica para dibujar píxeles en la grilla
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del pincel (radio)
 * @param {number} cols - Número de columnas en la grilla
 * @param {number} rows - Número de filas en la grilla
 * @param {p5.Color} color - Color del pincel
 * @returns {Object} - Información sobre los píxeles afectados
 */
function drawBasicPixelBrush(buffer, x, y, size, cols, rows, color) {
    // Convertir coordenadas del mouse a coordenadas de la grilla
    const gridPos = canvasToGridWithParams(x, y, cols, rows);
    
    // Calcular el ancho y alto de la celda en el canvas
    const canvasGridCellWidth = windowWidth / cols;
    const canvasGridCellHeight = windowHeight / rows;
    
    // Calcular el radio en celdas (basado en el tamaño del pincel)
    // Dividimos el size por el tamaño promedio de celda para obtener el radio en celdas
    const avgCellSize = (canvasGridCellWidth + canvasGridCellHeight) / 2;
    const radiusInCells = Math.max(1, Math.floor(size / avgCellSize));
    
    // Configurar el modo de dibujo
    buffer.rectMode(CORNER);
    buffer.fill(color);
    buffer.noStroke();
    
    // Dibujar todas las celdas dentro del radio
    for (let offsetY = -radiusInCells; offsetY <= radiusInCells; offsetY++) {
        for (let offsetX = -radiusInCells; offsetX <= radiusInCells; offsetX++) {
            // Calcular la posición de la celda actual
            const currentCellX = gridPos.cellX + offsetX;
            const currentCellY = gridPos.cellY + offsetY;
            
            // Verificar límites de la grilla
            if (currentCellX >= 0 && currentCellX < cols && 
                currentCellY >= 0 && currentCellY < rows) {
                
                // Calcular distancia al centro (para forma circular)
                const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
                
                // Solo dibujar si está dentro del radio
                if (distance <= radiusInCells) {
                    // Calcular la posición en el canvas
                    const pixelX = currentCellX * canvasGridCellWidth;
                    const pixelY = currentCellY * canvasGridCellHeight;
                    
                    // Dibujar el píxel
                    buffer.rect(pixelX, pixelY, canvasGridCellWidth, canvasGridCellHeight);
                }
            }
        }
    }
    
    // Retornar los píxeles afectados para sincronización
    return {
        centerCell: gridPos,
        radiusInCells: radiusInCells
    };
}

/**
 * Dibuja píxeles en la grilla dentro del radio del pincel con posible efecto caleidoscopio
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del pincel (radio)
 * @param {number} cols - Número de columnas en la grilla
 * @param {number} rows - Número de filas en la grilla
 * @param {p5.Color} color - Color del pincel
 * @param {number} segments - Número de segmentos para el efecto caleidoscopio
 * @returns {Object} - Información sobre los píxeles afectados
 */
function drawPixelBrush(buffer, x, y, size, cols, rows, color, segments = 1) {
    // Obtener el número de segmentos para el efecto caleidoscopio
    segments = segments || 1;
    
    if (segments <= 1) {
        // Sin efecto caleidoscopio, dibujar normalmente
        return drawBasicPixelBrush(buffer, x, y, size, cols, rows, color);
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
        
        // Crear un array para almacenar los resultados de cada segmento
        let results = [];
        
        // Dibujar en cada segmento
        for (let i = 0; i < segments; i++) {
            const segmentAngle = angleStep * i;
            
            // Calcular nueva posición
            const newX = centerX + Math.cos(angle + segmentAngle) * distance;
            const newY = centerY + Math.sin(angle + segmentAngle) * distance;
            
            // Dibujar los píxeles en la nueva posición
            const result = drawBasicPixelBrush(buffer, newX, newY, size, cols, rows, color);
            results.push(result);
        }
        
        // Devolver el resultado del primer segmento (para sincronización)
        return results.length > 0 ? results[0] : null;
    }
}

/**
 * Convertir coordenadas del canvas a coordenadas de la grilla usando parámetros específicos
 * @param {number} x - Posición X en el canvas
 * @param {number} y - Posición Y en el canvas
 * @param {number} cols - Número de columnas en la grilla
 * @param {number} rows - Número de filas en la grilla
 * @returns {Object} - Objeto con las coordenadas de la celda en la grilla
 */
function canvasToGridWithParams(x, y, cols, rows) {
    // Escalar coordenadas del canvas al espacio de la grilla (0-1024)
    const gridSize = 1024; // Tamaño fijo de la grilla
    const gridX = map(x, 0, windowWidth, 0, gridSize);
    const gridY = map(y, 0, windowHeight, 0, gridSize);
    
    // Calcular ancho y alto de celda con los parámetros específicos
    const cellWidthParam = gridSize / cols;
    const cellHeightParam = gridSize / rows;
    
    // Calcular celda de la grilla
    const cellX = Math.floor(gridX / cellWidthParam);
    const cellY = Math.floor(gridY / cellHeightParam);
    
    // Restringir a los límites de la grilla
    return {
        cellX: constrain(cellX, 0, cols - 1),
        cellY: constrain(cellY, 0, rows - 1)
    };
}
