/**
 * Tests pour les routes de commandes
 */
const request = require('supertest');
const app = require('../src/index');

describe('Order Routes', () => {
  let token;
  let orderId;

  beforeAll(async () => {
    // Se connecter pour obtenir un token valide
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '+224622334455',
        password: 'Password123!'
      });
    
    if (loginResponse.status === 200) {
      token = loginResponse.body.data.token;
    }
    
    // Ajouter un produit au panier pour pouvoir créer une commande
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: '00001111-1111-1111-1111-000000000001',
        quantity: 2
      });
  });

  test('Devrait créer une nouvelle commande', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'CASH_ON_DELIVERY',
        address: 'Conakry, Kaloum'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('orderId');
    
    orderId = response.body.data.orderId;
  });

  test('Devrait récupérer toutes les commandes de l\'utilisateur', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(Array.isArray(response.body.data)).toBeTruthy();
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('Devrait récupérer une commande spécifique', async () => {
    const response = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('id', orderId);
  });

  test('Devrait annuler une commande', async () => {
    const response = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    
    // Vérifier que la commande a bien été annulée
    const checkResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(checkResponse.body.data).toHaveProperty('status', 'cancelled');
  });
});
