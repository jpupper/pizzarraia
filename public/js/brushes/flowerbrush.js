/**
 * FlowerBrush - Pincel de flores animadas (basado en Silksun)
 * Dibuja continuamente con animación que se resetea
 */
class FlowerBrush extends BaseBrush {
    constructor() {
        super({
            id: 'flower',
            name: 'Flower Brush',
            title: 'Flower Brush',
            icon: '<path fill="currentColor" d="M12,22A1,1 0 0,1 11,21V19H10A2,2 0 0,1 8,17V15A4,4 0 0,1 4,11A4,4 0 0,1 8,7H9A2,2 0 0,1 11,5V3A1,1 0 0,1 12,2A1,1 0 0,1 13,3V5A2,2 0 0,1 15,7H16A4,4 0 0,1 20,11A4,4 0 0,1 16,15V17A2,2 0 0,1 14,19H13V21A1,1 0 0,1 12,22M12,7A2,2 0 0,0 10,9A2,2 0 0,0 12,11A2,2 0 0,0 14,9A2,2 0 0,0 12,7M12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13Z"/>',
            supportsKaleidoscope: true,
            parameters: {
                minSize: { min: 1, max: 20, default: 2, step: 1, label: 'Tamaño Mínimo' },
                maxSize: { min: 10, max: 50, default: 14, step: 1, label: 'Tamaño Máximo' },
                frequency: { min: 3, max: 12, default: 6, step: 1, label: 'Frecuencia' },
                animSpeed: { min: 0, max: 0.15, default: 0.1, step: 0.005, label: 'Velocidad Anim' },
                strokeWeight: { min: 1, max: 5, default: 4, step: 1, label: 'Grosor Trazo' },
                strokeAlpha: { min: 5, max: 100, default: 45, step: 5, label: 'Alpha Trazo' },
                shrinkSpeed: { min: 0, max: 2, default: 0.15, step: 0.01, label: 'Velocidad Encogimiento' },
                shadowOffset: { min: 0, max: 15, default: 10, step: 1, label: 'Offset Sombra' }
            }
        });
        
        // Estado de animación
        this.currentSize = 14; // Empieza en máximo
        this.frameCounter = 0;
        this.isDrawing = false; // Flag para saber si está dibujando
    }

    getCursorGUIControls() {
        return [
            { id: 'minSize', label: 'Min Size', min: 1, max: 20, default: 2, step: 1 },
            { id: 'maxSize', label: 'Max Size', min: 10, max: 50, default: 14, step: 1 },
            { id: 'frequency', label: 'Freq', min: 3, max: 12, default: 6, step: 1 },
            { id: 'animSpeed', label: 'Anim', min: 0, max: 0.15, default: 0.1, step: 0.005 },
            { id: 'flowerStrokeWeight', label: 'Grosor', min: 1, max: 5, default: 4, step: 1 },
            { id: 'strokeAlpha', label: 'Alpha', min: 5, max: 100, default: 45, step: 5 },
            { id: 'shrinkSpeed', label: 'Shrink', min: 0, max: 2, default: 0.15, step: 0.01 },
            { id: 'shadowOffset', label: 'Shadow', min: 0, max: 15, default: 10, step: 1 }
        ];
    }
    
    drawCursorGUIPreview(buffer, x, y, size, color) {
        buffer.push();
        buffer.noFill();
        buffer.stroke(color);
        buffer.strokeWeight(2);
        // Dibujar una flor simple
        const petals = 6;
        for (let i = 0; i < petals; i++) {
            const angle = (TWO_PI / petals) * i;
            const px = x + cos(angle) * size * 0.4;
            const py = y + sin(angle) * size * 0.4;
            buffer.ellipse(px, py, size * 0.3, size * 0.3);
        }
        buffer.pop();
    }
    
    renderControls() {
        return `
            <label>Tamaño Mínimo: <span id="minSize-value">2</span></label>
            <input type="range" value="2" id="minSize" min="1" max="20" step="1" class="jpslider"
                   oninput="document.getElementById('minSize-value').textContent = this.value">
            <br>
            <label>Tamaño Máximo: <span id="maxSize-value">14</span></label>
            <input type="range" value="14" id="maxSize" min="10" max="50" step="1" class="jpslider"
                   oninput="document.getElementById('maxSize-value').textContent = this.value">
            <br>
            <label>Frecuencia: <span id="frequency-value">6</span></label>
            <input type="range" value="6" id="frequency" min="3" max="12" step="1" class="jpslider"
                   oninput="document.getElementById('frequency-value').textContent = this.value">
            <br>
            <label>Velocidad Anim: <span id="animSpeed-value">0.10</span></label>
            <input type="range" value="0.1" id="animSpeed" min="0" max="0.15" step="0.005" class="jpslider"
                   oninput="document.getElementById('animSpeed-value').textContent = parseFloat(this.value).toFixed(2)">
            <br>
            <label>Grosor Trazo: <span id="flowerStrokeWeight-value">4</span></label>
            <input type="range" value="4" id="flowerStrokeWeight" min="1" max="5" step="1" class="jpslider"
                   oninput="document.getElementById('flowerStrokeWeight-value').textContent = this.value">
            <br>
            <label>Alpha Trazo: <span id="strokeAlpha-value">45</span></label>
            <input type="range" value="45" id="strokeAlpha" min="5" max="100" step="5" class="jpslider"
                   oninput="document.getElementById('strokeAlpha-value').textContent = this.value">
            <br>
            <label>Velocidad Encogimiento: <span id="shrinkSpeed-value">0.15</span></label>
            <input type="range" value="0.15" id="shrinkSpeed" min="0" max="2" step="0.01" class="jpslider"
                   oninput="document.getElementById('shrinkSpeed-value').textContent = parseFloat(this.value).toFixed(2)">
            <br>
            <label>Offset Sombra: <span id="shadowOffset-value">10</span></label>
            <input type="range" value="10" id="shadowOffset" min="0" max="15" step="1" class="jpslider"
                   oninput="document.getElementById('shadowOffset-value').textContent = this.value">
            <br>
            <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 10px;">
                🌸 Dibuja flores que se encogen y resetean continuamente
            </p>
        `;
    }

