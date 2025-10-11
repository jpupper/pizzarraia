// ============================================================
// CURSOR GUI - SELECTOR DE COLOR RADIAL
// Se activa al mantener presionado el mouse/touch por 2+ segundos
// ============================================================

class CursorGUI {
    constructor() {
        this.isVisible = false;
        this.centerX = 0;
        this.centerY = 0;
        this.sizeBarWidth = 200; // Ancho de las barras
        this.sizeBarHeight = 30; // Alto de las barras
        this.hueBarY = 0; // Posición Y de la barra de tono (arriba)
        this.saturationBarY = 0; // Posición Y de la barra de saturación
        this.brightnessBarY = 0; // Posición Y de la barra de brillo
        this.alphaBarY = 0; // Posición Y de la barra de transparencia
        this.paletteY = 0; // Posición Y de los slots de paleta
        this.sizeBarY = 0; // Posición Y de la barra de tamaño (abajo)
        this.brushButtonsY = 0; // Posición Y de los botones de pincel
        
        // Timer para detectar doble click/touch
        this.lastClickTime = 0;
        this.doubleClickThreshold = 200; // ms para detectar doble click
        this.clickCount = 0;
        this.isPressing = false;
        
        // Posición inicial para detectar movimiento
        this.pressStartX = 0;
        this.pressStartY = 0;
        this.movementThreshold = 10; // Píxeles de tolerancia de movimiento
        
        // Variables para hover
        this.hoveredSize = null;
        this.hoveredAlpha = null;
        this.hoveredHue = null;
        this.hoveredSaturation = null;
        this.hoveredBrightness = null;
        this.hoveredPaletteSlot = null;
        this.hoveredBrushButton = null;
        
        // Sistema de paleta de colores - sincronizar con HTML
        this.colorPalette = this.loadPaletteFromHTML();
        this.activePaletteSlot = 0; // Índice del slot activo (0-4)
        this.paletteSlotSize = 35;
        this.paletteSlotSpacing = 10;
        
        // Configuración de tamaño
        this.minSize = 1;
        this.maxSize = 100;
        
        // Botones de pinceles
        this.brushButtons = [
            { id: 'classic', icon: '●', name: 'Classic' },
            { id: 'line', icon: '/', name: 'Line' },
            { id: 'art', icon: '✦', name: 'Art' },
            { id: 'pixel', icon: '▦', name: 'Pixel' },
            { id: 'text', icon: 'A', name: 'Text' },
            { id: 'geometry', icon: '▲', name: 'Geometry' },
            { id: 'fill', icon: '▨', name: 'Fill' }
        ];
        this.brushButtonSize = 40;
        this.brushButtonSpacing = 8;
    }
    
    /**
     * Cargar paleta de colores desde el HTML
     */
    loadPaletteFromHTML() {
        const paletteSlots = document.querySelectorAll('.palette-slot');
        const colors = [];
        
        paletteSlots.forEach(slot => {
            const bgColor = slot.style.backgroundColor;
            if (bgColor) {
                // Convertir rgb a hex
                const rgb = bgColor.match(/\d+/g);
                if (rgb) {
                    const hex = '#' + rgb.map(x => {
                        const h = parseInt(x).toString(16);
                        return h.length === 1 ? '0' + h : h;
                    }).join('');
                    colors.push(hex);
                }
            }
        });
        
        // Si no se encontraron colores, usar valores por defecto
        if (colors.length === 0) {
            return ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
        }
        
        return colors;
    }
    
    /**
     * Detectar doble click/touch
     */
    startLongPress(x, y) {
        if (this.isVisible) return; // Ya está visible
        
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - this.lastClickTime;
        
        if (timeSinceLastClick < this.doubleClickThreshold) {
            // Es un doble click!
            this.show(x, y);
            this.clickCount = 0;
            this.lastClickTime = 0;
        } else {
            // Primer click
            this.clickCount = 1;
            this.lastClickTime = currentTime;
            this.pressStartX = x;
            this.pressStartY = y;
        }
        
        this.isPressing = true;
        this.centerX = x;
        this.centerY = y;
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
        // No hay timer que cancelar en el sistema de doble click
    }
    
