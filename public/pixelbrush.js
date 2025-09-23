// pixelbrush.js - Implementación del pincel de píxeles

/**
 * Dibuja un píxel en la grilla usando parámetros específicos
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del pincel
 * @param {number} cols - Número de columnas en la grilla
 * @param {number} rows - Número de filas en la grilla
 * @param {p5.Color} color - Color del pincel
 */
function drawPixelBrush(buffer, x, y, size, cols, rows, color) {
    // Convertir coordenadas del canvas a coordenadas de la grilla con los parámetros específicos
    const gridPos = canvasToGridWithParams(x, y, cols, rows);
    
    // Calcular el ancho y alto de la celda en el canvas con los parámetros específicos
    const canvasGridCellWidth = windowWidth / cols;
    const canvasGridCellHeight = windowHeight / rows;
    
    // Calcular la esquina superior izquierda de la celda
    const cellX = gridPos.cellX * canvasGridCellWidth;
    const cellY = gridPos.cellY * canvasGridCellHeight;
    
    // Dibujar el píxel como un rectángulo que coincide exactamente con la celda
    buffer.rectMode(CORNER); // Usar modo CORNER para coincidir exactamente con la grilla
    buffer.fill(color);
    buffer.noStroke();
    buffer.rect(cellX, cellY, canvasGridCellWidth, canvasGridCellHeight);
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
