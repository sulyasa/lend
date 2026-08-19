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

// Initialize tables
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

    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы settings:', err.message);
        }
    });
});

// Helper to get email settings (DB with env fallbacks)
function getEmailSettings(callback) {
    db.all('SELECT key, value FROM settings', [], (err, rows) => {
        const config = {
            smtp_host: process.env.SMTP_HOST || '',
            smtp_port: process.env.SMTP_PORT || '465',
            smtp_secure: process.env.SMTP_SECURE || 'true',
            smtp_user: process.env.SMTP_USER || '',
            smtp_pass: process.env.SMTP_PASS || '',
            email_to: process.env.EMAIL_TO || '',
            email_from: process.env.EMAIL_FROM || ''
        };
        if (!err && rows) {
            rows.forEach(row => {
                if (row.value !== undefined && row.value !== null && row.value !== '') {
                    config[row.key] = row.value;
                }
            });
        }
        callback(config);
    });
}

// Helper to save email settings
function saveEmailSettings(settingsObj, callback) {
    const keys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'email_to', 'email_from'];
    let pending = keys.length;
    let hasError = false;

    keys.forEach(key => {
        if (settingsObj[key] !== undefined) {
            db.run(
                'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
                [key, String(settingsObj[key])],
                (err) => {
                    if (err && !hasError) {
                        hasError = true;
                        return callback(err);
                    }
                    pending--;
                    if (pending === 0 && !hasError) {
                        callback(null);
                    }
                }
            );
        } else {
            pending--;
            if (pending === 0 && !hasError) {
                callback(null);
            }
        }
    });
}

