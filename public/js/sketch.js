// ============================================================
// VARIABLES GLOBALES
// ============================================================

// Variables de sesión
var socket;
var sessionId;
var sessionIndicator;
var analyticsTracker; // Tracker de analytics

// Variables de color y tamaño
var col1;
var col2;
var alphaVal; // Valor para el alpha del relleno
var size; // Valor para el tamaño del pincel
// Variables de estado
var isOverOpenButton = false;
var isBorder = true;
var isRandomValues = true;
var isOverGui = false;
var mouseFlag = true;
var fillExecuted = false; // Flag para controlar que el fill solo se ejecute una vez por click
var isMousePressed = false; // Flag para controlar si el mouse est  presionado

// Variables para el punto central del caleidoscopio
var kaleidoCenterX = null;
var kaleidoCenterY = null;
// Sistema de cursores remotos (compatible con TouchDesigner)
var PS; // Instancia de CursorServer (PointServer) para gestionar cursores de otros clientes

// Variables de canvas
var mainCanvas; // Canvas principal
var drawBuffer; // Buffer para dibujar los pinceles (DEPRECATED - usar layers)
var guiBuffer;  // Buffer para dibujar la grilla

// Sistema de capas dinámicas
var layers = []; // Array dinámico de buffers de capas
var activeLayer = 0; // Índice de la capa activa
var layerVisibility = []; // Visibilidad de cada capa
var MAX_LAYERS = 20; // Límite máximo de capas (seguridad de memoria)

// Sistema de zoom (solo local, no se replica por socket)
var zoomLevel = 1.0; // Nivel de zoom actual (1.0 = 100%)
var zoomMin = 0.25; // Zoom mínimo (25%)
var zoomMax = 4.0; // Zoom máximo (400%)
var zoomStep = 0.1; // Incremento/decremento de zoom
var panX = 0; // Desplazamiento horizontal
var panY = 0; // Desplazamiento vertical

// Variables para scrollbars
var isDraggingScrollbar = false;
var draggingScrollbarType = null; // 'horizontal' o 'vertical'
var scrollbarBounds = {
    horizontal: { x: 0, y: 0, width: 0, height: 0, handleX: 0, handleWidth: 0 },
    vertical: { x: 0, y: 0, width: 0, height: 0, handleY: 0, handleHeight: 0 }
};

/**
 * Convertir coordenadas de pantalla a coordenadas del canvas con zoom
 */
function screenToCanvas(screenX, screenY) {
    return {
        x: (screenX - panX) / zoomLevel,
        y: (screenY - panY) / zoomLevel
    };
}

/**
 * Convertir coordenadas del canvas a coordenadas de pantalla con zoom
 */
function canvasToScreen(canvasX, canvasY) {
    return {
        x: canvasX * zoomLevel + panX,
        y: canvasY * zoomLevel + panY
    };
}

// Función helper para obtener la capa activa
function getActiveLayer() {
    return layers[activeLayer];
}

// Función para combinar todas las capas visibles en un solo canvas
function renderAllLayers() {
    // Crear un canvas temporal del mismo tamaño
    const combined = createGraphics(windowWidth, windowHeight);
    
    // Dibujar cada capa visible en orden
    for (let i = 0; i < layers.length; i++) {
        if (layerVisibility[i] && layers[i]) {
            combined.image(layers[i], 0, 0);
        }
    }
    
    return combined;
}

// Función para toggle de visibilidad de capa
function toggleLayerVisibility(layerIndex) {
    if (layerIndex >= 0 && layerIndex < layers.length) {
        layerVisibility[layerIndex] = !layerVisibility[layerIndex];
        
        // Actualizar el botón visual si existe
        const layerBtn = document.querySelector(`[data-layer="${layerIndex}"]`);
        if (layerBtn) {
            if (layerVisibility[layerIndex]) {
                layerBtn.classList.add('active');
            } else {
                layerBtn.classList.remove('active');
            }
        }
        
        // Actualizar previews
        updateLayerPreviews();
        
        console.log(`Capa ${layerIndex} ${layerVisibility[layerIndex] ? 'visible' : 'oculta'}`);
    }
}

// Agregar nueva capa
function addLayer() {
    if (layers.length >= MAX_LAYERS) {
        if (typeof toast !== 'undefined') toast.warning(`Máximo de ${MAX_LAYERS} capas alcanzado`);
        return;
    }
    
    const newLayer = createGraphics(windowWidth, windowHeight);
    newLayer.clear();
    layers.push(newLayer);
    layerVisibility.push(true);
    
    // Emitir evento por socket
    if (socket && socket.connected) {
        socket.emit('layer_added', {
            sessionId: sessionId,
            layerIndex: layers.length - 1
        });
    }
    
    // Actualizar UI
    updateLayerUI();
    
    console.log(`Capa ${layers.length - 1} agregada. Total: ${layers.length}`);
}

// Eliminar capa
function deleteLayer(layerIndex) {
    if (layers.length <= 1) {
        if (typeof toast !== 'undefined') toast.warning('Debe haber al menos una capa');
        return;
    }
    
    if (layerIndex < 0 || layerIndex >= layers.length) {
        return;
    }
    
    // Eliminar la capa
    layers.splice(layerIndex, 1);
    layerVisibility.splice(layerIndex, 1);
    
    // Ajustar activeLayer si es necesario
    if (activeLayer >= layers.length) {
        activeLayer = layers.length - 1;
    }
    
    // Emitir evento por socket
    if (socket && socket.connected) {
        socket.emit('layer_deleted', {
            sessionId: sessionId,
            layerIndex: layerIndex
        });
    }
    
    // Actualizar UI
    updateLayerUI();
    
    console.log(`Capa ${layerIndex} eliminada. Total: ${layers.length}`);
}

// Actualizar UI de capas
function updateLayerUI() {
    // Esta función se implementará en general.js
    if (typeof window.renderLayerButtons === 'function') {
        window.renderLayerButtons();
    }
}

// Variables del sistema de grilla para pixel brush
var gridSize = 1024; // Tamaño de la grilla (1024x1024)
var gridCols = 32;   // Número predeterminado de columnas
var gridRows = 32;   // Número predeterminado de filas
var cellWidth, cellHeight; // Se calculará en base a gridSize y cols/rows
var showGrid = false; // Flag para mostrar/ocultar la grilla

// Variables del art brush
var particleCount = 10; // Número predeterminado de partículas por emisión

// Sistemas
var ps; // Sistema de palabras
var pmouseXGlobal = 0; // Posición anterior del mouse en X
var pmouseYGlobal = 0; // Posición anterior del mouse en Y

// Datos para enviar por socket
var data = {
    x: 0,
    y: 0,
    c1: null,
    c2: null,
    session: '0' // Sesión predeterminada
};

// ============================================================
// FUNCIONES DE INICIALIZACIÓN Y CONFIGURACIÓN
// ============================================================

function setup() {
    // Crear canvas principal
    mainCanvas = createCanvas(windowWidth, windowHeight);
    mainCanvas.position(0, 0);
    mainCanvas.style('z-index', '1');
    
    // Crear buffers para dibujo y GUI
    drawBuffer = createGraphics(windowWidth, windowHeight);
    guiBuffer = createGraphics(windowWidth, windowHeight);
    
    // Crear 1 capa inicial por defecto
    const initialLayer = createGraphics(windowWidth, windowHeight);
    initialLayer.background(0); // Fondo negro
    layers.push(initialLayer);
    layerVisibility.push(true);
    
    // Obtener ID de sesión desde URL
    sessionId = config.getSessionId();
    
    // Configurar socket
    const socketConfig = config.getSocketConfig();
    socket = io(socketConfig.url, socketConfig.options);
    
    // Unirse a la sesión
    socket.on('connect', function() {
        socket.emit('join_session', sessionId);
        console.log('Joined session:', sessionId);
    });
    
    // Configurar evento para recibir datos de dibujo (incluye mouse, touch y LIDAR)
    socket.on("mouse", newDrawing);
    
    // Configurar evento para recibir posiciones de cursor de otros clientes
    socket.on("cursor", updateRemoteCursor);
    
    // Configurar evento para recibir sincronización de flowfield
    socket.on("flowfield_sync", receiveFlowfieldSync);
    
    // Configurar evento para recibir cambios de configuración del flowfield
    socket.on("flowfield_config", receiveFlowfieldConfig);
    
    // Configurar eventos para sincronización de capas
    socket.on("layer_added", receiveLayerAdded);
    socket.on("layer_deleted", receiveLayerDeleted);
    
    // Configurar evento para sincronización de imagen del brush
    socket.on("image_brush_sync", receiveImageBrushSync);
    
    // Inicializar valores
    asignarValores();
    drawBuffer.background(0);
    
    // Inicializar dimensiones de la grilla
    updateGridDimensions();
    
    // Actualizar buffer de la grilla inicialmente
    updateGridBuffer();
    
    // Inicializar sistemas
    ps = new PalabraSystem();
    PS = new CursorServer(); // Inicializar el servidor de cursores (PointServer)
    window.PS = PS; // Hacer PS accesible globalmente para TouchDesigner
    window.renderAllLayers = renderAllLayers; // Exponer función para combinar capas
    window.drawBuffer = drawBuffer; // Mantener compatibilidad (deprecated)
    textAlign(CENTER, CENTER);
    textSize(80);
    
    // Configurar eventos de botones
    setupButtonEvents();
    
    // Configurar controles de sockets
    setupSocketControls();
    
    // Inicializar analytics tracker
    if (typeof AnalyticsTracker !== 'undefined') {
        const currentUser = config.getCurrentUser();
        analyticsTracker = new AnalyticsTracker(
            socket,
            sessionId,
            currentUser ? currentUser.id : null,
            currentUser ? currentUser.username : 'Anónimo'
        );
        console.log('Analytics tracker initialized');
    }
}

