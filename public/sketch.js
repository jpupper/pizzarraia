// ============================================================
// VARIABLES GLOBALES
// ============================================================

// Variables de sesión
var socket;
var sessionId;
var sessionIndicator;

// Variables de color y tamaño
var col1;
var col2;
var alphaVal; // Valor para el alpha del relleno
var size; // Valor para el tamaño del pincel
var texto1; 

// Variables de estado
var isOverOpenButton = false;
var isBorder = true;
var isRandomValues = true;
var isMousePressed = false; 
var isOverGui = false;
var mouseFlag = true;

// Variables de canvas
var mainCanvas; // Canvas principal
var drawBuffer; // Buffer para dibujar los pinceles
var guiBuffer;  // Buffer para dibujar la grilla

// Variables del sistema de grilla para pixel brush
var gridSize = 1024; // Tamaño de la grilla (1024x1024)
var gridCols = 32;   // Número predeterminado de columnas
var gridRows = 32;   // Número predeterminado de filas
var cellWidth, cellHeight; // Se calculará en base a gridSize y cols/rows
var showGrid = false; // Flag para mostrar/ocultar la grilla

// Variables del art brush
var starPoints = 5; // Número predeterminado de puntas para el star brush
var particleCount = 10; // Número predeterminado de partículas por emisión

// Sistemas
var ps; // Sistema de palabras
var particleSystem; // Sistema de partículas para el Art Brush
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
    
    // Obtener ID de sesión desde URL
    sessionId = config.getSessionId();
    
    // Actualizar indicador de sesión en GUI
    document.getElementById('sessionIndicator').innerText = `Sesión: ${sessionId}`;
    
    // Configurar socket
    const socketConfig = config.getSocketConfig();
    socket = io(socketConfig.url, socketConfig.options);
    
    // Unirse a la sesión
    socket.on('connect', function() {
        socket.emit('join_session', sessionId);
        console.log('Joined session:', sessionId);
    });
    
    // Configurar evento para recibir datos de dibujo
    socket.on("mouse", newDrawing);
    
    // Inicializar valores
    asignarValores();
    drawBuffer.background(0);
    
    // Inicializar dimensiones de la grilla
    updateGridDimensions();
    
    // Actualizar buffer de la grilla inicialmente
    updateGridBuffer();
    
    // Inicializar sistemas
    ps = new PalabraSystem();
    particleSystem = new ParticleSystem();
    textAlign(CENTER, CENTER);
    textSize(80);
    
    // Configurar eventos de botones
    setupButtonEvents();
}

