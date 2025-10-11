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
            icon: '<path fill="currentColor" d="M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22M12,5A2,2 0 0,0 10,7C10,7.5 10.2,8 10.5,8.5C9.6,8.3 8.7,8.2 8,8.2C6.5,8.2 5.2,9.2 5,10.6C4.8,12 5.8,13.3 7.2,13.5C7.7,13.6 8.2,13.5 8.7,13.3C8.3,13.7 8,14.3 8,15A2,2 0 0,0 10,17H14A2,2 0 0,0 16,15C16,14.3 15.7,13.7 15.3,13.3C15.8,13.5 16.3,13.6 16.8,13.5C18.2,13.3 19.2,12 19,10.6C18.8,9.2 17.5,8.2 16,8.2C15.3,8.2 14.4,8.3 13.5,8.5C13.8,8 14,7.5 14,7A2,2 0 0,0 12,5Z"/>',
            supportsKaleidoscope: true,
            parameters: {
                minSize: { min: 1, max: 20, default: 5, step: 1, label: 'Tamaño Mínimo' },
                maxSize: { min: 10, max: 50, default: 30, step: 1, label: 'Tamaño Máximo' },
                frequency: { min: 3, max: 12, default: 5, step: 1, label: 'Frecuencia' },
                animSpeed: { min: 0.01, max: 0.15, default: 0.065, step: 0.005, label: 'Velocidad Anim' },
                strokeWeight: { min: 1, max: 5, default: 1, step: 1, label: 'Grosor Trazo' },
                strokeAlpha: { min: 5, max: 100, default: 15, step: 5, label: 'Alpha Trazo' },
                shrinkSpeed: { min: 0.1, max: 2, default: 0.5, step: 0.1, label: 'Velocidad Encogimiento' }
            }
        });
        
        // Estado de animación
        this.currentSize = 30; // Empieza en máximo
        this.frameCounter = 0;
        this.isDrawing = false; // Flag para saber si está dibujando
    }

    renderControls() {
        return `
            <label>Tamaño Mínimo: <span id="minSize-value">5</span></label>
            <input type="range" value="5" id="minSize" min="1" max="20" step="1" class="jpslider"
                   oninput="document.getElementById('minSize-value').textContent = this.value">
            <br>
            <label>Tamaño Máximo: <span id="maxSize-value">30</span></label>
            <input type="range" value="30" id="maxSize" min="10" max="50" step="1" class="jpslider"
                   oninput="document.getElementById('maxSize-value').textContent = this.value">
            <br>
            <label>Frecuencia: <span id="frequency-value">5</span></label>
            <input type="range" value="5" id="frequency" min="3" max="12" step="1" class="jpslider"
                   oninput="document.getElementById('frequency-value').textContent = this.value">
            <br>
            <label>Velocidad Anim: <span id="animSpeed-value">0.065</span></label>
            <input type="range" value="0.065" id="animSpeed" min="0.01" max="0.15" step="0.005" class="jpslider"
                   oninput="document.getElementById('animSpeed-value').textContent = this.value">
            <br>
            <label>Grosor Trazo: <span id="flowerStrokeWeight-value">1</span></label>
            <input type="range" value="1" id="flowerStrokeWeight" min="1" max="5" step="1" class="jpslider"
                   oninput="document.getElementById('flowerStrokeWeight-value').textContent = this.value">
            <br>
            <label>Alpha Trazo: <span id="strokeAlpha-value">15</span></label>
            <input type="range" value="15" id="strokeAlpha" min="5" max="100" step="5" class="jpslider"
                   oninput="document.getElementById('strokeAlpha-value').textContent = this.value">
            <br>
            <label>Velocidad Encogimiento: <span id="shrinkSpeed-value">0.5</span></label>
            <input type="range" value="0.5" id="shrinkSpeed" min="0.1" max="2" step="0.1" class="jpslider"
                   oninput="document.getElementById('shrinkSpeed-value').textContent = this.value">
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
            minSize = 5,
            maxSize = 30,
            frequency = 5,
            animSpeed = 0.065,
            strokeWeight = 1,
            strokeAlpha = 15,
            shrinkSpeed = 0.5
        } = params;
        
        // Actualizar tamaño (encoger) - SOLO cuando está dibujando
        this.currentSize -= shrinkSpeed;
        
        // Resetear cuando llega al mínimo
        if (this.currentSize < minSize) {
            this.currentSize = maxSize;
        }
        
        // Incrementar frame counter
        this.frameCounter++;
        
        // Dibujar la flor
        this.drawShape(buffer, x, y, this.currentSize, frequency, animSpeed, color, strokeWeight, strokeAlpha);
    }

    /**
     * Obtiene los datos para sincronización
     */
    getSyncData(params) {
        return {
            minSize: params.minSize || 5,
            maxSize: params.maxSize || 30,
            frequency: params.frequency || 5,
            animSpeed: params.animSpeed || 0.065,
            strokeWeight: params.strokeWeight || 1,
            strokeAlpha: params.strokeAlpha || 15,
            shrinkSpeed: params.shrinkSpeed || 0.5
        };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new FlowerBrush());
}
