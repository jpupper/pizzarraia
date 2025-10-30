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
      name: { type: String, required: true }, // Nombre descriptivo de la imagen
      imageData: { type: String, required: true }, // Base64 de la imagen
      category: { type: String, default: 'general' } // Categoría opcional para organizar
    }]
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