function windowResized() {
    // Guardar el contenido del buffer de dibujo actual
    let tempBuffer = createGraphics(drawBuffer.width, drawBuffer.height);
    tempBuffer.image(drawBuffer, 0, 0);
    
    // Redimensionar canvas principal
    resizeCanvas(windowWidth, windowHeight);
    
    // Crear nuevos buffers con las dimensiones actualizadas
    let newDrawBuffer = createGraphics(windowWidth, windowHeight);
    let newGuiBuffer = createGraphics(windowWidth, windowHeight);
    
    // Copiar el contenido anterior al nuevo buffer de dibujo
    // Usar scale para ajustar proporcionalmente si es necesario
    const scaleX = windowWidth / tempBuffer.width;
    const scaleY = windowHeight / tempBuffer.height;
    
    newDrawBuffer.push();
    newDrawBuffer.background(0); // Fondo negro
    newDrawBuffer.image(tempBuffer, 0, 0, windowWidth, windowHeight);
    newDrawBuffer.pop();
    
    // Actualizar las referencias a los buffers
    drawBuffer = newDrawBuffer;
    guiBuffer = newGuiBuffer;
    
    // Limpiar el buffer temporal
    tempBuffer.remove();
    
    // Actualizar dimensiones de la grilla y redibujar
    updateGridDimensions();
    updateGridBuffer();
    
    console.log('Canvas redimensionado a:', windowWidth, 'x', windowHeight);
}

// Función para inicializar valores aleatorios
function asignarValores() {
    col1 = color(random(255));
    col2 = color(random(255));
    alphaVal = random(255);
    aplhaBorder = random(255);
    borderSize = random(1, 10);
    size = random(10, 30);
    texto1 = random(3, 10);
}

// Función para actualizar dimensiones de la grilla
function updateGridDimensions() {
    cellWidth = gridSize / gridCols;
    cellHeight = gridSize / gridRows;
    console.log(`Grid updated: ${gridCols}x${gridRows}, cell size: ${cellWidth}x${cellHeight}`);
}

// Función para actualizar el buffer de la grilla
function updateGridBuffer() {
    // Dibujar la grilla si está activada
    if (document.getElementById('showGrid').checked) {
        // Dibujar la grilla
        guiBuffer.stroke(100, 100, 100, 255); // Gris semitransparente
        guiBuffer.strokeWeight(5);
        guiBuffer.noFill();
        
        // Calcular tamaño de celda en coordenadas del canvas
        const canvasGridCellWidth = windowWidth / gridCols;
        const canvasGridCellHeight = windowHeight / gridRows;
        
        // Dibujar líneas verticales
        for (let i = 0; i <= gridCols; i++) {
            const x = i * canvasGridCellWidth;
            guiBuffer.line(x, 0, x, windowHeight);
        }
        
        // Dibujar líneas horizontales
        for (let j = 0; j <= gridRows; j++) {
            const y = j * canvasGridCellHeight;
            guiBuffer.line(0, y, windowWidth, y);
        }
    }
}

// Función para dibujar preview de la línea mientras se arrastra (Line Brush)
function drawLinePreview(buffer) {
    // Usar guiBuffer por defecto si no se especifica
    const targetBuffer = buffer || guiBuffer;
    
    const brushType = document.getElementById('brushType').value;
    
    // Solo dibujar preview si es Line Brush y estamos arrastrando
    if (brushType === 'line' && isMousePressed && !isOverGui && !isOverOpenButton && lineStartX !== null) {
        // Configurar estilo de la línea preview
        const brushSize = parseInt(document.getElementById('size').value);
        const colorValue = document.getElementById('c1').value;
        const alphaValue = parseInt(document.getElementById('alphaValue').value);
        
        const col = color(colorValue);
        col.setAlpha(Math.min(alphaValue, 150)); // Más transparente para el preview
        
        // Dibujar en el buffer especificado
        targetBuffer.push(); // Guardar estado
        targetBuffer.stroke(col);
        targetBuffer.strokeWeight(brushSize);
        targetBuffer.strokeCap(ROUND);
        
        // Dibujar línea desde el punto inicial hasta la posición actual del mouse
        targetBuffer.line(lineStartX, lineStartY, mouseX, mouseY);
        
        // Dibujar círculos en los extremos para mejor visualización
        targetBuffer.noStroke();
        targetBuffer.fill(col);
        targetBuffer.ellipse(lineStartX, lineStartY, brushSize * 0.5, brushSize * 0.5); // Punto inicial
        targetBuffer.ellipse(mouseX, mouseY, brushSize * 0.5, brushSize * 0.5); // Punto actual
        targetBuffer.pop(); // Restaurar estado
    }
}

// Función para dibujar un puntero circular que muestra el tamaño del pincel actual
function drawBrushCursor(buffer) {
    // Usar guiBuffer por defecto si no se especifica
    const targetBuffer = buffer || guiBuffer;
    
    // Obtener el tamaño del pincel desde el slider
    const brushSize = parseInt(document.getElementById('size').value);
    
    // No dibujar el cursor si el mouse está sobre la GUI o si el mouse no está en el canvas
    if (isOverGui || isOverOpenButton || mouseX < 0 || mouseY < 0 || mouseX > windowWidth || mouseY > windowHeight) {
        return;
    }
    
    // Animación diferente cuando el mouse está presionado
    if (isMousePressed) {
        // Cursor cuando está dibujando - más dinámico
        targetBuffer.stroke(255, 100, 100); // Color rojizo
        targetBuffer.strokeWeight(2.5); // Grosor más grueso
        targetBuffer.noFill();
        
        // Círculo pulsante (usando frameCount para animación)
        const pulseSize = brushSize + sin(frameCount * 0.2) * 5;
        targetBuffer.ellipse(mouseX, mouseY, pulseSize, pulseSize);
        
        // Círculo interno adicional
        targetBuffer.stroke(255, 150, 150, 150);
        targetBuffer.strokeWeight(1);
        targetBuffer.ellipse(mouseX, mouseY, brushSize * 0.5, brushSize * 0.5);
        
        // Cruz más grande y visible
        targetBuffer.stroke(255, 100, 100);
        targetBuffer.strokeWeight(2);
        const crossSize = 6;
        targetBuffer.line(mouseX - crossSize, mouseY, mouseX + crossSize, mouseY);
        targetBuffer.line(mouseX, mouseY - crossSize, mouseX, mouseY + crossSize);
    } else {
        // Cursor normal cuando no está dibujando
        targetBuffer.stroke(255); // Color blanco para el borde
        targetBuffer.strokeWeight(1.5); // Grosor del borde
        targetBuffer.noFill(); // Sin relleno
        
        // Dibujar un círculo en la posición del mouse con el tamaño del pincel
        targetBuffer.ellipse(mouseX, mouseY, brushSize, brushSize);
        
        // Dibujar una cruz pequeña en el centro para mayor precisión
        const crossSize = 4;
        targetBuffer.line(mouseX - crossSize, mouseY, mouseX + crossSize, mouseY);
        targetBuffer.line(mouseX, mouseY - crossSize, mouseX, mouseY + crossSize);
    }
}

// Función para actualizar las previsualizaciones de las capas
function updateLayerPreviews() {
    // Solo actualizar cada 10 frames para optimizar rendimiento
    if (frameCount % 10 !== 0) return;
    
    for (let i = 0; i < 5; i++) {
        const previewCanvas = document.getElementById(`layerPreview${i}`);
        if (previewCanvas && layers[i]) {
            const ctx = previewCanvas.getContext('2d');
            
            // FORZAR las dimensiones del canvas de preview
            const previewW = 100;
            const previewH = 56;
            previewCanvas.width = previewW;
            previewCanvas.height = previewH;
            
            // Obtener las dimensiones REALES del canvas de la capa (el buffer de p5.js)
            const sourceCanvas = layers[i].canvas;
            const sourceW = sourceCanvas.width;
            const sourceH = sourceCanvas.height;
            
            // Debug: imprimir dimensiones la primera vez
            if (i === 0 && frameCount === 10) {
                console.log('Source canvas:', sourceW, 'x', sourceH);
                console.log('Preview canvas:', previewW, 'x', previewH);
            }
            
            // Limpiar completamente
            ctx.clearRect(0, 0, previewW, previewH);
            
            // DIBUJAR TODO EL CANVAS SOURCE ESTIRADO AL PREVIEW
            // drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            ctx.drawImage(
                sourceCanvas,
                0, 0, sourceW, sourceH,           // Source: TODO el canvas (desde 0,0 hasta sourceW,sourceH)
                0, 0, previewW, previewH          // Destination: TODO el preview (estirado a 100x56)
            );
        }
    }
}

// Función para dibujar cursores de otros clientes
function drawRemoteCursors(buffer) {
    // Actualizar el servidor de cursores (eliminar obsoletos)
    PS.update();
    
    // Dibujar todos los cursores en el buffer especificado
    PS.display(buffer || guiBuffer);
}

// ============================================================
// FUNCIÓN PRINCIPAL DE DIBUJO (DRAW)
// ============================================================