    /**
     * Dibuja la forma de la flor
     */
    drawShape(buffer, x, y, size, frequency, animSpeed, brushColor, strokeWeight, strokeAlpha) {
        const cnt = 100; // Reducido de 250 a 100 para mejor performance
        
        // Extraer componentes del color y crear nuevo color con alpha parametrizable
        const r = red(brushColor);
        const g = green(brushColor);
        const b = blue(brushColor);
        
        buffer.stroke(r, g, b, strokeAlpha);
        buffer.noFill();
        buffer.strokeWeight(strokeWeight);
        
        buffer.beginShape();
        for (let i = 0; i < cnt; i++) {
            const a = map(i, 0, cnt - 1, 0, TWO_PI);
            const lf = map(size, this.currentSize, 0, 0, 1); // Factor de vida basado en tamaño
            
            let sf = size * map(
                sin(a * frequency + this.frameCounter * animSpeed) * 0.5 + 0.5,
                0, 1,
                size, size * 2
            ) * (1 - lf * 0.5); // Reduce con el tamaño
            
            const xx = x + sin(a) * sf;
            const yy = y + cos(a) * sf;
            buffer.vertex(xx, yy);
        }
        buffer.endShape(CLOSE);
        
        // Sombras desactivadas para mejor performance
        // Si quieres reactivarlas, descomenta este código
        /*
        const sp = 4;
        buffer.stroke(255, 255, 255, 5);
        buffer.beginShape();
        for (let i = 0; i < cnt; i++) {
            const a = map(i, 0, cnt - 1, 0, TWO_PI);
            const lf = map(size, this.currentSize, 0, 0, 1);
            let sf = size * map(
                sin(a * frequency + this.frameCounter * animSpeed) * 0.5 + 0.5,
                0, 1,
                size, size * 2
            ) * (1 - lf * 0.5);
            const xx = (x - sp) + sin(a) * sf;
            const yy = (y - sp) + cos(a) * sf;
            buffer.vertex(xx, yy);
        }
        buffer.endShape(CLOSE);
        
        buffer.stroke(0, 0, 0, 5);
        buffer.beginShape();
        for (let i = 0; i < cnt; i++) {
            const a = map(i, 0, cnt - 1, 0, TWO_PI);
            const lf = map(size, this.currentSize, 0, 0, 1);
            let sf = size * map(
                sin(a * frequency + this.frameCounter * animSpeed) * 0.5 + 0.5,
                0, 1,
                size, size * 2
            ) * (1 - lf * 0.5);
            const xx = (x + sp) + sin(a) * sf;
            const yy = (y + sp) + cos(a) * sf;
            buffer.vertex(xx, yy);
        }
        buffer.endShape(CLOSE);
        */
    }

    /**
     * Método draw principal - Dibuja continuamente con animación
     */
    draw(buffer, x, y, params) {
        const {
            color,
            minSize = 2,
            maxSize = 14,
            frequency = 6,
            animSpeed = 0.1,
            strokeWeight = 4,
            strokeAlpha = 45,
            shrinkSpeed = 0.15,
            shadowOffset = 10
        } = params;
        
        // Solo actualizar si shrinkSpeed > 0
        if (shrinkSpeed > 0) {
            // Actualizar tamaño (encoger)
            this.currentSize -= shrinkSpeed;
            
            // Resetear cuando llega al mínimo
            if (this.currentSize < minSize) {
                this.currentSize = maxSize;
            }
        }
        
        // Solo incrementar frame counter si animSpeed > 0
        if (animSpeed > 0) {
            this.frameCounter++;
        }
        
        // Dibujar sombra negra
        const blackColor = buffer.color(0, 0, 0);
        this.drawShape(buffer, x-shadowOffset, y-shadowOffset, this.currentSize, frequency, animSpeed, blackColor, strokeWeight, strokeAlpha);

        // Dibujar sombra blanca
        const whiteColor = buffer.color(255);
        this.drawShape(buffer, x+shadowOffset, y+shadowOffset, this.currentSize, frequency, animSpeed, whiteColor, strokeWeight, strokeAlpha);

        // Dibujar la flor con el color principal
        this.drawShape(buffer, x, y, this.currentSize, frequency, animSpeed, color, strokeWeight, strokeAlpha);
    }

    /**
     * Obtiene los datos para sincronización
     */
    getSyncData(params) {
        return {
            minSize: params.minSize || 2,
            maxSize: params.maxSize || 14,
            frequency: params.frequency || 6,
            animSpeed: params.animSpeed || 0.1,
            strokeWeight: params.strokeWeight || 4,
            strokeAlpha: params.strokeAlpha || 45,
            shrinkSpeed: params.shrinkSpeed || 0.15,
            shadowOffset: params.shadowOffset || 10
        };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new FlowerBrush());
}
