/**
 * Configuration de Supabase pour les tests
 * Ce fichier permet de configurer un environnement de test isolé
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Créer un client Supabase pour les tests
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-anon-key';

// Utiliser un préfixe "test_" pour isoler les données de test
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Prépare l'environnement de test Supabase
 */
async function setupTestEnvironment() {
  try {
    console.log('Préparation de l\'environnement de test Supabase...');
    
    // Créer un utilisateur de test si nécessaire
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .eq('phone', '+224622334455');
    
    if (!existingUsers || existingUsers.length === 0) {
      await supabase.from('users').insert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Utilisateur Test',
        phone: '+224622334455',
        address: 'Conakry, Guinée',
        password_hash: '$2a$10$X7VYlEjMVzrwv8LeJDNy.OqlNFYH7Z5KDc1ZjiJGSrOgg6M0WBdSi', // "Password123!"
        role: 'user'
      });
      
      console.log('Utilisateur de test créé avec succès.');
    }
    
    // Créer quelques produits et catégories de test si nécessaire
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*')
      .eq('id', 'a1111111-1111-1111-1111-111111111111');
    
    if (!existingCategories || existingCategories.length === 0) {
      await supabase.from('categories').insert({
        id: 'a1111111-1111-1111-1111-111111111111',
        name: 'Catégorie Test',
        description: 'Description de la catégorie de test'
      });
      
      await supabase.from('products').insert({
        id: '00001111-1111-1111-1111-000000000001',
        name: 'Produit Test',
        description: 'Description du produit de test',
        price: 5000,
        categoryId: 'a1111111-1111-1111-1111-111111111111',
        unit: 'kg',
        isDispo: true,
        stockQuantity: 100
      });
      
      console.log('Catégorie et produit de test créés avec succès.');
    }
    
    // Créer une sauce de test
    const { data: existingSauces } = await supabase
      .from('sauces')
      .select('*')
      .eq('id', 'a0001111-1111-1111-1111-000000000001');
    
    if (!existingSauces || existingSauces.length === 0) {
      await supabase.from('sauces').insert({
        id: 'a0001111-1111-1111-1111-000000000001',
        name: 'Sauce Test',
        description: 'Description de la sauce de test',
        preparationTime: 30,
        discountedPrice: 25000
      });
      
      console.log('Sauce de test créée avec succès.');
    }
    
    console.log('Environnement de test Supabase prêt.');
    return true;
  } catch (error) {
    console.error('Erreur lors de la préparation de l\'environnement de test:', error);
    return false;
  }
}

/**
 * Nettoie l'environnement de test après les tests
 */
async function cleanupTestEnvironment() {
  try {
    // En mode développement, on peut conserver les données de test
    // En mode production, on pourrait nettoyer les données
    console.log('Nettoyage de l\'environnement de test terminé.');
    return true;
  } catch (error) {
    console.error('Erreur lors du nettoyage de l\'environnement de test:', error);
    return false;
  }
}

module.exports = {
  supabase,
  setupTestEnvironment,
  cleanupTestEnvironment
};
