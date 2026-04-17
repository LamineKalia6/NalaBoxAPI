/**
 * Configuration Jest pour les tests de l'API NalaBox
 */
module.exports = {
  // Répertoire racine
  rootDir: '.',
  
  // Patterns de fichiers de test
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  
  // Environnement de test
  testEnvironment: 'node',
  
  // Timeout pour les tests
  testTimeout: 30000,
  
  // Hook de configuration pour les tests
  setupFilesAfterEnv: ['<rootDir>/tests/test-setup.js'],
  
  // Coverage
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: '<rootDir>/coverage',
  
  // Mocks globaux
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Reporter
  verbose: true,
};