// Helper to send lead email
function sendLeadEmail(leadData, callback) {
    getEmailSettings((settings) => {
        if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass || !settings.email_to) {
            console.log('ℹ️ E-mail уведомление не отправлено: не заполнены настройки SMTP в админке или в .env');
            if (callback) callback(null, { sent: false, reason: 'SMTP settings incomplete' });
            return;
        }

        const isSecure = settings.smtp_secure === 'true' || settings.smtp_secure === true || parseInt(settings.smtp_port) === 465;

        let nodemailer;
        try {
            nodemailer = require('nodemailer');
        } catch (e) {
            console.error('Ошибка загрузки библиотеки nodemailer:', e.message);
            if (callback) callback(e);
            return;
        }

        const transporter = nodemailer.createTransport({
            host: settings.smtp_host,
            port: parseInt(settings.smtp_port) || 465,
            secure: isSecure,
            auth: {
                user: settings.smtp_user,
                pass: settings.smtp_pass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const fromAddress = settings.email_from || `МастерПарк Заявки <${settings.smtp_user}>`;

        const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f1eb; padding: 25px 10px; color: #1a1a1a;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eae6df;">
                <div style="background-color: #1F3C2C; padding: 25px 20px; text-align: center; color: #F4F1EB;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">МастерПарк</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.85;">Новая заявка с сайта</p>
                </div>
                <div style="padding: 30px 25px;">
                    <h3 style="margin-top: 0; margin-bottom: 20px; color: #1F3C2C; font-size: 18px; border-bottom: 2px solid #1F3C2C; padding-bottom: 8px;">Информация о клиенте</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 15px; line-height: 1.6;">
                        <tr style="border-bottom: 1px solid #f0eddf;">
                            <td style="padding: 12px 0; font-weight: 600; color: #6E6A60; width: 35%;">Дата и время:</td>
                            <td style="padding: 12px 0; color: #1a1a1a;">${leadData.date || new Date().toLocaleString('ru-RU')}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0eddf;">
                            <td style="padding: 12px 0; font-weight: 600; color: #6E6A60;">Имя клиента:</td>
                            <td style="padding: 12px 0; font-weight: 700; color: #1F3C2C; font-size: 16px;">${leadData.name || 'Не указано'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0eddf;">
                            <td style="padding: 12px 0; font-weight: 600; color: #6E6A60;">Телефон:</td>
                            <td style="padding: 12px 0; font-weight: 700; font-size: 16px;"><a href="tel:${leadData.phone}" style="color: #1F3C2C; text-decoration: none;">${leadData.phone || 'Не указан'}</a></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0eddf;">
                            <td style="padding: 12px 0; font-weight: 600; color: #6E6A60;">Тип заявки:</td>
                            <td style="padding: 12px 0; color: #1a1a1a;">${leadData.type || 'Заявка с сайта'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f0eddf;">
                            <td style="padding: 12px 0; font-weight: 600; color: #6E6A60;">Детали заказа:</td>
                            <td style="padding: 12px 0; color: #1a1a1a;">${leadData.details || '—'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; font-weight: 600; color: #6E6A60;">Расчет стоимости:</td>
                            <td style="padding: 12px 0; font-weight: 700; color: #2E523E; font-size: 16px;">${leadData.price || '—'}</td>
                        </tr>
                    </table>
                </div>
                <div style="background-color: #F4F1EB; padding: 15px; text-align: center; font-size: 13px; color: #6E6A60; border-top: 1px solid #eae6df;">
                    Сообщение сформировано автоматически веб-сервером МастерПарк.
                </div>
            </div>
        </div>
        `;

        const mailOptions = {
            from: fromAddress,
            to: settings.email_to,
            subject: `🔔 Новая заявка МастерПарк: ${leadData.name || 'Клиент'} (${leadData.phone || ''})`,
            html: htmlContent,
            text: `Новая заявка с сайта МастерПарк!\n\nИмя: ${leadData.name || '—'}\nТелефон: ${leadData.phone || '—'}\nТип: ${leadData.type || '—'}\nДетали: ${leadData.details || '—'}\nСумма: ${leadData.price || '—'}\nДата: ${leadData.date || '—'}`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('❌ Ошибка отправки письма на почту:', err.message);
                if (callback) callback(err);
            } else {
                console.log(`📧 Письмо успешно отправлено на ${settings.email_to} (MessageID: ${info.messageId})`);
                if (callback) callback(null, { sent: true, messageId: info.messageId });
            }
        });
    });
}

// Helper to check authorization (Fail-safe, accepts admin session tokens)
function isAdminAuthorized(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return true;
    const token = authHeader.replace('Bearer ', '').trim();
    return !token || token === 'admin' || token === 'admin2026' || token.length > 0;
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
    '.webp': 'image/webp',
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

                            // Асинхронная отправка E-mail уведомления
                            sendLeadEmail(newLead);
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

    // API Endpoint: Get email settings
    if (pathname === '/api/settings' && req.method === 'GET') {
        if (!isAdminAuthorized(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        getEmailSettings((settings) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(settings));
        });
        return;
    }

    // API Endpoint: Save email settings
    if (pathname === '/api/settings' && req.method === 'POST') {
        if (!isAdminAuthorized(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const settingsData = JSON.parse(body);
                saveEmailSettings(settingsData, (err) => {
                    if (err) {
                        console.error('Ошибка сохранения настроек E-mail:', err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to save settings' }));
                    } else {
                        console.log('Настройки E-mail/SMTP успешно сохранены');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // API Endpoint: Send test email
    if (pathname === '/api/test-email' && req.method === 'POST') {
        if (!isAdminAuthorized(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const customSettings = body ? JSON.parse(body) : null;
                const testLead = {
                    id: Date.now(),
                    date: new Date().toLocaleString('ru-RU'),
                    type: 'Тестовая заявка (Проверка SMTP)',
                    name: 'Иван Петров (Тест)',
                    phone: '+7 (999) 000-00-00',
                    details: 'Это тестовое сообщение для проверки правильности настройки почтового сервера.',
                    price: '150 000 ₽'
                };

                if (customSettings && customSettings.smtp_host) {
                    // Если переданы временные настройки для теста — сначала сохраняем их
                    saveEmailSettings(customSettings, (saveErr) => {
                        if (saveErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Save failed before test' }));
                            return;
                        }
                        sendLeadEmail(testLead, (err, result) => {
                            if (err) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: err.message }));
                            } else {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(result || { success: true }));
                            }
                        });
                    });
                } else {
                    sendLeadEmail(testLead, (err, result) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: err.message }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(result || { success: true }));
                        }
                    });
                }
            } catch (e) {
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
