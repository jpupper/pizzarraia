const APP_PATH = 'pizarraia';  // Variable global para el nombre de la aplicación
const PORT = 3025;  // Variable global para el puerto

const config = {
  // Detectar si estamos en local o en VPS
  isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  
  // URL de la API (incluye el path base)
  get API_URL() {
    return this.isLocal 
      ? `http://localhost:${PORT}/${APP_PATH}` 
      : `https://vps-4455523-x.dattaweb.com/${APP_PATH}`;
  },
  
  // URL para Socket.IO
  get SOCKET_URL() {
    return this.isLocal 
      ? `http://localhost:${PORT}` 
      : 'https://vps-4455523-x.dattaweb.com';
  },
  
  // Path base de la aplicación
  get BASE_URL() {
    return `/${APP_PATH}`;
  },
  
  // Get session ID from URL parameter, default to 0 if not present
  getSessionId: function() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sesion') || '0';
  },
  
  getSocketConfig: function() {
    return {
      url: this.SOCKET_URL,
      options: {
        path: `${this.BASE_URL}/socket.io`
      }
    };
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
      default: 150,
      step: 1
    },
    size: {
      min: 0,
      max: 100,
      default: 10,
      step: 0.1
    },
    kaleidoSegments: {
      min: 1,
      max: 16,
      default: 1,
      step: 1
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

// Token management functions
config.saveToken = function(token) {
  localStorage.setItem('pizarracollab_token', token);
};

config.getToken = function() {
  return localStorage.getItem('pizarracollab_token');
};

config.removeToken = function() {
  localStorage.removeItem('pizarracollab_token');
};

config.getAuthHeaders = function() {
  const token = this.getToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  return {};
};

config.saveUser = function(user) {
  localStorage.setItem('pizarracollab_user', JSON.stringify(user));
};

config.getCurrentUser = function() {
  const userStr = localStorage.getItem('pizarracollab_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

config.removeUser = function() {
  localStorage.removeItem('pizarracollab_user');
};

// Exponer la configuración globalmente
window.config = config;
