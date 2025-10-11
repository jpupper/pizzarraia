/**
 * StandardBrush - Pincel estándar de línea continua
 * Extiende BaseBrush para implementar el comportamiento específico
 */
class StandardBrush extends BaseBrush {
    constructor() {
        super({
            id: 'classic',
            name: 'Standard Brush',
            title: 'Standard Brush',
            icon: '<circle cx="12" cy="12" r="8" fill="currentColor"/>',
            supportsKaleidoscope: true,
            parameters: {}
        });
    }

    renderControls() {
        return '';
    }

    drawLine(buffer, x1, y1, x2, y2, size, color) {
        buffer.stroke(color);
        buffer.strokeWeight(size);
        buffer.strokeCap(ROUND);
        buffer.line(x1, y1, x2, y2);
    }

    draw(buffer, x, y, params) {
        const {
            pmouseX = pmouseXGlobal,
            pmouseY = pmouseYGlobal,
            size,
            color,
            kaleidoSegments = 1
        } = params;

        if (kaleidoSegments <= 1) {
            this.drawLine(buffer, pmouseX, pmouseY, x, y, size, color);
        } else {
            const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;
            const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;
            
            drawLineKaleidoscope(
                buffer,
                pmouseX, pmouseY,
                x, y,
                centerX, centerY,
                kaleidoSegments,
                this.drawLine.bind(this),
                size, color
            );
        }
    }

    getSyncData(params) {
        return {};
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new StandardBrush());
}