    /**
     * Mostrar el selector de color
     */
    show(x, y) {
        this.isVisible = true;
        this.centerX = x;
        this.centerY = y;
        
        // Calcular posiciones de las barras (de arriba hacia abajo)
        let currentY = y - 300; // Empezar más arriba para dar espacio a los botones de pincel
        
        this.hueBarY = currentY;
        currentY += 60;
        
        this.saturationBarY = currentY;
        currentY += 60;
        
        this.brightnessBarY = currentY;
        currentY += 60;
        
        this.alphaBarY = currentY;
        currentY += 70;
        
        // Slots de paleta en el centro
        this.paletteY = currentY;
        currentY += 80;
        
        // Barra de tamaño
        this.sizeBarY = currentY;
        currentY += 70;
        
        // Botones de pinceles abajo
        this.brushButtonsY = currentY;
        
        console.log('Cursor GUI mostrado en:', x, y);
    }
    
    /**
     * Ocultar el selector de color
     */
    hide() {
        this.isVisible = false;
        this.hoveredSize = null;
        this.hoveredAlpha = null;
        this.hoveredHue = null;
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
        const y = this.paletteY;
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
            }
            
            // Sincronizar con la paleta HTML
            const paletteSlots = document.querySelectorAll('.palette-slot');
            paletteSlots.forEach((slot, i) => {
                slot.classList.remove('active');
                slot.style.border = '2px solid rgba(255,255,255,0.3)';
            });
            
            if (paletteSlots[index]) {
                paletteSlots[index].classList.add('active');
                paletteSlots[index].style.border = '3px solid white';
            }
            
