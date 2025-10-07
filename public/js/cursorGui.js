// ============================================================
// CURSOR GUI - SELECTOR DE COLOR RADIAL
// Se activa al mantener presionado el mouse/touch por 2+ segundos
// ============================================================

class CursorGUI {
    constructor() {
        this.isVisible = false;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 100; // Radio del círculo de colores
        this.innerRadius = 30; // Radio del círculo central
        this.sizeBarWidth = 200; // Ancho de la barra de tamaño
        this.sizeBarHeight = 30; // Alto de la barra de tamaño
        this.alphaBarY = 0; // Posición Y de la barra de transparencia (arriba)
        this.saturationBarY = 0; // Posición Y de la barra de saturación (arriba)
        this.brightnessBarY = 0; // Posición Y de la barra de brillo (arriba)
        this.sizeBarY = 0; // Posición Y de la barra de tamaño (abajo)
        
        // Timer para detectar long press
        this.pressStartTime = 0;
        this.longPressThreshold = 500; 
        this.longPressTimer = null;
        this.isPressing = false;
        
        // Posición inicial para detectar movimiento
        this.pressStartX = 0;
        this.pressStartY = 0;
        this.movementThreshold = 10; // Píxeles de tolerancia de movimiento
        
        // Colores base para la rueda (se mezclarán con la paleta)
        this.baseColors = [
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
            '#FF007F'  // Rosa
        ];
        
        // Colores adicionales fijos
        this.fixedColors = [
            '#FFFFFF', // Blanco
            '#CCCCCC', // Gris claro
            '#888888', // Gris
            '#444444', // Gris oscuro
            '#000000'  // Negro
        ];
        
        
        this.selectedColor = null;
        this.hoveredColor = null;
        this.hoveredSize = null;
        this.hoveredAlpha = null;
        this.hoveredSaturation = null;
        this.hoveredBrightness = null;
        this.hoveredPaletteSlot = null;
        
        // Sistema de paleta de colores
        this.colorPalette = [
            '#FF0000', // Slot 1: Rojo
            '#00FF00', // Slot 2: Verde
            '#0000FF', // Slot 3: Azul
            '#FFFF00', // Slot 4: Amarillo
            '#FF00FF'  // Slot 5: Magenta
        ];
        this.activePaletteSlot = 0; // Índice del slot activo (0-4)
        this.paletteSlotSize = 35;
        this.paletteSlotSpacing = 10;
        
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
        // Calcular posición de las barras
        // Arriba del círculo: transparencia, saturación y brillo
        this.alphaBarY = y - this.radius - 180;
        this.saturationBarY = this.alphaBarY + 50;
        this.brightnessBarY = this.saturationBarY + 50;
        // Abajo del círculo: tamaño
        this.sizeBarY = y + this.radius + 60;
        console.log('Cursor GUI mostrado en:', x, y);
    }
    
    /**
     * Ocultar el selector de color
     */
    hide() {
        this.isVisible = false;
        this.hoveredColor = null;
        this.hoveredSize = null;
        this.hoveredAlpha = null;
        this.hoveredSaturation = null;
        this.hoveredBrightness = null;
        this.hoveredPaletteSlot = null;
        this.cancelLongPress();
    }
    
    /**
     * Obtener la posición de un slot de la paleta
     */
    getPaletteSlotPosition(index) {
        const totalWidth = (this.paletteSlotSize * 5) + (this.paletteSlotSpacing * 4);
        const startX = this.centerX - totalWidth / 2;
        // Posicionar los slots debajo de la rueda de colores
        const y = this.centerY + this.radius + 80;
        const x = startX + (index * (this.paletteSlotSize + this.paletteSlotSpacing));
        
        return { x, y };
    }
    
    /**
     * Verificar si un punto está sobre un slot de la paleta
     */
    getPaletteSlotAt(x, y) {
        if (!this.isVisible) return null;
        
        for (let i = 0; i < 5; i++) {
            const pos = this.getPaletteSlotPosition(i);
            const dist = Math.sqrt(
                Math.pow(x - (pos.x + this.paletteSlotSize / 2), 2) + 
                Math.pow(y - (pos.y), 2)
            );
            
            if (dist <= this.paletteSlotSize / 2) {
                return i;
            }
        }
        
        return null;
    }
    
