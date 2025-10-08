const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Sin título'
  },
  description: {
    type: String,
    default: ''
  },
  imageData: {
    type: String,
    required: true  // Base64 encoded image
  },
  savedBy: {
    type: String,
    required: true  // Username del que guardó la imagen
  },
  collaborators: [{
    socketId: String,
    username: String,
    connectedAt: Date
  }],
  sessionId: {
    type: String,
    default: '0'
  },
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Image', imageSchema);