            console.log('Slot de paleta seleccionado:', index, '->', this.colorPalette[index]);
        }
    }
    
    /**
     * Actualizar el color del slot activo
     */
    updateActivePaletteSlot(color) {
        this.colorPalette[this.activePaletteSlot] = color;
        
        // Sincronizar con la paleta HTML
        const paletteSlots = document.querySelectorAll('.palette-slot');
        if (paletteSlots[this.activePaletteSlot]) {
            paletteSlots[this.activePaletteSlot].style.backgroundColor = color;
        }
        
        console.log('Slot', this.activePaletteSlot, 'actualizado a:', color);
    }
    
    /**
     * Obtener la posición de un botón de pincel
     */
    getBrushButtonPosition(index) {
        const totalButtons = this.brushButtons.length;
        const totalWidth = (this.brushButtonSize * totalButtons) + (this.brushButtonSpacing * (totalButtons - 1));
        const startX = this.centerX - totalWidth / 2;
        const x = startX + (index * (this.brushButtonSize + this.brushButtonSpacing));
        const y = this.brushButtonsY;
        
        return { x, y };
    }
    
    /**
     * Verificar si un punto está sobre un botón de pincel
     */
    getBrushButtonAt(x, y) {
        if (!this.isVisible) return null;
        
        for (let i = 0; i < this.brushButtons.length; i++) {
            const pos = this.getBrushButtonPosition(i);
            
            if (x >= pos.x && x <= pos.x + this.brushButtonSize &&
                y >= pos.y && y <= pos.y + this.brushButtonSize) {
                return i;
            }
        }
        
        return null;
    }
    
    /**
     * Seleccionar un pincel
     */
    selectBrush(index) {
        if (index >= 0 && index < this.brushButtons.length) {
            const brush = this.brushButtons[index];
            const brushTypeInput = document.getElementById('brushType');
            
            if (brushTypeInput) {
                brushTypeInput.value = brush.id;
                
                // Disparar evento change para actualizar la interfaz
                const event = new Event('change');
                brushTypeInput.dispatchEvent(event);
                
                // Sincronizar con los botones de la interfaz principal
                const brushBtns = document.querySelectorAll('.brush-btn');
                brushBtns.forEach(btn => btn.classList.remove('active'));
                
                const targetBtn = document.querySelector(`.brush-btn[data-brush="${brush.id}"]`);
                if (targetBtn) {
                    targetBtn.classList.add('active');
                }
                
                console.log('Pincel seleccionado:', brush.name);
            }
        }
    }
    
    /**
     * Verificar si un punto está dentro del selector
     */
    isPointInside(x, y) {
        if (!this.isVisible) return false;
        
        const barX = this.centerX - this.sizeBarWidth / 2;
        
        // Verificar todas las barras
        const bars = [
            { y: this.hueBarY },
            { y: this.saturationBarY },
            { y: this.brightnessBarY },
            { y: this.alphaBarY },
            { y: this.sizeBarY }
        ];
        
        for (const bar of bars) {
            if (x >= barX && x <= barX + this.sizeBarWidth &&
                y >= bar.y && y <= bar.y + this.sizeBarHeight) {
                return true;
            }
        }
        
        // Verificar slots de paleta
        if (this.getPaletteSlotAt(x, y) !== null) {
            return true;
        }
        
        // Verificar botones de pincel
        if (this.getBrushButtonAt(x, y) !== null) {
            return true;
        }
        
        return false;
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
     * Obtener el tono (Hue) en una posición específica de la barra
     */
    getHueAt(x, y) {
        if (!this.isVisible) return null;
        
        const hueBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Verificar si está en la barra de tono
        if (x >= hueBarX && x <= hueBarX + this.sizeBarWidth &&
            y >= this.hueBarY && y <= this.hueBarY + this.sizeBarHeight) {
            
            // Calcular el tono basado en la posición X (0-360)
            const relativeX = x - hueBarX;
            const percentage = relativeX / this.sizeBarWidth;
            return Math.round(percentage * 360);
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
            
            // Calcular el brillo basado en la posición X (0-100)
            const relativeX = x - brightBarX;
            const percentage = relativeX / this.sizeBarWidth;
            return Math.round(percentage * 100);
        }
        
        return null;
    }
    
    /**
     * Manejar click en el selector
     */
    handleClick(x, y) {
        if (!this.isVisible) return false;
        
        // Debug: log de la posición Y del click
        console.log('Click en Y:', y, 'Barras - Hue:', this.hueBarY, 'Sat:', this.saturationBarY, 'Bright:', this.brightnessBarY, 'Alpha:', this.alphaBarY, 'Size:', this.sizeBarY, 'Brushes:', this.brushButtonsY);
        
        // Verificar si hizo click en un botón de pincel (primero)
        const brushButton = this.getBrushButtonAt(x, y);
        if (brushButton !== null) {
            this.selectBrush(brushButton);
            return true;
        }
        
        // Verificar si hizo click en la barra de tono
        const hue = this.getHueAt(x, y);
        if (hue !== null) {
            this.applyHue(hue);
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
        
        // Verificar si hizo click en un slot de la paleta
        const paletteSlot = this.getPaletteSlotAt(x, y);
        if (paletteSlot !== null) {
            this.selectPaletteSlot(paletteSlot);
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
     * Convertir RGB a HSB
     */
    rgbToHsb(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        let h = 0;
        const s = max === 0 ? 0 : delta / max;
        const v = max;
        
        if (delta !== 0) {
            if (max === r) {
                h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
            } else if (max === g) {
                h = ((b - r) / delta + 2) / 6;
            } else {
                h = ((r - g) / delta + 4) / 6;
            }
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            b: Math.round(v * 100)
        };
    }
    
    /**
     * Convertir HSB a RGB
     */
    hsbToRgb(h, s, b) {
        h = h / 360;
        s = s / 100;
        b = b / 100;
        
        let r, g, bl;
        
        if (s === 0) {
            r = g = bl = b;
        } else {
            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p = b * (1 - s);
            const q = b * (1 - f * s);
            const t = b * (1 - (1 - f) * s);
            
            switch (i % 6) {
                case 0: r = b; g = t; bl = p; break;
                case 1: r = q; g = b; bl = p; break;
                case 2: r = p; g = b; bl = t; break;
                case 3: r = p; g = q; bl = b; break;
                case 4: r = t; g = p; bl = b; break;
                case 5: r = b; g = p; bl = q; break;
            }
        }
        
        // Clamp values to 0-255 range
        return {
            r: Math.max(0, Math.min(255, Math.round(r * 255))),
            g: Math.max(0, Math.min(255, Math.round(g * 255))),
            b: Math.max(0, Math.min(255, Math.round(bl * 255)))
        };
    }
    
    /**
     * Aplicar tono (Hue) al color actual
     */
    applyHue(hue) {
        const colorInput = document.getElementById('c1');
        if (!colorInput) return;
        
        const currentColor = colorInput.value;
        const r = parseInt(currentColor.substr(1, 2), 16);
        const g = parseInt(currentColor.substr(3, 2), 16);
        const b = parseInt(currentColor.substr(5, 2), 16);
        
        // Convertir a HSB
        const hsb = this.rgbToHsb(r, g, b);
        
        // Cambiar el tono
        hsb.h = hue;
        
        // Convertir de vuelta a RGB
        const rgb = this.hsbToRgb(hsb.h, hsb.s, hsb.b);
        
        const newColor = '#' + 
            rgb.r.toString(16).padStart(2, '0') + 
            rgb.g.toString(16).padStart(2, '0') + 
            rgb.b.toString(16).padStart(2, '0');
        
        colorInput.value = newColor;
        this.updateActivePaletteSlot(newColor);
        
        // Disparar evento para que general.js actualice la paleta HTML
        const event = new Event('input');
        colorInput.dispatchEvent(event);
        
        console.log('Tono aplicado:', hue, '° ->', newColor);
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
        
        // Convertir a HSB
        const hsb = this.rgbToHsb(r, g, b);
        console.log('HSB antes:', hsb);
        
        // Cambiar la saturación
        hsb.s = saturation;
        console.log('HSB después (saturación=' + saturation + '):', hsb);
        
        // Convertir de vuelta a RGB
        const rgb = this.hsbToRgb(hsb.h, hsb.s, hsb.b);
        console.log('RGB resultado:', rgb);
        
        const newColor = '#' + 
            rgb.r.toString(16).padStart(2, '0') + 
            rgb.g.toString(16).padStart(2, '0') + 
            rgb.b.toString(16).padStart(2, '0');
        
        colorInput.value = newColor;
        this.updateActivePaletteSlot(newColor);
        
        // Disparar evento para que general.js actualice la paleta HTML
        const event = new Event('input');
        colorInput.dispatchEvent(event);
        
        // Verificar el HSB del nuevo color
        const verifyHSB = this.rgbToHsb(rgb.r, rgb.g, rgb.b);
        console.log('Saturación aplicada:', saturation, '% -> Color:', newColor, '-> HSB verificado:', verifyHSB);
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
        
        // Convertir a HSB
        const hsb = this.rgbToHsb(r, g, b);
        
        // Cambiar el brillo
        hsb.b = brightness;
        
        // Convertir de vuelta a RGB
        const rgb = this.hsbToRgb(hsb.h, hsb.s, hsb.b);
        
        const newColor = '#' + 
            rgb.r.toString(16).padStart(2, '0') + 
            rgb.g.toString(16).padStart(2, '0') + 
            rgb.b.toString(16).padStart(2, '0');
        
        colorInput.value = newColor;
        this.updateActivePaletteSlot(newColor);
        
        // Disparar evento para que general.js actualice la paleta HTML
        const event = new Event('input');
        colorInput.dispatchEvent(event);
        
        console.log('Brillo aplicado:', brightness, '% ->', newColor);
    }
    
    /**
     * Actualizar hover
     */
    updateHover(x, y) {
        if (!this.isVisible) return;
        this.hoveredHue = this.getHueAt(x, y);
        this.hoveredSize = this.getSizeAt(x, y);
        this.hoveredAlpha = this.getAlphaAt(x, y);
        this.hoveredSaturation = this.getSaturationAt(x, y);
        this.hoveredBrightness = this.getBrightnessAt(x, y);
        this.hoveredPaletteSlot = this.getPaletteSlotAt(x, y);
        this.hoveredBrushButton = this.getBrushButtonAt(x, y);
    }
    
    /**
     * Dibujar el selector de color
     */
    display(buffer) {
        if (!this.isVisible) return;
        
        buffer.push();
        
        const barX = this.centerX - this.sizeBarWidth / 2;
        
        // Obtener el color actual
        const currentColor = document.getElementById('c1') ? document.getElementById('c1').value : '#FF0000';
        const r = parseInt(currentColor.substr(1, 2), 16);
        const g = parseInt(currentColor.substr(3, 2), 16);
        const b = parseInt(currentColor.substr(5, 2), 16);
        const currentHSB = this.rgbToHsb(r, g, b);
        
        // ===== BARRA DE TONO (HUE) =====
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(barX, this.hueBarY, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Gradiente de tono (arcoíris)
        for (let i = 0; i <= 100; i++) {
            const hue = (i / 100) * 360;
            const rgb = this.hsbToRgb(hue, 100, 100);
            buffer.fill(rgb.r, rgb.g, rgb.b);
            buffer.noStroke();
            buffer.rect(barX + (this.sizeBarWidth / 100) * i, this.hueBarY + 5, this.sizeBarWidth / 100 + 1, this.sizeBarHeight - 10);
        }
        
        // Indicador de tono actual
        const hueIndicatorX = barX + (currentHSB.h / 360) * this.sizeBarWidth;
        buffer.fill(100, 200, 255);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(hueIndicatorX, this.hueBarY + this.sizeBarHeight / 2, 20, 20);
        
        if (this.hoveredHue !== null) {
            buffer.fill(255, 255, 255, 230);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(14);
            buffer.text(this.hoveredHue + '°', this.centerX, this.hueBarY - 15);
        }
        
        // ===== BARRA DE SATURACIÓN =====
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(barX, this.saturationBarY, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Gradiente de saturación (gris a color)
        for (let i = 0; i <= 100; i++) {
            const sat = (i / 100) * 100;
            const rgb = this.hsbToRgb(currentHSB.h, sat, currentHSB.b);
            buffer.fill(rgb.r, rgb.g, rgb.b);
            buffer.noStroke();
            buffer.rect(barX + (this.sizeBarWidth / 100) * i, this.saturationBarY + 5, this.sizeBarWidth / 100 + 1, this.sizeBarHeight - 10);
        }
        
        // Indicador de saturación actual
        const satIndicatorX = barX + (currentHSB.s / 100) * this.sizeBarWidth;
        buffer.fill(100, 200, 255);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(satIndicatorX, this.saturationBarY + this.sizeBarHeight / 2, 20, 20);
        
        if (this.hoveredSaturation !== null) {
            buffer.fill(255, 255, 255, 230);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(14);
            buffer.text(this.hoveredSaturation + '%', this.centerX, this.saturationBarY - 15);
        }
        
        // ===== BARRA DE BRILLO =====
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(barX, this.brightnessBarY, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Gradiente de brillo (negro a color)
        for (let i = 0; i <= 100; i++) {
            const bright = (i / 100) * 100;
            const rgb = this.hsbToRgb(currentHSB.h, currentHSB.s, bright);
            buffer.fill(rgb.r, rgb.g, rgb.b);
            buffer.noStroke();
            buffer.rect(barX + (this.sizeBarWidth / 100) * i, this.brightnessBarY + 5, this.sizeBarWidth / 100 + 1, this.sizeBarHeight - 10);
        }
        
        // Indicador de brillo actual
        const brightIndicatorX = barX + (currentHSB.b / 100) * this.sizeBarWidth;
        buffer.fill(100, 200, 255);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(brightIndicatorX, this.brightnessBarY + this.sizeBarHeight / 2, 20, 20);
        
        if (this.hoveredBrightness !== null) {
            buffer.fill(255, 255, 255, 230);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(14);
            buffer.text(this.hoveredBrightness + '%', this.centerX, this.brightnessBarY - 15);
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
        
        // Texto de instrucción (ARRIBA de cada slider)
        buffer.fill(255);
        buffer.noStroke();
        buffer.textAlign(CENTER, CENTER);
        buffer.textSize(12);
        buffer.text('Tono', this.centerX, this.hueBarY - 10);
        buffer.text('Saturación', this.centerX, this.saturationBarY - 10);
        buffer.text('Brillo', this.centerX, this.brightnessBarY - 10);
        buffer.text('Transparencia', this.centerX, this.alphaBarY - 10);
        buffer.text('Paleta de Colores', this.centerX, this.paletteY - 25);
        buffer.text('Tamaño', this.centerX, this.sizeBarY - 10);
        buffer.text('Pinceles', this.centerX, this.brushButtonsY - 10);
        
        // Dibujar botones de pinceles
        const currentBrush = document.getElementById('brushType') ? document.getElementById('brushType').value : 'classic';
        
        for (let i = 0; i < this.brushButtons.length; i++) {
            const brush = this.brushButtons[i];
            const pos = this.getBrushButtonPosition(i);
            const isActive = brush.id === currentBrush;
            const isHovered = i === this.hoveredBrushButton;
            
            // Fondo del botón
            buffer.noStroke();
            if (isActive) {
                buffer.fill(138, 79, 191, 220); // Color activo (accent)
            } else if (isHovered) {
                buffer.fill(107, 61, 143, 200); // Color hover
            } else {
                buffer.fill(74, 43, 95, 180); // Color normal
            }
            buffer.rect(pos.x, pos.y, this.brushButtonSize, this.brushButtonSize, 8);
            
            // Borde del botón activo
            if (isActive) {
                buffer.stroke(255, 255, 255, 255);
                buffer.strokeWeight(3);
                buffer.noFill();
                buffer.rect(pos.x, pos.y, this.brushButtonSize, this.brushButtonSize, 8);
            }
            
            // Icono del pincel
            buffer.fill(255, 255, 255, 255);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(20);
            buffer.text(brush.icon, pos.x + this.brushButtonSize / 2, pos.y + this.brushButtonSize / 2);
            
            // Nombre del pincel en hover
            if (isHovered) {
                buffer.fill(255, 255, 255, 230);
                buffer.noStroke();
                buffer.textAlign(CENTER, CENTER);
                buffer.textSize(12);
                buffer.text(brush.name, pos.x + this.brushButtonSize / 2, pos.y + this.brushButtonSize + 15);
            }
        }
        
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
