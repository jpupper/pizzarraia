/**
 * LineBrush - Pincel de líneas rectas
 * Dibuja líneas rectas desde el punto inicial hasta el punto final
 */
class LineBrush extends BaseBrush {
    constructor() {
        super({
            id: 'line',
            name: 'Line Brush',
            title: 'Line Brush',
            icon: '<line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
            supportsKaleidoscope: true,
            parameters: {}
        });
        this.startX = null;
        this.startY = null;
    }

    renderControls() {
        return '';
    }

    drawBasicLine(buffer, x1, y1, x2, y2, size, color) {
        buffer.stroke(color);
        buffer.strokeWeight(size);
        buffer.strokeCap(ROUND);
        buffer.line(x1, y1, x2, y2);
    }

    draw(buffer, x, y, params) {
        const { size, color, kaleidoSegments = 1, startX, startY } = params;
        
        if (startX === null || startY === null) return;
        
        if (kaleidoSegments <= 1) {
            this.drawBasicLine(buffer, startX, startY, x, y, size, color);
        } else {
            const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;
            const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;
            
            drawLineKaleidoscope(
                buffer,
                startX, startY,
                x, y,
                centerX, centerY,
                kaleidoSegments,
                this.drawBasicLine.bind(this),
                size, color
            );
        }
    }

    getSyncData(params) {
        return {};
    }
}

// Variables globales para compatibilidad
var lineStartX = null;
var lineStartY = null;

function startLineBrush(x, y) {
    lineStartX = x;
    lineStartY = y;
}

function resetLineBrush() {
    lineStartX = null;
    lineStartY = null;
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new LineBrush());
}
