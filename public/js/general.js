var GUI = document.getElementById("gui");
var MODAL = document.getElementById("modal");

window.onload = function() {
    initializeSlidersFromConfig();
    setupButtonEvents();
    setupCloseButton();
    setupBrushTypeEvents();
    setupBrushSelector();
    setupColorPalette();
    renderLayerButtons(); // Renderizar capas dinámicamente
    setupLayerSelector();
    setupSocketControls();
    setupChat();
    setupTabs();
    checkUserAuthentication();
    setRandomFirstColor(); // Color random en primer slot
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
    
    // Eventos de hover
    openButton.addEventListener("mouseover", () => {
        isOverOpenButton = true;
    });
    openButton.addEventListener("mouseout", () => {
        isOverOpenButton = false;
    });
    
    // Evento de click para abrir el GUI
    openButton.addEventListener("click", () => {
        openGui();
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
  const imageBrushParams = document.getElementById('imageBrushParams');
  
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
      case 'image':
        imageBrushParams.style.display = 'block';
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
    updateArtBrushParameters({ fillTolerance: parseInt(this.value) });
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
      
      // Track brush change
      if (window.analyticsTracker) {
        window.analyticsTracker.trackBrushChange(brushValue);
      }
      
      // Disparar evento change para que se actualicen los parámetros
      const event = new Event('change');
      brushTypeInput.dispatchEvent(event);
    });
  });
}

// Función para configurar el selector de capas
function setupLayerSelector() {
  const layerButtons = document.querySelectorAll('.layer-btn');
  const visibilityButtons = document.querySelectorAll('.layer-visibility-btn');
  const layerPreviews = document.querySelectorAll('[id^="layerPreview"]');
  
  if (!layerButtons || layerButtons.length === 0) return;
  
  // Event listeners para botones de selección de capa
  layerButtons.forEach((button, index) => {
    button.addEventListener('click', function() {
      // Remover clase active de todos los botones
      layerButtons.forEach(btn => btn.classList.remove('active'));
      
      // Agregar clase active al botón clickeado
      this.classList.add('active');
      
      // Actualizar la capa activa en sketch.js
      const layerIndex = parseInt(this.getAttribute('data-layer'));
      if (typeof window.activeLayer !== 'undefined') {
        window.activeLayer = layerIndex;
        console.log('Capa activa cambiada a:', layerIndex);
      }
    });
  });
  
  // Event listeners para botones de visibilidad
  visibilityButtons.forEach((button, index) => {
    button.addEventListener('click', function() {
      const layerIndex = parseInt(this.getAttribute('data-layer'));
      
      // Toggle visibilidad
      if (typeof window.layerVisibility !== 'undefined') {
        window.layerVisibility[layerIndex] = !window.layerVisibility[layerIndex];
        
        // Toggle clase active
        if (window.layerVisibility[layerIndex]) {
          this.classList.add('active');
          console.log('Capa', layerIndex, 'visible');
        } else {
          this.classList.remove('active');
          console.log('Capa', layerIndex, 'oculta');
        }
      }
    });
  });
  
  // Event listeners para previsualizaciones (clickear para seleccionar capa)
  layerPreviews.forEach((preview, index) => {
    preview.addEventListener('click', function() {
      const layerIndex = parseInt(this.id.replace('layerPreview', ''));
      
      // Remover clase active de todos los botones
      layerButtons.forEach(btn => btn.classList.remove('active'));
      
      // Agregar clase active al botón correspondiente
      const targetButton = document.querySelector(`.layer-btn[data-layer="${layerIndex}"]`);
      if (targetButton) {
        targetButton.classList.add('active');
      }
      
      // Actualizar la capa activa
      if (typeof window.activeLayer !== 'undefined') {
        window.activeLayer = layerIndex;
        console.log('Capa activa cambiada a:', layerIndex, '(desde preview)');
      }
    });
    
    // Cambiar cursor al pasar sobre el preview
    preview.style.cursor = 'pointer';
  });
}