function draw() {
    // Limpiar el buffer GUI en cada frame
    guiBuffer.clear();
    
    // Renderizar todas las capas en orden (0 a 4) respetando visibilidad
    // La capa 0 ya tiene el fondo negro, no necesitamos background() aquí
    clear(); // Limpiar el canvas principal
    
    // Aplicar transformaciones de zoom y pan
    push();
    translate(panX, panY);
    scale(zoomLevel);
    
    for (let i = 0; i < 5; i++) {
        if (layerVisibility[i]) {
            image(layers[i], 0, 0);
        }
    }
    
    pop();
    
    // Actualizar previsualizaciones de capas
    updateLayerPreviews();
    
    // Mantener compatibilidad con drawBuffer (renderizar encima de las capas)
    // image(drawBuffer, 0, 0);
    
    // Dibujar la grilla en el buffer GUI si está activado
    if (document.getElementById("brushType").value === 'pixel' && document.getElementById('showGrid').checked) {
        updateGridBuffer();
    }
    
    // Dibujar cursores de otros clientes en el GUI buffer
    drawRemoteCursors(guiBuffer);
    
    // Dibujar el puntero circular que muestra el tamaño del pincel (local) en el GUI buffer
    drawBrushCursor(guiBuffer);
    
    // Dibujar preview de línea si estamos usando Line Brush en el GUI buffer
    drawLinePreview(guiBuffer);
    
    // Dibujar el cursor GUI si está visible (ya se dibuja en guiBuffer)
    if (window.cursorGUI) {
        cursorGUI.display(guiBuffer);
    }
    
    // Dibujar el flowfield en el GUI buffer si está activado
    drawArtBrushFlowfield(guiBuffer);
    
    // Dibujar FPS counter en el GUI buffer si está activado
    if (window.showFPS) {
        drawFPSCounter(guiBuffer);
    }
    
    // Dibujar indicador de zoom
    drawZoomIndicator(guiBuffer);
    
    // Dibujar scrollbars si hay zoom
    drawScrollbars(guiBuffer);
    
    // Mostrar el buffer GUI siempre (encima de todas las capas)
    image(guiBuffer, 0, 0);
    
    // Actualizar y dibujar el sistema de partículas del Art Brush
    updateArtBrush();
    drawArtBrushParticles(getActiveLayer());
    
    const brushType = document.getElementById("brushType").value;
    
    // Convertir coordenadas de pantalla a canvas (para normalizar correctamente)
    const canvasCoordsForSocket = screenToCanvas(mouseX, mouseY);
    const canvasPrevCoordsForSocket = screenToCanvas(pmouseXGlobal, pmouseYGlobal);
    
    // Objeto de datos base
    // IMPORTANTE: Normalizar coordenadas del CANVAS, no de la pantalla
    // Esto asegura que otros clientes con diferente zoom reciban las coordenadas correctas
    data = {
        x: map(canvasCoordsForSocket.x, 0, windowWidth, 0, 1),
        y: map(canvasCoordsForSocket.y, 0, windowHeight, 0, 1),
        pmouseX: map(canvasPrevCoordsForSocket.x, 0, windowWidth, 0, 1),
        pmouseY: map(canvasPrevCoordsForSocket.y, 0, windowHeight, 0, 1),
        c1: color(document.getElementById("c1").value),
        s: document.getElementById("size").value,
        av: document.getElementById("alphaValue").value,
        bt: brushType,
        bc: false,
        session: sessionId,
        layer: activeLayer, // Número de capa activa (0-4)
        kaleidoSegments: parseInt(document.getElementById("kaleidoSegments").value) || 1,
        // Incluir las coordenadas del punto central del caleidoscopio si están definidas
        // Convertir a coordenadas de canvas antes de normalizar
        kaleidoCenterX: kaleidoCenterX !== null ? map(screenToCanvas(kaleidoCenterX, 0).x, 0, windowWidth, 0, 1) : null,
        kaleidoCenterY: kaleidoCenterY !== null ? map(screenToCanvas(0, kaleidoCenterY).y, 0, windowHeight, 0, 1) : null
    };
    
    // Añadir parámetros específicos según el tipo de pincel
    switch (brushType) {
        case 'pixel':
            // Añadir parámetros de la grilla para pixel brush
            data.cols = gridCols;
            data.rows = gridRows;
            data.showGrid = document.getElementById('showGrid').checked;
            break;
        case 'art':
            // Añadir parámetro de cantidad de partículas para art brush
            data.particleCount = parseInt(document.getElementById('particleCount').value);
            break;
        case 'text':
            // Añadir parámetros para text brush
            data.textContent = document.getElementById('textContent').value;
            data.textSize = parseInt(document.getElementById('textSize').value);
            data.textFont = document.getElementById('textFont').value;
            break;
        case 'geometry':
            // Añadir parámetros para spirograph brush (size global controla radio principal)
            data.spiroModulo = parseFloat(document.getElementById('spiroModulo').value);
            data.spiroInc = parseFloat(document.getElementById('spiroInc').value);
            data.radius2 = parseFloat(document.getElementById('radius2').value);
            data.npoints1 = parseInt(document.getElementById('npoints1').value);
            data.borderScale = parseFloat(document.getElementById('borderScale').value);
            data.borderAlpha = parseFloat(document.getElementById('borderAlpha').value);
            break;
        case 'fill':
            // Añadir parámetros para fill brush
            data.fillTolerance = parseInt(document.getElementById('fillTolerance').value);
            break;
        case 'image':
            // Enviar imageData para que otros clientes vean el mismo dibujo
            // pero NO cambiará su selección local de emoji
            const imageBrushMgr = getImageBrushManager();
            if (imageBrushMgr.hasImage()) {
                data.imageData = imageBrushMgr.imageData;
            }
            break;
        case 'flower':
            // Añadir parámetros para flower brush
            data.minSize = parseFloat(document.getElementById('minSize').value);
            data.maxSize = parseFloat(document.getElementById('maxSize').value);
            data.frequency = parseFloat(document.getElementById('frequency').value);
            data.animSpeed = parseFloat(document.getElementById('animSpeed').value);
            data.strokeWeight = parseFloat(document.getElementById('flowerStrokeWeight').value);
            data.strokeAlpha = parseFloat(document.getElementById('strokeAlpha').value);
            data.shrinkSpeed = parseFloat(document.getElementById('shrinkSpeed').value);
            break;
    }
    
    // Enviar posición del cursor siempre (para que otros vean el cursor)
    const cursorData = {
        x: map(mouseX, 0, windowWidth, 0, 1),
        y: map(mouseY, 0, windowHeight, 0, 1),
        isDrawing: isMousePressed && !isOverGui && !isOverOpenButton,
        brushSize: parseInt(document.getElementById('size').value),
        session: sessionId,
        username: typeof getCurrentChatUsername === 'function' ? getCurrentChatUsername() : '',
        isCursorOnly: true // Flag para indicar que es solo actualización de cursor
    };
    
    // Enviar posición del cursor cada frame si el envío de sockets está habilitado
    if (config.sockets.sendEnabled && socket && socket.connected) {
        socket.emit('cursor', cursorData);
    }
    
    // Actualizar arrastre de scrollbar si está activo
    if (isDraggingScrollbar) {
        updateScrollbarDrag(mouseX, mouseY);
    }
    
    // Actualizar posición del cursor GUI (para detectar movimiento y arrastre)
    if (window.cursorGUI) {
        if (cursorGUI.isVisible) {
            // Si está arrastrando, actualizar posición
            if (cursorGUI.isDragging) {
                cursorGUI.updateDrag(mouseX, mouseY);
            } else {
                cursorGUI.updateHover(mouseX, mouseY);
            }
        } else if (cursorGUI.isPressing) {
            // Actualizar posición para detectar si se está moviendo
            cursorGUI.updatePosition(mouseX, mouseY);
        }
    }
    
    // Verificar si el mouse está sobre el contenedor de cursorGUI o scrollbars
    const isOverCursorGUI = window.cursorGUI && cursorGUI.isVisible && cursorGUI.isPointInContainer(mouseX, mouseY);
    const isOverScrollbars = isMouseOverScrollbar(mouseX, mouseY);
    
    // Dibujar si el mouse está presionado y no está sobre ninguna GUI o scrollbar
    if (isMousePressed && !isOverGui && !isOverOpenButton && !isOverCursorGUI && !isOverScrollbars) {
        // Para el fill brush, solo ejecutar una vez por click
        const isFillBrush = brushType === 'fill';
        const isLineBrush = brushType === 'line';
        let shouldSendSocket = false;
        
        // Convertir coordenadas de pantalla a canvas con zoom
        const canvasCoords = screenToCanvas(mouseX, mouseY);
        const canvasPrevCoords = screenToCanvas(pmouseXGlobal, pmouseYGlobal);
        
        // Agregar coordenadas previas transformadas a data
        data.pmouseXTransformed = canvasPrevCoords.x;
        data.pmouseYTransformed = canvasPrevCoords.y;
        
        // Line brush NO dibuja mientras se arrastra, solo al soltar
        if (!isFillBrush && !isLineBrush) {
            // Dibujar normalmente para otros brushes en la capa activa
            dibujarCoso(getActiveLayer(), canvasCoords.x, canvasCoords.y, data);
            shouldSendSocket = true;
        } else if (isFillBrush && !fillExecuted) {
            // Fill brush solo una vez en la capa activa
            dibujarCoso(getActiveLayer(), canvasCoords.x, canvasCoords.y, data);
            fillExecuted = true;
            shouldSendSocket = true;
        }
        
        // Si hay parámetros de sincronización, normalizarlos antes de enviarlos
        if (data.syncParams && !isFillBrush) {
            const syncParams = data.syncParams;
            // Normalizar las coordenadas del canvas a valores entre 0 y 1
            const normalizedSyncParams = {
                x: map(syncParams.x, 0, windowWidth, 0, 1),
                y: map(syncParams.y, 0, windowHeight, 0, 1),
                pmouseX: map(syncParams.pmouseX, 0, windowWidth, 0, 1),
                pmouseY: map(syncParams.pmouseY, 0, windowHeight, 0, 1),
                count: syncParams.count,
                size: syncParams.size,
                baseSeed: syncParams.baseSeed,
                mouseDirection: syncParams.mouseDirection,
                mouseSpeed: syncParams.mouseSpeed
            };
            
            // Si hay parámetros exactos para cada partícula, normalizarlos también
            if (syncParams.particleParams && syncParams.particleParams.length > 0) {
                const normalizedParticleParams = [];
                
                // Normalizar las coordenadas de cada partícula
                for (let i = 0; i < syncParams.particleParams.length; i++) {
                    const p = syncParams.particleParams[i];
                    normalizedParticleParams.push({
                        x: map(p.x, 0, windowWidth, 0, 1),
                        y: map(p.y, 0, windowHeight, 0, 1),
                        vx: p.vx,  // La velocidad no necesita ser normalizada
                        vy: p.vy,  // La velocidad no necesita ser normalizada
                        size: p.size,
                        seed: p.seed,
                        colorSeed: p.colorSeed // Incluir la semilla de color para sincronización
                    });
                }
                
                // Añadir los parámetros de partículas normalizados
                normalizedSyncParams.particleParams = normalizedParticleParams;
            }
            
            // Actualizar los parámetros de sincronización en los datos
            data.syncParams = normalizedSyncParams;
        }
        
        // Luego enviamos los datos por socket (con syncParams normalizados) si el envío está habilitado
        if (shouldSendSocket && config.sockets.sendEnabled && socket && socket.connected) {
            socket.emit('mouse', data);
        }
        mouseFlag = false;
    }
    
    if (!isMousePressed) {
        mouseFlag = true;
        fillExecuted = false; // Resetear el flag cuando se suelta el mouse
    }
    
    // Guardar la posición actual del mouse para el siguiente ciclo
    pmouseXGlobal = mouseX;
    pmouseYGlobal = mouseY;
}

