const fs = require('fs');
const fetch = require('node-fetch').default;
const FormData = require('form-data');
const path = require('path');

console.log(fetch)

const BASE_URL = 'http://localhost:3000';
const OUTPUT_FILE = path.join(__dirname, 'request_results.json');

async function makeRequest({ url, method = 'GET', headers = {}, body = null, query = {}, isMultipart = false, timeout = 10000 }) {
  let fullUrl = BASE_URL + url;
  if (Object.keys(query).length) {
    const params = new URLSearchParams(query).toString();
    fullUrl += `?${params}`;
  }

  let options = { method, headers };
  if (body) {
    if (isMultipart) {
      options.body = body;
      // node-fetch will set headers automatically for FormData
    } else if (typeof body === 'object') {
      options.body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    } else {
      options.body = body;
    }
  }

  let result = {
    request: {
      url: fullUrl,
      method,
      headers: options.headers,
      query,
      body: body && !isMultipart ? body : undefined,
      multipart: isMultipart ? true : undefined,
    },
  };

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    options.signal = controller.signal;
    const response = await fetch(fullUrl, options);
    clearTimeout(id);
    result.response = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      result.response.body = await response.json();
    } else if (contentType.includes('text')) {
      result.response.body = await response.text();
    } else if (contentType.includes('octet-stream')) {
      result.response.body = Buffer.from(await response.arrayBuffer()).toString('hex');
    } else {
      result.response.body = await response.text();
    }
  } catch (err) {
    result.error = err.name === 'AbortError' ? 'Request timed out' : err.message;
  }
  return result;
}

async function runTests() {
  const results = [];


  // 1. GET /api/get
  let res = await makeRequest({ url: '/api/get', method: 'GET', query: { page: 2, sort: 'desc' } });
  results.push(res);
  console.log('Request 1 finished');

  // 2. POST /api/post
  res = await makeRequest({ url: '/api/post', method: 'POST', body: { name: 'Alice', email: 'alice@example.com' } });
  results.push(res);
  console.log('Request 2 finished');

  // 3. PATCH /api/patch/:id
  res = await makeRequest({ url: '/api/patch/1', method: 'PATCH', body: { name: 'Johnny' } });
  results.push(res);
  console.log('Request 3 finished');

  // 4. PUT /api/put/:id
  res = await makeRequest({ url: '/api/put/2', method: 'PUT', body: { name: 'Janette', email: 'janette@example.com' } });
  results.push(res);
  console.log('Request 4 finished');

  // 5. DELETE /api/delete/:id
  res = await makeRequest({ url: '/api/delete/1', method: 'DELETE' });
  results.push(res);
  console.log('Request 5 finished');

  // 6. Multipart /api/multipart
  const form = new FormData();
  form.append('multipart_data', Buffer.from('filecontent'), 'test.txt');
  form.append('description', 'Test file upload');
  res = await makeRequest({ url: '/api/multipart', method: 'POST', body: form, isMultipart: true });
  results.push(res);
  console.log('Request 6 finished');

  // 7. URL-encoded form /api/form
  res = await makeRequest({ url: '/api/form', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'username=testuser&password=1234' });
  results.push(res);
  console.log('Request 7 finished');

  // 8. Binary /api/binary
  res = await makeRequest({ url: '/api/binary', method: 'GET' });
  results.push(res);
  console.log('Request 8 finished');

  // 9. Compression /api/compress
  res = await makeRequest({ url: '/api/compress', method: 'GET' });
  results.push(res);
  console.log('Request 9 finished');

  // 10. Redirect /api/redirect
  res = await makeRequest({ url: '/api/redirect', method: 'GET' });
  results.push(res);
  console.log('Request 10 finished');

  // 11. Delay /api/delay
  res = await makeRequest({ url: '/api/delay', method: 'GET' });
  results.push(res);
  console.log('Request 11 finished');

  // 12. Large body /api/large-body
  res = await makeRequest({ url: '/api/large-body', method: 'GET' });
  results.push(res);
  console.log('Request 12 finished');

  // 13. Image /api/image
  res = await makeRequest({ url: '/api/image', method: 'GET' });
  results.push(res);
  console.log('Request 13 finished');

  // 14. Stream (XHR) /api/stream-xhr
  res = await makeRequest({ url: '/api/stream-xhr', method: 'GET' });
  results.push(res);
  console.log('Request 14 finished');

  // 15. GitHub Zen
  try {
    const zenRes = await fetch('https://api.github.com/zen');
    const zenText = await zenRes.text();
    results.push({ request: { url: 'https://api.github.com/zen', method: 'GET' }, response: { body: zenText } });
    console.log('Request 15 (GitHub Zen) finished');
  } catch (err) {
    results.push({ request: { url: 'https://api.github.com/zen', method: 'GET' }, error: err.message });
    console.log('Request 15 (GitHub Zen) failed');
  }

  // 16. Client error /api/error/client-error
  res = await makeRequest({ url: '/api/error/client-error', method: 'GET' });
  results.push(res);
  console.log('Request 16 finished');

  // 17. Server error /api/error/server-error
  res = await makeRequest({ url: '/api/error/server-error', method: 'GET' });
  results.push(res);
  console.log('Request 17 finished');

  // 18. Truncated /api/error/truncated
  res = await makeRequest({ url: '/api/error/truncated', method: 'GET' });
  results.push(res);
  console.log('Request 18 finished');

  // 19. Invalid JSON /api/error/json
  res = await makeRequest({ url: '/api/error/json', method: 'GET' });
  results.push(res);
  console.log('Request 19 finished');

  // 20. Protocol violation /api/error/protocol
  res = await makeRequest({ url: '/api/error/protocol', method: 'GET' });
  results.push(res);
  console.log('Request 20 finished');

  // 21. Hang /api/error/hang
  res = await makeRequest({ url: '/api/error/hang', method: 'GET', timeout: 10000 });
  results.push(res);
  console.log('Request 21 finished');

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log('Results written to', OUTPUT_FILE);
}

runTests();