// Función para configurar la paleta de colores
function setupColorPalette() {
  const paletteSlots = document.querySelectorAll('.palette-slot');
  const colorInput = document.getElementById('c1');
  
  if (!paletteSlots || !colorInput) return;
  
  // Event listener para cuando cambia el color picker
  colorInput.addEventListener('input', function() {
    // Actualizar el color del slot activo en el GUI
    const activeSlot = document.querySelector('.palette-slot.active');
    if (activeSlot) {
      activeSlot.style.backgroundColor = this.value;
    }
    
    // Actualizar el color del slot activo en cursorGUI
    if (window.cursorGUI) {
      window.cursorGUI.updateActivePaletteSlot(this.value);
    }
    
    // Track color change
    if (window.analyticsTracker) {
      window.analyticsTracker.trackColorChange(this.value);
    }
  });
  
  // Event listeners para los slots
  paletteSlots.forEach((slot, index) => {
    slot.addEventListener('click', function() {
      // Remover clase active de todos los slots
      paletteSlots.forEach(s => {
        s.classList.remove('active');
        s.style.border = '2px solid rgba(255,255,255,0.3)';
      });
      
      // Agregar clase active al slot clickeado
      this.classList.add('active');
      this.style.border = '3px solid white';
      
      // Actualizar el color picker con el color del slot
      const slotColor = this.style.backgroundColor;
      // Convertir rgb a hex
      const rgb = slotColor.match(/\d+/g);
      if (rgb) {
        const hex = '#' + rgb.map(x => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        colorInput.value = hex;
      }
      
      // Actualizar el slot activo en cursorGUI
      if (window.cursorGUI) {
        window.cursorGUI.selectPaletteSlot(index);
      }
      
      console.log('Slot de paleta seleccionado:', index);
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

// Función para descargar la imagen combinando todas las capas visibles
function downloadImage() {
  // Verificar que la función renderAllLayers existe
  if (typeof window.renderAllLayers !== 'function') {
    console.error('renderAllLayers no está disponible');
    return;
  }
  
  // Combinar todas las capas visibles
  const combined = window.renderAllLayers();
  
  // Obtener el canvas combinado
  const canvas = combined.canvas;
  
  // Crear un nombre de archivo con timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `pizarracollab_${timestamp}.png`;
  
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
  
  // Configurar evento para el botón de recepción de sockets (auriculares)
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
        cursorCountElement.textContent = 'Cursores: 0';
      }
    }
  });
  
  // Configurar evento para el botón de envío de sockets (ojo)
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
      this.classList.add('inactive');
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
  // Usar la función del nameGenerator.js para crear nombres consistentes
  return generarNombreAleatorio(socketId);
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
  
  // Variable para almacenar el nombre de usuario del chat
  let username = '';
  
  // Función para actualizar el nombre de usuario del chat
  function updateChatUsername() {
    // Si el usuario está logueado, usar su nombre de usuario
    if (currentUser && currentUser.username) {
      username = currentUser.username;
      console.log('Usuario del chat (logueado):', username);
    } else {
      // Si no está logueado, generar un nombre aleatorio basado en el socket ID
      if (socket && socket.id) {
        username = generateUsername(socket.id);
        console.log('Usuario del chat (generado):', username);
      }
    }
    
    // Mostrar el nombre en la interfaz
    if (chatUsernameSpan) {
      chatUsernameSpan.textContent = username;
    }
  }
  
  // Actualizar el nombre cuando el socket se conecta
  socket.on('connect', function() {
    updateChatUsername();
    // Enviar username al servidor
    if (socket && socket.connected && username) {
      socket.emit('update_username', { username: username });
    }
  });
  
  // Si ya está conectado, actualizar inmediatamente
  if (socket.connected) {
    updateChatUsername();
    // Enviar username al servidor
    if (username) {
      socket.emit('update_username', { username: username });
    }
  }
  
  // Actualizar el nombre cuando cambia el estado de autenticación
  // Esta función se llamará desde checkUserAuthentication
  window.updateChatUsername = updateChatUsername;
  
  // Función para enviar mensaje
  function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;
    
    // Enviar mensaje por socket
    if (socket && socket.connected) {
      socket.emit('chat_message', {
        username: username,
        message: message,
        session: sessionId,
        timestamp: Date.now()
      });
    }
    
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

// ============================================================
// FUNCIONES DE AUTENTICACIÓN Y GUARDADO
// ============================================================

// Variable global para almacenar el usuario actual
let currentUser = null;

// Función para verificar la autenticación del usuario
async function checkUserAuthentication() {
  try {
    const response = await fetch(`${config.API_URL}/api/check-session`, {
      headers: config.getAuthHeaders()
    });
    const data = await response.json();
    
    if (data.authenticated) {
      currentUser = data.user;
      showUserLoggedIn(data.user.username);
      
      // Actualizar el nombre del chat si la función existe
      if (typeof window.updateChatUsername === 'function') {
        window.updateChatUsername();
      }
    } else {
      currentUser = null;
      showUserNotLoggedIn();
      
      // Actualizar el nombre del chat si la función existe
      if (typeof window.updateChatUsername === 'function') {
        window.updateChatUsername();
      }
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    showUserNotLoggedIn();
  }
}

// Función para mostrar el estado de usuario logueado
function showUserLoggedIn(username) {
  const userNotLoggedIn = document.getElementById('userNotLoggedIn');
  const userLoggedIn = document.getElementById('userLoggedIn');
  const loggedUsername = document.getElementById('loggedUsername');
  
  if (userNotLoggedIn) userNotLoggedIn.style.display = 'none';
  if (userLoggedIn) userLoggedIn.style.display = 'block';
  if (loggedUsername) loggedUsername.textContent = username;
  
  console.log('Usuario logueado:', username);
}

// Función para mostrar el estado de usuario no logueado
function showUserNotLoggedIn() {
  const userNotLoggedIn = document.getElementById('userNotLoggedIn');
  const userLoggedIn = document.getElementById('userLoggedIn');
  
  if (userNotLoggedIn) userNotLoggedIn.style.display = 'block';
  if (userLoggedIn) userLoggedIn.style.display = 'none';
  
  console.log('Usuario no logueado');
}

// Función para cerrar sesión
async function logoutUser() {
  try {
    await fetch(`${config.API_URL}/api/logout`, { 
      method: 'POST',
      headers: config.getAuthHeaders()
    });
    
    // Remove token from localStorage
    config.removeToken();
    
    currentUser = null;
    showUserNotLoggedIn();
    
    // Actualizar el nombre del chat después de cerrar sesión
    if (typeof window.updateChatUsername === 'function') {
      window.updateChatUsername();
    }
    
    if (typeof toast !== 'undefined') toast.success('Sesión cerrada exitosamente');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    if (typeof toast !== 'undefined') toast.error('Error al cerrar sesión');
  }
}

// Función para abrir el modal de guardar imagen
async function saveImageToServer() {
  // Verificar si el usuario está logueado
  if (!currentUser) {
    if (typeof toast !== 'undefined') toast.warning('Debes iniciar sesión para guardar imágenes');
    // Cambiar a la pestaña de usuario
    const userTab = document.querySelector('[data-tab="user"]');
    if (userTab) userTab.click();
    return;
  }
  
  // Verificar que renderAllLayers existe
  if (typeof window.renderAllLayers !== 'function') {
    if (typeof toast !== 'undefined') toast.warning('No hay imagen para guardar');
    return;
  }
  
  // Obtener colaboradores de la sesión actual
  await loadCollaborators();
  
  // Mostrar el modal
  document.getElementById('saveImageModal').classList.add('active');
  document.getElementById('imageTitle').value = '';
  document.getElementById('imageDescription').value = '';
  document.getElementById('imageTitle').focus();
}

// Función para cerrar el modal
function closeSaveModal() {
  document.getElementById('saveImageModal').classList.remove('active');
}

// Función para cargar colaboradores
async function loadCollaborators() {
  try {
    const response = await fetch(`${config.API_URL}/api/admin/sessions`, {
      headers: config.getAuthHeaders()
    });
    const data = await response.json();
    
    const currentSessionId = config.getSessionId();
    const currentSession = data.sessions.find(s => s.sessionId === currentSessionId);
    
    const collaboratorsList = document.getElementById('collaboratorsList');
    
    if (currentSession && currentSession.users.length > 0) {
      collaboratorsList.innerHTML = currentSession.users.map(user => 
        `<span class="collaborator-chip">${escapeHtml(user.username)}</span>`
      ).join('');
    } else {
      collaboratorsList.innerHTML = '<p>Solo tú en esta sesión</p>';
    }
  } catch (error) {
    console.error('Error loading collaborators:', error);
    document.getElementById('collaboratorsList').innerHTML = '<p>No se pudieron cargar los colaboradores</p>';
  }
}

// Función para enviar el formulario de guardar
async function submitSaveImage(event) {
  event.preventDefault();
  
  const title = document.getElementById('imageTitle').value.trim();
  const description = document.getElementById('imageDescription').value.trim();
  
  try {
    // Combinar todas las capas visibles
    const combined = window.renderAllLayers();
    
    // Convertir el canvas combinado a base64
    const canvas = combined.canvas;
    const imageData = canvas.toDataURL('image/png', 1.0);
    
    // Guardar cada capa por separado
    const layersData = [];
    if (window.layers && window.layers.length > 0) {
      window.layers.forEach((layer, index) => {
        if (layer && layer.canvas) {
          layersData.push({
            index: index,
            name: index === 0 ? 'Fondo' : `Capa ${index}`,
            visible: window.layerVisibility[index] || false,
            imageData: layer.canvas.toDataURL('image/png', 1.0)
          });
        }
      });
    }
    
    // Obtener colaboradores y sesión actual
    const sessionResponse = await fetch(`${config.API_URL}/api/admin/sessions`, {
      headers: config.getAuthHeaders()
    });
    const sessionData = await sessionResponse.json();
    
    const currentSessionId = config.getSessionId();
    const currentSession = sessionData.sessions.find(s => s.sessionId === currentSessionId);
    
    const collaborators = currentSession ? currentSession.users.map(user => ({
      socketId: user.socketId,
      username: user.username,
      connectedAt: new Date()
    })) : [];
    
    // Deshabilitar botón de submit
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }
    
    // Enviar al servidor
    const response = await fetch(`${config.API_URL}/api/images`, {
      method: 'POST',
      headers: {
        ...config.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        description,
        imageData,
        layers: layersData,
        collaborators,
        sessionId: currentSessionId
      })
    });
    
    const data = await response.json();
    
    // Restaurar botón
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Imagen';
    }
    
    if (response.ok) {
      closeSaveModal();
      if (typeof toast !== 'undefined') toast.success('¡Imagen guardada exitosamente!');
      console.log('Imagen guardada:', data.image);
    } else {
      if (typeof toast !== 'undefined') toast.error('Error al guardar: ' + (data.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error guardando imagen:', error);
    if (typeof toast !== 'undefined') toast.error('Error al guardar la imagen. Por favor intenta de nuevo.');
    
    // Restaurar botón en caso de error
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar Imagen';
    }
  }
}

// Contador de caracteres para la descripción
document.addEventListener('DOMContentLoaded', () => {
  const descriptionTextarea = document.getElementById('imageDescription');
  const charCount = document.getElementById('charCount');
  
  if (descriptionTextarea && charCount) {
    descriptionTextarea.addEventListener('input', () => {
      const length = descriptionTextarea.value.length;
      charCount.textContent = `${length}/500 caracteres`;
    });
  }
});

// Función para obtener el nombre de usuario actual del chat
function getCurrentChatUsername() {
  // Si el usuario está logueado, devolver su nombre
  if (currentUser && currentUser.username) {
    return currentUser.username;
  }
  
  // Si no está logueado, generar nombre basado en socket.id
  if (typeof socket !== 'undefined' && socket && socket.id) {
    return generarNombreAleatorio(socket.id);
  }
  
  // Fallback
  return 'Usuario Anónimo';
}

// Función para compartir la sesión actual
function shareSession() {
  const currentUrl = window.location.href;
  const sessionId = config.getSessionId();
  
  // Copiar al portapapeles
  navigator.clipboard.writeText(currentUrl).then(() => {
    if (typeof toast !== 'undefined') toast.success(`¡Link copiado! Comparte esta sesión (${sessionId})`);
  }).catch(() => {
    // Fallback si no funciona el clipboard API
    prompt('Copia este link para compartir:', currentUrl);
  });
}

// Función para renderizar las capas dinámicamente
function renderLayerButtons() {
  const container = document.getElementById('layersContainer');
  if (!container || typeof window.layers === 'undefined') return;
  
  container.innerHTML = '';
  
  window.layers.forEach((layer, index) => {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding: 6px; background: rgba(138, 79, 191, 0.15); border-radius: 8px;';
    
    const isActive = window.activeLayer === index;
    const isVisible = window.layerVisibility[index];
    
    layerItem.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 3px;">
        <button class="layer-btn ${isActive ? 'active' : ''}" data-layer="${index}" style="width: 35px; height: 28px; margin: 0; font-size: 0.9rem;">${index}</button>
        <button class="layer-visibility-btn ${isVisible ? 'active' : ''}" data-layer="${index}" title="Mostrar/Ocultar Capa" style="width: 35px; height: 28px; background: rgba(138, 79, 191, 0.3); border: 2px solid var(--accent); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
          <svg viewBox="0 0 24 24" width="16" height="16" class="eye-icon">
            <path class="eye-open" fill="white" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" style="${isVisible ? '' : 'display:none;'}" />
            <path class="eye-closed" fill="white" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z" style="${isVisible ? 'display:none;' : ''}" />
          </svg>
        </button>
      </div>
      <canvas id="layerPreview${index}" width="100" height="56"></canvas>
      <span style="color: rgba(255,255,255,0.7); font-size: 0.8rem; flex: 1;">${index === 0 ? 'Fondo' : `Capa ${index}`}</span>
      ${window.layers.length > 1 ? `<button class="btn-delete-layer" onclick="deleteLayer(${index})" title="Eliminar Capa">×</button>` : ''}
    `;
    
    container.appendChild(layerItem);
  });
  
  // Re-attach event listeners
  setupLayerSelector();
  
  // Update previews
  if (typeof updateLayerPreviews === 'function') {
    updateLayerPreviews();
  }
}

// Función para establecer un color random en el primer slot de la paleta
function setRandomFirstColor() {
  // Generar color random
  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  
  // Aplicar al primer slot
  const firstSlot = document.querySelector('.palette-slot[data-slot="0"]');
  if (firstSlot) {
    firstSlot.style.backgroundColor = randomColor;
  }
  
  // Aplicar al color picker
  const colorInput = document.getElementById('c1');
  if (colorInput) {
    colorInput.value = randomColor;
  }
  
  console.log('Color random inicial:', randomColor);
}

// Función para cerrar el modal de bienvenida
function closeWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (modal) {
    modal.classList.remove('active');
    // Guardar en localStorage que ya se mostró
    localStorage.setItem('welcomeModalShown', 'true');
  }
}

// Función para mostrar el modal de bienvenida solo la primera vez
function checkWelcomeModal() {
  const hasSeenModal = localStorage.getItem('welcomeModalShown');
  const modal = document.getElementById('welcomeModal');
  
  if (!hasSeenModal && modal) {
    // Mostrar el modal después de un pequeño delay
    setTimeout(() => {
      modal.classList.add('active');
    }, 500);
  } else if (modal) {
    // Si ya lo vio, no mostrar
    modal.classList.remove('active');
  }
}

// Hacer las funciones accesibles globalmente
window.logoutUser = logoutUser;
window.saveImageToServer = saveImageToServer;
window.renderLayerButtons = renderLayerButtons;
window.closeWelcomeModal = closeWelcomeModal;

// Verificar modal de bienvenida al cargar
if (typeof window !== 'undefined') {
  window.addEventListener('load', checkWelcomeModal);
}