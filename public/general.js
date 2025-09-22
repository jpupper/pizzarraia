


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
    setupBrushTypeEvents();
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

// Function to handle brush type changes
function setupBrushTypeEvents() {
  const brushTypeSelect = document.getElementById('brushType');
  const classicBrushParams = document.getElementById('classicBrushParams');
  const pixelBrushParams = document.getElementById('pixelBrushParams');
  const artBrushParams = document.getElementById('artBrushParams');
  
  // Get all brush parameter containers
  const allBrushParams = document.querySelectorAll('.brushParams');
  
  // Initial check
  toggleBrushParams();
  
  // Add event listener for brush type changes
  brushTypeSelect.addEventListener('change', toggleBrushParams);
  
  function toggleBrushParams() {
    // Hide all brush parameter containers
    allBrushParams.forEach(container => {
      container.style.display = 'none';
    });
    
    // Show the appropriate container based on the selected brush type
    switch(brushTypeSelect.value) {
      case 'classic':
        classicBrushParams.style.display = 'block';
        break;
      case 'pixel':
        pixelBrushParams.style.display = 'block';
        break;
      case 'art':
        artBrushParams.style.display = 'block';
        break;
    }
  }
  
  // Add event listeners for grid parameters (Pixel Brush)
  const gridColsInput = document.getElementById('gridCols');
  const gridRowsInput = document.getElementById('gridRows');
  const showGridCheckbox = document.getElementById('showGrid');
  
  gridColsInput.addEventListener('input', function() {
    if (window.gridCols) {
      window.gridCols = parseInt(this.value);
      updateGridDimensions();
      updateGridBuffer(); // Update grid buffer when columns change
    }
  });
  
  gridRowsInput.addEventListener('input', function() {
    if (window.gridRows) {
      window.gridRows = parseInt(this.value);
      updateGridDimensions();
      updateGridBuffer(); // Update grid buffer when rows change
    }
  });
  
  showGridCheckbox.addEventListener('change', function() {
    // Solo actualizar el buffer de la grilla cuando cambia la visibilidad
    updateGridBuffer();
  });
  
  // Add event listeners for art brush parameters
  const starPointsInput = document.getElementById('starPoints');
  
  starPointsInput.addEventListener('input', function() {
    if (window.starPoints !== undefined) {
      window.starPoints = parseInt(this.value);
    }
  });
}