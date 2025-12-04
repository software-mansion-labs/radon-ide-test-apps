const express = require('express');
const multer = require('multer'); // For multipart/form-data
const compression = require('compression'); // For GZIP/Brotli
const bodyParser = require('body-parser');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const port = 3000;

// In-memory data for testing
let users = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Doe", email: "jane@example.com" }
];

let cart = [
    { id: 1, item: "Book", quantity: 1 },
    { id: 2, item: "Pen", quantity: 2 }
];

// -- Middleware Configuration --

// Serve static files from current directory
app.use(express.static('.'));

// Parse JSON bodies (for API requests)
app.use(express.json());

// Parse URL-encoded bodies (for legacy forms)
app.use(express.urlencoded({ extended: true }));

// Configure Multer for file uploads (stores in memory to avoid filesystem clutter)
const upload = multer({ storage: multer.memoryStorage() });

// -- 1. GET Request (Data Retrieval) --
// Scenario: Fetching users with query params.
app.get('/api/get', (req, res) => {
    // Inspector Validation: Check ?page=2&sort=desc is captured
    const { page, sort } = req.query;
    
    res.setHeader('Content-Type', 'application/json');
    res.json({
        meta: {
            page: page || 1,
            sort: sort || 'asc',
            total: users.length
        },
        data: users
    });
});

// -- 2. POST Request (Resource Creation) --
// Scenario: User registration.
app.post('/api/post', (req, res) => {
    // Inspector Validation: Verify body capture. 
    const newUser = { id: users.length + 1, ...req.body };
    users.push(newUser);

    res.status(201).json({
        message: "Post request successful",
        userId: newUser.id,
        captured_data: req.body 
    });
});

// -- 3. PATCH Request (Partial Update) --
// Scenario: Updating a user profile.
app.patch('/api/patch/:id', (req, res) => {
    // Inspector Validation: Check payload only contains modified fields.
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    Object.assign(user, req.body);
    console.log(`Updating profile for ID: ${req.params.id}`);
    
    // Simulating a 204 No Content (common for updates)
    res.status(204).send();
});

// -- 4. PUT Request (Full Update) --
// Scenario: Updating a user profile.
app.put('/api/put/:id', (req, res) => {
    // Simulating full resource replacement
    const id = parseInt(req.params.id);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
        return res.status(404).json({ error: "User not found" });
    }
    users[index] = { id, ...req.body };
    res.status(200).json({
        message: "Put request successful",
        user: users[index]
    });
});

// -- 5. DELETE Request --
// Scenario: Removing a user.
app.delete('/api/delete/:id', (req, res) => {
    // Inspector Validation: Verify URL path ID construction.
    const id = parseInt(req.params.id);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
        return res.status(404).json({ error: "User not found" });
    }
    users.splice(index, 1);
    res.json({ message: "Delete request successful", deletedId: id });
});

// -- 6. Multipart/Form-Data (File Upload) --
// Scenario: Testing multipart/form-data file uploads.
app.post('/api/multipart', upload.single('multipart_data'), (req, res) => {
    // Inspector Validation: Identify boundary strings and separate metadata from binary.
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    // Also capture additional text fields sent with the file
    const description = req.body.description; 
    console.log("MULTIPART RECEIVED");

    res.json({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        metadata_received: description
    });
});

// -- 7. URL-Encoded Forms --
// Scenario: Testing URL-encoded forms.
app.post('/api/form', (req, res) => {
    // Inspector Validation: Body parsed as key-value pairs (x-www-form-urlencoded).
    const { username, password } = req.body;
    
    res.json({
        type: "Legacy Form",
        received_user: username,
        login_status: "active"
    });
});

// -- 8. Binary Data (Protobuf/Streams) --
// Scenario: Testing binary data.
app.get('/api/binary', (req, res) => {
    // Inspector Validation: Hex dump display.
    const buffer = Buffer.alloc(128);
    for (let i = 0; i < 128; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);
});

// -- 9. GZIP/Brotli Compression --
// Scenario: Testing compression.
app.get('/api/compress', compression(), (req, res) => {
    // Inspector Validation: Show decompressed size vs network transfer size.
    const largeDataSet = [];
    for(let i=0; i<1000; i++) {
        largeDataSet.push({ id: i, text: "Repeating string to compress " + i });
    }
    
    res.json(largeDataSet);
});

// -- 10. Redirection (3xx) --
// Scenario: Testing HTTP redirections.
app.get('/api/redirect', (req, res) => {
    // Inspector Validation: Show chain (301 -> 200).
    res.redirect(301, '/api/get?redirected=true');
});

// -- 11. Client Errors (4xx) --
// Scenario: Testing client errors.
app.get('/api/error/client-error', (req, res) => {
    // Inspector Validation: Highlight red/orange. Parse error payload.
    res.status(403).json({ 
        error: "Forbidden", 
        message: "Invalid Token provided", 
        code: 4003 
    });
});

// -- 12. Server Errors (5xx) --
// Scenario: Testing server errors.
app.get('/api/error/server-error', (req, res) => {
    // Inspector Validation: Render raw HTML preview instead of JSON.
    res.status(503).send(`
        <html>
            <body>
                <h1>503 Service Unavailable</h1>
                <p>The upstream server is currently unavailable.</p>
                <hr>
                <address>Nginx/1.18.0</address>
            </body>
        </html>
    `);
});