// ============================================================
// FUNCIONES DE EVENTOS
// ============================================================

function mousePressed() {
    // Verificar si se hizo click en una scrollbar
    if (handleScrollbarClick(mouseX, mouseY)) {
        return; // Click en scrollbar, no procesar más eventos
    }
    
    // Si el cursor GUI está visible, manejar el click y arrastre
    if (window.cursorGUI && cursorGUI.isVisible) {
        // Intentar iniciar arrastre primero
        const dragging = cursorGUI.startDrag(mouseX, mouseY);
        if (dragging) {
            return; // Iniciando arrastre, no procesar más eventos
        }
        
        // Si no es arrastre, manejar click normal
        const handled = cursorGUI.handleClick(mouseX, mouseY);
        if (handled) {
            return; // No procesar más eventos
        }
    }
    
    isMousePressed = true;
    
    // Iniciar temporizador de long press si no está sobre la GUI
    if (!isOverGui && !isOverOpenButton && window.cursorGUI) {
        cursorGUI.startLongPress(mouseX, mouseY);
    }
    
    // Actualizar pmouseXGlobal y pmouseYGlobal al inicio del trazo
    // Esto previene líneas no deseadas cuando se hace clic en un nuevo lugar
    pmouseXGlobal = mouseX;
    pmouseYGlobal = mouseY;
    
    // Establecer el punto central del caleidoscopio en la posición inicial del clic
    // Solo si no estamos sobre la GUI o el botón de cerrar
    if (!isOverGui && !isOverOpenButton) {
        kaleidoCenterX = mouseX;
        kaleidoCenterY = mouseY;
        // console.log('Punto central del caleidoscopio establecido en:', kaleidoCenterX, kaleidoCenterY);
    }
    
    // Si es line brush, guardar el punto inicial (con coordenadas transformadas)
    const brushType = document.getElementById('brushType').value;
    if (brushType === 'line' && !isOverGui && !isOverOpenButton) {
        const canvasCoords = screenToCanvas(mouseX, mouseY);
        startLineBrush(canvasCoords.x, canvasCoords.y);
    }
    
    // Track draw interaction
    if (analyticsTracker && !isOverGui && !isOverOpenButton) {
        analyticsTracker.trackDraw(brushType);
    }
}

function mouseReleased() {
    // Terminar arrastre de scrollbar
    isDraggingScrollbar = false;
    draggingScrollbarType = null;
    
    // Terminar arrastre de cursorGUI si estaba activo
    if (window.cursorGUI) {
        cursorGUI.endDrag();
        cursorGUI.cancelLongPress();
    }
    
    // Si es line brush, dibujar la línea y enviar por socket
    const brushType = document.getElementById('brushType').value;
    if (brushType === 'line' && !isOverGui && !isOverOpenButton && lineStartX !== null) {
        // Preparar color
        const colorValue = document.getElementById('c1').value;
        const alphaValue = parseInt(document.getElementById('alphaValue').value);
        const col = color(colorValue);
        col.setAlpha(alphaValue);
        const brushSize = parseInt(document.getElementById('size').value);
        const kaleidoSegments = parseInt(document.getElementById('kaleidoSegments').value);
        
        // Convertir coordenadas finales con zoom
        const canvasCoords = screenToCanvas(mouseX, mouseY);
        
        // Dibujar en la capa activa
        const lineBrush = brushRegistry ? brushRegistry.get('line') : null;
        if (lineBrush) {
            lineBrush.draw(getActiveLayer(), canvasCoords.x, canvasCoords.y, {
                size: brushSize,
                color: col,
                kaleidoSegments: kaleidoSegments,
                startX: lineStartX,
                startY: lineStartY
            });
        }
        
        // Preparar datos para enviar por socket
        // IMPORTANTE: Normalizar coordenadas del CANVAS (ya transformadas), no de pantalla
        const data = {
            x: canvasCoords.x / windowWidth,  // Normalizar coordenadas de canvas
            y: canvasCoords.y / windowHeight,
            pmouseX: lineStartX / windowWidth,  // lineStartX/Y ya son coordenadas de canvas
            pmouseY: lineStartY / windowHeight,
            c1: colorValue,
            av: alphaValue,
            s: brushSize,
            bt: 'line',
            bc: false,
            session: sessionId,
            kaleidoSegments: kaleidoSegments,
            // Incluir las coordenadas del punto central del caleidoscopio si están definidas
            // Convertir a coordenadas de canvas antes de normalizar
            kaleidoCenterX: kaleidoCenterX !== null ? screenToCanvas(kaleidoCenterX, 0).x / windowWidth : null,
            kaleidoCenterY: kaleidoCenterY !== null ? screenToCanvas(0, kaleidoCenterY).y / windowHeight : null
        };
        
        // Enviar por socket si el envío está habilitado
        // console.log('ENVIANDO LINE POR SOCKET:', data);
        if (config.sockets.sendEnabled && socket && socket.connected) {
            socket.emit('mouse', data);
        }
        
        // Resetear
        resetLineBrush();
    }
    
    asignarValores();
    isMousePressed = false;
    
    // Resetear el punto central del caleidoscopio después de dibujar
    kaleidoCenterX = null;
    kaleidoCenterY = null;
}

function keyPressed() {
    if (key == 'b') {
        cleanBackground();
    }
    // Alternar visibilidad del botón GUI con la tecla G
    if (key == 'g' || key == 'G') {
        toggleGuiButtonVisibility();
    }
    // Cerrar cursor GUI con ESC
    if (keyCode === ESCAPE && window.cursorGUI) {
        cursorGUI.hide();
    }
    // Teclas 1-5: Toggle de capas O slots de paleta
    if (key >= '1' && key <= '5') {
        const index = parseInt(key) - 1;
        
        // Si el cursor GUI está visible, cambiar slot de paleta
        if (window.cursorGUI && cursorGUI.isVisible) {
            cursorGUI.selectPaletteSlot(index);
        } else {
            // Si no, toggle de visibilidad de capa
            toggleLayerVisibility(index);
        }
    }
}

// ============================================================
// FUNCIONES DE TOUCH (MÓVILES)
// ============================================================

function touchStarted(event) {
    // Verificar si el touch es en la interfaz de usuario
    const gui = document.getElementById('gui');
    if (gui && gui.style.display !== 'none') {
        const touch = event.touches ? event.touches[0] : event;
        const guiRect = gui.getBoundingClientRect();
        
        // Si el toque está dentro de la interfaz de usuario, permitir el desplazamiento
        if (touch.clientX >= guiRect.left && touch.clientX <= guiRect.right && 
            touch.clientY >= guiRect.top && touch.clientY <= guiRect.bottom) {
            return true;
        }
    }
    
    // Si el touch es sobre un elemento HTML que no es el canvas, no bloquear
    if (event && event.target && event.target.tagName !== 'CANVAS') {
        return true; // Permitir el comportamiento por defecto
    }
    
    // Si el cursor GUI está visible, manejar el touch y arrastre
    if (window.cursorGUI && cursorGUI.isVisible) {
        // Intentar iniciar arrastre primero
        const dragging = cursorGUI.startDrag(mouseX, mouseY);
        if (dragging) {
            return false; // Iniciando arrastre, prevenir comportamiento por defecto
        }
        
        // Si no es arrastre, manejar click normal
        const handled = cursorGUI.handleClick(mouseX, mouseY);
        if (handled) {
            return false; // Prevenir comportamiento por defecto
        }
    }
    
    // Iniciar temporizador de long press si no está sobre la GUI
    if (!isOverGui && !isOverOpenButton && window.cursorGUI) {
        cursorGUI.startLongPress(mouseX, mouseY);
    }
    
    // NO llamar a mousePressed() aquí porque causa doble ejecución de startLongPress()
    // En su lugar, ejecutar solo la lógica necesaria de mousePressed
    isMousePressed = true;
    pmouseXGlobal = mouseX;
    pmouseYGlobal = mouseY;
    
    // Establecer punto central del caleidoscopio
    if (!isOverGui && !isOverOpenButton) {
        kaleidoCenterX = mouseX;
        kaleidoCenterY = mouseY;
    }
    
    // Si es line brush, guardar el punto inicial (con coordenadas transformadas)
    const brushType = document.getElementById('brushType').value;
    if (brushType === 'line' && !isOverGui && !isOverOpenButton) {
        const canvasCoords = screenToCanvas(mouseX, mouseY);
        startLineBrush(canvasCoords.x, canvasCoords.y);
    }
    
    // Track draw interaction
    if (analyticsTracker && !isOverGui && !isOverOpenButton) {
        analyticsTracker.trackDrawInteraction();
    }
    
    // Prevenir comportamiento por defecto en el canvas
    return false;
}

