const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const Image = require('./models/Image');
const Session = require('./models/Session');
const { Interaction, HourlyStats } = require('./models/Analytics');

const app = express();
const hostname = '0.0.0.0';
const port = 3025;
const APP_PATH = 'pizzarraia';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pizzarraia';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    // Crear usuario global de sistema si no existe
    try {
      const systemUser = await User.findOne({ username: 'sistema' });
      if (!systemUser) {
        const newSystemUser = new User({
          username: 'sistema',
          password: 'ayp0624',
          permissions: {
            canCreateSessions: true,
            canAccessAdmin: true
          }
        });
        await newSystemUser.save();
        console.log('✅ Usuario de sistema creado: sistema / ayp0624');
      } else {
        console.log('✅ Usuario de sistema ya existe');
      }
    } catch (error) {
      console.error('❌ Error creando usuario de sistema:', error);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// CORS configuration - Allow requests from any origin
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Allow all origins
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

// Middleware - Aumentar límite para imágenes con múltiples capas
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Session storage in memory (simple approach)
// Maps sessionToken -> userId
const activeSessions = new Map();

// Generate random session token
function generateSessionToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Middleware to extract user from Authorization header
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userId = activeSessions.get(token);
    if (userId) {
      req.userId = userId;
      req.sessionToken = token;
    }
  }
  next();
});

// Serve static files under /pizzarraia path
app.use('/pizzarraia', express.static(path.join(__dirname, 'public')));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.userId) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

// Middleware to check admin permissions
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.permissions || !user.permissions.canAccessAdmin) {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }
    next();
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return res.status(500).json({ error: 'Error verificando permisos' });
  }
};

// Main route
app.get('/pizzarraia', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Root route
app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Pizarraia Server');
});

