/**
 * Script de prueba para verificar endpoints de la API
 * Ejecutar con: node test-endpoints.js
 */

const https = require('https');
const http = require('http');

// Configuración
const IS_LOCAL = true; // Cambiar a false para probar en producción
const BASE_URL = IS_LOCAL
  ? 'http://localhost:3025/pizzarraia'
  : 'https://vps-4455523-x.dattaweb.com/pizzarraia';

// Función helper para hacer requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = lib.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Tests
async function runTests() {
  console.log('🚀 Probando endpoints en:', BASE_URL);
  console.log('─'.repeat(60));

  // Test 1: Check Session (sin autenticación)
  try {
    console.log('\n1️⃣  Testing: GET /api/check-session');
    const result = await makeRequest('/api/check-session');
    if (result.status === 200) {
      console.log('✅ Status:', result.status);
      console.log('📦 Response:', result.body);
    } else {
      console.log('❌ Failed with status:', result.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Register (crear usuario de prueba)
  try {
    console.log('\n2️⃣  Testing: POST /api/register');
    const testUsername = 'test_' + Date.now();
    const result = await makeRequest('/api/register', 'POST', {
      username: testUsername,
      password: 'test123'
    });

    if (result.status === 200 || result.status === 201) {
      console.log('✅ Status:', result.status);
      console.log('📦 Response:', result.body);
    } else if (result.status === 400 && result.body.error?.includes('ya existe')) {
      console.log('⚠️  Usuario ya existe (esperado si se ejecuta múltiples veces)');
    } else {
      console.log('❌ Failed with status:', result.status);
      console.log('📦 Response:', result.body);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Archivos estáticos
  try {
    console.log('\n3️⃣  Testing: GET /index.html (archivo estático)');
    const result = await makeRequest('/index.html');
    if (result.status === 200) {
      console.log('✅ Status:', result.status);
      console.log('📄 Content-Type:', result.headers['content-type']);
      console.log('📏 Content-Length:', result.headers['content-length']);
    } else {
      console.log('❌ Failed with status:', result.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Socket.IO endpoint
  try {
    console.log('\n4️⃣  Testing: GET /socket.io/ (Socket.IO endpoint)');
    const result = await makeRequest('/socket.io/?EIO=4&transport=polling');
    if (result.status === 200 || result.status === 400) {
      console.log('✅ Socket.IO endpoint accessible');
      console.log('📦 Status:', result.status);
    } else {
      console.log('❌ Failed with status:', result.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('✨ Tests completados');
  console.log('\n💡 Tip: Para probar en producción, cambia IS_LOCAL a false');
}

// Ejecutar tests
runTests().catch(console.error);