function touchEnded(event) {
    // Si el touch es sobre un elemento HTML (botón, input, etc), no bloquear
    if (event && event.target && event.target.tagName !== 'CANVAS') {
        return; // Dejar que el evento se propague normalmente
    }
    
    // Terminar arrastre de cursorGUI si estaba activo
    if (window.cursorGUI) {
        cursorGUI.endDrag();
        cursorGUI.cancelLongPress();
    }
    
    // Llamar a mouseReleased para mantener compatibilidad
    mouseReleased();
    
    // Prevenir comportamiento por defecto en touch solo en el canvas
    return false;
}

function touchMoved(event) {
    // Verificar si el movimiento es en la interfaz de usuario
    const gui = document.getElementById('gui');
    if (gui && gui.style.display !== 'none') {
        const touch = event.touches ? event.touches[0] : event;
        const guiRect = gui.getBoundingClientRect();
        
        // Si el movimiento es dentro de la interfaz, permitir el desplazamiento
        if (touch.clientX >= guiRect.left && touch.clientX <= guiRect.right && 
            touch.clientY >= guiRect.top && touch.clientY <= guiRect.bottom) {
            return true;
        }
    }
    
    // Actualizar hover o arrastre del cursor GUI
    if (window.cursorGUI && cursorGUI.isVisible) {
        if (cursorGUI.isDragging) {
            cursorGUI.updateDrag(mouseX, mouseY);
        } else {
            cursorGUI.updateHover(mouseX, mouseY);
        }
    }
    
    // Para el canvas, prevenir el scroll
    if (event && event.target && event.target.tagName === 'CANVAS') {
        return false;
    }
    
    // Permitir el comportamiento por defecto para otros elementos
    return true;
}

// ============================================================
// FUNCIONES DE DIBUJO
// ============================================================

// Función para dibujar según el tipo de pincel
function dibujarCoso(buffer, x, y, data) {
    const col = convertToP5Color(data.c1);
    col.setAlpha(parseInt(data.av));
    const brushSize = parseInt(data.s);
    
    // Obtener tipo de pincel, predeterminado a classic si no se especifica
    const brushType = data.bt || 'classic';
    
    // Dibujar según el tipo de pincel
    switch (brushType) {
        case 'line':
            // Line brush - usar el nuevo sistema de clases
            const lineBrush = brushRegistry ? brushRegistry.get('line') : null;
            if (lineBrush) {
                const startX = data.pmouseX * windowWidth;
                const startY = data.pmouseY * windowHeight;
                
                lineBrush.draw(buffer, x, y, {
                    size: brushSize,
                    color: col,
                    kaleidoSegments: data.kaleidoSegments || 1,
                    startX: startX,
                    startY: startY
                });
            }
            break;
        case 'art':
            // Art brush - usar el nuevo sistema de clases
            const artBrush = brushRegistry ? brushRegistry.get('art') : null;
            if (artBrush) {
                // Usar coordenadas transformadas si están disponibles (para zoom)
                const artPrevX = data.pmouseXTransformed !== undefined ? data.pmouseXTransformed : pmouseXGlobal;
                const artPrevY = data.pmouseYTransformed !== undefined ? data.pmouseYTransformed : pmouseYGlobal;
                
                const result = artBrush.draw(buffer, x, y, {
                    pmouseX: artPrevX,
                    pmouseY: artPrevY,
                    particleCount: data.particleCount || 10,
                    size: brushSize,
                    color: col,
                    kaleidoSegments: data.kaleidoSegments || 1,
                    syncParams: data.syncParams || null
                });
                
                // Guardar los parámetros de sincronización si se generaron
                if (result && !data.syncParams) {
                    data.syncParams = result;
                }
            }
            break;
        case 'pixel':
            // Pixel brush - usar el nuevo sistema de clases
            const pixelBrush = brushRegistry ? brushRegistry.get('pixel') : null;
            if (pixelBrush) {
                pixelBrush.draw(buffer, x, y, {
                    size: brushSize,
                    color: col,
                    cols: data.cols || 32,
                    rows: data.rows || 32,
                    kaleidoSegments: data.kaleidoSegments || 1
                });
            }
            break;
        case 'text':
            // Text brush - usar el nuevo sistema de clases
            const textBrush = brushRegistry ? brushRegistry.get('text') : null;
            if (textBrush) {
                textBrush.draw(buffer, x, y, {
                    color: col,
                    kaleidoSegments: data.kaleidoSegments || 1,
                    textContent: data.textContent || 'TEXTO',
                    textSize: data.textSize || 40,
                    textFont: data.textFont || 'Arial'
                });
            }
            break;
        case 'geometry':
            // Spirograph brush - usar el nuevo sistema de clases
            const geometryBrush = brushRegistry ? brushRegistry.get('geometry') : null;
            if (geometryBrush) {
                geometryBrush.draw(buffer, x, y, {
                    size: brushSize, // size controla radio principal
                    color: col,
                    kaleidoSegments: data.kaleidoSegments || 1,
                    spiroModulo: data.spiroModulo || 30,
                    spiroInc: data.spiroInc || 2,
                    radius2: data.radius2 || 0.6,
                    npoints1: data.npoints1 || 5,
                    borderScale: data.borderScale || 1.1,
                    borderAlpha: data.borderAlpha || 255,
                    syncAnim: data.syncAnim
                });
            }
            break;
        case 'fill':
            // Fill brush - usar el nuevo sistema de clases
            const fillBrush = brushRegistry ? brushRegistry.get('fill') : null;
            if (fillBrush) {
                fillBrush.draw(buffer, x, y, {
                    color: col,
                    fillTolerance: data.fillTolerance || 0
                });
            }
            break;
        case 'image':
            // Image brush - usar el nuevo sistema de clases
            const imageBrush = brushRegistry ? brushRegistry.get('image') : null;
            if (imageBrush) {
                const imageCenterX = data.kaleidoCenterX !== null && data.kaleidoCenterX !== undefined 
                    ? data.kaleidoCenterX * windowWidth 
                    : null;
                const imageCenterY = data.kaleidoCenterY !== null && data.kaleidoCenterY !== undefined 
                    ? data.kaleidoCenterY * windowHeight 
                    : null;
                
                imageBrush.draw(buffer, x, y, {
                    size: brushSize,
                    alpha: parseInt(data.av),
                    kaleidoSegments: data.kaleidoSegments || 1,
                    imageData: data.imageData || null,
                    kaleidoCenterX: imageCenterX,
                    kaleidoCenterY: imageCenterY
                });
            }
            break;
        case 'flower':
            // Flower brush - usar el nuevo sistema de clases (Silksun style)
            const flowerBrush = brushRegistry ? brushRegistry.get('flower') : null;
            if (flowerBrush) {
                flowerBrush.draw(buffer, x, y, {
                    color: col,
                    minSize: data.minSize || 2,
                    maxSize: data.maxSize || 14,
                    frequency: data.frequency || 6,
                    animSpeed: data.animSpeed || 0.1,
                    strokeWeight: data.strokeWeight || 4,
                    strokeAlpha: data.strokeAlpha || 45,
                    shrinkSpeed: data.shrinkSpeed || 0.15,
                    shadowOffset: data.shadowOffset || 10
                });
            }
            break;
        case 'classic':
        default:
            // Classic circle brush with kaleidoscope effect
            const kaleidoSegments = data.kaleidoSegments || 1;
            const brush = brushRegistry ? brushRegistry.get('classic') : null;
            if (brush) {
                // Usar coordenadas transformadas si están disponibles (para zoom)
                const prevX = data.pmouseXTransformed !== undefined ? data.pmouseXTransformed : pmouseXGlobal;
                const prevY = data.pmouseYTransformed !== undefined ? data.pmouseYTransformed : pmouseYGlobal;
                
                brush.draw(buffer, x, y, {
                    size: brushSize,
                    color: col,
                    kaleidoSegments,
                    pmouseX: prevX,
                    pmouseY: prevY
                });
            }
            break;
    }
}

// Función para dibujar un polígono
function polygon(buffer, x, y, radius, npoints, fase) {
    let angle = TWO_PI / npoints;
    buffer.beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a + fase) * radius;
        let sy = y + sin(a + fase) * radius;
        buffer.vertex(sx, sy);
    }
    buffer.endShape(CLOSE);
}

// ============================================================
// FUNCIONES DE CONVERSIÓN DE COORDENADAS
// ============================================================

// Convertir coordenadas de la grilla a coordenadas del canvas
function gridToCanvas(cellX, cellY) {
    // Obtener el punto central de la celda de la grilla
    const gridX = (cellX * cellWidth) + (cellWidth / 2);
    const gridY = (cellY * cellHeight) + (cellHeight / 2);
    
    // Mapear de vuelta a coordenadas del canvas
    return {
        x: map(gridX, 0, gridSize, 0, windowWidth),
        y: map(gridY, 0, gridSize, 0, windowHeight)
    };
}

// ============================================================
// FUNCIONES DE COMUNICACIÓN POR SOCKET
// ============================================================

