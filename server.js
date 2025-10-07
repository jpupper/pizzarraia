const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const User = require('./models/User');
const Image = require('./models/Image');

const app = express();
const hostname = '0.0.0.0';
const port = 3025;
const APP_PATH = 'pizarraia';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pizzarraia';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: 'pizzarraia-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

// API Routes
// Register
app.post('/api/register', async (req, res) => {
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
    
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.json({ 
      success: true, 
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
app.post('/api/login', async (req, res) => {
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
    
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.json({ 
      success: true, 
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
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ success: true });
  });
});

// Get current user
app.get('/api/user', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Check session
app.get('/api/check-session', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true, 
      user: { 
        id: req.session.userId, 
        username: req.session.username 
      } 
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Save image
app.post('/api/images', isAuthenticated, async (req, res) => {
  try {
    const { title, imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Datos de imagen requeridos' });
    }
    
    const image = new Image({
      userId: req.session.userId,
      username: req.session.username,
      title: title || 'Sin título',
      imageData
    });
    
    await image.save();
    
    res.json({ 
      success: true, 
      image: {
        id: image._id,
        title: image.title,
        createdAt: image.createdAt
      }
    });
  } catch (error) {
    console.error('Error guardando imagen:', error);
    res.status(500).json({ error: 'Error al guardar la imagen' });
  }
});

// Get user's images
app.get('/api/images', isAuthenticated, async (req, res) => {
  try {
    const images = await Image.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .select('-imageData'); // Don't send image data in list
    
    res.json({ images });
  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    res.status(500).json({ error: 'Error al obtener imágenes' });
  }
});

// Get specific image
app.get('/api/images/:id', isAuthenticated, async (req, res) => {
  try {
    const image = await Image.findOne({ 
      _id: req.params.id, 
      userId: req.session.userId 
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
app.delete('/api/images/:id', isAuthenticated, async (req, res) => {
  try {
    const image = await Image.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.session.userId 
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

io.on('connection', (socket) => {
  console.log('Cliente conectado: ' + socket.id);
  
  // Handle session joining
  socket.on('join_session', (sessionId) => {
    // Convert to string and ensure it's a valid number
    sessionId = String(sessionId || '0');
    
    // Remove from previous session if any
    Object.keys(sessions).forEach(sid => {
      if (sessions[sid] && sessions[sid].includes(socket.id)) {
        sessions[sid] = sessions[sid].filter(id => id !== socket.id);
      }
    });
    
    // Add to new session
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }
    sessions[sessionId].push(socket.id);
    
    console.log(`Cliente ${socket.id} se unió a la sesión ${sessionId}`);
    console.log('Sesiones activas:', sessions);
    
    // Store the session ID in the socket object for easy access
    socket.sessionId = sessionId;
  });
  
  socket.on('mouse', mouseMsg);
  socket.on('cursor', cursorMsg);
  socket.on('flowfield_sync', flowfieldMsg);
  socket.on('flowfield_config', flowfieldConfigMsg);
  
  function flowfieldMsg(data){
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
  
  function flowfieldConfigMsg(data){
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
  
  function mouseMsg(data){
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
  
  function cursorMsg(data){
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
  socket.on('chat_message', function(data) {
    // Reenviar el mensaje a todos los clientes de la misma sesión
    io.emit('chat_message', data);
    console.log('Chat message from', data.username, ':', data.message);
  });
  // Manejar la desccconexión del cliente
  socket.on('disconnect', () => {
    console.log('Cliente desconectado: ' + socket.id);
    
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
