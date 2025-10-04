
var GUI = document.getElementById("gui");
var MODAL = document.getElementById("modal");
var isModalOpen = true;

window.onload = function() {
    initializeSlidersFromConfig();
    setupButtonEvents();
    setupCloseButton();
    setupBrushTypeEvents();
    setupBrushSelector();
    setupChat();
    setupTabs();
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
    const sliderIds = ['alphaValue', 'size', 'kaleidoSegments', 'gridCols', 'gridRows', 'particleCount', 'speedForce', 'maxSpeed', 'particleLife', 'particleMaxSize', 'textSize', 'polygonSides', 'fillTolerance'];
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
  const kaleidoSegmentsInput = document.getElementById('kaleidoSegments');
  
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
  
  if (kaleidoSegmentsInput) {
    kaleidoSegmentsInput.addEventListener('input', function() {
      updateSliderValue('kaleidoSegments');
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

// Función para configurar el selector visual de pinceles
function setupBrushSelector() {
  const brushButtons = document.querySelectorAll('.brush-btn');
  const brushTypeInput = document.getElementById('brushType');
  
  brushButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remover clase active de todos los botones
      brushButtons.forEach(btn => btn.classList.remove('active'));
      
      // Agregar clase active al botón clickeado
      this.classList.add('active');
      
      // Actualizar el valor del input hidden
      const brushValue = this.getAttribute('data-brush');
      brushTypeInput.value = brushValue;
      
      // Disparar evento change para que se actualicen los parámetros
      const event = new Event('change');
      brushTypeInput.dispatchEvent(event);
    });
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

// Función para configurar los controles de sockets
function setupSocketControls() {
  const toggleReceiveBtn = document.getElementById('toggleReceive');
  const toggleSendBtn = document.getElementById('toggleSend');
  const sessionInput = document.getElementById('sessionInput');
  const changeSessionBtn = document.getElementById('changeSession');
  
  // Inicializar el campo de sesión con la sesión actual
  sessionInput.value = config.getSessionId();
  
  // Inicializar los botones según la configuración actual
  if (!config.sockets.receiveEnabled) {
    toggleReceiveBtn.classList.remove('active');
    toggleReceiveBtn.classList.add('inactive');
  }
  
  if (!config.sockets.sendEnabled) {
    toggleSendBtn.classList.remove('active');
    toggleSendBtn.classList.add('inactive');
  }
  
  // Configurar evento para el botón de recepción de sockets
  toggleReceiveBtn.addEventListener('click', function() {
    // Cambiar el estado
    config.sockets.receiveEnabled = !config.sockets.receiveEnabled;
    
    // Actualizar la apariencia del botón
    if (config.sockets.receiveEnabled) {
      this.classList.remove('inactive');
      this.classList.add('active');
      console.log('Recepción de sockets activada');
    } else {
      this.classList.remove('active');
      this.classList.add('inactive');
      console.log('Recepción de sockets desactivada');
      
      // Si se desactiva la recepción, actualizar el contador de cursores
      const cursorCountElement = document.getElementById('cursorCount');
      if (cursorCountElement) {
        cursorCountElement.textContent = 'Cursores: 0 (recepción desactivada)';
      }
    }
  });
  
  // Configurar evento para el botón de envío de sockets
  toggleSendBtn.addEventListener('click', function() {
    // Cambiar el estado
    config.sockets.sendEnabled = !config.sockets.sendEnabled;
    
    // Actualizar la apariencia del botón
    if (config.sockets.sendEnabled) {
      this.classList.remove('inactive');
      this.classList.add('active');
      console.log('Envío de sockets activado');
    } else {
      this.classList.remove('active');
      console.log('Envío de sockets desactivado');
    }
  });
  
  // Configurar evento para el cambio de sesión automático
  sessionInput.addEventListener('input', function() {
    const newSession = this.value.trim();
    if (newSession === '') {
      return; // No hacer nada si está vacío
    }
    
    // Esperar un momento antes de cambiar la sesión para dar tiempo a que el usuario termine de escribir
    clearTimeout(this.sessionChangeTimeout);
    this.sessionChangeTimeout = setTimeout(function() {
      // Construir la nueva URL con el parámetro de sesión
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('sesion', newSession);
      
      // Cambiar la sesión sin alertas ni confirmaciones
      window.location.href = currentUrl.toString();
    }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir
  });
  
  // Permitir presionar Enter para cambiar inmediatamente
  sessionInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      clearTimeout(this.sessionChangeTimeout);
      const newSession = this.value.trim();
      if (newSession !== '') {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('sesion', newSession);
        window.location.href = currentUrl.toString();
      }
    }
  });
  
  // Ocultar el botón de cambiar sesión ya que ahora es automático
  if (changeSessionBtn) {
    changeSessionBtn.style.display = 'none';
  }
}

// ============================================================
// FUNCIONES DE CHAT
// ============================================================

// Función para generar un nombre de usuario basado en el hash de conexión
function generateUsername(socketId) {
  const adjectives = ['Rápido', 'Brillante', 'Creativo', 'Mágico', 'Épico', 'Salvaje', 'Cósmico', 'Eléctrico', 'Místico', 'Veloz'];
  const nouns = ['Artista', 'Pintor', 'Dibujante', 'Creador', 'Maestro', 'Genio', 'Visionario', 'Soñador', 'Explorador', 'Aventurero'];
  
  // Usar el socketId como semilla para generar un nombre consistente
  let hash = 0;
  for (let i = 0; i < socketId.length; i++) {
    hash = ((hash << 5) - hash) + socketId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const number = Math.abs(hash >> 16) % 100;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`;
}

// Función para configurar el chat
function setupChat() {
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatUsernameSpan = document.getElementById('chatUsername');
  
  if (!chatInput || !sendChatBtn || !chatMessages) {
    console.warn('Elementos del chat no encontrados');
    return;
  }
  
  // Esperar a que el socket esté conectado para generar el nombre
  let username = '';
  
  socket.on('connect', function() {
    // Generar nombre de usuario para este cliente basado en el socket ID
    username = generateUsername(socket.id);
    console.log('Username generado:', username);
    
    // Mostrar el nombre de usuario en la interfaz
    if (chatUsernameSpan) {
      chatUsernameSpan.textContent = username;
    }
  });
  
  // Si ya está conectado, generar el nombre inmediatamente
  if (socket.connected) {
    username = generateUsername(socket.id);
    console.log('Username generado (ya conectado):', username);
    if (chatUsernameSpan) {
      chatUsernameSpan.textContent = username;
    }
  }
  
  // Función para enviar mensaje
  function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;
    
    // Enviar mensaje por socket
    socket.emit('chat_message', {
      username: username,
      message: message,
      session: sessionId,
      timestamp: Date.now()
    });
    
    // Limpiar input
    chatInput.value = '';
  }
  
  // Event listener para el botón de enviar
  sendChatBtn.addEventListener('click', sendMessage);
  
  // Event listener para presionar Enter
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Recibir mensajes de chat
  socket.on('chat_message', function(data) {
    // Verificar que el mensaje es de la misma sesión
    if (data.session !== sessionId) return;
    
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'chat-username';
    usernameSpan.textContent = data.username + ':';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'chat-text';
    textSpan.textContent = ' ' + data.message;
    
    messageDiv.appendChild(usernameSpan);
    messageDiv.appendChild(textSpan);
    
    // Agregar mensaje al contenedor
    chatMessages.appendChild(messageDiv);
    
    // Scroll automático al último mensaje
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// ============================================================
// FUNCIONES DE PESTAÑAS
// ============================================================

// Función para configurar el sistema de pestañas
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Remover clase active de todos los botones
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Agregar clase active al botón clickeado
      this.classList.add('active');
      
      // Ocultar todo el contenido de las pestañas
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Mostrar el contenido de la pestaña seleccionada
      const selectedTab = document.getElementById('tab-' + tabName);
      if (selectedTab) {
        selectedTab.classList.add('active');
      }
      
      console.log('Pestaña cambiada a:', tabName);
    });
  });
}