function windowResized() {
    // Redimensionar canvas principal
    resizeCanvas(windowWidth, windowHeight);
    
    // Redimensionar buffers
    drawBuffer = createGraphics(windowWidth, windowHeight);
    guiBuffer = createGraphics(windowWidth, windowHeight);
    
    // Copiar contenido anterior si es necesario
    // (Aquí podrías implementar una función para preservar el dibujo)
    
    // Actualizar dimensiones de la grilla y redibujar
    updateGridDimensions();
    updateGridBuffer();
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
    // Limpiar el buffer de la grilla
    guiBuffer.clear();
   // guiBuffer.background(255,0,0);
    // Usar directamente el valor del checkbox para determinar si dibujar la grilla
    //if (!document.getElementById('showGrid') || !document.getElementById('showGrid').checked) return; // No dibujar si la grilla está oculta
    
    // Configurar estilo de la grilla
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

// ============================================================
// FUNCIÓN PRINCIPAL DE DIBUJO (DRAW)
// ============================================================

function draw() {
    // Mostrar el buffer de dibujo en el canvas principal
    image(drawBuffer, 0, 0);
    
    // Mostrar el buffer de la grilla si está activado localmente
    // Usar directamente el valor del checkbox para determinar si mostrar la grilla
    if (document.getElementById("brushType").value === 'pixel' && document.getElementById('showGrid').checked) {
        
    image(guiBuffer, 0, 0);
    }
    // Actualizar y dibujar el sistema de partículas
    particleSystem.update();
    particleSystem.draw(drawBuffer);
    
    const brushType = document.getElementById("brushType").value;
    
    // Objeto de datos base
    data = {
        x: map(mouseX, 0, windowWidth, 0, 1),
        y: map(mouseY, 0, windowHeight, 0, 1),
        c1: color(document.getElementById("c1").value),
        s: document.getElementById("size").value,
        av: document.getElementById("alphaValue").value,
        bt: brushType,
        bc: false,
        session: sessionId
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
    }
    
    // Dibujar si el mouse está presionado y no está sobre la GUI
    if (isMousePressed && !isOverGui && !isOverOpenButton) {
        socket.emit('mouse', data);
        dibujarCoso(drawBuffer, mouseX, mouseY, data);
        mouseFlag = false;
    }
    
    if (!isMousePressed) {
        mouseFlag = true;
    }
    
    // Guardar la posición actual del mouse para el siguiente ciclo
    pmouseXGlobal = mouseX;
    pmouseYGlobal = mouseY;
}

// ============================================================
// FUNCIONES DE EVENTOS
// ============================================================

function mousePressed() {
    isMousePressed = true;
}

function mouseReleased() {
    asignarValores();
    isMousePressed = false;
}

function keyPressed() {
    if (key == 'b') {
        cleanBackground();
    }
    // Alternar visibilidad del botón GUI con la tecla G
    if (key == 'g' || key == 'G') {
        toggleGuiButtonVisibility();
    }
}

// ============================================================
// FUNCIONES DE DIBUJO
// ============================================================

// Función para dibujar según el tipo de pincel
function dibujarCoso(buffer, x, y, data) {
    const col = convertToP5Color(data.c1);
    col.setAlpha(parseInt(data.av));
    const brushSize = parseInt(data.s);
    
    buffer.noStroke();
    buffer.fill(col);
    
    // Obtener tipo de pincel, predeterminado a classic si no se especifica
    const brushType = data.bt || 'classic';
    
    // No actualizar ninguna variable global, cada trazo es independiente
    
    // Dibujar según el tipo de pincel
    switch (brushType) {
        case 'art':
            // Art brush - sistema de partículas
            // Usar el valor de particleCount del dato recibido, sin actualizar el global
            drawStar(buffer, x, y, brushSize/2, data.particleCount);
            break;
        case 'pixel':
            // Pixel brush - dibuja un cuadrado en la grilla
            // Usar los valores de cols y rows del dato recibido, sin actualizar los globales
            if (data.cols && data.rows) {
                drawPixelOnGridWithParams(buffer, x, y, brushSize, data.cols, data.rows);
            } else {
                drawPixelOnGrid(buffer, x, y, brushSize);
            }
            break;
        case 'classic':
        default:
            // Classic circle brush
            buffer.ellipse(x, y, brushSize, brushSize);
            break;
    }
}

// Función para dibujar un píxel en la grilla usando los parámetros globales
function drawPixelOnGrid(buffer, x, y, size) {
    // Convertir coordenadas del canvas a coordenadas de la grilla
    const gridPos = canvasToGrid(x, y);
    
    // Calcular el ancho y alto de la celda en el canvas
    const canvasGridCellWidth = windowWidth / gridCols;
    const canvasGridCellHeight = windowHeight / gridRows;
    
    // Calcular la esquina superior izquierda de la celda
    const cellX = gridPos.cellX * canvasGridCellWidth;
    const cellY = gridPos.cellY * canvasGridCellHeight;
    
    // Dibujar el píxel como un rectángulo que coincide exactamente con la celda
    buffer.rectMode(CORNER); // Usar modo CORNER para coincidir exactamente con la grilla
    buffer.rect(cellX, cellY, canvasGridCellWidth, canvasGridCellHeight);
}

// Función para dibujar un píxel en la grilla usando parámetros específicos
function drawPixelOnGridWithParams(buffer, x, y, size, cols, rows) {
    // Convertir coordenadas del canvas a coordenadas de la grilla con los parámetros específicos
    const gridPos = canvasToGridWithParams(x, y, cols, rows);
    
    // Calcular el ancho y alto de la celda en el canvas con los parámetros específicos
    const canvasGridCellWidth = windowWidth / cols;
    const canvasGridCellHeight = windowHeight / rows;
    
    // Calcular la esquina superior izquierda de la celda
    const cellX = gridPos.cellX * canvasGridCellWidth;
    const cellY = gridPos.cellY * canvasGridCellHeight;
    
    // Dibujar el píxel como un rectángulo que coincide exactamente con la celda
    buffer.rectMode(CORNER); // Usar modo CORNER para coincidir exactamente con la grilla
    buffer.rect(cellX, cellY, canvasGridCellWidth, canvasGridCellHeight);
}

// Función para emitir partículas (reemplaza a drawStar)
function drawStar(buffer, x, y, radius, points = null) {
    // Usar el parámetro de puntas pasado o la variable global starPoints
    const numPoints = points || particleCount;
    
    // Calcular la posición anterior del mouse para determinar la dirección y velocidad
    let prevX = pmouseXGlobal;
    let prevY = pmouseYGlobal;
    
    // Si es el primer punto o no hay movimiento significativo, usar una posición ligeramente desplazada
    if (dist(x, y, prevX, prevY) < 1) {
        prevX = x - 1;
        prevY = y - 1;
    }
    
    // Añadir partículas al sistema
    particleSystem.addParticles(
        x, y,                // Posición actual
        prevX, prevY,        // Posición anterior
        numPoints,           // Número de partículas
        buffer.fill(),       // Color
        radius * 2           // Tamaño
    );
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

// Convertir coordenadas del canvas a coordenadas de la grilla usando parámetros globales
function canvasToGrid(x, y) {
    // Escalar coordenadas del canvas al espacio de la grilla (0-1024)
    const gridX = map(x, 0, windowWidth, 0, gridSize);
    const gridY = map(y, 0, windowHeight, 0, gridSize);
    
    // Calcular celda de la grilla
    const cellX = Math.floor(gridX / cellWidth);
    const cellY = Math.floor(gridY / cellHeight);
    
    // Restringir a los límites de la grilla
    return {
        cellX: constrain(cellX, 0, gridCols - 1),
        cellY: constrain(cellY, 0, gridRows - 1)
    };
}

// Convertir coordenadas del canvas a coordenadas de la grilla usando parámetros específicos
function canvasToGridWithParams(x, y, cols, rows) {
    // Escalar coordenadas del canvas al espacio de la grilla (0-1024)
    const gridX = map(x, 0, windowWidth, 0, gridSize);
    const gridY = map(y, 0, windowHeight, 0, gridSize);
    
    // Calcular ancho y alto de celda con los parámetros específicos
    const cellWidthParam = gridSize / cols;
    const cellHeightParam = gridSize / rows;
    
    // Calcular celda de la grilla
    const cellX = Math.floor(gridX / cellWidthParam);
    const cellY = Math.floor(gridY / cellHeightParam);
    
    // Restringir a los límites de la grilla
    return {
        cellX: constrain(cellX, 0, cols - 1),
        cellY: constrain(cellY, 0, rows - 1)
    };
}

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
    if (data2.bc) {
        cleanBackgroundLocal(); // Usar la función local para evitar reemitir el mensaje
    } else {
        // No actualizar ninguna variable global, cada trazo es completamente independiente
        
        // Dibujar en el buffer de dibujo usando los parámetros recibidos
        // sin actualizar los valores globales
        dibujarCoso(
            drawBuffer,
            map(data2.x, 0, 1, 0, windowWidth),
            map(data2.y, 0, 1, 0, windowHeight),
            data2
        );
    }
}

// Función para limpiar el fondo localmente
function cleanBackgroundLocal() {
    drawBuffer.background(0);
    console.log("LIMPIANDO LOCALMENTE");
}

// Función para limpiar el fondo y enviar mensaje a otros clientes
function cleanBackground() {
    cleanBackgroundLocal();
    socket.emit('mouse', {bc: true, session: sessionId});
    console.log("ENVIANDO MENSAJE DE LIMPIEZA PARA SESIÓN:", sessionId);
}

// ============================================================
// FUNCIONES DE UTILIDAD
// ============================================================

// Función para convertir objeto de color a color p5
function convertToP5Color(colorObj) {
    if (colorObj && colorObj.levels) {
        return color(colorObj.levels[0], colorObj.levels[1], colorObj.levels[2], colorObj.levels[3]);
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

// Clase para una partícula individual del Art Brush
class Particle {
    constructor(x, y, radius, angle, speed, color, size) {
        // Posición inicial usando radio y ángulo
        this.x = x + cos(angle) * radius;
        this.y = y + sin(angle) * radius;
        
        // Velocidad basada en la dirección del mouse y la velocidad proporcionada
        this.vx = cos(angle) * speed;
        this.vy = sin(angle) * speed;
        
        this.color = color;      // Color de la partícula
        this.size = size;        // Tamaño de la partícula
        this.alpha = 255;        // Opacidad inicial
        this.life = 255;         // Vida de la partícula (se reduce con el tiempo)
        this.decay = random(2, 5); // Velocidad de degradación
    }
    
    // Actualizar posición y vida de la partícula
    update() {
        // Mover la partícula según su velocidad
        this.x += this.vx;
        this.y += this.vy;
        
        // Reducir la vida y la opacidad
        this.life -= this.decay;
        this.alpha = this.life;
    }
    
    // Dibujar la partícula
    draw(buffer) {
        // Configurar color y opacidad
        const particleColor = color(this.color.levels[0], this.color.levels[1], this.color.levels[2]);
        particleColor.setAlpha(this.alpha);
        buffer.fill(particleColor);
        buffer.noStroke();
        
        // Dibujar la partícula como un círculo
        buffer.ellipse(this.x, this.y, this.size, this.size);
    }
    
    // Verificar si la partícula sigue viva
    isAlive() {
        return this.life > 0;
    }
}

// Sistema de partículas para el Art Brush
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    // Añadir nuevas partículas
    addParticles(x, y, pmouseX, pmouseY, count, color, size) {
        // Calcular la dirección y velocidad del mouse
        const mouseDirection = atan2(y - pmouseY, x - pmouseX);
        const mouseSpeed = dist(x, y, pmouseX, pmouseY) * 0.1; // Ajustar la velocidad según la rapidez del movimiento
        
        // Crear nuevas partículas
        for (let i = 0; i < count; i++) {
            // Calcular radio y ángulo aleatorios para la posición inicial
            const radius = random(0, size / 2);
            const angle = mouseDirection + random(-PI/4, PI/4); // Variación en el ángulo
            
            // Calcular velocidad basada en el movimiento del mouse
            const speed = mouseSpeed * random(0.5, 1.5); // Variación en la velocidad
            
            // Crear y añadir la partícula
            const particle = new Particle(x, y, radius, angle, speed, color, random(2, size/4));
            this.particles.push(particle);
        }
    }
    
    // Actualizar todas las partículas
    update() {
        // Actualizar cada partícula
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            
            // Eliminar partículas muertas
            if (!this.particles[i].isAlive()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // Dibujar todas las partículas
    draw(buffer) {
        for (let particle of this.particles) {
            particle.draw(buffer);
        }
    }
}

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