// Función para manejar nuevos dibujos recibidos por socket
function newDrawing(data2) {
    // Verificar si la recepción de sockets está habilitada
    if (!config.sockets.receiveEnabled) {
        console.log("Recepción de sockets desactivada. Ignorando datos recibidos.");
        return;
    }
    
    if (data2.bc) {
        // Limpiar el background de la capa especificada cuando se recibe el mensaje
        const layerToClean = data2.layer !== undefined ? data2.layer : 0;
        
        if (layerToClean === 0) {
            // Capa 0 se limpia a negro
            layers[0].background(0);
            console.log("LIMPIEZA REMOTA APLICADA: CAPA 0 A NEGRO");
        } else if (layerToClean >= 1 && layerToClean <= 4) {
            // Capas 1-4 se limpian a transparente
            layers[layerToClean].clear();
            console.log("LIMPIEZA REMOTA APLICADA: CAPA", layerToClean, "A TRANSPARENTE");
        }
    } else {
        // No actualizar ninguna variable global, cada trazo es completamente independiente
        
        // Log para debugging de Line Brush
        if (data2.bt === 'line') {
            // console.log('RECIBIENDO LINE BRUSH EN NEWDRAWING:', data2);
            // console.log('sessionId:', sessionId);
            // console.log('socket.id:', socket.id);
        }
        
        // Convertir coordenadas normalizadas a coordenadas del canvas
        // IMPORTANTE: Estas coordenadas ya están en el espacio del canvas (0 a windowWidth/Height)
        // NO necesitan transformación de zoom porque vienen normalizadas del espacio del canvas
        const canvasX = map(data2.x, 0, 1, 0, windowWidth);
        const canvasY = map(data2.y, 0, 1, 0, windowHeight);
        
        // Convertir pmouseX y pmouseY si están presentes
        let remotePmouseX = canvasX;
        let remotePmouseY = canvasY;
        if (data2.pmouseX !== undefined && data2.pmouseY !== undefined) {
            remotePmouseX = map(data2.pmouseX, 0, 1, 0, windowWidth);
            remotePmouseY = map(data2.pmouseY, 0, 1, 0, windowHeight);
        }
        
        // Agregar coordenadas transformadas para que dibujarCoso las use
        data2.pmouseXTransformed = remotePmouseX;
        data2.pmouseYTransformed = remotePmouseY;
        
        // Establecer el punto central del caleidoscopio si se recibió en los datos
        if (data2.kaleidoCenterX !== null && data2.kaleidoCenterY !== null) {
            kaleidoCenterX = map(data2.kaleidoCenterX, 0, 1, 0, windowWidth);
            kaleidoCenterY = map(data2.kaleidoCenterY, 0, 1, 0, windowHeight);
            // console.log('Punto central del caleidoscopio recibido:', kaleidoCenterX, kaleidoCenterY);
        }
        
        // Guardar temporalmente las posiciones anteriores globales
        const tempPmouseX = window.pmouseXGlobal;
        const tempPmouseY = window.pmouseYGlobal;
        
        // Establecer las posiciones anteriores para este trazo remoto
        window.pmouseXGlobal = remotePmouseX;
        window.pmouseYGlobal = remotePmouseY;
        
        // Si es un trazo de art brush con parámetros de sincronización
        if (data2.bt === 'art' && data2.syncParams) {
            // Asegurarse de que los parámetros de sincronización están en coordenadas del canvas
            const syncParams = data2.syncParams;
            
            // Convertir las coordenadas normalizadas a coordenadas del canvas
            const syncX = map(syncParams.x, 0, 1, 0, windowWidth);
            const syncY = map(syncParams.y, 0, 1, 0, windowHeight);
            const syncPmouseX = map(syncParams.pmouseX, 0, 1, 0, windowWidth);
            const syncPmouseY = map(syncParams.pmouseY, 0, 1, 0, windowHeight);
            
            // Asegurarse de que el parámetro kaleidoSegments esté presente
            // Usar el valor de kaleidoSegments de los parámetros de sincronización si está presente,
            // o el valor de data2.kaleidoSegments, o 1 como valor predeterminado
            const kaleidoSegments = syncParams.kaleidoSegments || data2.kaleidoSegments || 1;
            
            // Crear un objeto de parámetros de sincronización con coordenadas del canvas
            const localSyncParams = {
                x: syncX,
                y: syncY,
                pmouseX: syncPmouseX,
                pmouseY: syncPmouseY,
                count: syncParams.count,
                size: syncParams.size,
                baseSeed: syncParams.baseSeed,
                mouseDirection: syncParams.mouseDirection,
                mouseSpeed: syncParams.mouseSpeed,
                kaleidoSegments: kaleidoSegments // Incluir el parámetro kaleidoSegments
            };
            
            // NO modificar los valores de los sliders locales
            // Las partículas ya vienen con sus velocidades calculadas en particleParams
            
            // Si hay parámetros exactos para cada partícula, convertirlos también
            if (syncParams.particleParams && syncParams.particleParams.length > 0) {
                const localParticleParams = [];
                
                // Convertir las coordenadas de cada partícula
                for (let i = 0; i < syncParams.particleParams.length; i++) {
                    const p = syncParams.particleParams[i];
                    localParticleParams.push({
                        x: map(p.x, 0, 1, 0, windowWidth),
                        y: map(p.y, 0, 1, 0, windowHeight),
                        vx: p.vx,  // La velocidad no necesita ser convertida
                        vy: p.vy,  // La velocidad no necesita ser convertida
                        size: p.size,
                        seed: p.seed,
                        colorSeed: p.colorSeed // Incluir la semilla de color para sincronización
                    });
                }
                
                // Añadir los parámetros de partículas convertidos
                localSyncParams.particleParams = localParticleParams;
            }
            
            // Actualizar los parámetros de sincronización en los datos
            data2.syncParams = localSyncParams;
        }
        
        // Obtener la capa correcta (usar capa 0 si no se especifica)
        const targetLayer = layers[data2.layer !== undefined ? data2.layer : 0];
        
        // Dibujar en la capa correcta usando los parámetros recibidos
        // Todos los brushes ahora usan dibujarCoso con el nuevo sistema de clases
        dibujarCoso(
            targetLayer,
            canvasX,
            canvasY,
            data2
        );
        
        // Restaurar las posiciones anteriores globales
        window.pmouseXGlobal = tempPmouseX;
        window.pmouseYGlobal = tempPmouseY;
        
        // Resetear el punto central del caleidoscopio después de dibujar
        kaleidoCenterX = null;
        kaleidoCenterY = null;
    }
}

// Función para actualizar cursor remoto
function updateRemoteCursor(data) {
    // Verificar si la recepción de sockets está habilitada
    if (!config.sockets.receiveEnabled) {
        // No procesar cursores remotos si la recepción está desactivada
        return;
    }
    
    // Procesar los datos del cursor usando CursorServer
    PS.processCursorData(data);
}

// Función para enviar sincronización de flowfield (completa con configuración)
function sendFlowfieldSync() {
    if (!config.sockets.sendEnabled) return;
    
    const system = getParticleSystem();
    
    // Enviar seed y noiseZ
    const syncData = {
        seed: system.flowfieldSeed,
        noiseZ: system.noiseZ,
        noiseScale: system.noiseScale,
        noiseZSpeed: system.noiseZSpeed
    };
    if (socket && socket.connected) {
        socket.emit('flowfield_sync', syncData);
    }
    
    // También enviar la configuración completa
    const configData = {
        seed: system.flowfieldSeed,
        noiseZ: system.noiseZ,
        cols: system.flowfieldCols,
        rows: system.flowfieldRows,
        strength: system.flowfieldStrength,
        speed: system.noiseZSpeed,
        noiseScale: system.noiseScale,
        showFlowfield: system.showFlowfield
    };
    if (socket && socket.connected) {
        socket.emit('flowfield_config', configData);
    }
    
    console.log('Enviando sincronización completa de flowfield:', configData);
}

// Función para recibir sincronización de flowfield
function receiveFlowfieldSync(data) {
    if (!config.sockets.receiveEnabled) return;
    
    const system = getParticleSystem();
    system.syncFlowfield(data.seed, data.noiseZ);
    
    // Actualizar también otros parámetros si están presentes
    if (data.noiseScale !== undefined) {
        system.noiseScale = data.noiseScale;
    }
    if (data.noiseZSpeed !== undefined) {
        system.noiseZSpeed = data.noiseZSpeed;
    }
    
    console.log('Recibida sincronización de flowfield:', data);
}

// Función para toggle del flowfield (sincronizada)
function toggleFlowfield() {
    const checkbox = document.getElementById('activateFlowfield');
    const controlsDiv = document.getElementById('flowfieldControls');
    const system = getParticleSystem();
    
    // Actualizar el estado del flowfield
    system.flowfieldActive = checkbox.checked;
    
    // Mostrar/ocultar controles
    if (checkbox.checked) {
        controlsDiv.style.display = 'block';
    } else {
        controlsDiv.style.display = 'none';
    }
    
    // Enviar el cambio a otros clientes
    if (config.sockets.sendEnabled && socket && socket.connected) {
        socket.emit('flowfield_config', {
            active: checkbox.checked,
            seed: system.flowfieldSeed,
            noiseZ: system.noiseZ,
            cols: system.flowfieldCols,
            rows: system.flowfieldRows,
            strength: system.flowfieldStrength,
            speed: system.noiseZSpeed,
            noiseScale: system.noiseScale
        });
        console.log('Flowfield', checkbox.checked ? 'activado' : 'desactivado');
    }
}

// Función para enviar cambios de configuración del flowfield
function sendFlowfieldConfigUpdate() {
    if (!config.sockets.sendEnabled) return;
    
    const system = getParticleSystem();
    const data = {
        active: system.flowfieldActive,
        seed: system.flowfieldSeed,
        noiseZ: system.noiseZ,
        cols: system.flowfieldCols,
        rows: system.flowfieldRows,
        strength: system.flowfieldStrength,
        speed: system.noiseZSpeed,
        noiseScale: system.noiseScale
    };
    
    if (socket && socket.connected) {
        socket.emit('flowfield_config', data);
        console.log('Enviando configuración de flowfield:', data);
    }
}

