const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 5173;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(root, urlPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// Try listening on `port`, and if it's in use, try the next ports up to a limit.
const maxAttempts = 10;
function startServer(startPort, attemptsLeft) {
  server.removeAllListeners('error');

  server.once('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      if (attemptsLeft > 0) {
        console.warn(`Port ${startPort} in use — trying ${startPort + 1}...`);
        // Try the next port
        startServer(startPort + 1, attemptsLeft - 1);
      } else {
        console.error('No available ports found after multiple attempts. Exiting.');
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  server.listen(startPort, () => {
    console.log(`TaskHub frontend running at http://localhost:${startPort}`);
  });
}

startServer(Number(port), maxAttempts);
