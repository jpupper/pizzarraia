const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorUsername: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Nueva Sesión'
  },
  description: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  allowedBrushTypes: [{
    type: String
  }],
  accessConfig: {
    notLogged: {
      allowed: { type: Boolean, default: true },
      brushes: [{ type: String }],
      restrictions: {
        allowKaleidoscope: { type: Boolean, default: true },
        allowLayers: { type: Boolean, default: true },
        allowCleanBackground: { type: Boolean, default: true }
      }
    },
    logged: {
      allowed: { type: Boolean, default: true },
      brushes: [{ type: String }],
      restrictions: {
        allowKaleidoscope: { type: Boolean, default: true },
        allowLayers: { type: Boolean, default: true },
        allowCleanBackground: { type: Boolean, default: true }
      }
    },
    specific: {
      allowed: { type: Boolean, default: false },
      users: [{ type: String }],
      brushes: [{ type: String }],
      restrictions: {
        allowKaleidoscope: { type: Boolean, default: true },
        allowLayers: { type: Boolean, default: true },
        allowCleanBackground: { type: Boolean, default: true }
      }
    }
  },
  restrictions: {
    allowKaleidoscope: { type: Boolean, default: true },
    allowLayers: { type: Boolean, default: true }
  },
  customization: {
    backgroundImage: { type: String, default: '' }, // Base64 image for gallery background
    logoImage: { type: String, default: '' }, // Base64 image for session logo
    colors: {
      background: { type: String, default: '#1a1a2e' }, // Color de fondo
      primary: { type: String, default: '#667eea' }, // Color primario (botones, highlights)
      secondary: { type: String, default: '#764ba2' }, // Color secundario (acentos)
      text: { type: String, default: '#ffffff' } // Color de tipografía
    }
  },
  initialLayers: [{
    layerIndex: { type: Number, required: true }, // Índice de la capa (0, 1, 2, etc.)
    name: { type: String, default: '' }, // Nombre opcional de la capa
    imageData: { type: String, default: '' }, // Base64 de la imagen inicial (vacío = capa negra)
    opacity: { type: Number, default: 1.0, min: 0, max: 1 }, // Opacidad de la capa
    visible: { type: Boolean, default: true } // Si la capa está visible al inicio
  }],
  defaultImageBrush: {
    enabled: { type: Boolean, default: false }, // Si está habilitado el sistema de imágenes por defecto
    images: [{ 
      // Nombre y categoría ya no son obligatorios en la UI; mantenerlos opcionales para compatibilidad
      name: { type: String, required: false },
      imageData: { type: String, required: true }, // Base64 de la imagen
      category: { type: String, default: 'general', required: false }
    }]
  },
  initialValues: {
    palette: [{ 
      color: { type: String, required: true }, // Color en formato hex
      random: { type: Boolean, default: false } // Si debe randomizarse al entrar
    }],
    alpha: { type: Number, default: 1.0, min: 0, max: 1 }, // Opacidad inicial (0-1)
    size: { type: Number, default: 10, min: 1, max: 100 }, // Tamaño de pincel inicial
    kaleidoscope: {
      slices: { type: Number, default: 1, min: 1, max: 12 } // Número de reflejos (1 = desactivado)
    },
    autoClean: { type: Number, default: 0, min: 0, max: 255 } // Opacidad del fade continuo (0 = desactivado)
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', sessionSchema);
