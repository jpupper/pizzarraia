/**
 * GeometryBrush - Pincel de Spirograph
 * Dibuja espirógrafos animados con rotación continua
 */
class GeometryBrush extends BaseBrush {

    constructor() {
        super({
            id: 'geometry',
            name: 'Spirograph Brush',
            title: 'Spirograph Brush',
            icon: '<polygon points="12,4 20,20 4,20" fill="currentColor"/>',
            supportsKaleidoscope: true,
            parameters: {
                spiroRadius: { min: 10, max: 200, default: 50, step: 5, label: 'Radio' },
                spiroModulo: { min: 5, max: 100, default: 30, step: 5, label: 'Módulo' },
                spiroInc: { min: 0.1, max: 10, default: 2, step: 0.1, label: 'Velocidad Rotación' },
                npoints1: { min: 3, max: 12, default: 5, step: 1, label: 'Puntas 1' },
                npoints2: { min: 3, max: 12, default: 3, step: 1, label: 'Puntas 2 (Estrella)' },
                borderSize: { min: 0, max: 20, default: 2, step: 1, label: 'Grosor Borde' },
                borderAlpha: { min: 0, max: 255, default: 255, step: 5, label: 'Alpha Borde' }
            }
        });
        this.anim = 0; // Variable de animación global
    }

    renderControls() {
        return `
            <label>Radio: <span id="spiroRadius-value">50</span></label>
            <input type="range" value="50" id="spiroRadius" min="10" max="200" step="5" class="jpslider"
                   oninput="document.getElementById('spiroRadius-value').textContent = this.value">
            <br>
            <label>Módulo: <span id="spiroModulo-value">30</span></label>
            <input type="range" value="30" id="spiroModulo" min="5" max="100" step="5" class="jpslider"
                   oninput="document.getElementById('spiroModulo-value').textContent = this.value">
            <br>
            <label>Velocidad Rotación: <span id="spiroInc-value">2</span></label>
            <input type="range" value="2" id="spiroInc" min="0.1" max="10" step="0.1" class="jpslider"
                   oninput="document.getElementById('spiroInc-value').textContent = this.value">
            <br>
            <label>Puntas 1: <span id="npoints1-value">5</span></label>
            <input type="range" value="5" id="npoints1" min="3" max="12" step="1" class="jpslider"
                   oninput="document.getElementById('npoints1-value').textContent = this.value">
            <br>
            <label>Puntas 2 (Estrella): <span id="npoints2-value">3</span></label>
            <input type="range" value="3" id="npoints2" min="3" max="12" step="1" class="jpslider"
                   oninput="document.getElementById('npoints2-value').textContent = this.value">
            <br>
            <label>Grosor Borde: <span id="borderSize-value">2</span></label>
            <input type="range" value="2" id="borderSize" min="0" max="20" step="1" class="jpslider"
                   oninput="document.getElementById('borderSize-value').textContent = this.value">
            <br>
            <label>Alpha Borde: <span id="borderAlpha-value">255</span></label>
            <input type="range" value="255" id="borderAlpha" min="0" max="255" step="5" class="jpslider"
                   oninput="document.getElementById('borderAlpha-value').textContent = this.value">
            <br>
            <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 10px;">
                🌀 Spirograph animado con rotación continua
            </p>
        `;
    }

    /**
     * Dibuja una estrella
     */
    drawStar(buffer, x, y, radius1, radius2, npoints) {
        const angle = TWO_PI / npoints;
        const halfAngle = angle / 2.0;
        buffer.beginShape();
        for (let a = -HALF_PI; a < TWO_PI - HALF_PI; a += angle) {
            let sx = x + cos(a) * radius1;
            let sy = y + sin(a) * radius1;
            buffer.vertex(sx, sy);
            sx = x + cos(a + halfAngle) * radius2;
            sy = y + sin(a + halfAngle) * radius2;
            buffer.vertex(sx, sy);
        }
        buffer.endShape(CLOSE);
    }

    /**
     * Dibuja un spirograph individual
     */
    drawSpirograph(buffer, x, y, params, animPhase) {
        const {
            size,
            color,
            spiroRadius = 50,
            spiroModulo = 30,
            spiroInc = 2,
            npoints1 = 5,
            npoints2 = 3,
            borderSize = 2,
            borderAlpha = 255
        } = params;

        // Calcular posición del spirograph basado en la fase de animación
        const angulo = animPhase * -10;
        const angulo_fijo = animPhase * spiroInc;
        
        const spirox = cos(radians(-angulo)) * spiroModulo;
        const spiroy = sin(radians(-angulo)) * spiroModulo;

        buffer.push();
        buffer.translate(x - spiroModulo + spirox, y - spiroy);
        buffer.rotate(radians(angulo_fijo));

        // Dibujar borde (figura más grande 1.1x)
        if (borderSize > 0) {
            // Usar directamente RGB con alpha para evitar problemas de scope
            buffer.fill(red(color) * 0.5, green(color) * 0.5, blue(color) * 0.5, borderAlpha);
            buffer.noStroke();
            this.drawStar(
                buffer,
                spiroModulo + spiroModulo / 2,
                spiroModulo - spiroModulo / 2,
                spiroRadius * 1.1,
                (spiroRadius * 1.1) * (npoints2 / npoints1),
                npoints1
            );
        }

        // Dibujar fill principal
        buffer.fill(color);
        buffer.noStroke();
        this.drawStar(
            buffer,
            spiroModulo + spiroModulo / 2,
            spiroModulo - spiroModulo / 2,
            spiroRadius,
            spiroRadius * (npoints2 / npoints1),
            npoints1
        );

        buffer.pop();
    }

    draw(buffer, x, y, params) {
        const { kaleidoSegments = 1, syncAnim } = params;
        
        // Incrementar animación solo si no hay sincronización
        if (syncAnim === undefined) {
            this.anim += 1;
            params.syncAnim = this.anim; // Guardar para sincronización
        } else {
            // Usar la animación sincronizada
            this.anim = syncAnim;
        }
        
        if (kaleidoSegments <= 1) {
            this.drawSpirograph(buffer, x, y, params, this.anim);
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
                this.drawSpirograph(buffer, newX, newY, params, this.anim);
            }
        }
    }

    getSyncData(params) {
        return {
            spiroRadius: params.spiroRadius || 50,
            spiroModulo: params.spiroModulo || 30,
            spiroInc: params.spiroInc || 2,
            npoints1: params.npoints1 || 5,
            npoints2: params.npoints2 || 3,
            borderSize: params.borderSize || 2,
            borderAlpha: params.borderAlpha || 255,
            syncAnim: params.syncAnim || this.anim
        };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new GeometryBrush());
}
