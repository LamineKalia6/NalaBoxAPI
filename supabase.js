// Ce fichier initialise la connexion à Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Récupérer les variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Vérifier que les variables sont définies
if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur : Variables Supabase manquantes dans .env');
  process.exit(1);
}

// Créer et exporter le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