// Función para recibir cambios de configuración del flowfield
function receiveFlowfieldConfig(data) {
    if (!config.sockets.receiveEnabled) return;
    
    console.log('Recibida configuración de flowfield:', data);
    
    const system = getParticleSystem();
    const activateCheckbox = document.getElementById('activateFlowfield');
    const controlsDiv = document.getElementById('flowfieldControls');
    
    // Actualizar el estado activo del flowfield
    if (data.active !== undefined) {
        system.flowfieldActive = data.active;
        if (activateCheckbox) {
            activateCheckbox.checked = data.active;
        }
        // Mostrar/ocultar controles
        if (controlsDiv) {
            controlsDiv.style.display = data.active ? 'block' : 'none';
        }
    }
    
    // Actualizar el sistema con los nuevos valores
    if (data.seed !== undefined) system.flowfieldSeed = data.seed;
    if (data.noiseZ !== undefined) system.noiseZ = data.noiseZ;
    if (data.cols !== undefined) {
        system.flowfieldCols = data.cols;
        system.flowfieldResolution = windowWidth / data.cols;
    }
    if (data.rows !== undefined) {
        system.flowfieldRows = data.rows;
    }
    if (data.strength !== undefined) system.flowfieldStrength = data.strength;
    if (data.speed !== undefined) system.noiseZSpeed = data.speed;
    if (data.noiseScale !== undefined) system.noiseScale = data.noiseScale;
    
    // Actualizar los sliders y valores mostrados en la UI
    const colsInput = document.getElementById('flowfieldCols');
    const rowsInput = document.getElementById('flowfieldRows');
    const strengthInput = document.getElementById('flowfieldStrength');
    const speedInput = document.getElementById('flowfieldSpeed');
    
    if (colsInput && data.cols !== undefined) {
        colsInput.value = data.cols;
        const valueSpan = document.getElementById('flowfieldCols-value');
        if (valueSpan) valueSpan.textContent = data.cols;
    }
    
    if (rowsInput && data.rows !== undefined) {
        rowsInput.value = data.rows;
        const valueSpan = document.getElementById('flowfieldRows-value');
        if (valueSpan) valueSpan.textContent = data.rows;
    }
    
    if (strengthInput && data.strength !== undefined) {
        strengthInput.value = data.strength;
        const valueSpan = document.getElementById('flowfieldStrength-value');
        if (valueSpan) valueSpan.textContent = data.strength.toFixed(2);
    }
    
    if (speedInput && data.speed !== undefined) {
        speedInput.value = data.speed;
        const valueSpan = document.getElementById('flowfieldSpeed-value');
        if (valueSpan) valueSpan.textContent = data.speed.toFixed(3);
    }
    
    // Reinicializar el flowfield con la nueva configuración
    system.initFlowfield();
}

// Función para limpiar el fondo localmente (solo la capa activa)
function cleanBackgroundLocal() {
    if (activeLayer === 0) {
        // Capa 0 se limpia a negro
        getActiveLayer().background(0);
        console.log("LIMPIANDO CAPA 0 A NEGRO LOCALMENTE");
    } else {
        // Capas 1-4 se limpian a transparente
        getActiveLayer().clear();
        console.log("LIMPIANDO CAPA", activeLayer, "A TRANSPARENTE LOCALMENTE");
    }
}

// Función para limpiar el fondo y enviar mensaje a otros clientes si está activada la sincronización
function cleanBackground() {
    // Limpiar el fondo localmente siempre (solo capa activa)
    cleanBackgroundLocal();
    
    // Enviar mensaje a otros clientes si el envío de sockets está habilitado
    if (config.sockets.sendEnabled && socket && socket.connected) {
        socket.emit('mouse', {
            bc: true, 
            session: sessionId,
            layer: activeLayer // Enviar el número de capa que se está limpiando
        });
        console.log("ENVIANDO MENSAJE DE LIMPIEZA PARA CAPA", activeLayer, "EN SESIÓN:", sessionId);
    } else {
        console.log("LIMPIEZA LOCAL SOLAMENTE (ENVÍO DE SOCKETS DESACTIVADO)");
    }
}

// ============================================================
// FUNCIONES DE UTILIDAD
// ============================================================

// Función para convertir objeto de color a color p5
function convertToP5Color(colorObj) {
    // Si es un objeto de color con levels
    if (colorObj && colorObj.levels) {
        return color(colorObj.levels[0], colorObj.levels[1], colorObj.levels[2], colorObj.levels[3]);
    }
    // Si es un string (hex color)
    else if (typeof colorObj === 'string') {
        return color(colorObj);
    }
    return color(255); // color por defecto si algo sale mal
}

// Función para alternar la visibilidad del botón GUI
function toggleGuiButtonVisibility() {
    const openGuiButton = document.getElementById('opengui');
    if (openGuiButton.style.display === 'none') {
        openGuiButton.style.display = 'block';
    } else {
        openGuiButton.style.display = 'none';
    }
}

// ============================================================
// CLASES
// ============================================================

// Sistema de palabras
class PalabraSystem {
    constructor() {
        this.palabras = [];
    }
    
    addPalabra(x, y, data) {
        var palabra = new Palabra();
        palabra.posX = map(data.x, 0, 1, 0, windowWidth),
        palabra.posY = map(data.y, 0, 1, 0, windowHeight),
        palabra.size = parseInt(data.s);
        palabra.color = convertToP5Color(data.c1);
        palabra.colorBorder = convertToP5Color(data.c2);
        palabra.borderSize = data.bs;
        palabra.texto = data.t;
        palabra.alphaVal = data.av;
        palabra.alphaBorder = data.ab;
        palabra.font = data.font;
        
        this.palabras.push(palabra);
    }
    
    update() {
        for (var i = 0; i < this.palabras.length; i++) {
            this.palabras[i].update();
        }
    }
    
    dibujar() {
        for (var i = 0; i < this.palabras.length; i++) {
            this.palabras[i].dibujar();
            if (this.palabras[i].life <= 0) {
                this.palabras.splice(i, 1);
            }
        }
    }
}

// Clase Palabra
class Palabra {
    constructor() {
        this.texto = "AHHHH";
        this.posX = 0;
        this.posY = 0;
        this.size = 0;
        this.color = color(255);
        this.colorBorder = color(255);
        this.borderSize = 0;
        this.alphaVal = 0;
        this.alphaBorder = 0;
        this.life = 255;
        this.initialSize = 0;
        this.targetSize = 0;
        this.currentSize = 0;
        this.font = "Arial";
        this.fadeInPoint = 0.1;  // 10% para fade in
        this.fadeOutPoint = 0.9; // 90% para fade out
        this.currentBorderAlpha = 0;
    }
    
    dibujar() {
        // Calculamos el progreso de la animación (0 a 1)
        let progress = this.life / 255;
        
        textFont(this.font);
        
        // Calculamos la opacidad del borde y del relleno
        let currentAlpha;
        let currentBorderAlpha;
        
        // Fase de salida (fadeOutPoint-100%)
        if (progress >= this.fadeOutPoint) {
            let fadeOutProgress = map(progress, this.fadeOutPoint, 1, 1, 0);
            this.currentSize = this.size * fadeOutProgress;
            currentAlpha = this.life * fadeOutProgress;
            currentBorderAlpha = this.life * fadeOutProgress;
        } 
        // Fase de entrada (0-fadeInPoint)
        else if (progress <= this.fadeInPoint) {
            let fadeInProgress = map(progress, 0, this.fadeInPoint, 0, 1);
            this.currentSize = this.size * fadeInProgress;
            currentAlpha = this.life * fadeInProgress;
            currentBorderAlpha = this.life * fadeInProgress;
        } 
        // Fase estable (fadeInPoint-fadeOutPoint)
        else {
            this.currentSize = this.size;
            currentAlpha = this.life;
            currentBorderAlpha = this.life;
        }
        
        // Aplicamos las opacidades calculadas
        let fillColor = color(
            this.color.levels[0], 
            this.color.levels[1], 
            this.color.levels[2], 
            currentAlpha
        );
        
        let strokeColor = color(
            this.colorBorder.levels[0], 
            this.colorBorder.levels[1], 
            this.colorBorder.levels[2], 
            currentBorderAlpha
        );
        
        textSize(this.currentSize);
        fill(fillColor);
        stroke(strokeColor);
        strokeWeight(this.borderSize);
        text(this.texto, this.posX, this.posY);
    }
    
    update() {
        this.life -= 1;
    }
}

// Funciones para recibir eventos de capas por socket
function receiveLayerAdded(data) {
    if (!config.sockets.receiveEnabled) return;
    
    console.log('Capa agregada remotamente:', data);
    
    // Agregar capa sin emitir evento (para evitar loop)
    if (layers.length < MAX_LAYERS) {
        const newLayer = createGraphics(windowWidth, windowHeight);
        newLayer.clear();
        layers.push(newLayer);
        layerVisibility.push(true);
        
        // Actualizar UI
        updateLayerUI();
        
        console.log(`Capa ${layers.length - 1} agregada por socket. Total: ${layers.length}`);
    }
}

function receiveLayerDeleted(data) {
    if (!config.sockets.receiveEnabled) return;
    
    console.log('Capa eliminada remotamente:', data);
    
    const layerIndex = data.layerIndex;
    
    if (layers.length > 1 && layerIndex >= 0 && layerIndex < layers.length) {
        // Eliminar la capa
        layers.splice(layerIndex, 1);
        layerVisibility.splice(layerIndex, 1);
        
        // Ajustar activeLayer si es necesario
        if (activeLayer >= layers.length) {
            activeLayer = layers.length - 1;
        }
        
        // Actualizar UI
        updateLayerUI();
        
        console.log(`Capa ${layerIndex} eliminada por socket. Total: ${layers.length}`);
    }
}

// ============================================================
// FPS COUNTER
// ============================================================
// Variable global para controlar visibilidad del FPS
window.showFPS = false;

function drawFPSCounter(buffer) {
    const fps = frameRate();
    
    buffer.push();
    // Fondo semi-transparente
    buffer.fill(0, 0, 0, 180);
    buffer.noStroke();
    buffer.rect(buffer.width - 120, 10, 110, 40, 5);
    
    // Texto FPS
    buffer.fill(255);
    buffer.textSize(22);
    buffer.textAlign(RIGHT, TOP);
    buffer.text(`FPS: ${fps.toFixed(1)}`, buffer.width - 15, 18);
    buffer.pop();
}

