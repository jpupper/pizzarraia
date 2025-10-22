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
    logoImage: { type: String, default: '' } // Base64 image for session logo
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
