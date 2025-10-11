/**
 * FlowerBrush - Pincel de flores animadas (basado en Silksun)
 * Crea objetos con vida que se animan hasta desaparecer
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
                flowerSize: { min: 5, max: 30, default: 12, step: 1, label: 'Tamaño' },
                frequency: { min: 3, max: 12, default: 5, step: 1, label: 'Frecuencia' },
                animSpeed: { min: 0.01, max: 0.15, default: 0.065, step: 0.005, label: 'Velocidad Anim' },
                lives: { min: 1, max: 20, default: 5, step: 1, label: 'Vidas' },
                strokeWeight: { min: 1, max: 5, default: 1, step: 1, label: 'Grosor Trazo' }
            }
        });
        
        // Array de flores vivas
        this.flowers = [];
        this.lastClickTime = 0;
    }

    renderControls() {
        return `
            <label>Tamaño: <span id="flowerSize-value">12</span></label>
            <input type="range" value="12" id="flowerSize" min="5" max="30" step="1" class="jpslider"
                   oninput="document.getElementById('flowerSize-value').textContent = this.value">
            <br>
            <label>Frecuencia: <span id="frequency-value">5</span></label>
            <input type="range" value="5" id="frequency" min="3" max="12" step="1" class="jpslider"
                   oninput="document.getElementById('frequency-value').textContent = this.value">
            <br>
            <label>Velocidad Anim: <span id="animSpeed-value">0.065</span></label>
            <input type="range" value="0.065" id="animSpeed" min="0.01" max="0.15" step="0.005" class="jpslider"
                   oninput="document.getElementById('animSpeed-value').textContent = this.value">
            <br>
            <label>Vidas: <span id="flowerLives-value">5</span></label>
            <input type="range" value="5" id="flowerLives" min="1" max="20" step="1" class="jpslider"
                   oninput="document.getElementById('flowerLives-value').textContent = this.value">
            <br>
            <label>Grosor Trazo: <span id="flowerStrokeWeight-value">1</span></label>
            <input type="range" value="1" id="flowerStrokeWeight" min="1" max="5" step="1" class="jpslider"
                   oninput="document.getElementById('flowerStrokeWeight-value').textContent = this.value">
            <br>
            <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 10px;">
                🌸 Click para crear flores animadas que viven y se desvanecen
            </p>
        `;
    }

    /**
     * Actualiza todas las flores vivas
     */
    updateFlowers(buffer) {
        for (let i = this.flowers.length - 1; i >= 0; i--) {
            const flower = this.flowers[i];
            flower.update();
            flower.display(buffer);
            
            // Eliminar flores muertas
            if (flower.life < 0) {
                flower.restartLife();
                if (flower.lives < 0) {
                    this.flowers.splice(i, 1);
                }
            }
        }
    }

    /**
     * Crea una nueva flor en la posición del click
     */
    createFlower(x, y, params) {
        const {
            color,
            flowerSize = 12,
            frequency = 5,
            animSpeed = 0.065,
            lives = 5,
            strokeWeight = 1
        } = params;
        
        const flower = new SilkFlower(x, y, flowerSize, color, frequency, animSpeed, lives, strokeWeight);
        this.flowers.push(flower);
    }

    /**
     * Método draw principal - Solo crea flores en clicks, no dibuja continuamente
     */
    draw(buffer, x, y, params) {
        // Actualizar y dibujar todas las flores existentes
        this.updateFlowers(buffer);
        
        // Crear nueva flor solo si es un click (no arrastre)
        const currentTime = millis();
        if (currentTime - this.lastClickTime > 100) { // Debounce de 100ms
            this.createFlower(x, y, params);
            this.lastClickTime = currentTime;
        }
    }

    /**
     * Obtiene los datos para sincronización
     */
    getSyncData(params) {
        return {
            flowerSize: params.flowerSize || 12,
            frequency: params.frequency || 5,
            animSpeed: params.animSpeed || 0.065,
            lives: params.lives || 5,
            strokeWeight: params.strokeWeight || 1
        };
    }
}

/**
 * Clase SilkFlower - Representa una flor animada individual
 */
class SilkFlower {
    constructor(x, y, size, color, frequency, animSpeed, lives, strokeWeight) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.frequency = frequency;
        this.animSpeed = animSpeed;
        this.lives = lives;
        this.maxLives = lives;
        this.strokeWeight = strokeWeight;
        this.life = 255;
        this.frameCounter = 0;
    }
    
    update() {
        this.life -= 2.1;
        this.frameCounter++;
    }
    
    display(buffer) {
        // Color con alpha basado en vida
        const col = color(red(this.color), green(this.color), blue(this.color), 15);
        buffer.stroke(col);
        buffer.noFill();
        buffer.strokeWeight(this.strokeWeight);
        
        // Dibujar forma principal
        this.drawShape(buffer, this.x, this.y);
        
        // Sombras (opcional)
        const sp = 4;
        buffer.stroke(255, 255, 255, 5);
        this.drawShape(buffer, this.x - sp, this.y - sp);
        
        buffer.stroke(0, 0, 0, 5);
        this.drawShape(buffer, this.x + sp, this.y + sp);
    }
    
    drawShape(buffer, x, y) {
        const cnt = 250;
        buffer.beginShape();
        
        for (let i = 0; i < cnt; i++) {
            const a = map(i, 0, cnt - 1, 0, TWO_PI);
            const lf = map(this.life, 0, 255, 0, 1);
            
            let sf;
            if (this.lives % 2 === 0) {
                sf = this.size * map(
                    sin(a * this.frequency + this.frameCounter * this.animSpeed) * 0.5 + 0.5,
                    0, 1,
                    this.size, this.size * 2
                ) * lf;
            } else {
                sf = this.size * map(
                    sin(a * this.frequency - this.frameCounter * this.animSpeed) * 0.5 + 0.5,
                    0, 1,
                    this.size, this.size * 2
                ) * lf;
            }
            
            const xx = x + sin(a) * sf;
            const yy = y + cos(a) * sf;
            buffer.vertex(xx, yy);
        }
        
        buffer.endShape(CLOSE);
    }
    
    restartLife() {
        this.lives--;
        this.life = 255;
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new FlowerBrush());
}
