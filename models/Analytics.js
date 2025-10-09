const mongoose = require('mongoose');

// Schema para almacenar interacciones individuales
const interactionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  username: {
    type: String,
    default: 'Anónimo'
  },
  interactionType: {
    type: String,
    enum: ['click', 'touch', 'draw', 'brush_change', 'color_change'],
    default: 'click'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Schema para estadísticas agregadas por hora
const hourlyStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  sessionId: {
    type: String,
    required: true
  },
  totalInteractions: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  touchCount: {
    type: Number,
    default: 0
  },
  drawCount: {
    type: Number,
    default: 0
  },
  uniqueUsers: {
    type: Number,
    default: 0
  },
  usersList: [{
    type: String
  }]
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
hourlyStatsSchema.index({ date: 1, hour: 1, sessionId: 1 }, { unique: true });

const Interaction = mongoose.model('Interaction', interactionSchema);
const HourlyStats = mongoose.model('HourlyStats', hourlyStatsSchema);

module.exports = {
  Interaction,
  HourlyStats
};
