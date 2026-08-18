import http from 'http';

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, location: res.headers.location, bodyLength: data.length });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function run() {
  console.log('Checking http://localhost:3000/:');
  console.log(await checkUrl('http://localhost:3000/'));
  
  console.log('\nChecking http://localhost:3000/login:');
  console.log(await checkUrl('http://localhost:3000/login'));
}

run();
