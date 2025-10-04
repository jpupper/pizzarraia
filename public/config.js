const APP_PATH = 'pizarraia';  // Variable global para el nombre de la aplicación
const PORT = 3025;  // Variable global para el puerto

const config = {
  // Get session ID from URL parameter, default to 0 if not present
  getSessionId: function() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sesion') || '0';
  },
  
  getSocketConfig: function() {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
      return {
        url: `http://localhost:${PORT}`,
        options: {
          path: `/${APP_PATH}/socket.io`
        }
      };
    } else {
      return {
        url: 'https://vps-4455523-x.dattaweb.com',
        options: {
          path: `/${APP_PATH}/socket.io`
        }
      };
    }
  },
  
  // Configuración para los controles de sockets
  sockets: {
    receiveEnabled: true,  // Por defecto, recibir sockets está activado
    sendEnabled: true      // Por defecto, enviar sockets está activado
  },
  
  // Configuración de sliders - Valores mínimos, máximos y por defecto
  sliders: {
    // Sliders globales
    alphaValue: {
      min: 0,
      max: 255,
      default: 255,
      step: 1
    },
    size: {
      min: 0,
      max: 100,
      default: 20,
      step: 0.1
    },
    
    // Pixel Brush
    gridCols: {
      min: 4,
      max: 64,
      default: 32,
      step: 4
    },
    gridRows: {
      min: 4,
      max: 64,
      default: 32,
      step: 4
    },
    
    // Art Brush
    particleCount: {
      min: 1,
      max: 30,
      default: 10,
      step: 1
    },
    speedForce: {
      min: 0.1,
      max: 2.0,
      default: 0.5,
      step: 0.1
    },
    maxSpeed: {
      min: 0.1,
      max: 3.0,
      default: 0.5,
      step: 0.1
    },
    particleLife: {
      min: 50,
      max: 500,
      default: 255,
      step: 10
    },
    particleMaxSize: {
      min: 1,
      max: 20,
      default: 8,
      step: 1
    },
    
    // Text Brush
    textSize: {
      min: 10,
      max: 200,
      default: 40,
      step: 5
    },
    
    // Geometry Brush
    polygonSides: {
      min: 2,
      max: 10,
      default: 5,
      step: 1
    },
    
    // Fill Brush
    fillTolerance: {
      min: 0,
      max: 50,
      default: 0,
      step: 1
    }
  }
};
