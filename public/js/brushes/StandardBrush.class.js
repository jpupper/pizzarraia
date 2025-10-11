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
            parameters: {
                // No tiene parámetros específicos adicionales
                // Solo usa los globales: size, color, alpha
            }
        });
    }

    /**
     * Renderiza los controles específicos del brush
     * @returns {string} HTML string
     */
    renderControls() {
        // El standard brush no tiene controles adicionales
        return '';
    }

    /**
     * Dibuja una línea simple
     * @param {p5.Graphics} buffer - Buffer donde dibujar
     * @param {number} x1 - Posición X inicial
     * @param {number} y1 - Posición Y inicial
     * @param {number} x2 - Posición X final
     * @param {number} y2 - Posición Y final
     * @param {number} size - Tamaño del pincel
     * @param {p5.Color} color - Color del pincel
     */
    drawLine(buffer, x1, y1, x2, y2, size, color) {
        buffer.stroke(color);
        buffer.strokeWeight(size);
        buffer.strokeCap(PROJECT);
        buffer.line(x1, y1, x2, y2);
    }

    /**
     * Función principal de dibujo
     * @param {p5.Graphics} buffer - Buffer donde dibujar
     * @param {number} x - Posición X actual
     * @param {number} y - Posición Y actual
     * @param {Object} params - Parámetros de dibujo
     */
    draw(buffer, x, y, params) {
        const {
            pmouseX = pmouseXGlobal,
            pmouseY = pmouseYGlobal,
            size,
            color,
            kaleidoSegments = 1
        } = params;

        if (kaleidoSegments <= 1) {
            // Sin efecto caleidoscopio, dibujar normalmente
            this.drawLine(buffer, pmouseX, pmouseY, x, y, size, color);
        } else {
            // Con efecto caleidoscopio
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

    /**
     * Obtiene los datos para sincronización
     * @param {Object} params - Parámetros actuales
     * @returns {Object}
     */
    getSyncData(params) {
        return {
            // No necesita datos adicionales
        };
    }
}

// Registrar el brush automáticamente cuando se carga el script
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new StandardBrush());
}
