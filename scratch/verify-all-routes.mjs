import http from 'http';

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, bodyLength: data.length });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function verifyAll() {
  const routes = [
    '/dashboard',
    '/investment-khata',
    '/customers',
    '/loans',
    '/depositors',
    '/employees',
    '/chits',
    '/reports',
    '/settings',
    '/partners' // expected 404
  ];

  console.log('Testing application routes on http://localhost:3000:');
  for (const r of routes) {
    const res = await checkUrl(`http://localhost:3000${r}`);
    console.log(`Route ${r.padEnd(20)} => Status: ${res.statusCode}, Length: ${res.bodyLength || 0}`);
  }
}

verifyAll();