    /**
     * Seleccionar un slot de la paleta
     */
    selectPaletteSlot(index) {
        if (index >= 0 && index < 5) {
            this.activePaletteSlot = index;
            // Actualizar el color actual al del slot seleccionado
            const colorInput = document.getElementById('c1');
            if (colorInput) {
                colorInput.value = this.colorPalette[index];
                console.log('Slot de paleta seleccionado:', index, '->', this.colorPalette[index]);
            }
        }
    }
    
    /**
     * Actualizar el color del slot activo
     */
    updateActivePaletteSlot(color) {
        this.colorPalette[this.activePaletteSlot] = color;
        console.log('Slot', this.activePaletteSlot, 'actualizado a:', color);
    }
    
    /**
     * Generar los colores de la rueda basados en la paleta activa
     */
    getWheelColors() {
        // Combinar los colores de la paleta con los colores fijos
        return [...this.colorPalette, ...this.fixedColors];
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
        
        // Verificar si está en la barra de transparencia
        if (x >= sizeBarX && x <= sizeBarX + this.sizeBarWidth &&
            y >= this.alphaBarY && y <= this.alphaBarY + this.sizeBarHeight) {
            return true;
        }
        
        // Verificar si está en la barra de saturación
        if (x >= sizeBarX && x <= sizeBarX + this.sizeBarWidth &&
            y >= this.saturationBarY && y <= this.saturationBarY + this.sizeBarHeight) {
            return true;
        }
        
        // Verificar si está en la barra de brillo
        if (x >= sizeBarX && x <= sizeBarX + this.sizeBarWidth &&
            y >= this.brightnessBarY && y <= this.brightnessBarY + this.sizeBarHeight) {
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
        
        // Verificar si está sobre un slot de la paleta (tiene prioridad)
        const paletteSlot = this.getPaletteSlotAt(x, y);
        if (paletteSlot !== null) {
            return null; // Los slots se manejan por separado
        }
        
        // Anillo de colores
        if (distance >= this.innerRadius && distance < this.radius) {
            const wheelColors = this.getWheelColors();
            const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
            const colorIndex = Math.floor(normalizedAngle * wheelColors.length);
            return wheelColors[colorIndex % wheelColors.length];
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
     * Obtener la transparencia en una posición específica de la barra
     */
    getAlphaAt(x, y) {
        if (!this.isVisible) return null;
        
        const alphaBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Verificar si está en la barra de transparencia
        if (x >= alphaBarX && x <= alphaBarX + this.sizeBarWidth &&
            y >= this.alphaBarY && y <= this.alphaBarY + this.sizeBarHeight) {
            
            // Calcular la transparencia basada en la posición X
            const relativeX = x - alphaBarX;
            const percentage = relativeX / this.sizeBarWidth;
            const alpha = Math.round(percentage * 255);
            return alpha;
        }
        
        return null;
    }
    
    /**
     * Obtener la saturación en una posición específica de la barra
     */
    getSaturationAt(x, y) {
        if (!this.isVisible) return null;
        
        const satBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Verificar si está en la barra de saturación
        if (x >= satBarX && x <= satBarX + this.sizeBarWidth &&
            y >= this.saturationBarY && y <= this.saturationBarY + this.sizeBarHeight) {
            
            // Calcular la saturación basada en la posición X (0-100)
            const relativeX = x - satBarX;
            const percentage = relativeX / this.sizeBarWidth;
            return Math.round(percentage * 100);
        }
        
        return null;
    }
    
    /**
     * Obtener el brillo en una posición específica de la barra
     */
    getBrightnessAt(x, y) {
        if (!this.isVisible) return null;
        
        const brightBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Verificar si está en la barra de brillo
        if (x >= brightBarX && x <= brightBarX + this.sizeBarWidth &&
            y >= this.brightnessBarY && y <= this.brightnessBarY + this.sizeBarHeight) {
            
            // Calcular el brillo basado en la posición X (0-200, siendo 100 el valor neutro)
            const relativeX = x - brightBarX;
            const percentage = relativeX / this.sizeBarWidth;
            return Math.round(percentage * 200);
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
            const sizeInput = document.getElementById('size');
            if (sizeInput) {
                sizeInput.value = size;
                const event = new Event('input');
                sizeInput.dispatchEvent(event);
                console.log('Tamaño seleccionado:', size);
            }
            return true;
        }
        
        // Verificar si hizo click en la barra de transparencia
        const alpha = this.getAlphaAt(x, y);
        if (alpha !== null) {
            const alphaInput = document.getElementById('alphaValue');
            if (alphaInput) {
                alphaInput.value = alpha;
                const event = new Event('input');
                alphaInput.dispatchEvent(event);
                console.log('Transparencia seleccionada:', alpha);
            }
            return true;
        }
        
        // Verificar si hizo click en la barra de saturación
        const saturation = this.getSaturationAt(x, y);
        if (saturation !== null) {
            this.applySaturation(saturation);
            return true;
        }
        
        // Verificar si hizo click en la barra de brillo
        const brightness = this.getBrightnessAt(x, y);
        if (brightness !== null) {
            this.applyBrightness(brightness);
            return true;
        }
        
        // Verificar si hizo click en un slot de la paleta
        const paletteSlot = this.getPaletteSlotAt(x, y);
        if (paletteSlot !== null) {
            this.selectPaletteSlot(paletteSlot);
            return true;
        }
        
        // Verificar si hizo click en un color
        const color = this.getColorAt(x, y);
        if (color && color !== 'current') {
            this.selectedColor = color;
            const colorInput = document.getElementById('c1');
            if (colorInput) {
                colorInput.value = color;
                // Actualizar el slot activo de la paleta con el nuevo color
                this.updateActivePaletteSlot(color);
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
     * Aplicar saturación al color actual
     */
    applySaturation(saturation) {
        const colorInput = document.getElementById('c1');
        if (!colorInput) return;
        
        const currentColor = colorInput.value;
        const r = parseInt(currentColor.substr(1, 2), 16);
        const g = parseInt(currentColor.substr(3, 2), 16);
        const b = parseInt(currentColor.substr(5, 2), 16);
        
        // Convertir a escala de grises
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Interpolar entre gris y color original según saturación
        const sat = saturation / 100;
        const newR = Math.round(gray + (r - gray) * sat);
        const newG = Math.round(gray + (g - gray) * sat);
        const newB = Math.round(gray + (b - gray) * sat);
        
        const newColor = '#' + 
            newR.toString(16).padStart(2, '0') + 
            newG.toString(16).padStart(2, '0') + 
            newB.toString(16).padStart(2, '0');
        
        colorInput.value = newColor;
        console.log('Saturación aplicada:', saturation, '% ->', newColor);
    }
    
    /**
     * Aplicar brillo al color actual
     */
    applyBrightness(brightness) {
        const colorInput = document.getElementById('c1');
        if (!colorInput) return;
        
        const currentColor = colorInput.value;
        const r = parseInt(currentColor.substr(1, 2), 16);
        const g = parseInt(currentColor.substr(3, 2), 16);
        const b = parseInt(currentColor.substr(5, 2), 16);
        
        // Brillo: 0-100 = oscurecer, 100 = neutro, 100-200 = aclarar
        const factor = brightness / 100;
        
        let newR, newG, newB;
        if (factor < 1) {
            // Oscurecer (interpolar hacia negro)
            newR = Math.round(r * factor);
            newG = Math.round(g * factor);
            newB = Math.round(b * factor);
        } else {
            // Aclarar (interpolar hacia blanco)
            const adjust = factor - 1;
            newR = Math.round(r + (255 - r) * adjust);
            newG = Math.round(g + (255 - g) * adjust);
            newB = Math.round(b + (255 - b) * adjust);
        }
        
        // Asegurar que estén en el rango 0-255
        newR = Math.max(0, Math.min(255, newR));
        newG = Math.max(0, Math.min(255, newG));
        newB = Math.max(0, Math.min(255, newB));
        
        const newColor = '#' + 
            newR.toString(16).padStart(2, '0') + 
            newG.toString(16).padStart(2, '0') + 
            newB.toString(16).padStart(2, '0');
        
        colorInput.value = newColor;
        console.log('Brillo aplicado:', brightness, '->', newColor);
    }
    
    /**
     * Actualizar hover
     */
    updateHover(x, y) {
        if (!this.isVisible) return;
        this.hoveredColor = this.getColorAt(x, y);
        this.hoveredSize = this.getSizeAt(x, y);
        this.hoveredAlpha = this.getAlphaAt(x, y);
        this.hoveredSaturation = this.getSaturationAt(x, y);
        this.hoveredBrightness = this.getBrightnessAt(x, y);
        this.hoveredPaletteSlot = this.getPaletteSlotAt(x, y);
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
        
        // Dibujar anillo de colores usando la paleta activa
        const wheelColors = this.getWheelColors();
        const segmentAngle = (2 * Math.PI) / wheelColors.length;
        for (let i = 0; i < wheelColors.length; i++) {
            const startAngle = i * segmentAngle - Math.PI;
            const endAngle = (i + 1) * segmentAngle - Math.PI;
            
            buffer.fill(wheelColors[i]);
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
            if (this.hoveredColor === wheelColors[i]) {
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
        
        // Dibujar slots de la paleta de colores en el centro
        for (let i = 0; i < 5; i++) {
            const pos = this.getPaletteSlotPosition(i);
            const slotX = pos.x + this.paletteSlotSize / 2;
            const slotY = pos.y;
            
            // Color del slot
            buffer.fill(this.colorPalette[i]);
            
            // Borde del slot
            if (i === this.activePaletteSlot) {
                // Slot activo: borde blanco grueso
                buffer.stroke(255, 255, 255, 255);
                buffer.strokeWeight(4);
            } else if (i === this.hoveredPaletteSlot) {
                // Slot en hover: borde blanco delgado
                buffer.stroke(255, 255, 255, 200);
                buffer.strokeWeight(3);
            } else {
                // Slot normal: borde gris
                buffer.stroke(150, 150, 150, 150);
                buffer.strokeWeight(2);
            }
            
            // Dibujar el slot
            buffer.ellipse(slotX, slotY, this.paletteSlotSize, this.paletteSlotSize);
            
            // Número del slot
            buffer.fill(255, 255, 255, 200);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(12);
            buffer.text(i + 1, slotX, slotY + this.paletteSlotSize / 2 + 15);
        }
        
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
        
        // Dibujar barra de transparencia
        const alphaBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Fondo de la barra de transparencia
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(alphaBarX, this.alphaBarY, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Gradiente de transparencia
        for (let i = 0; i <= 20; i++) {
            const x = alphaBarX + (this.sizeBarWidth / 20) * i;
            const alpha = (i / 20) * 255;
            buffer.fill(255, 255, 255, alpha);
            buffer.noStroke();
            buffer.rect(x, this.alphaBarY + 5, this.sizeBarWidth / 20, this.sizeBarHeight - 10);
        }
        
        // Indicador de transparencia actual
        const currentAlpha = parseInt(document.getElementById('alphaValue') ? document.getElementById('alphaValue').value : 255);
        const currentAlphaPercentage = currentAlpha / 255;
        const alphaIndicatorX = alphaBarX + this.sizeBarWidth * currentAlphaPercentage;
        
        buffer.fill(100, 200, 255);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(alphaIndicatorX, this.alphaBarY + this.sizeBarHeight / 2, 20, 20);
        
        // Mostrar valor de transparencia en hover
        if (this.hoveredAlpha !== null) {
            buffer.fill(255, 255, 255, 230);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(14);
            buffer.text(this.hoveredAlpha, this.centerX, this.alphaBarY - 15);
        }
        
        // Dibujar barra de saturación
        const satBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Fondo de la barra de saturación
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(satBarX, this.saturationBarY, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Gradiente de saturación (de gris a color)
        const satColor = document.getElementById('c1') ? document.getElementById('c1').value : '#FFFFFF';
        const r = parseInt(satColor.substr(1, 2), 16);
        const g = parseInt(satColor.substr(3, 2), 16);
        const b = parseInt(satColor.substr(5, 2), 16);
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        for (let i = 0; i <= 20; i++) {
            const x = satBarX + (this.sizeBarWidth / 20) * i;
            const sat = i / 20;
            const newR = Math.round(gray + (r - gray) * sat);
            const newG = Math.round(gray + (g - gray) * sat);
            const newB = Math.round(gray + (b - gray) * sat);
            buffer.fill(newR, newG, newB);
            buffer.noStroke();
            buffer.rect(x, this.saturationBarY + 5, this.sizeBarWidth / 20, this.sizeBarHeight - 10);
        }
        
        // Indicador de saturación (siempre al 100% por defecto)
        const satIndicatorX = satBarX + this.sizeBarWidth;
        
        buffer.fill(100, 200, 255);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(satIndicatorX, this.saturationBarY + this.sizeBarHeight / 2, 20, 20);
        
        // Mostrar valor de saturación en hover
        if (this.hoveredSaturation !== null) {
            buffer.fill(255, 255, 255, 230);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(14);
            buffer.text(this.hoveredSaturation + '%', this.centerX, this.saturationBarY - 15);
        }
        
        // Dibujar barra de brillo
        const brightBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Fondo de la barra de brillo
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(brightBarX, this.brightnessBarY, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Gradiente de brillo (de negro a color a blanco)
        const brightColor = document.getElementById('c1') ? document.getElementById('c1').value : '#FFFFFF';
        const br = parseInt(brightColor.substr(1, 2), 16);
        const bg = parseInt(brightColor.substr(3, 2), 16);
        const bb = parseInt(brightColor.substr(5, 2), 16);
        
        for (let i = 0; i <= 20; i++) {
            const x = brightBarX + (this.sizeBarWidth / 20) * i;
            const brightness = (i / 20) * 200; // 0-200
            const factor = brightness / 100;
            
            let newR, newG, newB;
            if (factor < 1) {
                // Oscurecer
                newR = Math.round(br * factor);
                newG = Math.round(bg * factor);
                newB = Math.round(bb * factor);
            } else {
                // Aclarar
                const adjust = factor - 1;
                newR = Math.round(br + (255 - br) * adjust);
                newG = Math.round(bg + (255 - bg) * adjust);
                newB = Math.round(bb + (255 - bb) * adjust);
            }
            
            buffer.fill(newR, newG, newB);
            buffer.noStroke();
            buffer.rect(x, this.brightnessBarY + 5, this.sizeBarWidth / 20, this.sizeBarHeight - 10);
        }
        
        // Indicador de brillo (100 = neutro, en el medio)
        const brightIndicatorX = brightBarX + this.sizeBarWidth / 2;
        
        buffer.fill(100, 200, 255);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(brightIndicatorX, this.brightnessBarY + this.sizeBarHeight / 2, 20, 20);
        
        // Mostrar valor de brillo en hover
        if (this.hoveredBrightness !== null) {
            buffer.fill(255, 255, 255, 230);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(14);
            buffer.text(this.hoveredBrightness, this.centerX, this.brightnessBarY - 15);
        }
        
        // Texto de instrucción
        buffer.fill(255);
        buffer.noStroke();
        buffer.textAlign(CENTER, CENTER);
        buffer.textSize(12);
        buffer.text('Transparencia', this.centerX, this.alphaBarY - 20);
        buffer.text('Saturación', this.centerX, this.saturationBarY - 20);
        buffer.text('Brillo', this.centerX, this.brightnessBarY - 20);
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
