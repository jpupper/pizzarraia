/**
 * PixelBrush - Pincel de píxeles/grilla
 * Dibuja cuadrados en una grilla dentro del radio del pincel
 */
class PixelBrush extends BaseBrush {
    constructor() {
        super({
            id: 'pixel',
            name: 'Pixel Brush',
            title: 'Pixel Brush',
            icon: '<path fill="currentColor" d="M2,2H6V6H2V2M7,2H11V6H7V2M12,2H16V6H12V2M17,2H21V6H17V2M2,7H6V11H2V7M7,7H11V11H7V7M12,7H16V11H12V7M17,7H21V11H17V7M2,12H6V16H2V12M7,12H11V16H7V12M12,12H16V16H12V12M17,12H21V16H17V12M2,17H6V21H2V17M7,17H11V21H7V17M12,17H16V21H12V17M17,17H21V21H17V17Z"/>',
            supportsKaleidoscope: true,
            parameters: {
                cols: {
                    min: 8,
                    max: 64,
                    default: 32,
                    step: 4,
                    label: 'Columnas',
                    description: 'Número de columnas en la grilla'
                },
                rows: {
                    min: 8,
                    max: 64,
                    default: 32,
                    step: 4,
                    label: 'Filas',
                    description: 'Número de filas en la grilla'
                }
            }
        });
    }

    /**
     * Renderiza los controles específicos del brush
     * @returns {string} HTML string
     */
    renderControls() {
        return `
            <label for="gridCols">Columnas: <span id="gridColsValue">32</span></label>
            <input type="range" id="gridCols" class="jpslider" 
                   min="${this.parameters.cols.min}" 
                   max="${this.parameters.cols.max}" 
                   value="${this.parameters.cols.default}" 
                   step="${this.parameters.cols.step}"
                   oninput="document.getElementById('gridColsValue').textContent = this.value">
            
            <label for="gridRows">Filas: <span id="gridRowsValue">32</span></label>
            <input type="range" id="gridRows" class="jpslider" 
                   min="${this.parameters.rows.min}" 
                   max="${this.parameters.rows.max}" 
                   value="${this.parameters.rows.default}" 
                   step="${this.parameters.rows.step}"
                   oninput="document.getElementById('gridRowsValue').textContent = this.value">
        `;
    }

    /**
     * Dibuja un píxel individual
     * @param {p5.Graphics} buffer - Buffer donde dibujar
     * @param {number} px - Posición X del píxel
     * @param {number} py - Posición Y del píxel
     * @param {number} cellWidth - Ancho de la celda
     * @param {number} cellHeight - Alto de la celda
     * @param {p5.Color} color - Color del píxel
     */
    drawPixel(buffer, px, py, cellWidth, cellHeight, color) {
        buffer.fill(color);
        buffer.noStroke();
        buffer.rect(px, py, cellWidth, cellHeight);
    }

    /**
     * Función principal de dibujo
     * @param {p5.Graphics} buffer - Buffer donde dibujar
     * @param {number} x - Posición X del mouse
     * @param {number} y - Posición Y del mouse
     * @param {Object} params - Parámetros de dibujo
     */
    draw(buffer, x, y, params) {
        const {
            size,
            color,
            cols = 32,
            rows = 32,
            kaleidoSegments = 1
        } = params;

        const cellWidth = windowWidth / cols;
        const cellHeight = windowHeight / rows;
        
        // Calcular el radio en celdas
        const radiusInCells = Math.ceil(size / Math.max(cellWidth, cellHeight));
        
        // Calcular la celda central
        const centerCol = Math.floor(x / cellWidth);
        const centerRow = Math.floor(y / cellHeight);
        
        if (kaleidoSegments <= 1) {
            // Sin kaleidoscopio - dibujar píxeles dentro del radio
            for (let i = -radiusInCells; i <= radiusInCells; i++) {
                for (let j = -radiusInCells; j <= radiusInCells; j++) {
                    const col = centerCol + i;
                    const row = centerRow + j;
                    
                    // Verificar que esté dentro de los límites
                    if (col >= 0 && col < cols && row >= 0 && row < rows) {
                        const px = col * cellWidth;
                        const py = row * cellHeight;
                        
                        // Verificar que esté dentro del radio circular
                        const dx = px + cellWidth/2 - x;
                        const dy = py + cellHeight/2 - y;
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        if (distance <= size) {
                            this.drawPixel(buffer, px, py, cellWidth, cellHeight, color);
                        }
                    }
                }
            }
        } else {
            // Con kaleidoscopio
            const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;
            const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;
            
            // Dibujar píxeles con efecto kaleidoscopio
            for (let i = -radiusInCells; i <= radiusInCells; i++) {
                for (let j = -radiusInCells; j <= radiusInCells; j++) {
                    const col = centerCol + i;
                    const row = centerRow + j;
                    
                    if (col >= 0 && col < cols && row >= 0 && row < rows) {
                        const px = col * cellWidth;
                        const py = row * cellHeight;
                        
                        const dx = px + cellWidth/2 - x;
                        const dy = py + cellHeight/2 - y;
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        if (distance <= size) {
                            // Aplicar kaleidoscopio a cada píxel
                            drawKaleidoscope(
                                buffer,
                                px + cellWidth/2, py + cellHeight/2,
                                centerX, centerY,
                                kaleidoSegments,
                                this.drawPixel.bind(this),
                                px, py, cellWidth, cellHeight, color
                            );
                        }
                    }
                }
            }
        }
    }

    /**
     * Obtiene los datos para sincronización
     * @param {Object} params - Parámetros actuales
     * @returns {Object}
     */
    getSyncData(params) {
        return {
            cols: params.cols || 32,
            rows: params.rows || 32
        };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new PixelBrush());
}
