const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = 3000;

// Determine database path (Amvera vs local)
let dbPath;
if (fs.existsSync('/data')) {
    dbPath = '/data/leads.db';
} else {
    const localDataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(localDataDir)) {
        fs.mkdirSync(localDataDir);
    }
    dbPath = path.join(localDataDir, 'leads.db');
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к SQLite:', err.message);
    } else {
        console.log(`Подключение к базе данных SQLite установлено: ${dbPath}`);
    }
});

// Initialize table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY,
        date TEXT,
        type TEXT,
        name TEXT,
        phone TEXT,
        details TEXT,
        price TEXT
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы leads:', err.message);
        }
    });
});

// Helper to check authorization
function isAdminAuthorized(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return false;
    const token = authHeader.replace('Bearer ', '').trim();
    return token === 'admin' || token === 'admin2026';
}

// Helper to serve static files (optimized stream serving)
function serveFile(res, filePath, contentType) {
    fs.stat(filePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 File Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`500 Server Error: ${err.code}`);
            }
            return;
        }

        const headers = { 
            'Content-Type': contentType,
            'Content-Length': stats.size
        };
        // Кешируем статические файлы на 1 час
        if (contentType.startsWith('image/') || contentType.startsWith('text/css') || contentType.startsWith('application/javascript')) {
            headers['Cache-Control'] = 'public, max-age=3600';
        }
        res.writeHead(200, headers);

        const stream = fs.createReadStream(filePath);
        stream.on('error', (streamErr) => {
            console.error('Ошибка при стриминге файла:', streamErr.message);
        });
        stream.pipe(res);
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
        if (!isAdminAuthorized(req)) {
            console.warn('Попытка неавторизованного доступа к API получения лидов');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        db.all('SELECT * FROM leads ORDER BY id DESC', [], (err, rows) => {
            if (err) {
                console.error('Ошибка получения лидов из БД:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            } else {
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
                });
                res.end(JSON.stringify(rows || []));
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
                db.run(
                    'INSERT OR IGNORE INTO leads (id, date, type, name, phone, details, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [newLead.id, newLead.date, newLead.type, newLead.name, newLead.phone, newLead.details, newLead.price],
                    function(err) {
                        if (err) {
                            console.error('Ошибка записи лида в БД:', err.message);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Database insert failed: ' + err.message }));
                        } else {
                            console.log(`Заявка успешно сохранена в SQLite: ID=${newLead.id}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    }
                );
            } catch (e) {
                console.error('Ошибка парсинга JSON тела при записи лида:', e.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // API Endpoint: Delete single lead
    if (pathname === '/api/delete-lead' && req.method === 'POST') {
        if (!isAdminAuthorized(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { id } = JSON.parse(body);
                db.run('DELETE FROM leads WHERE id = ?', [id], function(err) {
                    if (err) {
                        console.error(`Ошибка удаления лида ID=${id} из БД:`, err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Database delete failed: ' + err.message }));
                    } else {
                        console.log(`Лид ID=${id} успешно удален из БД`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
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
        if (!isAdminAuthorized(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        db.run('DELETE FROM leads', [], function(err) {
            if (err) {
                console.error('Ошибка полной очистки лидов в БД:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Database clear failed: ' + err.message }));
            } else {
                console.log('Все лиды успешно удалены из БД (полная очистка)');
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
    console.log(`📂 Заявки сохраняются в базу данных SQLite: ${dbPath}`);
    console.log(`==================================================`);
});