// API Routes
// Register
app.post('/pizzarraia/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const user = new User({ username, password });
    await user.save();

    // Generate session token
    const token = generateSessionToken();
    activeSessions.set(token, user._id.toString());

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login
app.post('/pizzarraia/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generate session token
    const token = generateSessionToken();
    activeSessions.set(token, user._id.toString());

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Logout
app.post('/pizzarraia/api/logout', (req, res) => {
  if (req.sessionToken) {
    activeSessions.delete(req.sessionToken);
  }
  res.json({ success: true });
});

// Get current user
app.get('/pizzarraia/api/user', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Check session
app.get('/pizzarraia/api/check-session', async (req, res) => {
  if (req.userId) {
    try {
      const user = await User.findById(req.userId).select('-password');
      res.json({
        authenticated: true,
        user: {
          id: user._id,
          username: user.username
        }
      });
    } catch (error) {
      res.json({ authenticated: false });
    }
  } else {
    res.json({ authenticated: false });
  }
});

// Save image
app.post('/pizzarraia/api/images', isAuthenticated, async (req, res) => {
  try {
    const { title, description, imageData, layers, collaborators, sessionId } = req.body;

    // Logs de debug
    console.log('=== RECIBIENDO IMAGEN EN SERVIDOR ===');
    console.log('Límite configurado: 100MB');
    console.log('Título:', title);
    console.log('Número de capas:', layers ? layers.length : 0);
    console.log('Número de colaboradores:', collaborators ? collaborators.length : 0);

    // Calcular tamaño del payload
    const payloadSize = JSON.stringify(req.body).length / (1024 * 1024);
    console.log('Tamaño del payload recibido:', payloadSize.toFixed(2), 'MB');

    if (!imageData) {
      return res.status(400).json({ error: 'Datos de imagen requeridos' });
    }

    const user = await User.findById(req.userId);
    const image = new Image({
      userId: req.userId,
      username: user.username,
      title: title || 'Sin título',
      description: description || '',
      imageData,
      layers: layers || [],
      savedBy: user.username,
      collaborators: collaborators || [],
      sessionId: sessionId || '0',
      likes: [],
      comments: []
    });

    await image.save();

    console.log('✅ Imagen guardada exitosamente. ID:', image._id);

    res.json({
      success: true,
      image: {
        id: image._id,
        title: image.title,
        description: image.description,
        createdAt: image.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error guardando imagen:', error.message);
    if (error.message.includes('PayloadTooLargeError')) {
      console.error('El payload supera el límite de 100MB');
      res.status(413).json({ error: 'Imagen demasiado grande. Intenta con "Solo imagen final"' });
    } else {
      res.status(500).json({ error: 'Error al guardar la imagen' });
    }
  }
});

// Get user's images
app.get('/pizzarraia/api/images', isAuthenticated, async (req, res) => {
  try {
    const images = await Image.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('-imageData'); // Don't send image data in list

    res.json({ images });
  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    res.status(500).json({ error: 'Error al obtener imágenes' });
  }
});

// Get specific image
app.get('/pizzarraia/api/images/:id', isAuthenticated, async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    res.json({ image });
  } catch (error) {
    console.error('Error obteniendo imagen:', error);
    res.status(500).json({ error: 'Error al obtener la imagen' });
  }
});

// Delete image
app.delete('/pizzarraia/api/images/:id', isAuthenticated, async (req, res) => {
  try {
    const image = await Image.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
});

// Like an image
app.post('/pizzarraia/api/images/:id/like', isAuthenticated, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    const user = await User.findById(req.userId);

    // Check if already liked
    const alreadyLiked = image.likes.some(like => like.userId.toString() === req.userId);

    if (alreadyLiked) {
      // Unlike
      image.likes = image.likes.filter(like => like.userId.toString() !== req.userId);
    } else {
      // Like
      image.likes.push({
        userId: req.userId,
        username: user.username,
        likedAt: new Date()
      });
    }

    await image.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: image.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Error al dar like' });
  }
});

// Add comment to image
app.post('/pizzarraia/api/images/:id/comment', isAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    const user = await User.findById(req.userId);

    image.comments.push({
      userId: req.userId,
      username: user.username,
      text: text.trim(),
      createdAt: new Date()
    });

    await image.save();

    res.json({
      success: true,
      comment: image.comments[image.comments.length - 1]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Error al agregar comentario' });
  }
});

// Delete comment
app.delete('/pizzarraia/api/images/:imageId/comment/:commentId', isAuthenticated, async (req, res) => {
  try {
    const image = await Image.findById(req.params.imageId);

    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    const comment = image.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Only the comment author can delete it
    if (comment.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    }

    comment.remove();
    await image.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
});

// Global gallery route (public)
app.get('/pizzarraia/api/gallery', async (req, res) => {
  try {
    const { session, sesion } = req.query;
    const sessionId = session || sesion;

    // Build query
    let query = {};
    if (sessionId) {
      query.sessionId = sessionId;
    }

    // Get images with optional session filter
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .select('-imageData') // Don't send full image data in list
      .limit(100); // Limit to last 100 images

    res.json({ images, sessionId: sessionId || null });
  } catch (error) {
    console.error('Error getting gallery:', error);
    res.status(500).json({ error: 'Error al obtener la galería' });
  }
});

// Get specific image from gallery (public)
app.get('/pizzarraia/api/gallery/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    res.json({ image });
  } catch (error) {
    console.error('Error getting image:', error);
    res.status(500).json({ error: 'Error al obtener la imagen' });
  }
});

// Admin routes
app.get('/pizzarraia/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all users from database
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Update user permissions
app.put('/pizzarraia/api/admin/users/:userId/permissions', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { canCreateSessions, canAccessAdmin } = req.body;

    // No permitir que se modifique el usuario sistema
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.username === 'sistema') {
      return res.status(403).json({ error: 'No se puede modificar el usuario de sistema' });
    }

    // Actualizar permisos
    user.permissions = {
      canCreateSessions: canCreateSessions !== undefined ? canCreateSessions : user.permissions.canCreateSessions,
      canAccessAdmin: canAccessAdmin !== undefined ? canAccessAdmin : user.permissions.canAccessAdmin
    };

    await user.save();

    console.log(`✅ Permisos actualizados para usuario ${user.username}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ error: 'Error al actualizar permisos' });
  }
});

app.get('/pizzarraia/api/admin/connected', isAuthenticated, isAdmin, (req, res) => {
  try {
    // Get connected users info
    const connected = Array.from(connectedUsers.values());
    res.json({ connected });
  } catch (error) {
    console.error('Error getting connected users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios conectados' });
  }
});

// Public endpoint for sessions (no auth required)
app.get('/pizzarraia/api/sessions', (req, res) => {
  try {
    // Get active sessions with user count
    const activeSessions = Object.keys(sessions)
      .filter(sessionId => sessions[sessionId] && sessions[sessionId].length > 0)
      .map(sessionId => ({
        sessionId,
        userCount: sessions[sessionId].length,
        users: sessions[sessionId].map(socketId => {
          const userInfo = connectedUsers.get(socketId);
          return userInfo || { socketId, username: 'Anónimo' };
        })
      }));

    res.json({ sessions: activeSessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// Admin endpoint - shows ALL sessions (active socket sessions + database sessions)
app.get('/pizzarraia/api/admin/sessions', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get active socket sessions with user count
    const activeSessions = Object.keys(sessions)
      .filter(sessionId => sessions[sessionId] && sessions[sessionId].length > 0)
      .map(sessionId => ({
        sessionId,
        userCount: sessions[sessionId].length,
        users: sessions[sessionId].map(socketId => {
          const userInfo = connectedUsers.get(socketId);
          return userInfo || { socketId, username: 'Anónimo' };
        }),
        isActive: true
      }));

    // Get all sessions from database (both public and private)
    const dbSessions = await Session.find().sort({ lastActiveAt: -1 });

    // Merge database sessions with active sessions
    const allSessions = [...activeSessions];

    // Add database sessions that aren't already in active sessions
    dbSessions.forEach(dbSession => {
      const existingSession = activeSessions.find(s => s.sessionId === dbSession.sessionId);
      if (!existingSession) {
        allSessions.push({
          sessionId: dbSession.sessionId,
          name: dbSession.name,
          description: dbSession.description,
          isPublic: dbSession.isPublic,
          creatorUsername: dbSession.creatorUsername,
          userCount: 0,
          users: [],
          isActive: false
        });
      } else {
        // Enrich active session with database info
        existingSession.name = dbSession.name;
        existingSession.description = dbSession.description;
        existingSession.isPublic = dbSession.isPublic;
        existingSession.creatorUsername = dbSession.creatorUsername;
      }
    });

    res.json({ sessions: allSessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// Analytics endpoints
// Save interaction
app.post('/pizzarraia/api/analytics/interaction', async (req, res) => {
  try {
    const { sessionId, userId, username, interactionType, metadata } = req.body;

    const interaction = new Interaction({
      sessionId: sessionId || '0',
      userId: userId || null,
      username: username || 'Anónimo',
      interactionType: interactionType || 'click',
      metadata: metadata || {}
    });

    await interaction.save();

    // Update hourly stats
    const now = new Date();
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hour = now.getHours();

    await HourlyStats.findOneAndUpdate(
      {
        date: dateOnly,
        hour: hour,
        sessionId: sessionId || '0'
      },
      {
        $inc: {
          totalInteractions: 1,
          [`${interactionType}Count`]: 1
        },
        $addToSet: {
          usersList: username || 'Anónimo'
        }
      },
      {
        upsert: true,
        new: true
      }
    ).then(async (stats) => {
      // Update unique users count
      stats.uniqueUsers = stats.usersList.length;
      await stats.save();
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving interaction:', error);
    res.status(500).json({ error: 'Error al guardar interacción' });
  }
});

// Get analytics data
app.get('/pizzarraia/api/analytics/stats', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, sessionId, username } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (username) {
      query.usersList = username;
    }

    const stats = await HourlyStats.find(query).sort({ date: 1, hour: 1 });

    res.json({ stats });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Get detailed interactions for download
app.get('/pizzarraia/api/analytics/interactions', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, sessionId, username } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (username) {
      query.username = username;
    }

    const interactions = await Interaction.find(query)
      .sort({ timestamp: -1 })
      .limit(10000); // Limit to prevent huge downloads

    res.json({ interactions });
  } catch (error) {
    console.error('Error getting interactions:', error);
    res.status(500).json({ error: 'Error al obtener interacciones' });
  }
});

// Get real-time analytics summary
app.get('/pizzarraia/api/analytics/summary', isAuthenticated, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total interactions today
    const todayStats = await HourlyStats.aggregate([
      {
        $match: {
          date: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: '$totalInteractions' },
          totalClicks: { $sum: '$clickCount' },
          totalTouches: { $sum: '$touchCount' },
          totalDraws: { $sum: '$drawCount' }
        }
      }
    ]);

    // Total interactions all time
    const allTimeStats = await HourlyStats.aggregate([
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: '$totalInteractions' }
        }
      }
    ]);

    // Interactions by hour today
    const hourlyData = await HourlyStats.find({
      date: today
    }).sort({ hour: 1 });

    res.json({
      today: todayStats[0] || { totalInteractions: 0, totalClicks: 0, totalTouches: 0, totalDraws: 0 },
      allTime: allTimeStats[0] || { totalInteractions: 0 },
      hourlyData
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

// ========== SESSION MANAGEMENT ROUTES ==========

// Create a new session
app.post('/pizzarraia/api/sessions/create', isAuthenticated, async (req, res) => {
  try {
    const { sessionId, name, description, isPublic, allowedBrushTypes, accessConfig, restrictions, customization, initialLayers, defaultImageBrush, initialValues } = req.body;

    if (!sessionId || !name) {
      return res.status(400).json({ error: 'Session ID y nombre son requeridos' });
    }

    // Check if session ID already exists
    const existingSession = await Session.findOne({ sessionId });
    if (existingSession) {
      return res.status(400).json({ error: 'El ID de sesión ya existe' });
    }

    const user = await User.findById(req.userId);

    // Check if user has permission to create sessions
    if (!user.permissions || !user.permissions.canCreateSessions) {
      return res.status(403).json({ error: 'No tienes permisos para crear sesiones' });
    }

    const session = new Session({
      sessionId,
      creatorId: req.userId,
      creatorUsername: user.username,
      name,
      description: description || '',
      isPublic: isPublic !== undefined ? isPublic : true,
      allowedBrushTypes: allowedBrushTypes || [],
      accessConfig: accessConfig || undefined,
      restrictions: restrictions || undefined,
      customization: customization || undefined,
      initialLayers: initialLayers || [],
      defaultImageBrush: defaultImageBrush || undefined,
      initialValues: initialValues || undefined
    });

    await session.save();

    console.log(`✅ Nueva sesión creada: ${sessionId} por ${user.username}`);

    res.json({
      success: true,
      session: {
        id: session._id,
        sessionId: session.sessionId,
        name: session.name,
        description: session.description,
        isPublic: session.isPublic,
        allowedBrushTypes: session.allowedBrushTypes,
        accessConfig: session.accessConfig,
        restrictions: session.restrictions,
        customization: session.customization,
        defaultImageBrush: session.defaultImageBrush
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Error al crear la sesión' });
  }
});

// Get user's sessions
app.get('/pizzarraia/api/sessions/my-sessions', isAuthenticated, async (req, res) => {
  try {
    const sessions = await Session.find({ creatorId: req.userId })
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// Get session by ID
app.get('/pizzarraia/api/sessions/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Error al obtener la sesión' });
  }
});

// Get all public sessions
app.get('/pizzarraia/api/sessions/public/list', async (req, res) => {
  try {
    const sessions = await Session.find({ isPublic: true })
      .sort({ lastActiveAt: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error('Error getting public sessions:', error);
    res.status(500).json({ error: 'Error al obtener sesiones públicas' });
  }
});

// Update session
app.put('/pizzarraia/api/sessions/:id', isAuthenticated, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      creatorId: req.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o no tienes permisos' });
    }

    const { sessionId, name, description, isPublic, allowedBrushTypes, accessConfig, restrictions, customization, initialLayers, defaultImageBrush, initialValues } = req.body;

    // Actualizar campos
    if (sessionId) session.sessionId = sessionId;
    if (name) session.name = name;
    if (description !== undefined) session.description = description;
    if (isPublic !== undefined) session.isPublic = isPublic;
    if (allowedBrushTypes) session.allowedBrushTypes = allowedBrushTypes;
    if (accessConfig) session.accessConfig = accessConfig;
    if (restrictions) session.restrictions = restrictions;
    if (customization !== undefined) session.customization = customization;
    if (initialLayers !== undefined) session.initialLayers = initialLayers;
    if (defaultImageBrush !== undefined) session.defaultImageBrush = defaultImageBrush;
    if (initialValues !== undefined) session.initialValues = initialValues;

    await session.save();

    console.log(`✅ Sesión ${session.sessionId} actualizada por ${req.userId}`);

    res.json({ success: true, session });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Error al actualizar la sesión' });
  }
});

// Delete session
app.delete('/pizzarraia/api/sessions/:id', isAuthenticated, async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      creatorId: req.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o no tienes permisos' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Error al eliminar la sesión' });
  }
});

// Update session last active time
app.post('/pizzarraia/api/sessions/:sessionId/ping', async (req, res) => {
  try {
    await Session.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { lastActiveAt: new Date() }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error pinging session:', error);
    res.status(500).json({ error: 'Error al actualizar sesión' });
  }
});

const server = http.createServer(app);

// Adjuntar socket.io al servidor HTTP
const io = socketIo(server, {
  path: `/${APP_PATH}/socket.io`,  // Usando la variable global
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active sessions and their sockets
const sessions = {};

// Store connected users info (socketId -> user info)
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('Cliente conectado: ' + socket.id);

  // Register connected user
  connectedUsers.set(socket.id, {
    socketId: socket.id,
    username: 'Anónimo',
    sessionId: '0',
    connectedAt: new Date()
  });

  // Handle session joining
  socket.on('join_session', (sessionId) => {
    // Convert to string and ensure it's a valid number
    sessionId = String(sessionId || '0');

    // ⚠️ CRÍTICO: Salir de la sala anterior de Socket.IO
    if (socket.sessionId) {
      socket.leave(socket.sessionId);
      console.log(`   🚪 Socket ${socket.id} salió de sala ${socket.sessionId}`);
    }

    // Remove from previous session array
    Object.keys(sessions).forEach(sid => {
      if (sessions[sid] && sessions[sid].includes(socket.id)) {
        sessions[sid] = sessions[sid].filter(id => id !== socket.id);
      }
    });

    // Add to new session array
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }
    sessions[sessionId].push(socket.id);

    // ✅ CRÍTICO: Unir a la SALA de Socket.IO
    socket.join(sessionId);
    console.log(`✅ Cliente ${socket.id} se unió a la SALA ${sessionId}`);

    // Update user info
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      userInfo.sessionId = sessionId;
    }

    console.log('Sesiones activas:', sessions);

    // Store the session ID in the socket object for easy access
    socket.sessionId = sessionId;
  });

  socket.on('mouse', mouseMsg);
  socket.on('cursor', cursorMsg);
  socket.on('flowfield_sync', flowfieldMsg);
  socket.on('flowfield_config', flowfieldConfigMsg);
  socket.on('image_brush_sync', imageBrushSyncMsg);

  function flowfieldMsg(data) {
    // Broadcast flowfield sync to all clients in the same session
    const sessionId = socket.sessionId || '0';

    if (sessions[sessionId]) {
      const sessionSockets = sessions[sessionId];

      // Broadcast to all sockets in the same session except the sender
      sessionSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('flowfield_sync', data);
        }
      });
    }

    console.log(`Flowfield sync from session ${sessionId}:`, data);
  }

  function flowfieldConfigMsg(data) {
    // Broadcast flowfield config to all clients in the same session
    const sessionId = socket.sessionId || '0';

    if (sessions[sessionId]) {
      const sessionSockets = sessions[sessionId];

      // Broadcast to all sockets in the same session except the sender
      sessionSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('flowfield_config', data);
        }
      });
    }

    console.log(`Flowfield config from session ${sessionId}:`, data);
  }

  function imageBrushSyncMsg(data) {
    // Broadcast image brush sync to all clients in the same session
    const sessionId = socket.sessionId || data.sessionId || '0';

    if (sessions[sessionId]) {
      const sessionSockets = sessions[sessionId];

      // Broadcast to all sockets in the same session except the sender
      sessionSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('image_brush_sync', data);
        }
      });
    }

    console.log(`Image brush sync from session ${sessionId} (image size: ${data.imageData ? data.imageData.length : 0} bytes)`);
  }

  function mouseMsg(data) {
    // Only broadcast to clients in the same session
    const sessionId = socket.sessionId || '0';

    if (sessions[sessionId]) {
      // Get all socket IDs in the same session
      const sessionSockets = sessions[sessionId];

      // Broadcast to all sockets in the same session except the sender
      sessionSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('mouse', data);
        }
      });
    }

    // Log especial para Line Brush
    if (data.bt === 'line') {
      console.log(`LINE BRUSH DATA from session ${sessionId}:`, data);
      if (sessions[sessionId]) {
        console.log('Broadcasting to:', sessions[sessionId].filter(id => id !== socket.id));
      } else {
        console.log('No hay sesiones para broadcast');
      }
    } else {
      console.log(`Data from session ${sessionId}:`, data);
    }
  }

  function cursorMsg(data) {
    // Only broadcast cursor position to clients in the same session
    const sessionId = socket.sessionId || '0';

    if (sessions[sessionId]) {
      // Get all socket IDs in the same session
      const sessionSockets = sessions[sessionId];

      // Add the sender's socket ID to the data ONLY if not already set
      // (para permitir múltiples cursores LIDAR con IDs únicos)
      if (!data.socketId) {
        data.socketId = socket.id;
      }

      // Broadcast to all sockets in the same session except the sender
      sessionSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('cursor', data);
        }
      });
    }
  }
  // Update username for connected user
  socket.on('update_username', function (data) {
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo && data.username) {
      userInfo.username = data.username;
      console.log('Username updated for', socket.id, ':', data.username);
    }
  });

  socket.on('chat_message', function (data) {
    // Reenviar el mensaje a todos los clientes de la misma sesión
    io.emit('chat_message', data);
    console.log('Chat message from', data.username, ':', data.message);
  });

  // Handle layer management
  socket.on('layer_added', function (data) {
    const sessionId = socket.sessionId || data.sessionId || '0';

    if (sessions[sessionId]) {
      const sessionSockets = sessions[sessionId];

      // Broadcast to all sockets in the same session except the sender
      sessionSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('layer_added', data);
        }
      });
    }

    console.log(`Layer added in session ${sessionId}`);
  });

  socket.on('layer_deleted', function (data) {
    const sessionId = socket.sessionId || data.sessionId || '0';

    if (sessions[sessionId]) {
      const sessionSockets = sessions[sessionId];

      // Broadcast to all sockets in the same session except the sender
      sessionSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('layer_deleted', data);
        }
      });
    }

    console.log(`Layer deleted in session ${sessionId}:`, data.layerIndex);
  });

  // Handle session configuration updates (real-time sync)
  socket.on('session-updated', function (data) {
    const sessionId = data.sessionId;

    console.log('\n🔥 [SERVER] ========== SESSION-UPDATED RECIBIDO ==========');
    console.log('📊 [SERVER] Datos recibidos:', {
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
      accessConfig: {
        notLogged: {
          allowed: data.accessConfig?.notLogged?.allowed,
          brushes: data.accessConfig?.notLogged?.brushes?.length || 0,
          brushesList: data.accessConfig?.notLogged?.brushes,
          restrictions: data.accessConfig?.notLogged?.restrictions
        },
        logged: {
          allowed: data.accessConfig?.logged?.allowed,
          brushes: data.accessConfig?.logged?.brushes?.length || 0,
          brushesList: data.accessConfig?.logged?.brushes,
          restrictions: data.accessConfig?.logged?.restrictions
        },
        specific: {
          allowed: data.accessConfig?.specific?.allowed,
          users: data.accessConfig?.specific?.users,
          brushes: data.accessConfig?.specific?.brushes?.length || 0,
          brushesList: data.accessConfig?.specific?.brushes,
          restrictions: data.accessConfig?.specific?.restrictions
        }
      }
    });

    console.log('📢 [SERVER] Broadcasting a sala:', sessionId);
    console.log('👥 [SERVER] Usuarios en sala:', sessions[sessionId]?.length || 0);

    // Broadcast INMEDIATO a toda la sala
    io.to(sessionId).emit('session-updated', data);

    console.log('✅ [SERVER] Broadcast completado');
    console.log('========== FIN SESSION-UPDATED ==========\n');
  });

  // Handle interaction tracking
  socket.on('track_interaction', async function (data) {
    try {
      const { sessionId, userId, username, interactionType, metadata } = data;

      const interaction = new Interaction({
        sessionId: sessionId || '0',
        userId: userId || null,
        username: username || 'Anónimo',
        interactionType: interactionType || 'click',
        metadata: metadata || {}
      });

      await interaction.save();

      // Update hourly stats
      const now = new Date();
      const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hour = now.getHours();

      const stats = await HourlyStats.findOneAndUpdate(
        {
          date: dateOnly,
          hour: hour,
          sessionId: sessionId || '0'
        },
        {
          $inc: {
            totalInteractions: 1,
            [`${interactionType}Count`]: 1
          },
          $addToSet: {
            usersList: username || 'Anónimo'
          }
        },
        {
          upsert: true,
          new: true
        }
      );

      if (stats) {
        stats.uniqueUsers = stats.usersList.length;
        await stats.save();

        // Broadcast updated stats to all admin clients
        io.emit('analytics_update', {
          sessionId: sessionId || '0',
          stats: {
            totalInteractions: stats.totalInteractions,
            clickCount: stats.clickCount,
            touchCount: stats.touchCount,
            drawCount: stats.drawCount,
            uniqueUsers: stats.uniqueUsers,
            hour: stats.hour
          }
        });
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  });
  // Manejar la desccconexión del cliente
  socket.on('disconnect', () => {
    console.log('Cliente desconectado: ' + socket.id);

    // Remove from connected users
    connectedUsers.delete(socket.id);

    // Remove from session
    const sessionId = socket.sessionId || '0';
    if (sessions[sessionId]) {
      sessions[sessionId] = sessions[sessionId].filter(id => id !== socket.id);

      // Clean up empty sessions
      if (sessions[sessionId].length === 0) {
        delete sessions[sessionId];
      }
    }

    console.log('Sesiones activas después de desconexión:', sessions);
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Socket.IO path: /${APP_PATH}/socket.io`);
  console.log(`Static files are being served from ${path.join(__dirname, 'public')}`);
});
