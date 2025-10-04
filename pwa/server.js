'use strict';

const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const { WebSocketServer } = require('ws');
const { randomUUID } = require('node:crypto');

const PORT = 8000;
const HTTPS_PORT = 8443;

// SSL Configuration
const SSL_KEY_PATH = path.join(__dirname, 'ssl', 'certs', 'localhost.key');
const SSL_CERT_PATH = path.join(__dirname, 'ssl', 'certs', 'localhost.crt');
const USE_HTTPS = fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH);

const MIME_TYPES = {
  default: 'application/octet-stream',
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  json: 'application/json',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const HEADERS_HTML = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

const STATIC_PATH = path.join(__dirname, 'Application', 'static');

const connections = new Map();
const messages = [];
const MAX_MESSAGES = 100;

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
  const paths = [STATIC_PATH, url];
  if (url.endsWith('/')) paths.push('index.html');
  const filePath = path.join(...paths);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await fs.promises.access(filePath).then(...toBool);
  const found = !pathTraversal && exists;
  const streamPath = found ? filePath : path.join(STATIC_PATH, '404.html');
  const ext = path.extname(streamPath).substring(1).toLowerCase();
  const stream = fs.createReadStream(streamPath);
  return { found, ext, stream };
};

const requestHandler = async (req, res) => {
  const url = new URL(req.url, `http${USE_HTTPS ? 's' : ''}://${req.headers.host}`);

  // Remove /Application/static prefix if present
  let pathname = url.pathname;
  const prefix = '/Application/static';
  if (pathname.startsWith(prefix)) {
    pathname = pathname.substring(prefix.length) || '/';
  }

  const file = await prepareFile(pathname);
  const statusCode = file.found ? 200 : 404;
  const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;

  const headers = { ...HEADERS, 'Content-Type': mimeType };
  if (file.ext === 'html') Object.assign(headers, HEADERS_HTML);

  res.writeHead(statusCode, headers);
  file.stream.pipe(res);

  console.log(`${req.method} ${req.url} ${statusCode}`);
};

// Create server (HTTP or HTTPS based on certificate availability)
let server;
let serverType;

if (USE_HTTPS) {
  const options = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };
  server = https.createServer(options, requestHandler);
  serverType = 'HTTPS';
} else {
  server = http.createServer(requestHandler);
  serverType = 'HTTP';
  console.log('\n⚠️  WARNING: Running in HTTP mode');
  console.log('Safari requires HTTPS for PWA features (notifications, etc.)');
  console.log('Run ./generate-ssl.sh to create SSL certificates\n');
}

const wss = new WebSocketServer({ server });

wss.on('error', (error) => {
  console.error('WebSocket Server error:', error);
});

const broadcast = (data, excludeClientId = '') => {
  const message = JSON.stringify(data);
  for (const [clientId, connection] of connections) {
    if (clientId !== excludeClientId && connection.ws.readyState === 1) {
      try {
        connection.ws.send(message);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        connections.delete(clientId);
      }
    }
  }
};

wss.on('connection', (ws, req) => {
  const clientId = randomUUID();
  console.log(`WebSocket connection ${req.socket.remoteAddress}`);

  const connectedAt = new Date();
  const userAgent = req.headers['user-agent'];
  connections.set(clientId, { ws, connectedAt, userAgent });

  const userCount = connections.size;
  const recentMessages = messages.slice(-10);
  const data = { type: 'connected', clientId, userCount, recentMessages };
  ws.send(JSON.stringify(data));

  broadcast({ type: 'userCount', count: userCount }, clientId);
  console.log(`Client connected: ${clientId} (Total: ${connections.size})`);

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log(`Received from ${clientId}:`, message);
    const { type, content } = message;
    if (type === 'message') {
      const timestamp = new Date().toISOString();
      messages.push({ type, content, clientId, timestamp });
      if (messages.length > MAX_MESSAGES) messages.shift();
      broadcast(message, clientId);
    } else if (message.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket connection closed: ${clientId}`);
    connections.delete(clientId);
    const count = connections.size;
    broadcast({ type: 'userCount', count }, clientId);
    console.log(`Client disconnected: ${clientId} (Total: ${count})`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
    connections.delete(clientId);
    const count = connections.size;
    broadcast({ type: 'userCount', count }, clientId);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  for (const connection of connections.values()) {
    connection.ws.close();
  }
  connections.clear();
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

const port = USE_HTTPS ? HTTPS_PORT : PORT;
const protocol = USE_HTTPS ? 'https' : 'http';

server.listen(port, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  PWA Server (${serverType})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n  🚀 Server running at: ${protocol}://localhost:${port}/`);
  console.log(`  📱 Local access:      ${protocol}://127.0.0.1:${port}/`);

  if (USE_HTTPS) {
    console.log('\n  ✅ HTTPS enabled - Safari PWA features available');
    console.log('  📜 Using certificates from ./ssl/certs/');
  } else {
    console.log('\n  ⚠️  HTTP mode - Limited PWA features');
    console.log('  💡 Run: cd ssl && chmod +x generate-ssl.sh && ./generate-ssl.sh');
  }

  console.log('\n  📄 Applications:');
  console.log(`     • Chat App:    ${protocol}://localhost:${port}/Application/static/index.html`);
  console.log(`     • Example App: ${protocol}://localhost:${port}/Application/static/example.html`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
