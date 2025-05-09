


var GUI = document.getElementById("gui");
var MODAL = document.getElementById("modal");
var isModalOpen = true;

/*
document.getElementById("gui").onmouseout = function(event) {
  console.log("AFUERA");
};
document.getElementById("gui").onmouseover = function(event) {
  console.log("ADENTRO");
};*/

window.onload = function() {
    setupButtonEvents();
    setupCloseButton();
};

function setupCloseButton() {
    const closeButton = document.getElementById("closeButton");
    closeButton.addEventListener("click", closeGui);
    closeButton.addEventListener("mouseover", () => {
        isOverGui = true;
    });
    closeButton.addEventListener("mouseout", () => {
        isOverGui = false;
    });
}

function setupButtonEvents() {
    const openButton = document.getElementById("opengui");
    openButton.addEventListener("mouseover", () => {
        isOverOpenButton = true;
    });
    openButton.addEventListener("mouseout", () => {
        isOverOpenButton = false;
    });
}

function updateCurrentFont() {
    const select = document.getElementById("fontSelector");
    const textoInput = document.getElementById("texto1");
    
    // Actualizar el estilo del select
    select.style.fontFamily = select.value;
    // Actualizar el estilo del input de texto
    textoInput.style.fontFamily = select.value;
}

function openGui(){
	console.log("ABRIR GUI");
	document.getElementById("gui").style.display = "block";
	document.getElementById("opengui").style.display = "none";
	isRandomValues = false;
}

function closeGui(){
	console.log("CERRAR GUI");
	document.getElementById("gui").style.display = "none";
	document.getElementById("opengui").style.display = "block";
}


$("#gui").mouseover(function() {
  //console.log("ENTRA PLIS");
  isOverGui = true;
});

$("#gui").mouseleave(function() {
 // console.log("SALE PLIS");
  isOverGui = false;
});

// Touch events for mobile
$("#gui").on("touchstart", function() {
  isOverGui = true;
});

$("#gui").on("touchend", function() {
  // Keep isOverGui true to prevent accidental drawing when touching GUI elements
  setTimeout(function() {
    if (!$.contains(document.getElementById("gui"), document.activeElement)) {
      isOverGui = false;
    }
  }, 100);
});