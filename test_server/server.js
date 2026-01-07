const express = require("express");
const multer = require("multer"); // For multipart/form-data
const compression = require("compression"); // For GZIP/Brotli
const bodyParser = require("body-parser");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();
const port = 3000;

// data for testing
const users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Doe", email: "jane@example.com" },
];

// middleware

app.use(express.static("."));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage() });

// 1. GET Request
app.get("/api/get", (req, res) => {
  const { page, sort } = req.query;

  res.setHeader("Content-Type", "application/json");
  res.json({
    meta: {
      page: page || 1,
      sort: sort || "asc",
      total: users.length,
    },
    data: users,
  });
});

// 2. POST Request
app.post("/api/post", (req, res) => {
  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);

  res.status(201).json({
    message: "Post request successful",
    userId: newUser.id,
    captured_data: req.body,
  });
});

// 3. PATCH Request
app.patch("/api/patch/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  Object.assign(user, req.body);

  res.status(204).send();
});

// 4. PUT Request
app.put("/api/put/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users[index] = { id, ...req.body };
  res.status(200).json({
    message: "Put request successful",
    user: users[index],
  });
});

// 5. DELETE Request
app.delete("/api/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  users.splice(index, 1);
  res.json({ message: "Delete request successful", deletedId: id });
});

// 6. Multipart/Form-Data
app.post("/api/multipart", upload.single("multipart_data"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const description = req.body.description;

  res.json({
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    metadata_received: description,
  });
});

// 7. URL-Encoded Forms
app.post("/api/form", (req, res) => {
  const { username, password } = req.body;

  res.json({
    type: "Legacy Form",
    received_user: username,
    login_status: "active",
  });
});

// 8. Binary Data
app.get("/api/binary", (req, res) => {
  const buffer = Buffer.alloc(128);
  for (let i = 0; i < 128; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }

  res.setHeader("Content-Type", "application/octet-stream");
  res.send(buffer);
});

// 9. GZIP/Brotli Compression
app.get("/api/compress", compression(), (req, res) => {
  const largeDataSet = [];
  for (let i = 0; i < 1000; i++) {
    largeDataSet.push({ id: i, text: "Repeating string to compress " + i });
  }

  res.json(largeDataSet);
});

// 10. Redirection (3xx)
app.get("/api/redirect", (req, res) => {
  res.redirect(301, "/api/get?redirected=true");
});

// 11. Delayed Response (Timeout)
app.get("/api/delay", (req, res) => {
  const delay = 3000;
  console.log(`/delay: Holding request for ${delay}ms`);

  setTimeout(() => {
    res.json({
      message: "Response received after delay",
      delay_ms: delay,
      timestamp: new Date().toISOString(),
    });
  }, delay);
});

// 12. Large Body
app.get("/api/large-body", (req, res) => {
  const targetSizeMB = 5;
  const dummyString = "X ".repeat(1024); // 1KB chunk
  const iterations = targetSizeMB * 512; // 5120KB total

  const largeData = [];
  for (let i = 0; i < iterations; i++) {
    largeData.push(dummyString);
  }
  res.send(largeData.join(""));
});

// 13. Image Serving
app.get("/api/image", (req, res) => {
  res.sendFile(__dirname + "/img/img.jpg");
});

// 14. Large Image Serving
app.get("/api/large-image", (req, res) => {
  res.sendFile(__dirname + "/img/large_img.jpg");
});

// 15. XHR Incremental Streaming
app.get("/api/stream-xhr", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");

  res.write("--- Stream Started ---\n");

  let chunkCount = 0;
  const maxChunks = 5;

  const interval = setInterval(() => {
    chunkCount++;
    const timestamp = new Date().toLocaleTimeString();
    res.write(`[Chunk ${chunkCount}] Data received at ${timestamp}\n`);

    if (chunkCount >= maxChunks) {
      clearInterval(interval);
      res.write("--- Stream Finished ---");
      res.end();
    }
  }, 1000);
});

// 16. Client Errors (4xx)
app.get("/api/error/client-error", (req, res) => {
  res.status(403).json({
    error: "Forbidden",
    message: "Invalid Token provided",
    code: 4003,
  });
});

// 17. Server Errors (5xx)
app.get("/api/error/server-error", (req, res) => {
  res.status(503).send(`
        <html>
            <body>
                <h1>503 Service Unavailable</h1>
                <p>The upstream server is currently unavailable.</p>
                <hr>
            </body>
        </html>
    `);
});

// 18. Malformed: Content-Length mismatch
app.get("/api/error/truncated", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Length": "1024",
  });
  res.write('{ "message": "This is the start of a valid JSON object"');
  setTimeout(() => {
    console.log("/truncated: Destroying socket for /truncated");
    req.socket.destroy();
  }, 100);
});

// 19. Invalid JSON Syntax
app.get("/api/error/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send('{ "status": "ok", "data": [1, 2, 3, "malformed');
});

// 20. Protocol Violation
app.get("/api/error/protocol", (req, res) => {
  const socket = req.socket;
  socket.write("BAD_PROTOCOL\r\n");
  socket.write("Content-Type: ?????\r\n");
  socket.write("\r\n");
  socket.write("raw string data");
  socket.end();
});

// 21. Malformed: Hang
app.get("/api/error/hang", (req, res) => {
  console.log("/hang: Hanging connection intentionally");
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", endpoint: req.originalUrl });
});

// Root HTML Page for Testing
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Server Initialization
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Testing Server running at http://localhost:${port}`);
  console.log(`- Standard API: /api/`);
  console.log(`- Errors: /api/error/`);
});