// -- 13. GraphQL Operations --
// Scenario: Testing GraphQL operations.
app.post('/api/graphql', (req, res) => {
    // Inspector Validation: Identify operationName (GetUserProfile) and Variables.
    const { query, operationName, variables } = req.body;

    let data = {};
    if (operationName === 'GetUserProfile') {
        data = {
            user: {
                id: variables?.id || "1",
                name: "GraphQL User"
            }
        };
    } else {
        data = { message: "Unknown operation" };
    }

    res.json({ data: data });
});

// -- 14. Network Failure --
// Note: Handled by client requesting non-existent domain.

// -- 15. XHR Incremental Streaming --
// Scenario: Legacy real-time updates.
app.get('/api/stream-xhr', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked'); 
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.write('--- Stream Started ---\n');

    let chunkCount = 0;
    const maxChunks = 5;

    const interval = setInterval(() => {
        chunkCount++;
        const timestamp = new Date().toLocaleTimeString();
        res.write(`[Chunk ${chunkCount}] Data received at ${timestamp}\n`);

        if (chunkCount >= maxChunks) {
            clearInterval(interval);
            res.write('--- Stream Finished ---');
            res.end(); 
        }
    }, 1000); 
});

// -- 16. Malformed: Content-Length mismatch --
app.get('/api/error/truncated', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': '1024' 
    });
    res.write('{ "message": "This is the start of a valid JSON object, but it will die soon..."');
    setTimeout(() => {
        console.log("error: Destroying socket for /truncated");
        req.socket.destroy(); 
    }, 100);
});

// -- 17. error: Invalid JSON Syntax --
app.get('/api/error/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send('{ "status": "ok", "data": [1, 2, 3, "oops...'); 
});

// -- 18. error: Protocol Violation --
app.get('/api/error/protocol', (req, res) => {
    const socket = req.socket;
    console.log("error: Sending garbage protocol data");
    socket.write('BAD_PROTOCOL 999 WHAT?\r\n');
    socket.write('Content-Type: ?????\r\n');
    socket.write('\r\n');
    socket.write('Some raw data');
    socket.end();
});

// -- 19. Malformed: Hang --
app.get('/api/error/hang', (req, res) => {
    console.log('error: Hanging connection intentionally (Zombie Request)...');
});

// -- 20. Large Body --
// Scenario: Stress testing throughput and payload size (~5MB).
app.get('/api/large-body', (req, res) => {
    // Inspector Validation: Notice high "Content-Length" and longer "Content Download" time.
    console.log("START")
    const targetSizeMB = 5;
    const dummyString = "X ".repeat(1024); // 1KB chunk
    const iterations = targetSizeMB * 512; // 5120KB total
    
    const largeData = [];
    for (let i = 0; i < iterations; i++) {
        largeData.push(dummyString);
    }
    // res.json({
    //     meta: { 
    //         description: "Large Payload Test",
    //         size_label: `${targetSizeMB} MB`, 
    //         chunks: iterations 
    //     },
    //     data: largeData
    // });
    res.send(largeData.join(""))
    console.log("END")
});

// -- 21. Delayed Response (Timeout) --
// Scenario: Simulating High Latency or Server Processing Time.
app.get('/api/delay', (req, res) => {
    // Inspector Validation: "Waiting (TTFB)" should be ~3.0s (or slightly more).
    const delay = 3000; // 3 seconds
    console.log(`Delay: Holding request for ${delay}ms...`);
    
    setTimeout(() => {
        res.json({ 
            message: "Response received after delay", 
            delay_ms: delay,
            timestamp: new Date().toISOString()
        });
    }, delay);
});

// -- 22. Image Serving --
// Scenario: Serving static image files.
app.get('/api/image', (req, res) => {
    // Inspector Validation: Check Content-Type header and binary data display.
    res.sendFile(__dirname + '/img.png');
});

// -- Global 404 Handler --
app.use((req, res) => {
    res.status(404).json({ error: "Not Found", endpoint: req.originalUrl });
});

// -- Root HTML Page for Testing --
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// -- Server Initialization --
const server = http.createServer(app);

// -- 22. WebSockets (WS/WSS) --
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('WS: Client connected');
    ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to Live Ticker' }));

    ws.on('message', (message) => {
        console.log('WS: Received:', message.toString());
        ws.send(JSON.stringify({ type: 'ECHO', content: message.toString() }));
    });

    ws.on('close', (code, reason) => {
        console.log(`WS: Closed with code ${code}`);
    });
});

server.listen(port, () => {
    console.log(`Testing Server running at http://localhost:${port}`);
    console.log(`- Standard API: /api/get`);
    console.log(`- Malformed (Truncated): /api/error/truncated`);
    console.log(`- Malformed (Bad JSON): /api/error/json`);
    console.log(`- Large Body (~5MB): /api/large-body`);
    console.log(`- 3s Delay: /api/delay`);
    console.log(`WebSocket Server ready at ws://localhost:${port}`);
});