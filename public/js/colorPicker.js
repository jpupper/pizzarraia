// ============================================================
// CURSOR GUI - SELECTOR DE COLOR RADIAL
// Se activa al mantener presionado el mouse/touch por 2+ segundos
// ============================================================

class CursorGUI {
    constructor() {
        this.isVisible = false;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 120; // Radio del círculo de colores
        this.innerRadius = 30; // Radio del círculo central
        this.sizeBarWidth = 200; // Ancho de la barra de tamaño
        this.sizeBarHeight = 30; // Alto de la barra de tamaño
        this.sizeBarY = 0; // Posición Y de la barra (se calcula dinámicamente)
        
        // Timer para detectar long press
        this.pressStartTime = 0;
        this.longPressThreshold = 2000; // 2 segundos
        this.longPressTimer = null;
        this.isPressing = false;
        
        // Posición inicial para detectar movimiento
        this.pressStartX = 0;
        this.pressStartY = 0;
        this.movementThreshold = 10; // Píxeles de tolerancia de movimiento
        
        // Colores predefinidos en círculo
        this.colors = [
            '#FF0000', // Rojo
            '#FF7F00', // Naranja
            '#FFFF00', // Amarillo
            '#7FFF00', // Lima
            '#00FF00', // Verde
            '#00FF7F', // Verde agua
            '#00FFFF', // Cian
            '#007FFF', // Azul cielo
            '#0000FF', // Azul
            '#7F00FF', // Violeta
            '#FF00FF', // Magenta
            '#FF007F', // Rosa
            '#FFFFFF', // Blanco
            '#CCCCCC', // Gris claro
            '#888888', // Gris
            '#444444', // Gris oscuro
            '#000000'  // Negro
        ];
        
        // Colores adicionales en anillo exterior
        this.outerColors = [
            '#8B0000', '#FF4500', '#FFD700', '#ADFF2F',
            '#32CD32', '#20B2AA', '#1E90FF', '#4169E1',
            '#8A2BE2', '#9932CC', '#FF1493', '#DC143C',
            '#F5F5DC', '#D2B48C', '#A0522D', '#654321'
        ];
        
        this.selectedColor = null;
        this.hoveredColor = null;
        this.hoveredSize = null;
        
        // Configuración de tamaño
        this.minSize = 1;
        this.maxSize = 100;
    }
    
    /**
     * Iniciar el temporizador de long press
     */
    startLongPress(x, y) {
        if (this.isVisible) return; // Ya está visible
        
        this.isPressing = true;
        this.pressStartTime = Date.now();
        this.pressStartX = x;
        this.pressStartY = y;
        this.centerX = x;
        this.centerY = y;
        
        // Iniciar timer
        this.longPressTimer = setTimeout(() => {
            if (this.isPressing && this.checkIfStill()) {
                this.show(x, y);
            }
        }, this.longPressThreshold);
    }
    
    /**
     * Verificar si el cursor se ha movido desde la posición inicial
     */
    checkIfStill() {
        const dx = Math.abs(this.centerX - this.pressStartX);
        const dy = Math.abs(this.centerY - this.pressStartY);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.movementThreshold;
    }
    
    /**
     * Actualizar posición actual (para detectar movimiento)
     */
    updatePosition(x, y) {
        if (this.isPressing && !this.isVisible) {
            this.centerX = x;
            this.centerY = y;
            
            // Si se movió demasiado, cancelar el long press
            if (!this.checkIfStill()) {
                this.cancelLongPress();
            }
        }
    }
    
