/**
 * Script simple pour tester l'API NalaBox
 * Exécutez avec: node test-api.js
 */
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/products',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Test de l\'API NalaBox sur http://localhost:3001/api/products...');

const req = http.request(options, (res) => {
  console.log(`Statut: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Réponse:');
    console.log(JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error(`Erreur: ${error.message}`);
});

req.end();
