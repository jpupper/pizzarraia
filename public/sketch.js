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
}


function setup(){
	createCanvas(windowWidth, windowHeight);
	
	// Get session ID from URL
	sessionId = config.getSessionId();
	
	// Create session indicator
	createSessionIndicator();
	
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


function draw(){
	//background(0);
	//col1 = color(document.getElementById("c1").value);
	//col1.setAlpha(document.getElementById("alphaValue").value);
	//size = document.getElementById("size").value;
	//texto1 = document.getElementById("texto1").value;
	
	data = {
		x:map(mouseX,0,windowWidth,0,1),
		y:map(mouseY,0,windowHeight,0,1),
		c1:color(document.getElementById("c1").value),
		s:document.getElementById("size").value,
		t:document.getElementById("texto1").value,
		av:document.getElementById("alphaValue").value,
		bc:false,
		session: sessionId // Include session ID in the data
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
	console.log("ALPHA : "+parseInt(data.av))
	size = data.s;
	noStroke();
	fill(col1);
	ellipse(x,y,parseInt(size),parseInt(size));
	//ellipse(data.x,data.y,size,size);
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

// Create a visual indicator for the current session
function createSessionIndicator() {
	// Create a div element for the session indicator
	sessionIndicator = createDiv(`Sesión: ${sessionId}`);
	sessionIndicator.position(10, 10);
	sessionIndicator.style('background-color', 'rgba(0, 0, 0, 0.7)');
	sessionIndicator.style('color', 'white');
	sessionIndicator.style('padding', '5px 10px');
	sessionIndicator.style('border-radius', '5px');
	sessionIndicator.style('font-family', 'Arial, sans-serif');
	sessionIndicator.style('z-index', '1000');
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