function toggleFPS() {
    window.showFPS = !window.showFPS;
    console.log('FPS Counter:', window.showFPS ? 'ON' : 'OFF');
}

// ============================================================
// SISTEMA DE ZOOM
// ============================================================

/**
 * Aumentar zoom
 */
function zoomIn() {
    const oldZoom = zoomLevel;
    zoomLevel = Math.min(zoomLevel + zoomStep, zoomMax);
    
    // Ajustar pan para mantener el centro
    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;
    panX = centerX - (centerX - panX) * (zoomLevel / oldZoom);
    panY = centerY - (centerY - panY) * (zoomLevel / oldZoom);
    
    console.log(`Zoom In: ${(zoomLevel * 100).toFixed(0)}%`);
}

/**
 * Disminuir zoom
 */
function zoomOut() {
    const oldZoom = zoomLevel;
    zoomLevel = Math.max(zoomLevel - zoomStep, zoomMin);
    
    // Ajustar pan para mantener el centro
    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;
    panX = centerX - (centerX - panX) * (zoomLevel / oldZoom);
    panY = centerY - (centerY - panY) * (zoomLevel / oldZoom);
    
    console.log(`Zoom Out: ${(zoomLevel * 100).toFixed(0)}%`);
}

/**
 * Resetear zoom a 100%
 */
function resetZoom() {
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    console.log('Zoom Reset: 100%');
}

/**
 * Dibujar indicador de zoom
 */
function drawZoomIndicator(buffer) {
    // Solo mostrar si el zoom no es 100%
    if (zoomLevel === 1.0) return;
    
    buffer.push();
    
    // Fondo semi-transparente
    buffer.fill(0, 0, 0, 180);
    buffer.noStroke();
    buffer.rect(10, buffer.height - 60, 120, 50, 5);
    
    // Texto de zoom
    buffer.fill(255);
    buffer.textSize(20);
    buffer.textAlign(LEFT, TOP);
    buffer.text(`Zoom: ${(zoomLevel * 100).toFixed(0)}%`, 20, buffer.height - 50);
    
    // Barra de progreso
    const barWidth = 100;
    const barHeight = 8;
    const barX = 20;
    const barY = buffer.height - 25;
    
    // Fondo de la barra
    buffer.fill(50, 50, 50);
    buffer.rect(barX, barY, barWidth, barHeight, 4);
    
    // Progreso de la barra
    const progress = (zoomLevel - zoomMin) / (zoomMax - zoomMin);
    buffer.fill(100, 200, 255);
    buffer.rect(barX, barY, barWidth * progress, barHeight, 4);
    
    buffer.pop();
}

/**
 * Dibujar scrollbars cuando hay zoom
 */
function drawScrollbars(buffer) {
    // Solo mostrar si hay zoom diferente de 100%
    if (zoomLevel === 1.0) return;
    
    buffer.push();
    
    const scrollbarThickness = 12;
    const scrollbarColor = [100, 100, 100, 180];
    const scrollbarHandleColor = [138, 79, 191, 220];
    const scrollbarHoverColor = [158, 99, 211, 240];
    
    // Calcular dimensiones del contenido con zoom
    const contentWidth = windowWidth * zoomLevel;
    const contentHeight = windowHeight * zoomLevel;
    
    // Calcular posición visible (normalizada 0-1)
    const visibleX = -panX / contentWidth;
    const visibleY = -panY / contentHeight;
    const visibleWidth = windowWidth / contentWidth;
    const visibleHeight = windowHeight / contentHeight;
    
    // SCROLLBAR HORIZONTAL (abajo)
    if (visibleWidth < 1) {
        const scrollbarY = windowHeight - scrollbarThickness - 5;
        const scrollbarWidth = windowWidth - 20;
        const scrollbarX = 10;
        
        // Fondo del scrollbar
        buffer.fill(scrollbarColor);
        buffer.noStroke();
        buffer.rect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarThickness, 6);
        
        // Handle del scrollbar
        const handleWidth = Math.max(30, scrollbarWidth * visibleWidth);
        const handleX = scrollbarX + (scrollbarWidth - handleWidth) * visibleX;
        
        // Guardar bounds para interacción
        scrollbarBounds.horizontal = {
            x: scrollbarX,
            y: scrollbarY,
            width: scrollbarWidth,
            height: scrollbarThickness,
            handleX: handleX,
            handleWidth: handleWidth
        };
        
        // Highlight si el mouse está sobre el handle
        const isHovering = mouseX >= handleX && mouseX <= handleX + handleWidth &&
                          mouseY >= scrollbarY && mouseY <= scrollbarY + scrollbarThickness;
        buffer.fill(isHovering || (isDraggingScrollbar && draggingScrollbarType === 'horizontal') ? scrollbarHoverColor : scrollbarHandleColor);
        buffer.rect(handleX, scrollbarY, handleWidth, scrollbarThickness, 6);
    }
    
    // SCROLLBAR VERTICAL (derecha)
    if (visibleHeight < 1) {
        const scrollbarX = windowWidth - scrollbarThickness - 5;
        const scrollbarHeight = windowHeight - 20;
        const scrollbarY = 10;
        
        // Fondo del scrollbar
        buffer.fill(scrollbarColor);
        buffer.noStroke();
        buffer.rect(scrollbarX, scrollbarY, scrollbarThickness, scrollbarHeight, 6);
        
        // Handle del scrollbar
        const handleHeight = Math.max(30, scrollbarHeight * visibleHeight);
        const handleY = scrollbarY + (scrollbarHeight - handleHeight) * visibleY;
        
        // Guardar bounds para interacción
        scrollbarBounds.vertical = {
            x: scrollbarX,
            y: scrollbarY,
            width: scrollbarThickness,
            height: scrollbarHeight,
            handleY: handleY,
            handleHeight: handleHeight
        };
        
        // Highlight si el mouse está sobre el handle
        const isHovering = mouseX >= scrollbarX && mouseX <= scrollbarX + scrollbarThickness &&
                          mouseY >= handleY && mouseY <= handleY + handleHeight;
        buffer.fill(isHovering || (isDraggingScrollbar && draggingScrollbarType === 'vertical') ? scrollbarHoverColor : scrollbarHandleColor);
        buffer.rect(scrollbarX, handleY, scrollbarThickness, handleHeight, 6);
    }
    
    buffer.pop();
}

/**
 * Verificar si el mouse está sobre alguna scrollbar
 */
function isMouseOverScrollbar(x, y) {
    if (zoomLevel === 1.0) return false;
    
    // Verificar scrollbar horizontal
    const hBounds = scrollbarBounds.horizontal;
    if (hBounds.width > 0) {
        if (x >= hBounds.x && x <= hBounds.x + hBounds.width &&
            y >= hBounds.y && y <= hBounds.y + hBounds.height) {
            return true;
        }
    }
    
    // Verificar scrollbar vertical
    const vBounds = scrollbarBounds.vertical;
    if (vBounds.height > 0) {
        if (x >= vBounds.x && x <= vBounds.x + vBounds.width &&
            y >= vBounds.y && y <= vBounds.y + vBounds.height) {
            return true;
        }
    }
    
    return false;
}

/**
 * Manejar click en scrollbar
 */
function handleScrollbarClick(x, y) {
    if (zoomLevel === 1.0) return false;
    
    // Verificar click en scrollbar horizontal
    const hBounds = scrollbarBounds.horizontal;
    if (hBounds.width > 0) {
        if (x >= hBounds.handleX && x <= hBounds.handleX + hBounds.handleWidth &&
            y >= hBounds.y && y <= hBounds.y + hBounds.height) {
            isDraggingScrollbar = true;
            draggingScrollbarType = 'horizontal';
            return true;
        }
    }
    
    // Verificar click en scrollbar vertical
    const vBounds = scrollbarBounds.vertical;
    if (vBounds.height > 0) {
        if (x >= vBounds.x && x <= vBounds.x + vBounds.width &&
            y >= vBounds.handleY && y <= vBounds.handleY + vBounds.handleHeight) {
            isDraggingScrollbar = true;
            draggingScrollbarType = 'vertical';
            return true;
        }
    }
    
    return false;
}

/**
 * Actualizar posición de pan basado en arrastre de scrollbar
 */
function updateScrollbarDrag(x, y) {
    if (!isDraggingScrollbar) return;
    
    const contentWidth = windowWidth * zoomLevel;
    const contentHeight = windowHeight * zoomLevel;
    
    if (draggingScrollbarType === 'horizontal') {
        const hBounds = scrollbarBounds.horizontal;
        const relativeX = x - hBounds.x;
        const percentage = relativeX / hBounds.width;
        panX = -percentage * contentWidth + windowWidth / 2;
        
        // Limitar pan
        const maxPanX = 0;
        const minPanX = windowWidth - contentWidth;
        panX = Math.max(minPanX, Math.min(maxPanX, panX));
    } else if (draggingScrollbarType === 'vertical') {
        const vBounds = scrollbarBounds.vertical;
        const relativeY = y - vBounds.y;
        const percentage = relativeY / vBounds.height;
        panY = -percentage * contentHeight + windowHeight / 2;
        
        // Limitar pan
        const maxPanY = 0;
        const minPanY = windowHeight - contentHeight;
        panY = Math.max(minPanY, Math.min(maxPanY, panY));
    }
}

/**
 * Manejar evento de rueda del mouse para zoom
 */
function mouseWheel(event) {
    // Solo hacer zoom si se mantiene presionada la tecla Ctrl
    if (event.event && event.event.ctrlKey) {
        event.event.preventDefault(); // Prevenir zoom del navegador
        
        if (event.delta > 0) {
            zoomOut();
        } else {
            zoomIn();
        }
        
        return false;
    }
}

// Exponer funciones globalmente
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;
