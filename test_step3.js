const { generateToken } = require('./src/utils/jwt');
const http = require('http');

try {
  const token = generateToken({ userId: '00000000-0000-0000-0000-000000000000', role: 'PATIENT' });
  const data = JSON.stringify({
    insurance_provider: "Star Health",
    preferred_time_slot: "Morning"
  });

  const req = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/onboarding/step-3',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Response:', res.statusCode, body));
  });

  req.on('error', console.error);
  req.write(data);
  req.end();
} catch (e) {
  console.error(e);
}
