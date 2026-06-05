const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const LEADS_FILE = path.join(__dirname, 'leads.json');

// Helper to serve static files
function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 File Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`500 Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // API Endpoint: Get leads
    if (pathname === '/api/leads' && req.method === 'GET') {
        fs.readFile(LEADS_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data || '[]');
            }
        });
        return;
    }

    // API Endpoint: Save lead
    if (pathname === '/api/leads' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const newLead = JSON.parse(body);
                fs.readFile(LEADS_FILE, 'utf8', (err, data) => {
                    let leads = [];
                    if (!err && data) {
                        try {
                            leads = JSON.parse(data);
                        } catch (e) {
                            leads = [];
                        }
                    }
                    // Filter duplicates by checking ID
                    const exists = leads.some(l => l.id === newLead.id);
                    if (!exists) {
                        leads.unshift(newLead);
                    }
                    fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8', (writeErr) => {
                        if (writeErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to write leads' }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // API Endpoint: Delete single lead
    if (pathname === '/api/delete-lead' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { id } = JSON.parse(body);
                fs.readFile(LEADS_FILE, 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'No leads found' }));
                        return;
                    }
                    let leads = JSON.parse(data) || [];
                    leads = leads.filter(l => l.id !== id);
                    fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8', (writeErr) => {
                        if (writeErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to update leads' }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid body' }));
            }
        });
        return;
    }

    // API Endpoint: Clear all leads
    if (pathname === '/api/clear-leads' && req.method === 'POST') {
        fs.writeFile(LEADS_FILE, JSON.stringify([], null, 2), 'utf8', (err) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to clear leads' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            }
        });
        return;
    }

    // Static files server logic
    let safePathname = pathname;
    if (safePathname === '/') safePathname = '/index.html';
    
    const filePath = path.join(__dirname, safePathname);
    
    // Security check to avoid directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    serveFile(res, filePath, contentType);
});

server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Локальный сервер запущен: http://localhost:${PORT}`);
    console.log(`📂 Заявки сохраняются в файл: ${LEADS_FILE}`);
    console.log(`==================================================`);
});
