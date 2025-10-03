


var GUI = document.getElementById("gui");
var MODAL = document.getElementById("modal");
var isModalOpen = true;

window.onload = function() {
    initializeSlidersFromConfig();
    setupButtonEvents();
    setupCloseButton();
    setupBrushTypeEvents();
};

// Función para inicializar sliders desde config.js
function initializeSlidersFromConfig() {
    if (!config || !config.sliders) {
        console.warn('Config.sliders no está definido');
        return;
    }
    
    const sliders = config.sliders;
    
    // Aplicar configuración a cada slider
    Object.keys(sliders).forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        if (slider) {
            const sliderConfig = sliders[sliderId];
            slider.min = sliderConfig.min;
            slider.max = sliderConfig.max;
            slider.value = sliderConfig.default;
            slider.step = sliderConfig.step;
            
            console.log(`Slider ${sliderId} configurado: min=${sliderConfig.min}, max=${sliderConfig.max}, value=${sliderConfig.default}, step=${sliderConfig.step}`);
        }
    });
    
    // Inicializar variables globales del Art Brush con los valores por defecto
    if (config.sliders.speedForce) {
        window.artBrushSpeedForce = config.sliders.speedForce.default;
        console.log('artBrushSpeedForce inicializado a:', window.artBrushSpeedForce);
    }
    if (config.sliders.maxSpeed) {
        window.artBrushMaxSpeed = config.sliders.maxSpeed.default;
        console.log('artBrushMaxSpeed inicializado a:', window.artBrushMaxSpeed);
    }
    
    // Actualizar los valores numéricos iniciales
    updateAllSliderValues();
}

// Función para actualizar el valor numérico de un slider
function updateSliderValue(sliderId) {
    const slider = document.getElementById(sliderId);
    const valueSpan = document.getElementById(sliderId + '-value');
    
    if (slider && valueSpan) {
        let value = slider.value;
        // Formatear según el tipo de slider
        if (sliderId === 'size' || sliderId === 'speedForce' || sliderId === 'maxSpeed') {
            value = parseFloat(value).toFixed(1);
        } else {
            value = parseInt(value);
        }
        valueSpan.textContent = value;
    }
}

