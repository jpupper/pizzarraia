const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const hostname = '0.0.0.0';
const port = 3025;
const APP_PATH = 'pizarraia';  // Nueva variable global

// Create HTTP server with proper file serving
const server = http.createServer((req, res) => {
  let pathname = req.url;
  
  if (pathname === '/' || pathname === `/${APP_PATH}/`) {
    pathname = '/index.html';
  }
  
  if (pathname.startsWith(`/${APP_PATH}/socket.io/`)) {
    return;
  }
  
  if (pathname.startsWith(`/${APP_PATH}/`)) {
    pathname = pathname.substring(APP_PATH.length + 1);
  }
  
  // Ok what's our file extension
  const ext = path.extname(pathname);
  
  // Map extension to file type
  const typeExt = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif'
  };
  
  // What is it? Default to plain text
  const contentType = typeExt[ext] || 'text/plain';
  
  // Now read and write back the file with the appropriate content type
  // Use the public directory as the root for serving files
  fs.readFile(path.join(__dirname, 'public', pathname), (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        return res.end(`File ${pathname} not found!`);
      } else {
        // Server error
        res.writeHead(500);
        return res.end(`Error loading ${pathname}: ${err.code}`);
      }
    }
    
    // Dynamically setting content type
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Adjuntar socket.io al servidor HTTP
const io = socketIo(server, {
  path: `/${APP_PATH}/socket.io`,  // Usando la variable global
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado: ' + socket.id);
  
  socket.on('mouse', mouseMsg);
  
  function mouseMsg(data){
    socket.broadcast.emit('mouse', data);
    console.log(data);
  }	

  // Manejar la desconexión del cliente
  socket.on('disconnect', () => {
    console.log('Cliente desconectado: ' + socket.id);
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Socket.IO path: /${APP_PATH}/socket.io`);
  console.log(`Static files are being served from ${path.join(__dirname, 'public')}`);
});
