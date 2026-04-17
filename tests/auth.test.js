/**
 * Tests pour les routes d'authentification
 */
const request = require('supertest');
const app = require('../src/index');

describe('Auth Routes', () => {
  let token;
  const testUser = {
    name: 'Test User',
    phone: '+224622334455',
    address: 'Conakry, Guinée',
    password: 'Password123!'
  };

  beforeAll(() => {
    // Cette fonction s'exécute avant tous les tests
    console.log('Démarrage des tests d\'authentification');
  });

  afterAll(() => {
    // Cette fonction s'exécute après tous les tests
    console.log('Fin des tests d\'authentification');
  });

  test('Devrait enregistrer un nouvel utilisateur', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('token');
  });

  test('Devrait refuser un enregistrement avec des données invalides', async () => {
    const invalidUser = { ...testUser, phone: 'invalid-phone' };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(invalidUser);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
  });

  test('Devrait connecter un utilisateur existant', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: testUser.phone,
        password: testUser.password
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('token');
    
    // Stocker le token pour les tests suivants
    token = response.body.data.token;
  });

  test('Devrait refuser une connexion avec un mot de passe incorrect', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: testUser.phone,
        password: 'WrongPassword123!'
      });
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('status', 'error');
  });

  test('Devrait rafraîchir le token', async () => {
    // Nécessite que la route de refresh token soit implémentée
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: token // Normalement on utiliserait un refresh token distinct
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('token');
  });
});
