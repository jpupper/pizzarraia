var socket;

// Session variables
var sessionId;
var sessionIndicator;

var col1;
var col2;
var alphaVal; //Valor para el alpha del relleno de las palabas
var size; //Valor para el tamaño del pincel
var texto1; 
var isOverOpenButton = false;


var isBorder = true;
var isRandomValues = true;
var isMousePressed = false; 

var isOverGui = false;
var mouseFlag = true;

// Grid system variables for pixel brush
var gridSize = 1024; // Grid size (1024x1024)
var gridCols = 32; // Default number of columns
var gridRows = 32; // Default number of rows
var cellWidth, cellHeight; // Will be calculated based on gridSize and cols/rows
var showGrid = false; // Flag to show/hide grid

// Art brush variables
var starPoints = 5; // Default number of points for star brush

var ps;
var data = {
		x:0,
		y:0,
		c1:col1,
		c2:col2,
		session: '0' // Default session
	}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	updateGridDimensions();
}

// Function to update grid cell dimensions
function updateGridDimensions() {
	// Make grid cells proportional to the canvas size
	cellWidth = gridSize / gridCols;
	cellHeight = gridSize / gridRows;
	console.log(`Grid updated: ${gridCols}x${gridRows}, cell size: ${cellWidth}x${cellHeight}`);
}

// Convert canvas coordinates to grid coordinates
function canvasToGrid(x, y) {
	// Scale canvas coordinates to grid space (0-1024)
	const gridX = map(x, 0, windowWidth, 0, gridSize);
	const gridY = map(y, 0, windowHeight, 0, gridSize);
	
	// Calculate grid cell
	const cellX = Math.floor(gridX / cellWidth);
	const cellY = Math.floor(gridY / cellHeight);
	
	// Constrain to grid bounds
	return {
		cellX: constrain(cellX, 0, gridCols - 1),
		cellY: constrain(cellY, 0, gridRows - 1)
	};
}

// Convert grid coordinates back to canvas coordinates
function gridToCanvas(cellX, cellY) {
	// Get the center point of the grid cell
	const gridX = (cellX * cellWidth) + (cellWidth / 2);
	const gridY = (cellY * cellHeight) + (cellHeight / 2);
	
	// Map back to canvas coordinates
	return {
		x: map(gridX, 0, gridSize, 0, windowWidth),
		y: map(gridY, 0, gridSize, 0, windowHeight)
	};
}


function setup(){
	createCanvas(windowWidth, windowHeight);
	
	// Get session ID from URL
	sessionId = config.getSessionId();
	
	// Update session indicator in GUI
	document.getElementById('sessionIndicator').innerText = `Sesión: ${sessionId}`;
	
	const socketConfig = config.getSocketConfig();
	socket = io(socketConfig.url, socketConfig.options);
	
	// Join the session
	socket.on('connect', function() {
		socket.emit('join_session', sessionId);
		console.log('Joined session:', sessionId);
	});
	
	socket.on("mouse",newDrawing);	
	asignarValores();
	background(0);

	// Initialize grid dimensions
	updateGridDimensions();

	ps = new PalabraSystem();
	textAlign(CENTER,CENTER	);
	textSize(80);
    setupButtonEvents();
}


function asignarValores(){
 	col1= color(random(255));
	col2= color(random(255));
	alphaVal = random(255);
	aplhaBorder = random(255);
	borderSize = random(1,10);
	size = random(10,30);
	texto1 = random(3,10);
}

function mouseReleased(){
	asignarValores();
	isMousePressed = false;
}
function keyPressed(){
	if(key == 'b'){
		cleanBackground();
	}
	// Toggle GUI button visibility with G key
	if(key == 'g' || key == 'G'){
		toggleGuiButtonVisibility();
	}
}
function mousePressed(){
	isMousePressed = true;
}
function mouseDragged(){
	
//	socket.emit('mouse',data);
	//dibujarCoso(data);
}
function newDrawing(data2){
	//ps.addPalabra(data2.x,data2.y,data2);
	if(data2.bc){
		cleanBackgroundLocal(); // Usar la función local para evitar reemitir el mensaje
	}else{
		// Update grid parameters if received (for pixel brush)
		if (data2.bt === 'pixel' && data2.cols && data2.rows) {
			// Only update if values are different to avoid unnecessary recalculations
			if (data2.cols !== gridCols || data2.rows !== gridRows) {
				gridCols = data2.cols;
				gridRows = data2.rows;
				updateGridDimensions();
			}
		}
		
		dibujarCoso(map(data2.x,0,1,0,windowWidth),map(data2.y,0,1,0,windowHeight),data2);
	}
}
function cleanBackgroundLocal(){
	background(0);
	console.log("LIMPIANDO LOCALMENTE");
}

function cleanBackground(){
	cleanBackgroundLocal();
	socket.emit('mouse',{bc:true, session: sessionId});
	console.log("ENVIANDO MENSAJE DE LIMPIEZA PARA SESIÓN:", sessionId);
}


// Function to draw the grid for pixel brush
function drawGrid() {
	push(); // Save current drawing state
	
	// Set grid style
	stroke(100, 100, 100, 50); // Semi-transparent gray
	strokeWeight(0.5);
	noFill();
	
	// Calculate grid cell size in canvas coordinates
	const canvasGridCellWidth = windowWidth / gridCols;
	const canvasGridCellHeight = windowHeight / gridRows;
	
	// Draw vertical lines
	for (let i = 0; i <= gridCols; i++) {
		const x = i * canvasGridCellWidth;
		line(x, 0, x, windowHeight);
	}
	
	// Draw horizontal lines
	for (let j = 0; j <= gridRows; j++) {
		const y = j * canvasGridCellHeight;
		line(0, y, windowWidth, y);
	}
	
	pop(); // Restore previous drawing state
}

