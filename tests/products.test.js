/**
 * Tests pour les routes de produits
 */
const request = require('supertest');
const app = require('../src/index');

describe('Product Routes', () => {
  let token;

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

  test('Devrait récupérer tous les produits', async () => {
    const response = await request(app)
      .get('/api/products');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(Array.isArray(response.body.data)).toBeTruthy();
  });

  test('Devrait récupérer un produit par ID', async () => {
    const productId = '00001111-1111-1111-1111-000000000001'; // ID d'un produit existant
    
    const response = await request(app)
      .get(`/api/products/${productId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.data).toHaveProperty('id', productId);
  });

  test('Devrait filtrer les produits par catégorie', async () => {
    const categoryId = 'a1111111-1111-1111-1111-111111111111'; // ID d'une catégorie existante
    
    const response = await request(app)
      .get(`/api/products?categoryId=${categoryId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(Array.isArray(response.body.data)).toBeTruthy();
    
    // Vérifier que tous les produits appartiennent à cette catégorie
    if (response.body.data.length > 0) {
      const allFromCategory = response.body.data.every(product => product.categoryId === categoryId);
      expect(allFromCategory).toBeTruthy();
    }
  });

  // Test d'administration des produits (nécessite un token admin)
  test('Devrait refuser la création de produit sans droits admin', async () => {
    const newProduct = {
      name: 'Test Product',
      description: 'Description du produit de test',
      price: 10000,
      categoryId: 'a1111111-1111-1111-1111-111111111111',
      unit: 'kg'
    };
    
    const response = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send(newProduct);
    
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('status', 'error');
  });
});
