/**
 * GeometryBrush - Pincel de geometría (polígonos)
 * Dibuja polígonos regulares
 */
class GeometryBrush extends BaseBrush {

    constructor() {
        super({
            id: 'geometry',
            name: 'Geometry Brush',
            title: 'Geometry Brush',
            icon: '<polygon points="12,4 20,20 4,20" fill="currentColor"/>',
            supportsKaleidoscope: true,
            parameters: {
                polygonSides: { min: 2, max: 10, default: 5, step: 1, label: 'Lados' }
            }
        });
    }

    renderControls() {
        return `
            <label>Polygon Sides: <span id="polygonSides-value">5</span></label>
            <input type="range" value="5" id="polygonSides" min="2" max="10" step="1" class="jpslider">
            <br>
        `;
    }

    drawBasicGeometry(buffer, x, y, size, sides, color) {
        sides = constrain(sides, 2, 10);
        buffer.fill(color);
        buffer.noStroke();
        buffer.push();
        buffer.translate(x, y);
        
        if (sides === 2) {
            buffer.stroke(color);
            buffer.strokeWeight(size / 10);
            buffer.line(-size / 2, 0, size / 2, 0);
        } else {
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

    draw(buffer, x, y, params) {
        const { size, color, kaleidoSegments = 1, polygonSides = 5 } = params;
        
        if (kaleidoSegments <= 1) {
            this.drawBasicGeometry(buffer, x, y, size, polygonSides, color);
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
                this.drawBasicGeometry(buffer, newX, newY, size, polygonSides, color);
            }
        }
    }

    getSyncData(params) {
        return { polygonSides: params.polygonSides || 5 };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new GeometryBrush());
}
