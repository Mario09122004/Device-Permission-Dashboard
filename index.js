/**
 * Device Permission Dashboard - Local Server (index.js)
 * -------------------------------------------------------------
 * Standalone, zero-dependency HTTP server running on Node.js standard library.
 * Serves index.html, style.css, and app.js at http://127.0.0.1:8000.
 *
 * To run:
 *   node index.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // Default route
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Alias styles.css to style.css for compatibility
  if (reqPath === '/styles.css') {
    reqPath = '/style.css';
  }

  const filePath = path.join(__dirname, reqPath);

  // Security: prevent directory traversal outside folder
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found: ${reqPath}`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`500 Internal Server Error: ${err.code}`);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log('       DEVICE PERMISSION DASHBOARD SERVER');
  console.log('====================================================');
  console.log(` Status: Running`);
  console.log(` URL:    http://${HOST}:${PORT}/`);
  console.log(` Origin: Trustworthy Localhost`);
  console.log(' No Next.js or external dependencies required.');
  console.log(' Press Ctrl + C to stop.');
  console.log('====================================================');
});