// Función para actualizar todos los valores numéricos
function updateAllSliderValues() {
    const sliderIds = ['alphaValue', 'size', 'gridCols', 'gridRows', 'particleCount', 'speedForce', 'maxSpeed', 'particleLife', 'particleMaxSize', 'textSize', 'polygonSides', 'fillTolerance'];
    sliderIds.forEach(sliderId => updateSliderValue(sliderId));
}

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
  // Event listeners para sliders globales
  const alphaValueInput = document.getElementById('alphaValue');
  const sizeInput = document.getElementById('size');
  
  if (alphaValueInput) {
    alphaValueInput.addEventListener('input', function() {
      updateSliderValue('alphaValue');
    });
  }
  
  if (sizeInput) {
    sizeInput.addEventListener('input', function() {
      updateSliderValue('size');
    });
  }
  
  const brushTypeSelect = document.getElementById('brushType');
  const classicBrushParams = document.getElementById('classicBrushParams');
  const pixelBrushParams = document.getElementById('pixelBrushParams');
  const artBrushParams = document.getElementById('artBrushParams');
  const textBrushParams = document.getElementById('textBrushParams');
  const geometryBrushParams = document.getElementById('geometryBrushParams');
  const fillBrushParams = document.getElementById('fillBrushParams');
  
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
      case 'text':
        textBrushParams.style.display = 'block';
        break;
      case 'geometry':
        geometryBrushParams.style.display = 'block';
        break;
      case 'fill':
        fillBrushParams.style.display = 'block';
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
    updateSliderValue('gridCols');
  });
  
  gridRowsInput.addEventListener('input', function() {
    if (window.gridRows) {
      window.gridRows = parseInt(this.value);
      updateGridDimensions();
      updateGridBuffer(); // Update grid buffer when rows change
    }
    updateSliderValue('gridRows');
  });
  
  showGridCheckbox.addEventListener('change', function() {
    // Solo actualizar el buffer de la grilla cuando cambia la visibilidad
    updateGridBuffer();
  });
  
  // Add event listeners for art brush parameters
  const particleCountInput = document.getElementById('particleCount');
  const speedForceInput = document.getElementById('speedForce');
  const maxSpeedInput = document.getElementById('maxSpeed');
  const particleLifeInput = document.getElementById('particleLife');
  const particleMaxSizeInput = document.getElementById('particleMaxSize');
  
  particleCountInput.addEventListener('input', function() {
    // Asignar directamente el valor del slider a la variable global
    window.particleCount = parseInt(this.value);
    console.log('Particle count actualizado:', window.particleCount);
    updateSliderValue('particleCount');
  });
  
  // Event listener for speed force slider
  speedForceInput.addEventListener('input', function() {
    // Actualizar el multiplicador de velocidad
    const speedForce = parseFloat(this.value);
    console.log('Speed Force slider cambiado a:', speedForce);
    updateArtBrushParameters({ speedForce: speedForce });
    updateSliderValue('speedForce');
  });
  
  // Event listener for max speed slider
  maxSpeedInput.addEventListener('input', function() {
    // Actualizar el límite máximo de velocidad
    const maxSpeed = parseFloat(this.value);
    console.log('Max Speed slider cambiado a:', maxSpeed);
    updateArtBrushParameters({ maxSpeed: maxSpeed });
    updateSliderValue('maxSpeed');
  });
  
  // Event listener for particle life slider
  particleLifeInput.addEventListener('input', function() {
    // Actualizar la vida de las partículas
    const particleLife = parseInt(this.value);
    updateArtBrushParameters({ particleLife: particleLife });
    updateSliderValue('particleLife');
  });
  
  // Event listener for particle size slider
  particleMaxSizeInput.addEventListener('input', function() {
    // Actualizar el tamaño máximo de las partículas
    const particleMaxSize = parseInt(this.value);
    updateArtBrushParameters({ particleMaxSize: particleMaxSize });
    updateSliderValue('particleMaxSize');
  });
  
  // Add event listeners for text brush parameters
  const textSizeInput = document.getElementById('textSize');
  
  textSizeInput.addEventListener('input', function() {
    updateSliderValue('textSize');
  });
  
  // Add event listeners for geometry brush parameters
  const polygonSidesInput = document.getElementById('polygonSides');
  
  polygonSidesInput.addEventListener('input', function() {
    updateSliderValue('polygonSides');
  });
  
  // Add event listeners for fill brush parameters
  const fillToleranceInput = document.getElementById('fillTolerance');
  
  fillToleranceInput.addEventListener('input', function() {
    updateSliderValue('fillTolerance');
  });
}

// Función para actualizar los parámetros del Art Brush
function updateArtBrushParameters(params) {
  // Verificar si el sistema de partículas está inicializado
  if (typeof artBrushParticleSystem === 'undefined') {
    console.warn('Art Brush Particle System no está inicializado');
    return;
  }
  
  // Actualizar el multiplicador de velocidad (Speed Force)
  if (params.speedForce !== undefined) {
    window.artBrushSpeedForce = params.speedForce;
    console.log('artBrushSpeedForce actualizado a:', window.artBrushSpeedForce);
  }
  
  // Actualizar el límite máximo de velocidad (Max Speed)
  if (params.maxSpeed !== undefined) {
    window.artBrushMaxSpeed = params.maxSpeed;
    console.log('artBrushMaxSpeed actualizado a:', window.artBrushMaxSpeed);
  }
  
  // Actualizar la vida de las partículas
  if (params.particleLife !== undefined) {
    window.artBrushParticleLife = params.particleLife;
  }
  
  // Actualizar el tamaño máximo de las partículas
  if (params.particleMaxSize !== undefined) {
    window.artBrushParticleMaxSize = params.particleMaxSize;
  }
}

// Función para descargar la imagen del drawBuffer en alta calidad
function downloadImage() {
  if (!window.drawBuffer) {
    console.error('drawBuffer no está disponible');
    return;
  }
  
  // Obtener el canvas del drawBuffer
  const canvas = drawBuffer.canvas;
  
  // Crear un nombre de archivo con timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `pizarraia_${timestamp}.png`;
  
  // Convertir el canvas a blob y descargar
  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`Imagen descargada: ${filename}`);
  }, 'image/png', 1.0); // Calidad máxima (1.0)
}