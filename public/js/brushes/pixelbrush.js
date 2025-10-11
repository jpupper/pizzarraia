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
                cols: { min: 8, max: 64, default: 32, step: 4, label: 'Columnas' },
                rows: { min: 8, max: 64, default: 32, step: 4, label: 'Filas' }
            }
        });
    }

    renderControls() {
        return `
            <label for="gridCols">Columnas: <span id="gridColsValue">32</span></label>
            <input type="range" id="gridCols" class="jpslider" min="8" max="64" value="32" step="4"
                   oninput="document.getElementById('gridColsValue').textContent = this.value">
            <label for="gridRows">Filas: <span id="gridRowsValue">32</span></label>
            <input type="range" id="gridRows" class="jpslider" min="8" max="64" value="32" step="4"
                   oninput="document.getElementById('gridRowsValue').textContent = this.value">
        `;
    }

    draw(buffer, x, y, params) {
        const { size, color, cols = 32, rows = 32, kaleidoSegments = 1 } = params;
        
        const cellWidth = windowWidth / cols;
        const cellHeight = windowHeight / rows;
        const radiusInCells = Math.ceil(size / Math.max(cellWidth, cellHeight));
        const centerCol = Math.floor(x / cellWidth);
        const centerRow = Math.floor(y / cellHeight);
        
        buffer.rectMode(CORNER);
        buffer.fill(color);
        buffer.noStroke();
        
        if (kaleidoSegments <= 1) {
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
                            buffer.rect(px, py, cellWidth, cellHeight);
                        }
                    }
                }
            }
        } else {
            const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;
            const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const angleStep = (Math.PI * 2) / kaleidoSegments;
            
            for (let i = 0; i < kaleidoSegments; i++) {
                const segmentAngle = angleStep * i;
                const newX = centerX + Math.cos(angle + segmentAngle) * distance;
                const newY = centerY + Math.sin(angle + segmentAngle) * distance;
                
                const newCenterCol = Math.floor(newX / cellWidth);
                const newCenterRow = Math.floor(newY / cellHeight);
                
                for (let ii = -radiusInCells; ii <= radiusInCells; ii++) {
                    for (let jj = -radiusInCells; jj <= radiusInCells; jj++) {
                        const col = newCenterCol + ii;
                        const row = newCenterRow + jj;
                        
                        if (col >= 0 && col < cols && row >= 0 && row < rows) {
                            const px = col * cellWidth;
                            const py = row * cellHeight;
                            const ddx = px + cellWidth/2 - newX;
                            const ddy = py + cellHeight/2 - newY;
                            const dist = Math.sqrt(ddx*ddx + ddy*ddy);
                            
                            if (dist <= size) {
                                buffer.rect(px, py, cellWidth, cellHeight);
                            }
                        }
                    }
                }
            }
        }
    }
    
    getSyncData(params) {
        return { cols: params.cols || 32, rows: params.rows || 32 };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new PixelBrush());
}
