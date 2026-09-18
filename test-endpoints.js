const fetch = require('node-fetch');

async function test() {
  const endpoints = [
    '/api/stats',
    '/api/progress-details',
    '/api/dashboard-extended'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Fetching ${endpoint}...`);
      const res = await fetch(`http://localhost:3000${endpoint}`);
      const text = await res.text();
      console.log(`Response for ${endpoint}:`, text.substring(0, 200));
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
    }
  }
}

test();
