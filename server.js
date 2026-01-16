/**
 * Reddit GDPR Export Data Viewer - Standalone Server
 * Zero dependencies - uses only Node.js built-in modules
 * Compatible with pkg for building standalone .exe
 * 
 * Run: node server.js
 * Build: pkg server.js --targets node18-win-x64 --output RedditViewer.exe
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
// When bundled with pkg, use the directory where the exe is located
const ROOT_DIR = process.pkg ? path.dirname(process.execPath) : __dirname;
// Define CSV data directory
const DATA_DIR = path.join(ROOT_DIR, 'csv');

// Create csv directory if it doesn't perform
if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR);
    } catch (e) {
        console.error('Could not create csv directory:', e);
    }
}

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.md': 'text/markdown; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// Open browser (cross-platform)
function openBrowser(url) {
    const platform = process.platform;
    let cmd;

    if (platform === 'win32') {
        cmd = `start "" "${url}"`;
    } else if (platform === 'darwin') {
        cmd = `open "${url}"`;
    } else {
        cmd = `xdg-open "${url}"`;
    }

    exec(cmd, (err) => {
        if (err) console.log('Could not open browser automatically. Please open:', url);
    });
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const method = req.method;
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = decodeURIComponent(url.pathname);

    // CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Save/Update CSV file
    if (method === 'POST' && pathname === '/api/save') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { filename, content } = JSON.parse(body);
                const safeName = path.basename(filename);
                // Save to DATA_DIR
                const safePath = path.join(DATA_DIR, safeName);

                // Create backup before modifying
                if (fs.existsSync(safePath)) {
                    const backupPath = safePath + '.backup';
                    fs.copyFileSync(safePath, backupPath);
                    console.log(`Backup created: ${backupPath}`);
                }

                fs.writeFileSync(safePath, content, 'utf8');
                console.log(`File saved: ${safeName}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: `${safeName} saved` }));
            } catch (err) {
                console.error('Save error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // API: Delete row from CSV
    if (method === 'POST' && pathname === '/api/delete-row') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { filename, rowId } = JSON.parse(body);
                const safeName = path.basename(filename);
                // Read from DATA_DIR
                const safePath = path.join(DATA_DIR, safeName);

                if (!fs.existsSync(safePath)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'File not found' }));
                    return;
                }

                // Read, filter, and write back
                const content = fs.readFileSync(safePath, 'utf8');
                const lines = content.split('\n');
                const header = lines[0];
                const dataLines = lines.slice(1).filter(line => {
                    if (!line.trim()) return false;
                    // First column is the ID
                    const id = line.split(',')[0];
                    return id !== rowId;
                });

                // Backup and save
                fs.copyFileSync(safePath, safePath + '.backup');
                fs.writeFileSync(safePath, header + '\n' + dataLines.join('\n'), 'utf8');

                console.log(`Deleted row ${rowId} from ${safeName}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: `Row deleted from ${safeName}` }));
            } catch (err) {
                console.error('Delete error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // API: List CSV files
    if (method === 'GET' && pathname === '/api/files') {
        try {
            // List files from DATA_DIR
            if (!fs.existsSync(DATA_DIR)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ files: [] }));
                return;
            }

            const files = fs.readdirSync(DATA_DIR)
                .filter(f => f.endsWith('.csv'))
                .map(f => ({
                    name: f,
                    size: fs.statSync(path.join(DATA_DIR, f)).size
                }));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ files }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // API: Check if server is running (for frontend detection)
    if (method === 'GET' && pathname === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ server: true, rootDir: ROOT_DIR }));
        return;
    }

    // API: Get available Poe models
    if (method === 'POST' && pathname === '/api/poe/models') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { apiKey } = JSON.parse(body);

                if (!apiKey) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'API key required' }));
                    return;
                }

                const https = require('https');
                const options = {
                    hostname: 'api.poe.com',
                    port: 443,
                    path: '/v1/models',
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                };

                const poeReq = https.request(options, (poeRes) => {
                    let data = '';
                    poeRes.on('data', chunk => data += chunk);
                    poeRes.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            if (result.data) {
                                const models = result.data.map(m => ({
                                    id: m.id,
                                    name: m.metadata?.display_name || m.id,
                                    modalities: m.architecture?.input_modalities || ['text']
                                }));
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true, models }));
                            } else {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: false, error: result.error || 'Failed to get models' }));
                            }
                        } catch (e) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'Parse error: ' + e.message }));
                        }
                    });
                });

                poeReq.on('error', (e) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                });

                poeReq.end();
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // API: Poe API Proxy (keeps API key server-side)
    if (method === 'POST' && pathname === '/api/poe') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { apiKey, model, prompt, maxTokens = 1000, temperature = 0.7 } = JSON.parse(body);

                if (!apiKey) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'API key required' }));
                    return;
                }

                // Build Poe API request
                const postData = JSON.stringify({
                    model: model || 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: temperature,
                    max_tokens: maxTokens
                });

                const options = {
                    hostname: 'api.poe.com',
                    port: 443,
                    path: '/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const https = require('https');
                const poeReq = https.request(options, (poeRes) => {
                    let data = '';
                    poeRes.on('data', chunk => data += chunk);
                    poeRes.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            if (result.choices && result.choices[0]) {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: true,
                                    content: result.choices[0].message.content,
                                    usage: result.usage
                                }));
                            } else {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: false, error: result.error || 'Unknown API error', raw: result }));
                            }
                        } catch (e) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'Parse error: ' + e.message }));
                        }
                    });
                });

                poeReq.on('error', (e) => {
                    console.error('Poe API error:', e.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                });

                poeReq.write(postData);
                poeReq.end();
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Serve static files
    let filePath = pathname === '/' ? '/index.html' : pathname;

    // Check if it's a CSV request, verify if it exists in DATA_DIR
    let fullPath = path.join(ROOT_DIR, filePath);
    if (filePath.endsWith('.csv')) {
        const dataPath = path.join(DATA_DIR, path.basename(filePath));
        if (fs.existsSync(dataPath)) {
            fullPath = dataPath;
        }
    }

    // Security: prevent directory traversal (allow both ROOT and DATA dirs)
    if (!fullPath.startsWith(ROOT_DIR) && !fullPath.startsWith(DATA_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found: ' + pathname);
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// Keep console open on exit
function keepAlive() {
    console.log('\nPress any key to exit...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
}

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('\nCRITICAL ERROR:', err.message);
    console.error(err.stack);
    keepAlive();
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error(`Please close any other instances of Reddit Viewer or applications using port ${PORT}.`);
        keepAlive();
    } else {
        console.error('\n❌ SERVER ERROR:', e.code, e.message);
        keepAlive();
    }
});

// Start server
server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;

    // Dynamic banner box
    function printBox(lines) {
        const maxWidth = 70; // Max width for the box content
        // Calculate required width based on longest line
        const contentWidth = lines.reduce((max, line) => {
            // Simple length check - for emojis assume length 2 roughly if needed, 
            // but for paths standard length is fine. 
            // We strip ANSI codes if any (none here)
            return Math.max(max, line.length);
        }, 50); // Min width 50

        const boxWidth = Math.min(contentWidth, maxWidth);

        const top = '╔' + '═'.repeat(boxWidth + 2) + '╗';
        const bottom = '╚' + '═'.repeat(boxWidth + 2) + '╝';

        console.log('');
        console.log(top);

        lines.forEach(line => {
            let content = line;
            if (content.length > boxWidth) {
                content = content.substring(0, boxWidth - 3) + '...';
            }
            console.log('║ ' + content.padEnd(boxWidth) + ' ║');
        });

        console.log(bottom);
        console.log('');
    }

    printBox([
        'Reddit GDPR Export Data Viewer - Server Started',
        '',
        `📂 Serving from: ${ROOT_DIR}`,
        `🌐 Open in browser: ${url}`,
        'Press Ctrl+C to stop'
    ]);

    // Auto-open browser after short delay
    setTimeout(() => openBrowser(url), 500);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nServer stopped.');
    process.exit(0);
});
