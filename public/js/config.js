const APP_PATH = 'pizzarraia';  // Variable global para el nombre de la aplicación
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
      : 'https://vps-4455523-x.dattaweb.com'; // Dirección del motor de sockets en el VPS
  },

  // Path base de la aplicación
  get BASE_URL() {
    return `/${APP_PATH}`;
  },

  // Get session ID from URL parameter, default to 0 if not present
  getSessionId: function () {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sesion') || '0';
  },

  getSocketConfig: function () {
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
      default: 255,
      step: 1
    },
    size: {
      min: 0,
      max: 100,
      default: 35,
      step: 0.1
    },
    autocleanOpacity: {
      min: 0,
      max: 255,
      default: 0,
      step: 1
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

// ============================================================
// JPCONNECT — el acceso unificado del ecosistema Fullscreen
// ============================================================
// El login de esta app ES el de JPCONNECT (no hay formulario propio):
//   * páginas humanas (login, registro, perfil) -> dominio público
//   * API (sso-check, verify, logout)           -> SIEMPRE el VPS directo
// Regla §1.b del manual FSC: el salto 307 del .htaccess borra el header
// Authorization, así que la API nunca se arma con FSCAUTH_URL.
config.FSCAUTH_URL = 'https://fullscreencode.com/jpconnect';
config.FSCAUTH_API = 'https://vps-4455523-x.dattaweb.com/jpconnect/api';
config.FSC_ORIGIN = APP_PATH;   // lo que identifica a esta app ante JPCONNECT

// Token management functions
config.saveToken = function (token) {
  localStorage.setItem('pizarracollab_token', token);
};

config.getToken = function () {
  // La sesión puede estar con la clave de esta app o con las del ECOSISTEMA
  // ('token', la que dejan el login unificado de JPCONNECT y el include del fondo):
  // se adoptan las dos y se descarta el texto 'undefined' de un SSO incompleto.
  var t = localStorage.getItem('pizarracollab_token') || localStorage.getItem('token') || '';
  t = String(t).replace(/^"|"$/g, '');
  if (!t || t === 'undefined' || t === 'null' || t.split('.').length !== 3) return null;
  return t;
};

config.removeToken = function () {
  localStorage.removeItem('pizarracollab_token');
};

config.getAuthHeaders = function () {
  const token = this.getToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  return {};
};

config.saveUser = function (user) {
  localStorage.setItem('pizarracollab_user', JSON.stringify(user));
};

config.getCurrentUser = function () {
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

config.removeUser = function () {
  localStorage.removeItem('pizarracollab_user');
};

// Exponer la configuración globalmente
// El estándar FSC exige el nombre `window.CONFIG` (auth.js y los módulos
// compartidos lo buscan así); la app venía usando `config`, que se mantiene
// como alias para no romper las páginas existentes.
window.CONFIG = config;
window.config = config;
