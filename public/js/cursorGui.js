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
        this.sizeBarHeight = 25; // Alto de las barras (más compacto: 30 -> 25)
        this.barSpacing = 45; // Espaciado entre barras (más compacto: 60 -> 45)
        this.hueBarY = 0; // Posición Y de la barra de tono (arriba)
        this.saturationBarY = 0; // Posición Y de la barra de saturación
        this.brightnessBarY = 0; // Posición Y de la barra de brillo
        this.alphaBarY = 0; // Posición Y de la barra de transparencia
        this.paletteY = 0; // Posición Y de los slots de paleta
        this.sizeBarY = 0; // Posición Y de la barra de tamaño (abajo)
        this.kaleidoBarY = 0; // Posición Y de la barra de kaleidoscope
        this.brushButtonsY = 0; // Posición Y de los botones de pincel
        
        // Variables para hacer la GUI movible
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.closeButtonSize = 30;
        this.closeButtonX = 0;
        this.closeButtonY = 0;
        
        // Variables para el contenedor
        this.containerPadding = 20;
        this.containerX = 0;
        this.containerY = 0;
        this.containerWidth = 0;
        this.containerHeight = 0;
        
        // Variables para parámetros dinámicos del brush
        this.brushParams = {}; // Almacena valores de parámetros por brush
        this.currentBrushType = null;
        this.dynamicSlidersY = 0; // Posición Y donde empiezan los sliders dinámicos
        
        // Variables para desplegables (collapsibles)
        this.globalParamsCollapsed = false; // Parámetros globales abiertos por defecto
        this.brushParamsCollapsed = true; // Parámetros del brush cerrados por defecto
        this.globalParamsHeaderY = 0;
        this.brushParamsHeaderY = 0;
        this.collapsibleHeaderHeight = 30;
        
        // Timer para detectar doble click/touch
        this.lastClickTime = 0;
        this.lastClickX = 0;
        this.lastClickY = 0;
        this.doubleClickThreshold = 200; // ms para detectar doble click
        this.doubleClickDistanceThreshold = 10; // píxeles de tolerancia para considerar "mismo punto"
        this.clickCount = 0;
        this.isPressing = false;
        this.resetTimer = null; // Timer para resetear el contador
        
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
        this.hoveredKaleido = null;
        this.hoveredGlobalHeader = false;
        this.hoveredBrushHeader = false;
        
        // Sistema de paleta de colores - sincronizar con HTML
        this.colorPalette = this.loadPaletteFromHTML();
        this.activePaletteSlot = 0; // Índice del slot activo (0-4)
        this.paletteSlotSize = 35;
        this.paletteSlotSpacing = 10;
        
        // Configuración de tamaño
        this.minSize = 1;
        this.maxSize = 100;
        
        // Botones de pinceles - se cargarán dinámicamente del registry
        this.brushButtons = [];
        this.brushButtonSize = 35;
        this.brushButtonSpacing = 6;
        this.brushButtonCols = 2; // 2 columnas
        
        // Cargar brushes del registry
        this.loadBrushesFromRegistry();
    }
    
    /**
     * Cargar brushes desde el registry
     */
    loadBrushesFromRegistry() {
        if (!window.brushRegistry) return;
        
        this.brushButtons = [];
        const allBrushes = brushRegistry.getAll();
        
        for (const brush of allBrushes) {
            this.brushButtons.push({
                id: brush.getId(),
                name: brush.getName(),
                icon: brush.getIcon(),
                brush: brush
            });
        }
        
        // Agregar botón de background (bomba) al final
        this.brushButtons.push({
            id: 'background',
            name: 'Limpiar Canvas',
            icon: null,
            brush: null,
            isAction: true // Flag para indicar que es una acción, no un brush
        });
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
     * Detectar doble click/touch en el mismo punto
     */
    startLongPress(x, y) {
        if (this.isVisible) return; // Ya está visible
        
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - this.lastClickTime;
        
        // Calcular distancia desde el último click
        const dx = x - this.lastClickX;
        const dy = y - this.lastClickY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // SI HAY UN PRIMER CLICK PREVIO
        if (this.lastClickTime > 0) {
            // Verificar si es doble click válido: mismo tiempo Y mismo punto
            if (timeSinceLastClick < this.doubleClickThreshold && 
                distance < this.doubleClickDistanceThreshold) {
                // ✅ DOBLE CLICK VÁLIDO - Abrir GUI
                this.show(x, y);
            }
            
            // SIEMPRE resetear después del segundo touch (válido o no)
            this.lastClickTime = 0;
            this.lastClickX = 0;
            this.lastClickY = 0;
            this.clickCount = 0;
            
            // Cancelar timer
            if (this.resetTimer) {
                clearTimeout(this.resetTimer);
                this.resetTimer = null;
            }
        } else {
            // PRIMER CLICK - Guardar datos
            this.lastClickTime = currentTime;
            this.lastClickX = x;
            this.lastClickY = y;
            this.clickCount = 1;
            this.pressStartX = x;
            this.pressStartY = y;
            
            // Cancelar timer anterior si existe
            if (this.resetTimer) {
                clearTimeout(this.resetTimer);
            }
            
            // Timer para auto-reset si no hay segundo click
            this.resetTimer = setTimeout(() => {
                this.lastClickTime = 0;
                this.lastClickX = 0;
                this.lastClickY = 0;
                this.clickCount = 0;
            }, this.doubleClickThreshold);
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
        
        // Calcular posiciones de las barras (de arriba hacia abajo) - MÁS COMPACTO
        let currentY = y - 250; // Empezar más arriba (reducido de 300)
        
        // Header de parámetros globales
        this.globalParamsHeaderY = currentY;
        currentY += this.collapsibleHeaderHeight + 5;
        
        // Parámetros globales (solo si no está colapsado)
        if (!this.globalParamsCollapsed) {
            this.hueBarY = currentY;
            currentY += this.barSpacing;
            
            this.saturationBarY = currentY;
            currentY += this.barSpacing;
            
            this.brightnessBarY = currentY;
            currentY += this.barSpacing;
            
            this.alphaBarY = currentY;
            currentY += this.barSpacing + 10;
            
            // Slots de paleta en el centro
            this.paletteY = currentY;
            currentY += 60; // Reducido de 80
            
            // Barra de tamaño
            this.sizeBarY = currentY;
            currentY += this.barSpacing + 10;
            
            // Barra de kaleidoscope
            this.kaleidoBarY = currentY;
            currentY += this.barSpacing + 10;
        } else {
            // Si está colapsado, solo avanzar un poco para separar los headers
            currentY += 10;
        }
        
        // Obtener brush activo DIRECTAMENTE del HTML (fuente única de verdad)
        this.currentBrushType = document.getElementById('brushType') ? document.getElementById('brushType').value : 'classic';
        const activeBrush = window.brushRegistry ? brushRegistry.get(this.currentBrushType) : null;
        const brushControls = activeBrush ? activeBrush.getCursorGUIControls() : [];
        
        // Inicializar valores de parámetros si no existen
        if (!this.brushParams[this.currentBrushType]) {
            this.brushParams[this.currentBrushType] = {};
            brushControls.forEach(control => {
                this.brushParams[this.currentBrushType][control.id] = control.default;
            });
        }
        
        // Botones de pinceles a la IZQUIERDA (2 columnas) - POSICIÓN ORIGINAL
        const brushAreaWidth = (this.brushButtonSize * this.brushButtonCols) + (this.brushButtonSpacing * (this.brushButtonCols - 1));
        this.brushButtonsX = this.centerX - this.sizeBarWidth / 2 - brushAreaWidth - 20;
        this.brushButtonsY = this.globalParamsHeaderY; // Empezar desde el header
        
        // Header de parámetros del brush
        this.brushParamsHeaderY = currentY;
        currentY += this.collapsibleHeaderHeight + 5;
        
        // Sliders dinámicos del brush (solo si no está colapsado)
        if (!this.brushParamsCollapsed && brushControls.length > 0) {
            this.dynamicSlidersY = currentY;
            currentY += brushControls.length * this.barSpacing;
        }
        
        // Calcular dimensiones del contenedor PRIMERO (más ancho para incluir botones a la izquierda)
        const barX = this.centerX - this.sizeBarWidth / 2;
        this.containerX = this.brushButtonsX - this.containerPadding;
        this.containerY = y - 270 - this.containerPadding;
        this.containerWidth = (barX + this.sizeBarWidth) - this.brushButtonsX + this.containerPadding * 2;
        
        // Posición del botón de cierre (esquina superior derecha del CONTENEDOR)
        this.closeButtonX = this.containerX + this.containerWidth - this.closeButtonSize - 5;
        this.closeButtonY = this.containerY + 5;
        // Altura dinámica basada en cuántos controles hay (incluye parámetros y headers)
        let endY = currentY; // Usar currentY que ya incluye todo
        this.containerHeight = endY - this.closeButtonY + this.containerPadding * 3;
        
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
     * Obtener la posición de un botón de pincel (2 COLUMNAS A LA IZQUIERDA)
     */
    getBrushButtonPosition(index) {
        const col = index % this.brushButtonCols;
        const row = Math.floor(index / this.brushButtonCols);
        const x = this.brushButtonsX + (col * (this.brushButtonSize + this.brushButtonSpacing));
        const y = this.brushButtonsY + (row * (this.brushButtonSize + this.brushButtonSpacing));
        
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
     * Seleccionar un pincel o ejecutar acción
     */
    selectBrush(index) {
        if (index >= 0 && index < this.brushButtons.length) {
            const brush = this.brushButtons[index];
            
            // Si es una acción (como background/bomba)
            if (brush.isAction) {
                if (brush.id === 'background') {
                    // Ejecutar función de limpiar canvas
                    if (typeof cleanBackground === 'function') {
                        cleanBackground();
                    }
                    console.log('Canvas limpiado');
                }
                return;
            }
            
            // Si es un brush normal
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
     * Verificar si un punto está dentro de un elemento interactivo (para excluir del drag)
     */
    isPointInsideInteractiveElement(x, y) {
        const barX = this.centerX - this.sizeBarWidth / 2;
        
        // Verificar headers (NO deben ser arrastrables)
        if (this.isPointInGlobalParamsHeader(x, y) || this.isPointInBrushParamsHeader(x, y)) {
            return true;
        }
        
        // Verificar todas las barras
        const bars = [
            { y: this.hueBarY },
            { y: this.saturationBarY },
            { y: this.brightnessBarY },
            { y: this.alphaBarY },
            { y: this.sizeBarY },
            { y: this.kaleidoBarY }
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
        
        // Verificar sliders dinámicos
        const activeBrush = window.brushRegistry ? brushRegistry.get(this.currentBrushType) : null;
        const brushControls = activeBrush ? activeBrush.getCursorGUIControls() : [];
        let currentSliderY = this.dynamicSlidersY;
        for (const control of brushControls) {
            if (x >= barX && x <= barX + this.sizeBarWidth &&
                y >= currentSliderY && y <= currentSliderY + this.sizeBarHeight) {
                return true;
            }
            currentSliderY += this.barSpacing;
        }
        
        return false;
    }
    
    /**
     * Verificar si un punto está dentro del selector
     */
    isPointInside(x, y) {
        return this.isPointInContainer(x, y);
    }
    
    /**
     * Verificar si un punto está en el botón de cierre
     */
    isPointInCloseButton(x, y) {
        if (!this.isVisible) return false;
        return x >= this.closeButtonX && x <= this.closeButtonX + this.closeButtonSize &&
               y >= this.closeButtonY && y <= this.closeButtonY + this.closeButtonSize;
    }
    
    /**
     * Función de bounding box simple
     */
    isPointInRect(px, py, rectCenterX, rectCenterY, rectWidth, rectHeight) {
        const halfW = rectWidth / 2;
        const halfH = rectHeight / 2;
        return px >= rectCenterX - halfW && px <= rectCenterX + halfW &&
               py >= rectCenterY - halfH && py <= rectCenterY + halfH;
    }
    
    /**
     * Verificar si un punto está en el header de parámetros globales
     */
    isPointInGlobalParamsHeader(x, y) {
        if (!this.isVisible) return false;
        const barX = this.centerX - this.sizeBarWidth / 2;
        return x >= barX && x <= barX + this.sizeBarWidth &&
               y >= this.globalParamsHeaderY && y <= this.globalParamsHeaderY + this.collapsibleHeaderHeight;
    }
    
    /**
     * Verificar si un punto está en el header de parámetros del brush
     */
    isPointInBrushParamsHeader(x, y) {
        if (!this.isVisible) return false;
        const barX = this.centerX - this.sizeBarWidth / 2;
        return x >= barX && x <= barX + this.sizeBarWidth &&
               y >= this.brushParamsHeaderY && y <= this.brushParamsHeaderY + this.collapsibleHeaderHeight;
    }
    
    /**
     * Verificar si un punto está dentro del contenedor completo de la GUI
     */
    isPointInContainer(x, y) {
        if (!this.isVisible) return false;
        return x >= this.containerX && x <= this.containerX + this.containerWidth &&
               y >= this.containerY && y <= this.containerY + this.containerHeight;
    }
    
    /**
     * Verificar si un punto está en el área de arrastre (TODO EL CONTENEDOR)
     */
    isPointInDragArea(x, y) {
        if (!this.isVisible) return false;
        // El área de drag es TODO el contenedor, excepto botones interactivos
        return this.isPointInContainer(x, y) && 
               !this.isPointInCloseButton(x, y) &&
               !this.isPointInsideInteractiveElement(x, y);
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
     * Obtener el valor de kaleidoscope en una posición específica de la barra
     */
    getKaleidoAt(x, y) {
        if (!this.isVisible) return null;
        
        const kaleidoBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Verificar si está en la barra de kaleidoscope
        if (x >= kaleidoBarX && x <= kaleidoBarX + this.sizeBarWidth &&
            y >= this.kaleidoBarY && y <= this.kaleidoBarY + this.sizeBarHeight) {
            
            // Calcular el valor basado en la posición X (1 a 12)
            const relativeX = x - kaleidoBarX;
            const percentage = relativeX / this.sizeBarWidth;
            const kaleido = 1 + Math.floor(percentage * 11); // 1 a 12
            return Math.max(1, Math.min(12, kaleido));
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
     * Iniciar arrastre de la GUI
     */
    startDrag(x, y) {
        if (this.isPointInDragArea(x, y)) {
            this.isDragging = true;
            this.dragOffsetX = x - this.centerX;
            this.dragOffsetY = y - this.centerY;
            return true;
        }
        return false;
    }
    
    /**
     * Actualizar posición durante el arrastre
     */
    updateDrag(x, y) {
        if (this.isDragging) {
            const newCenterX = x - this.dragOffsetX;
            const newCenterY = y - this.dragOffsetY;
            
            // Actualizar todas las posiciones
            const deltaX = newCenterX - this.centerX;
            const deltaY = newCenterY - this.centerY;
            
            this.centerX = newCenterX;
            this.centerY = newCenterY;
            this.hueBarY += deltaY;
            this.saturationBarY += deltaY;
            this.brightnessBarY += deltaY;
            this.alphaBarY += deltaY;
            this.paletteY += deltaY;
            this.sizeBarY += deltaY;
            this.kaleidoBarY += deltaY;
            this.brushButtonsX += deltaX;
            this.brushButtonsY += deltaY;
            this.dynamicSlidersY += deltaY;
            this.closeButtonX += deltaX;
            this.closeButtonY += deltaY;
            this.containerX += deltaX;
            this.containerY += deltaY;
        }
    }
    
    /**
     * Terminar arrastre
     */
    endDrag() {
        this.isDragging = false;
    }
    
    /**
     * Manejar click en el selector
     */
    handleClick(x, y) {
        if (!this.isVisible) return false;
        
        console.log('handleClick llamado:', {x, y, visible: this.isVisible});
        
        // Verificar si hizo click en el botón de cierre
        if (this.isPointInCloseButton(x, y)) {
            this.hide();
            return true;
        }
        
        // Verificar si hizo click en el header de parámetros globales
        if (this.isPointInGlobalParamsHeader(x, y)) {
            console.log('Click en header de parámetros globales');
            this.globalParamsCollapsed = !this.globalParamsCollapsed;
            console.log('Estado globalParamsCollapsed:', this.globalParamsCollapsed);
            // Recalcular posiciones
            this.show(this.centerX, this.centerY);
            return true;
        }
        
        // Verificar si hizo click en el header de parámetros del brush
        if (this.isPointInBrushParamsHeader(x, y)) {
            console.log('Click en header de parámetros del brush');
            this.brushParamsCollapsed = !this.brushParamsCollapsed;
            console.log('Estado brushParamsCollapsed:', this.brushParamsCollapsed);
            // Recalcular posiciones
            this.show(this.centerX, this.centerY);
            return true;
        }
        
        // Verificar si hizo click en un botón de pincel (primero)
        const brushButton = this.getBrushButtonAt(x, y);
        if (brushButton !== null) {
            this.selectBrush(brushButton);
            return true;
        }
        
        // Verificar si hizo click en un slider dinámico
        if (this.handleDynamicSliderClick(x, y)) {
            return true;
        }
        
        // Verificar barras SOLO si los parámetros globales NO están colapsados
        if (!this.globalParamsCollapsed) {
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
            
            // Verificar si hizo click en la barra de kaleidoscope
            const kaleido = this.getKaleidoAt(x, y);
            if (kaleido !== null) {
                const kaleidoInput = document.getElementById('kaleidoSegments');
                if (kaleidoInput) {
                    kaleidoInput.value = kaleido;
                    const event = new Event('input');
                    kaleidoInput.dispatchEvent(event);
                    console.log('Kaleidoscope seleccionado:', kaleido);
                }
                return true;
            }
            
            // Verificar si hizo click en un slot de la paleta
            const paletteSlot = this.getPaletteSlotAt(x, y);
            if (paletteSlot !== null) {
                this.selectPaletteSlot(paletteSlot);
                return true;
            }
        } // Fin de if (!this.globalParamsCollapsed)
        
        // NO cerrar al hacer click afuera - solo con el botón X
        
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
        this.hoveredKaleido = this.getKaleidoAt(x, y);
        this.hoveredGlobalHeader = this.isPointInGlobalParamsHeader(x, y);
        this.hoveredBrushHeader = this.isPointInBrushParamsHeader(x, y);
    }
    
    /**
     * Verificar si un punto está en un slider dinámico y actualizar su valor
     */
    handleDynamicSliderClick(x, y) {
        const activeBrush = window.brushRegistry ? brushRegistry.get(this.currentBrushType) : null;
        const brushControls = activeBrush ? activeBrush.getCursorGUIControls() : [];
        
        if (brushControls.length === 0) return false;
        
        const barX = this.centerX - this.sizeBarWidth / 2;
        let currentSliderY = this.dynamicSlidersY;
        
        for (const control of brushControls) {
            if (x >= barX && x <= barX + this.sizeBarWidth &&
                y >= currentSliderY && y <= currentSliderY + this.sizeBarHeight) {
                
                // Calcular nuevo valor
                const percentage = (x - barX) / this.sizeBarWidth;
                const newValue = control.min + (control.max - control.min) * percentage;
                const steppedValue = Math.round(newValue / control.step) * control.step;
                const clampedValue = Math.max(control.min, Math.min(control.max, steppedValue));
                
                // Inicializar brushParams si no existe
                if (!this.brushParams[this.currentBrushType]) {
                    this.brushParams[this.currentBrushType] = {};
                }
                
                // Actualizar valor en brushParams
                this.brushParams[this.currentBrushType][control.id] = clampedValue;
                
                // Sincronizar con input HTML si existe Y disparar evento
                const htmlInput = document.getElementById(control.id);
                if (htmlInput) {
                    htmlInput.value = clampedValue;
                    
                    // DISPARAR EVENTO INPUT para que el brush detecte el cambio
                    const inputEvent = new Event('input', { bubbles: true });
                    htmlInput.dispatchEvent(inputEvent);
                    
                    // Actualizar el span de valor si existe
                    const valueSpan = document.getElementById(`${control.id}-value`);
                    if (valueSpan) {
                        valueSpan.textContent = clampedValue.toFixed(control.step < 1 ? 2 : 0);
                    }
                }
                
                console.log(`Parámetro ${control.id} actualizado a:`, clampedValue);
                
                return true;
            }
            currentSliderY += this.barSpacing;
        }
        
        return false;
    }
    
    /**
     * Dibujar un slider dinámico para parámetros del brush
     */
    drawDynamicSlider(buffer, control, y) {
        const barX = this.centerX - this.sizeBarWidth / 2;
        
        // Fondo de la barra
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(barX, y, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Obtener valor actual del HTML input (fuente única de verdad)
        const htmlInput = document.getElementById(control.id);
        let currentValue;
        
        if (htmlInput && htmlInput.value !== '') {
            // Usar valor del HTML input si existe
            currentValue = parseFloat(htmlInput.value);
        } else {
            // Fallback: usar brushParams o default
            if (!this.brushParams[this.currentBrushType]) {
                this.brushParams[this.currentBrushType] = {};
            }
            if (this.brushParams[this.currentBrushType][control.id] === undefined) {
                this.brushParams[this.currentBrushType][control.id] = control.default;
            }
            currentValue = this.brushParams[this.currentBrushType][control.id];
        }
        
        const percentage = (currentValue - control.min) / (control.max - control.min);
        
        // Barra de progreso
        buffer.fill(138, 79, 191, 180);
        buffer.rect(barX, y, this.sizeBarWidth * percentage, this.sizeBarHeight, 15);
        
        // Indicador
        const indicatorX = barX + this.sizeBarWidth * percentage;
        buffer.fill(100, 200, 255);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(indicatorX, y + this.sizeBarHeight / 2, 18, 18);
        
        // Label y valor
        buffer.fill(255, 255, 255, 230);
        buffer.noStroke();
        buffer.textAlign(LEFT, CENTER);
        buffer.textSize(11);
        buffer.text(control.label, barX + 5, y + this.sizeBarHeight / 2);
        
        buffer.textAlign(RIGHT, CENTER);
        buffer.text(currentValue.toFixed(control.step < 1 ? 2 : 0), barX + this.sizeBarWidth - 5, y + this.sizeBarHeight / 2);
    }
    
    /**
     * Dibujar el selector de color
     */
    display(buffer) {
        if (!this.isVisible) return;
        
        buffer.push();
        
        const barX = this.centerX - this.sizeBarWidth / 2;
        
        // ===== CONTENEDOR CON DISEÑO MEJORADO =====
        // Sombra exterior suave
        buffer.noStroke();
        buffer.fill(0, 0, 0, 80);
        buffer.rect(this.containerX + 4, this.containerY + 4, this.containerWidth, this.containerHeight, 12);
        
        // Fondo principal con gradiente
        for (let i = 0; i < this.containerHeight; i++) {
            const alpha = 220 + (i / this.containerHeight) * 30;
            buffer.fill(25, 25, 30, alpha);
            buffer.rect(this.containerX, this.containerY + i, this.containerWidth, 1);
        }
        
        // Borde brillante
        buffer.noFill();
        buffer.stroke(138, 79, 191, 100);
        buffer.strokeWeight(2);
        buffer.rect(this.containerX, this.containerY, this.containerWidth, this.containerHeight, 12);
        
        // Borde interior sutil
        buffer.stroke(60, 60, 70, 150);
        buffer.strokeWeight(1);
        buffer.rect(this.containerX + 2, this.containerY + 2, this.containerWidth - 4, this.containerHeight - 4, 10);
        
        // ===== BOTÓN DE CIERRE (X) =====
        buffer.fill(200, 50, 50, 220);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.rect(this.closeButtonX, this.closeButtonY, this.closeButtonSize, this.closeButtonSize, 5);
        
        // Dibujar X
        buffer.stroke(255, 255, 255, 255);
        buffer.strokeWeight(3);
        const margin = 8;
        buffer.line(
            this.closeButtonX + margin, 
            this.closeButtonY + margin,
            this.closeButtonX + this.closeButtonSize - margin,
            this.closeButtonY + this.closeButtonSize - margin
        );
        buffer.line(
            this.closeButtonX + this.closeButtonSize - margin,
            this.closeButtonY + margin,
            this.closeButtonX + margin,
            this.closeButtonY + this.closeButtonSize - margin
        );
        
        // ===== HEADER DE PARÁMETROS GLOBALES (REDISEÑADO COMPACTO) =====
        const globalHeaderCenterY = this.globalParamsHeaderY + this.collapsibleHeaderHeight / 2;
        
        // Fondo sólido oscuro (usando CENTER) - más claro si está en hover
        buffer.rectMode(CORNER);
        buffer.noStroke();
        if (this.hoveredGlobalHeader) {
            buffer.fill(60, 60, 65, 240); // Más claro en hover
        } else {
            buffer.fill(40, 40, 45, 230);
        }
        buffer.rect(barX, this.globalParamsHeaderY, this.sizeBarWidth, this.collapsibleHeaderHeight, 6);
        
        // Borde izquierdo de color (indicador visual) - más brillante en hover
        if (this.hoveredGlobalHeader) {
            buffer.fill(158, 99, 211, 255); // Más brillante en hover
        } else {
            buffer.fill(138, 79, 191, 255);
        }
        buffer.rect(barX, this.globalParamsHeaderY, 3, this.collapsibleHeaderHeight, 6, 0, 0, 6);
        
        // Texto simple sin sombra
        buffer.fill(255, 255, 255, 255);
        buffer.textAlign(LEFT, CENTER);
        buffer.textSize(11);
        buffer.textStyle(NORMAL);
        buffer.text('Parámetros Globales', barX + 10, globalHeaderCenterY);
        
        // Flecha simple a la derecha
        buffer.textAlign(RIGHT, CENTER);
        buffer.textSize(12);
        buffer.text(this.globalParamsCollapsed ? '▶' : '▼', barX + this.sizeBarWidth - 8, globalHeaderCenterY);
        
        // Obtener el color actual
        const currentColor = document.getElementById('c1') ? document.getElementById('c1').value : '#FF0000';
        const r = parseInt(currentColor.substr(1, 2), 16);
        const g = parseInt(currentColor.substr(3, 2), 16);
        const b = parseInt(currentColor.substr(5, 2), 16);
        const currentHSB = this.rgbToHsb(r, g, b);
        
        // ===== PARÁMETROS GLOBALES (solo si no está colapsado) =====
        if (!this.globalParamsCollapsed) {
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
        
        // ===== BARRA DE KALEIDOSCOPE =====
        const kaleidoBarX = this.centerX - this.sizeBarWidth / 2;
        
        // Fondo de la barra
        buffer.noStroke();
        buffer.fill(50, 50, 50, 200);
        buffer.rect(kaleidoBarX, this.kaleidoBarY, this.sizeBarWidth, this.sizeBarHeight, 15);
        
        // Valores de kaleidoscope (1 a 12)
        const minKaleido = 1;
        const maxKaleido = 12;
        
        // Gradiente visual (líneas radiales) - AJUSTADO para no sobrepasar
        for (let i = 0; i <= 11; i++) {
            const x = kaleidoBarX + (this.sizeBarWidth / 12) * (i + 0.5); // Centrar en cada sección
            const segments = minKaleido + i;
            buffer.fill(150, 150, 150, 150);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(9); // Más pequeño
            buffer.text(segments, x, this.kaleidoBarY + this.sizeBarHeight / 2);
        }
        
        // Indicador del kaleidoscope actual
        const currentKaleido = parseInt(document.getElementById('kaleidoSegments') ? document.getElementById('kaleidoSegments').value : 1);
        const currentKaleidoPercentage = (currentKaleido - minKaleido) / (maxKaleido - minKaleido);
        const kaleidoIndicatorX = kaleidoBarX + this.sizeBarWidth * currentKaleidoPercentage;
        
        buffer.fill(138, 79, 191);
        buffer.stroke(255, 255, 255, 200);
        buffer.strokeWeight(2);
        buffer.ellipse(kaleidoIndicatorX, this.kaleidoBarY + this.sizeBarHeight / 2, 20, 20);
        
        // Mostrar valor del kaleidoscope en hover
        if (this.hoveredKaleido !== null) {
            buffer.fill(255, 255, 255, 230);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(14);
            buffer.text(this.hoveredKaleido + ' segmentos', this.centerX, this.kaleidoBarY - 15);
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
        buffer.text('Kaleidoscope', this.centerX, this.kaleidoBarY - 10);
        
        } // Fin de if (!this.globalParamsCollapsed)
        
        // ===== HEADER DE PARÁMETROS DEL BRUSH (REDISEÑADO COMPACTO) =====
        const brushHeaderCenterY = this.brushParamsHeaderY + this.collapsibleHeaderHeight / 2;
        
        // Fondo sólido oscuro - más claro si está en hover
        buffer.rectMode(CORNER);
        buffer.noStroke();
        if (this.hoveredBrushHeader) {
            buffer.fill(60, 60, 65, 240); // Más claro en hover
        } else {
            buffer.fill(40, 40, 45, 230);
        }
        buffer.rect(barX, this.brushParamsHeaderY, this.sizeBarWidth, this.collapsibleHeaderHeight, 6);
        
        // Borde izquierdo de color azul (indicador visual) - más brillante en hover
        if (this.hoveredBrushHeader) {
            buffer.fill(99, 158, 211, 255); // Más brillante en hover
        } else {
            buffer.fill(79, 138, 191, 255);
        }
        buffer.rect(barX, this.brushParamsHeaderY, 3, this.collapsibleHeaderHeight, 6, 0, 0, 6);
        
        // Texto simple sin sombra
        buffer.fill(255, 255, 255, 255);
        buffer.textAlign(LEFT, CENTER);
        buffer.textSize(11);
        buffer.textStyle(NORMAL);
        buffer.text('Parámetros del Brush', barX + 10, brushHeaderCenterY);
        
        // Flecha simple a la derecha
        buffer.textAlign(RIGHT, CENTER);
        buffer.textSize(12);
        buffer.text(this.brushParamsCollapsed ? '▶' : '▼', barX + this.sizeBarWidth - 8, brushHeaderCenterY);
        
        // ===== SLIDERS DINÁMICOS DEL BRUSH (solo si no está colapsado) =====
        // OBTENER BRUSH ACTIVO DEL HTML (fuente única de verdad) y actualizar this.currentBrushType
        this.currentBrushType = document.getElementById('brushType') ? document.getElementById('brushType').value : 'classic';
        const activeBrush = window.brushRegistry ? brushRegistry.get(this.currentBrushType) : null;
        const brushControls = activeBrush ? activeBrush.getCursorGUIControls() : [];
        
        if (!this.brushParamsCollapsed && brushControls.length > 0) {
            let currentSliderY = this.dynamicSlidersY;
            brushControls.forEach(control => {
                this.drawDynamicSlider(buffer, control, currentSliderY);
                currentSliderY += this.barSpacing;
            });
        }
        
        // Título de pinceles a la izquierda
        buffer.textAlign(LEFT, CENTER);
        buffer.text('Pinceles', this.brushButtonsX, this.brushButtonsY - 15);
        
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
            
            // Icono del pincel - dibujar iconos que coincidan con la GUI HTML
            const centerX = pos.x + this.brushButtonSize / 2;
            const centerY = pos.y + this.brushButtonSize / 2;
            const iconSize = this.brushButtonSize * 0.55;
            
            buffer.fill(255, 255, 255, 255);
            buffer.stroke(255, 255, 255, 255);
            buffer.strokeWeight(2);
            
            // Dibujar icono según el tipo de brush
            this.drawBrushIcon(buffer, brush.id, centerX, centerY, iconSize);
            
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
    
    /**
     * Dibujar icono de brush (coincide con iconos HTML SVG)
     */
    drawBrushIcon(buffer, brushId, x, y, size) {
        buffer.push();
        buffer.translate(x, y);
        
        switch(brushId) {
            case 'classic':
                // Círculo simple
                buffer.noStroke();
                buffer.ellipse(0, 0, size * 0.7, size * 0.7);
                break;
                
            case 'line':
                // Línea diagonal
                buffer.strokeWeight(3);
                buffer.line(-size * 0.4, size * 0.4, size * 0.4, -size * 0.4);
                break;
                
            case 'art':
                // 5 círculos (patrón de dados)
                buffer.noStroke();
                buffer.ellipse(0, 0, size * 0.2, size * 0.2); // Centro
                buffer.ellipse(-size * 0.3, -size * 0.3, size * 0.15, size * 0.15);
                buffer.ellipse(size * 0.3, -size * 0.3, size * 0.15, size * 0.15);
                buffer.ellipse(-size * 0.3, size * 0.3, size * 0.15, size * 0.15);
                buffer.ellipse(size * 0.3, size * 0.3, size * 0.15, size * 0.15);
                break;
                
            case 'pixel':
                // 4 cuadrados
                buffer.noStroke();
                const pixelSize = size * 0.25;
                const offset = size * 0.2;
                buffer.rect(-offset - pixelSize/2, -offset - pixelSize/2, pixelSize, pixelSize);
                buffer.rect(offset - pixelSize/2, -offset - pixelSize/2, pixelSize, pixelSize);
                buffer.rect(-offset - pixelSize/2, offset - pixelSize/2, pixelSize, pixelSize);
                buffer.rect(offset - pixelSize/2, offset - pixelSize/2, pixelSize, pixelSize);
                break;
                
            case 'text':
                // Letra A
                buffer.noStroke();
                buffer.textAlign(CENTER, CENTER);
                buffer.textSize(size * 0.8);
                buffer.textStyle(BOLD);
                buffer.text('A', 0, 0);
                break;
                
            case 'geometry':
                // Triángulo
                buffer.noStroke();
                buffer.triangle(0, -size * 0.4, size * 0.4, size * 0.4, -size * 0.4, size * 0.4);
                break;
                
            case 'fill':
                // Balde de pintura (igual al HTML SVG)
                buffer.noStroke();
                // Gota de agua (arriba derecha)
                buffer.ellipse(size * 0.35, -size * 0.15, size * 0.15, size * 0.2);
                // Balde principal (trapecio + triángulos)
                buffer.beginShape();
                buffer.vertex(-size * 0.35, -size * 0.05);
                buffer.vertex(size * 0.15, -size * 0.05);
                buffer.vertex(size * 0.25, size * 0.35);
                buffer.vertex(-size * 0.45, size * 0.35);
                buffer.endShape(CLOSE);
                // Asa del balde (arco)
                buffer.noFill();
                buffer.strokeWeight(2);
                buffer.stroke(255, 255, 255, 255);
                buffer.arc(-size * 0.1, -size * 0.2, size * 0.4, size * 0.3, PI + 0.5, TWO_PI - 0.5);
                break;
                
            case 'image':
                // Icono de imagen (rectángulo con montaña)
                buffer.strokeWeight(2);
                buffer.noFill();
                buffer.rect(-size * 0.35, -size * 0.35, size * 0.7, size * 0.7);
                buffer.noStroke();
                buffer.fill(255, 255, 255, 255);
                buffer.triangle(-size * 0.25, size * 0.25, 0, 0, size * 0.25, size * 0.25);
                buffer.ellipse(-size * 0.15, -size * 0.15, size * 0.15, size * 0.15);
                break;
                
            case 'flower':
                // Flor (círculo central + pétalos)
                buffer.noStroke();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i;
                    const px = Math.cos(angle) * size * 0.25;
                    const py = Math.sin(angle) * size * 0.25;
                    buffer.ellipse(px, py, size * 0.25, size * 0.25);
                }
                buffer.ellipse(0, 0, size * 0.3, size * 0.3);
                break;
                
            case 'background':
                // Bomba
                buffer.noStroke();
                buffer.ellipse(0, size * 0.1, size * 0.6, size * 0.55); // Cuerpo
                buffer.rect(-size * 0.05, -size * 0.3, size * 0.1, size * 0.25); // Mecha
                buffer.ellipse(0, -size * 0.35, size * 0.15, size * 0.15); // Chispa
                break;
                
            default:
                // Fallback: círculo
                buffer.noStroke();
                buffer.ellipse(0, 0, size * 0.5, size * 0.5);
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