    /**
     * Cancelar el temporizador
     */
    cancelLongPress() {
        this.isPressing = false;
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    
    /**
     * Mostrar el selector de color
     */
    show(x, y) {
        this.isVisible = true;
        this.centerX = x;
        this.centerY = y;
        // Calcular posición de la barra de tamaño (debajo del círculo)
        this.sizeBarY = y + this.radius + 60;
        console.log('Cursor GUI mostrado en:', x, y);
    }
    
    /**
     * Ocultar el selector de color
     */
    hide() {
        this.isVisible = false;
        this.hoveredColor = null;
        this.cancelLongPress();
    }
    
    /**
     * Verificar si un punto está dentro del selector
     */
    isPointInside(x, y) {
        if (!this.isVisible) return false;
        
        // Verificar si está en el círculo de colores
        const dist = Math.sqrt(
            Math.pow(x - this.centerX, 2) + 
            Math.pow(y - this.centerY, 2)
        );
        if (dist <= this.radius + 40) return true;
        
        // Verificar si está en la barra de tamaño
        const sizeBarX = this.centerX - this.sizeBarWidth / 2;
        if (x >= sizeBarX && x <= sizeBarX + this.sizeBarWidth &&
            y >= this.sizeBarY && y <= this.sizeBarY + this.sizeBarHeight) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Obtener el color en una posición específica
     */
    getColorAt(x, y) {
        if (!this.isVisible) return null;
        
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Círculo central (color actual)
        if (distance < this.innerRadius) {
            return 'current';
        }
        
        // Anillo interior (colores principales)
        if (distance >= this.innerRadius && distance < this.radius) {
            const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
            const colorIndex = Math.floor(normalizedAngle * this.colors.length);
            return this.colors[colorIndex % this.colors.length];
        }
        
        // Anillo exterior (colores adicionales)
        if (distance >= this.radius && distance < this.radius + 30) {
            const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
            const colorIndex = Math.floor(normalizedAngle * this.outerColors.length);
            return this.outerColors[colorIndex % this.outerColors.length];
        }
        
        return null;
    }
    
    /**
     * Obtener el tamaño en una posición específica de la barra
     */
    getSizeAt(x, y) {
        if (!this.isVisible) return null;
        
        const sizeBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Verificar si está en la barra de tamaño
        if (x >= sizeBarX && x <= sizeBarX + this.sizeBarWidth &&
            y >= this.sizeBarY && y <= this.sizeBarY + this.sizeBarHeight) {
            
            // Calcular el tamaño basado en la posición X
            const relativeX = x - sizeBarX;
            const percentage = relativeX / this.sizeBarWidth;
            const size = this.minSize + (this.maxSize - this.minSize) * percentage;
            return Math.round(size);
        }
        
        return null;
    }
    
    /**
     * Manejar click en el selector
     */
    handleClick(x, y) {
        if (!this.isVisible) return false;
        
        // Verificar si hizo click en la barra de tamaño
        const size = this.getSizeAt(x, y);
        if (size !== null) {
            // Actualizar el slider de tamaño
            const sizeInput = document.getElementById('size');
            if (sizeInput) {
                sizeInput.value = size;
                // Disparar evento para actualizar el valor mostrado
                const event = new Event('input');
                sizeInput.dispatchEvent(event);
                console.log('Tamaño seleccionado:', size);
            }
            // No cerrar, permitir ajustar más
            return true;
        }
        
        // Verificar si hizo click en un color
        const color = this.getColorAt(x, y);
        if (color && color !== 'current') {
            this.selectedColor = color;
            
            // Actualizar el input de color en la GUI
            const colorInput = document.getElementById('c1');
            if (colorInput) {
                colorInput.value = color;
                console.log('Color seleccionado:', color);
            }
            
            this.hide();
            return true;
        }
        
        // Si hace click fuera, cerrar
        if (!this.isPointInside(x, y)) {
            this.hide();
            return true;
        }
        
        return false;
    }
    
    /**
     * Actualizar hover
     */
    updateHover(x, y) {
        if (!this.isVisible) return;
        this.hoveredColor = this.getColorAt(x, y);
        this.hoveredSize = this.getSizeAt(x, y);
    }
    
    /**
     * Dibujar el selector de color
     */
    display(buffer) {
        if (!this.isVisible) return;
        
        buffer.push();
        
        // Fondo semi-transparente oscuro
        buffer.noStroke();
        buffer.fill(0, 0, 0, 100);
        buffer.ellipse(this.centerX, this.centerY, (this.radius + 40) * 2);
        
        // Dibujar anillo exterior (colores adicionales)
        const outerSegmentAngle = (2 * Math.PI) / this.outerColors.length;
        for (let i = 0; i < this.outerColors.length; i++) {
            const startAngle = i * outerSegmentAngle - Math.PI;
            const endAngle = (i + 1) * outerSegmentAngle - Math.PI;
            
            buffer.fill(this.outerColors[i]);
            buffer.noStroke();
            
            // Dibujar segmento de anillo
            buffer.beginShape();
            for (let a = startAngle; a <= endAngle; a += 0.1) {
                const x1 = this.centerX + Math.cos(a) * this.radius;
                const y1 = this.centerY + Math.sin(a) * this.radius;
                buffer.vertex(x1, y1);
            }
            for (let a = endAngle; a >= startAngle; a -= 0.1) {
                const x2 = this.centerX + Math.cos(a) * (this.radius + 30);
                const y2 = this.centerY + Math.sin(a) * (this.radius + 30);
                buffer.vertex(x2, y2);
            }
            buffer.endShape(CLOSE);
            
            // Borde si está en hover
            if (this.hoveredColor === this.outerColors[i]) {
                buffer.stroke(255, 255, 255, 200);
                buffer.strokeWeight(3);
                buffer.noFill();
                buffer.beginShape();
                for (let a = startAngle; a <= endAngle; a += 0.1) {
                    const x1 = this.centerX + Math.cos(a) * this.radius;
                    const y1 = this.centerY + Math.sin(a) * this.radius;
                    buffer.vertex(x1, y1);
                }
                for (let a = endAngle; a >= startAngle; a -= 0.1) {
                    const x2 = this.centerX + Math.cos(a) * (this.radius + 30);
                    const y2 = this.centerY + Math.sin(a) * (this.radius + 30);
                    buffer.vertex(x2, y2);
                }
                buffer.endShape(CLOSE);
            }
        }
        
        // Dibujar anillo interior (colores principales)
        const segmentAngle = (2 * Math.PI) / this.colors.length;
        for (let i = 0; i < this.colors.length; i++) {
            const startAngle = i * segmentAngle - Math.PI;
            const endAngle = (i + 1) * segmentAngle - Math.PI;
            
            buffer.fill(this.colors[i]);
            buffer.noStroke();
            
            // Dibujar segmento
            buffer.beginShape();
            buffer.vertex(this.centerX, this.centerY);
            for (let a = startAngle; a <= endAngle; a += 0.1) {
                const x = this.centerX + Math.cos(a) * this.radius;
                const y = this.centerY + Math.sin(a) * this.radius;
                buffer.vertex(x, y);
            }
            buffer.endShape(CLOSE);
            
            // Borde si está en hover
            if (this.hoveredColor === this.colors[i]) {
                buffer.stroke(255, 255, 255, 200);
                buffer.strokeWeight(3);
                buffer.noFill();
                buffer.beginShape();
                buffer.vertex(this.centerX, this.centerY);
                for (let a = startAngle; a <= endAngle; a += 0.1) {
                    const x = this.centerX + Math.cos(a) * this.radius;
                    const y = this.centerY + Math.sin(a) * this.radius;
                    buffer.vertex(x, y);
                }
                buffer.endShape(CLOSE);
            }
        }
        
        // Círculo central (color actual)
        const currentColor = document.getElementById('c1') ? 
            document.getElementById('c1').value : '#FFFFFF';
        buffer.fill(currentColor);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(3);
        buffer.ellipse(this.centerX, this.centerY, this.innerRadius * 2);
        
        // Dibujar barra de tamaño
        const sizeBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Fondo de la barra
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(sizeBarX, this.sizeBarY, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Gradiente visual de tamaño (círculos de diferentes tamaños)
        for (let i = 0; i <= 10; i++) {
            const x = sizeBarX + (this.sizeBarWidth / 10) * i;
            const size = this.minSize + (this.maxSize - this.minSize) * (i / 10);
            buffer.fill(150, 150, 150, 150);
            buffer.noStroke();
            buffer.ellipse(x, this.sizeBarY + this.sizeBarHeight / 2, size * 0.3, size * 0.3);
        }
        
        // Indicador del tamaño actual
        const currentSize = parseInt(document.getElementById('size') ? document.getElementById('size').value : 20);
        const currentSizePercentage = (currentSize - this.minSize) / (this.maxSize - this.minSize);
        const indicatorX = sizeBarX + this.sizeBarWidth * currentSizePercentage;
        
        buffer.fill(100, 200, 255);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(indicatorX, this.sizeBarY + this.sizeBarHeight / 2, 20, 20);
        
        // Mostrar valor del tamaño en hover
        if (this.hoveredSize !== null) {
            buffer.fill(255, 255, 255, 230);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(14);
            buffer.text(this.hoveredSize, this.centerX, this.sizeBarY - 15);
        }
        
        // Texto de instrucción
        buffer.fill(255);
        buffer.noStroke();
        buffer.textAlign(CENTER, CENTER);
        buffer.textSize(12);
        buffer.text('Color', this.centerX, this.centerY + this.radius + 50);
        buffer.text('Tamaño', this.centerX, this.sizeBarY + this.sizeBarHeight + 20);
        
        // Mostrar indicador de progreso si está presionando Y quieto
        if (this.isPressing && !this.isVisible && this.checkIfStill()) {
            const elapsed = Date.now() - this.pressStartTime;
            const progress = Math.min(elapsed / this.longPressThreshold, 1);
            
            // Círculo de fondo
            buffer.noFill();
            buffer.stroke(50, 50, 50, 150);
            buffer.strokeWeight(4);
            buffer.ellipse(this.pressStartX, this.pressStartY, 60, 60);
            
            // Arco de progreso
            buffer.noFill();
            buffer.stroke(100, 200, 255, 200);
            buffer.strokeWeight(4);
            buffer.arc(
                this.pressStartX, 
                this.pressStartY, 
                60, 
                60, 
                -Math.PI / 2, 
                -Math.PI / 2 + (2 * Math.PI * progress)
            );
            
            // Texto de progreso
            buffer.fill(255, 255, 255, 200);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(10);
            buffer.text('Mantén', this.pressStartX, this.pressStartY - 5);
            buffer.text('quieto', this.pressStartX, this.pressStartY + 5);
        }
        
        buffer.pop();
    }
}

// Crear instancia global
let cursorGUI = null;

// Inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
    window.addEventListener('load', function() {
        cursorGUI = new CursorGUI();
        window.cursorGUI = cursorGUI;
        console.log('Cursor GUI inicializado');
    });
}
