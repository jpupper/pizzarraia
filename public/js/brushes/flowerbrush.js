/**
 * FlowerBrush - Pincel de flores
 * Dibuja flores con pétalos personalizables
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
                petalCount: { min: 3, max: 12, default: 5, step: 1, label: 'Pétalos' },
                petalLength: { min: 0.5, max: 2.0, default: 1.0, step: 0.1, label: 'Largo Pétalos' },
                petalWidth: { min: 0.3, max: 1.5, default: 0.6, step: 0.1, label: 'Ancho Pétalos' },
                centerSize: { min: 0.1, max: 0.8, default: 0.3, step: 0.05, label: 'Centro' }
            }
        });
    }

    renderControls() {
        return `
            <label>Petal Count: <span id="petalCount-value">5</span></label>
            <input type="range" value="5" id="petalCount" min="3" max="12" step="1" class="jpslider"
                   oninput="document.getElementById('petalCount-value').textContent = this.value">
            <br>
            <label>Petal Length: <span id="petalLength-value">1.0</span></label>
            <input type="range" value="1.0" id="petalLength" min="0.5" max="2.0" step="0.1" class="jpslider"
                   oninput="document.getElementById('petalLength-value').textContent = this.value">
            <br>
            <label>Petal Width: <span id="petalWidth-value">0.6</span></label>
            <input type="range" value="0.6" id="petalWidth" min="0.3" max="1.5" step="0.1" class="jpslider"
                   oninput="document.getElementById('petalWidth-value').textContent = this.value">
            <br>
            <label>Center Size: <span id="centerSize-value">0.3</span></label>
            <input type="range" value="0.3" id="centerSize" min="0.1" max="0.8" step="0.05" class="jpslider"
                   oninput="document.getElementById('centerSize-value').textContent = this.value">
            <br>
            <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 10px;">
                🌸 Personaliza tu flor ajustando pétalos, tamaño y proporciones
            </p>
        `;
    }

    /**
     * Método update - Se llama antes de dibujar
     * Puedes usarlo para preparar datos o animaciones
     */
    update(params) {
        // Aquí puedes agregar lógica de actualización
        // Por ejemplo: animaciones, cálculos previos, etc.
        
        // Ejemplo: rotar pétalos con el tiempo
        if (!this.rotation) {
            this.rotation = 0;
        }
        this.rotation += 0.01; // Incremento de rotación
        
        return params;
    }

    /**
     * Dibuja una flor individual
     */
    drawFlower(buffer, x, y, size, color, petalCount, petalLength, petalWidth, centerSize) {
        buffer.push();
        buffer.translate(x, y);
        
        // Aplicar rotación si existe
        if (this.rotation) {
            buffer.rotate(this.rotation);
        }
        
        // Dibujar pétalos
        const angleStep = TWO_PI / petalCount;
        for (let i = 0; i < petalCount; i++) {
            const angle = angleStep * i;
            
            buffer.push();
            buffer.rotate(angle);
            
            // Pétalo como elipse
            buffer.fill(color);
            buffer.noStroke();
            buffer.ellipse(
                size * petalLength * 0.5, 
                0, 
                size * petalLength, 
                size * petalWidth
            );
            
            buffer.pop();
        }
        
        // Dibujar centro de la flor
        buffer.push();
        buffer.fill(255, 200, 50, alpha(color)); // Amarillo para el centro con alpha del color principal
        buffer.noStroke();
        buffer.ellipse(0, 0, size * centerSize, size * centerSize);
        buffer.pop();
        
        buffer.pop();
    }

    /**
     * Método draw principal - Se llama cuando el usuario dibuja
     */
    draw(buffer, x, y, params) {
        // Llamar a update primero
        params = this.update(params);
        
        const {
            size,
            color,
            kaleidoSegments = 1,
            petalCount = 5,
            petalLength = 1.0,
            petalWidth = 0.6,
            centerSize = 0.3
        } = params;
        
        if (kaleidoSegments <= 1) {
            // Sin kaleidoscopio
            this.drawFlower(buffer, x, y, size, color, petalCount, petalLength, petalWidth, centerSize);
        } else {
            // Con kaleidoscopio
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
                this.drawFlower(buffer, newX, newY, size, color, petalCount, petalLength, petalWidth, centerSize);
            }
        }
    }

    /**
     * Obtiene los datos para sincronización
     */
    getSyncData(params) {
        return {
            petalCount: params.petalCount || 5,
            petalLength: params.petalLength || 1.0,
            petalWidth: params.petalWidth || 0.6,
            centerSize: params.centerSize || 0.3
        };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new FlowerBrush());
}
