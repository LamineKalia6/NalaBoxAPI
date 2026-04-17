/**
 * Configuration de la base de données avec Supabase
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./supabase.config');

console.log('Mode Supabase activé - Utilisation de la base de données dans le cloud');

/**
 * Couche d'abstraction pour interagir avec Supabase
 * Cette couche traduit les requêtes SQL traditionnelles en appels Supabase
 */
const db = {
  /**
   * Exécute une requête sur Supabase
   * @param {string} text - Requête SQL ou nom de la table
   * @param {Array} params - Paramètres pour la requête
   */
  query: async (text, params = []) => {
    console.log('Requête Supabase:', text);
    
    try {
      // Déterminer le type de requête en analysant le texte SQL
      if (text.toLowerCase().startsWith('select')) {
        // Gestion des SELECT
        const tableName = extractTableName(text);
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (error) throw error;
        
        return {
          rows: data || [],
          rowCount: data ? data.length : 0
        };
      } 
      else if (text.toLowerCase().startsWith('insert')) {
        // Gestion des INSERT
        const tableName = extractTableName(text);
        const { data, error } = await supabase
          .from(tableName)
          .insert(params[0])
          .select();
        
        if (error) throw error;
        
        return {
          rows: data || [],
          rowCount: data ? data.length : 0
        };
      }
      else if (text.toLowerCase().startsWith('update')) {
        // Gestion des UPDATE
        const tableName = extractTableName(text);
        const { data, error } = await supabase
          .from(tableName)
          .update(params[0])
          .eq('id', params[1])
          .select();
        
        if (error) throw error;
        
        return {
          rows: data || [],
          rowCount: data ? data.length : 0
        };
      }
      else {
        // Requête SQL personnalisée via Supabase
        const { data, error } = await supabase.rpc('execute_sql', { 
          sql_query: text,
          params: params 
        });
        
        if (error) throw error;
        
        return {
          rows: data || [],
          rowCount: data ? data.length : 0
        };
      }
    } catch (error) {
      console.error('Erreur Supabase:', error);
      throw error;
    }
  },
  
  /**
   * Récupère un client de connexion à Supabase
   */
  getClient: () => {
    return {
      query: db.query,
      release: () => {}
    };
  },
  
  /**
   * Ajout de méthodes spécifiques pour Supabase
   */
  supabase,
  
  /**
   * Ajouter des données de test dans Supabase
   */
  addTestData: async () => {
    try {
      // Vérifier d'abord si l'utilisateur de test existe déjà
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('phone', '+224611223344');
      
      if (!existingUsers || existingUsers.length === 0) {
        // Créer un utilisateur de test
        await supabase.from('users').insert({
          id: uuidv4(),
          name: 'Utilisateur Test',
          phone: '+224611223344',
          address: 'Conakry, Guinée',
          password_hash: 'hashed_password',
          role: 'user'
        });
        
        console.log('Données de test ajoutées à Supabase');
      } else {
        console.log('Utilisateur de test existe déjà dans Supabase');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout des données de test:', error);
    }
  }
};

/**
 * Extrait le nom de la table à partir d'une requête SQL simple
 * Note: Cette fonction est simplifiée et ne gère pas tous les cas SQL complexes
 */
function extractTableName(sqlQuery) {
  const sql = sqlQuery.toLowerCase();
  
  if (sql.includes('from')) {
    const fromParts = sql.split('from')[1].trim().split(' ');
    return fromParts[0].replace(/[^a-zA-Z0-9_]/g, '');
  } else if (sql.includes('insert into')) {
    const intoParts = sql.split('insert into')[1].trim().split(' ');
    return intoParts[0].replace(/[^a-zA-Z0-9_]/g, '');
  } else if (sql.includes('update')) {
    const updateParts = sql.split('update')[1].trim().split(' ');
    return updateParts[0].replace(/[^a-zA-Z0-9_]/g, '');
  }
  
  // Fallback pour les cas non gérés
  return 'unknown_table';
}

// Essayer d'ajouter des données de test si les tables existent
db.addTestData().catch(err => {
  console.log('Note: La fonctionnalité de données de test n\'est pas disponible, veuillez configurer Supabase correctement');
});

module.exports = db;
