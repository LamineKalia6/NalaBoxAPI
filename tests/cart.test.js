/**
 * Tests pour les routes de panier
 */
const request = require('supertest');
const app = require('../src/index');

describe('Cart Routes', () => {
  let token;
  const testProductId = '00001111-1111-1111-1111-000000000001'; // ID d'un produit existant
  const testSauceId = 'a0001111-1111-1111-1111-000000000001'; // ID d'une sauce existante

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
  });

  test('Devrait récupérer le panier vide', async () => {
    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('items');
    expect(Array.isArray(response.body.data.items)).toBeTruthy();
  });

  test('Devrait ajouter un produit au panier', async () => {
    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testProductId,
        quantity: 2
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('items');
    
    const hasProduct = response.body.data.items.some(item => item.productId === testProductId);
    expect(hasProduct).toBeTruthy();
  });

  test('Devrait ajouter un kit de sauce au panier', async () => {
    const response = await request(app)
      .post('/api/cart/sauce-kit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sauceId: testSauceId
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('items');
    
    const hasSauceKit = response.body.data.items.some(item => item.sauceId === testSauceId);
    expect(hasSauceKit).toBeTruthy();
  });

  test('Devrait mettre à jour la quantité d\'un produit dans le panier', async () => {
    const response = await request(app)
      .put('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testProductId,
        quantity: 3
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    
    const product = response.body.data.items.find(item => item.productId === testProductId);
    expect(product).toBeDefined();
    expect(product.quantity).toBe(3);
  });

  test('Devrait supprimer un produit du panier', async () => {
    const response = await request(app)
      .delete(`/api/cart/items/${testProductId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    
    const hasProduct = response.body.data.items.some(item => item.productId === testProductId);
    expect(hasProduct).toBeFalsy();
  });
});
