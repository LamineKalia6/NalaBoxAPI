/**
 * Configuration globale pour les tests Jest
 */
const { setupTestEnvironment, cleanupTestEnvironment } = require('./supabase-setup');

// Configuration avant tous les tests
beforeAll(async () => {
  console.log('=== DÉMARRAGE DE LA SUITE DE TESTS ===');
  
  // Configurer l'environnement de test Supabase
  // En mode test réel, on activerait cette ligne:
  // await setupTestEnvironment();
  
  // En mode simulé (sans Supabase), on continue simplement
  console.log('Environnement de test prêt (mode simulé)');
});

// Nettoyage après tous les tests
afterAll(async () => {
  // Nettoyer l'environnement de test Supabase
  // En mode test réel, on activerait cette ligne:
  // await cleanupTestEnvironment();
  
  console.log('=== FIN DE LA SUITE DE TESTS ===');
});