function draw(){
	//background(0);
	//col1 = color(document.getElementById("c1").value);
	//col1.setAlpha(document.getElementById("alphaValue").value);
	//size = document.getElementById("size").value);
	//texto1 = document.getElementById("texto1").value);
	
	// Draw grid if enabled and pixel brush is selected
	if (showGrid && document.getElementById("brushType").value === 'pixel') {
		drawGrid();
	}
	
	const brushType = document.getElementById("brushType").value;
	
	// Base data object
	data = {
		x:map(mouseX,0,windowWidth,0,1),
		y:map(mouseY,0,windowHeight,0,1),
		c1:color(document.getElementById("c1").value),
		s:document.getElementById("size").value,
		av:document.getElementById("alphaValue").value,
		bt:brushType, // Add brush type
		bc:false,
		session: sessionId // Include session ID in the data
	}
	
	// Add brush-specific parameters based on the selected brush type
	switch(brushType) {
		case 'pixel':
			// Add grid parameters for pixel brush
			data.cols = gridCols;
			data.rows = gridRows;
			data.showGrid = document.getElementById('showGrid').checked;
			break;
		case 'art':
			// Add star points parameter for art brush
			data.starPts = parseInt(document.getElementById('starPoints').value);
			break;
	}
    if (isMousePressed && !isOverGui && !isOverOpenButton) {
	    socket.emit('mouse',data);
		dibujarCoso(mouseX,mouseY,data);
		noStroke();
		mouseFlag = false;
    } 
	
	if(!isMousePressed){
		mouseFlag = true;
	}
	//ps.update();
	//ps.dibujar();
}
function dibujarCoso(x,y,data){
	
	col1 = convertToP5Color(data.c1);
	col1.setAlpha(parseInt(data.av));
	size = data.s;
	noStroke();
	fill(col1);
	
	// Get brush type, default to classic if not specified
	const brushType = data.bt || 'classic';
	
	// Update global parameters if they're included in the data
	if (data.starPts) starPoints = data.starPts;
	if (data.cols) gridCols = data.cols;
	if (data.rows) gridRows = data.rows;
	if (data.showGrid !== undefined) showGrid = data.showGrid;
	
	switch(brushType) {
		case 'art':
			// Art brush - draws a star with specified points
			drawStar(x, y, parseInt(size)/2, data.starPts);
			break;
		case 'pixel':
			// Pixel brush - draws a square on the grid
			drawPixelOnGrid(x, y, parseInt(size));
			break;
		case 'classic':
		default:
			// Classic circle brush
			ellipse(x, y, parseInt(size), parseInt(size));
			break;
	}
}

// Function to draw a pixel on the grid
function drawPixelOnGrid(x, y, size) {
	// Convert canvas coordinates to grid coordinates
	const gridPos = canvasToGrid(x, y);
	
	// Get the canvas coordinates for the grid cell
	const canvasPos = gridToCanvas(gridPos.cellX, gridPos.cellY);
	
	// Calculate pixel size based on brush size and grid cell size
	// We'll use the brush size to determine how many grid cells to fill
	const pixelSize = map(size, 0, 100, cellWidth/2, cellWidth*3);
	
	// Draw the pixel at the grid position
	rectMode(CENTER);
	rect(canvasPos.x, canvasPos.y, pixelSize, pixelSize);
	
	// Debug info
	console.log(`Drawing pixel at grid cell (${gridPos.cellX}, ${gridPos.cellY}), canvas pos (${canvasPos.x}, ${canvasPos.y})`);
}

function polygon(x, y, radius, npoints,fase) {
  let angle = TWO_PI / npoints;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a+fase) * radius;
    let sy = y + sin(a+fase) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// Function to draw a star shape
function drawStar(x, y, radius, points = null) {
  // Use the passed points parameter or the global starPoints variable
  let numPoints = points || starPoints;
  let outerRadius = radius;
  let innerRadius = radius * 0.4;
  
  beginShape();
  for (let i = 0; i < numPoints * 2; i++) {
    let r = (i % 2 === 0) ? outerRadius : innerRadius;
    let angle = PI / numPoints * i;
    let sx = x + cos(angle) * r;
    let sy = y + sin(angle) * r;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}



function changeBorder(){
	isBorder = !isBorder;
	if(isBorder){
		document.getElementById("changborder").value = "No Border";
	}else{
			document.getElementById("changborder").value = "Use Border";
	}
}


function convertToP5Color(colorObj) {
  if (colorObj && colorObj.levels) {
    return color(colorObj.levels[0], colorObj.levels[1], colorObj.levels[2], colorObj.levels[3]);
  }
  return color(255); // color por defecto si algo sale mal
}

// Toggle GUI button visibility
function toggleGuiButtonVisibility() {
  const openGuiButton = document.getElementById('opengui');
  if (openGuiButton.style.display === 'none') {
    openGuiButton.style.display = 'block';
  } else {
    openGuiButton.style.display = 'none';
  }
}


class PalabraSystem{
	constructor(){
		this.palabras = [];
	}
	addPalabra(x,y,data){

		var palabra = new Palabra();
		palabra.posX = map(data.x,0,1,0,windowWidth),
		palabra.posY = map(data.y,0,1,0,windowHeight),
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
	update(){
		for(var i=0; i<this.palabras.length; i++){
			this.palabras[i].update();
		}
	}
	dibujar(){
		for(var i=0; i<this.palabras.length; i++){
			this.palabras[i].dibujar();
			if(this.palabras[i].life<=0){
				this.palabras.splice(i,1);
			}
		}
	}	
}
class Palabra {
    constructor(){
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
    
    dibujar(){
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
    
    update(){
        this.life -= 1;
    }
}

