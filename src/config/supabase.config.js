/**
 * Configuration de Supabase pour NalaBox API
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Créer un client Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`Client Supabase initialisé pour l'URL: ${supabaseUrl}`);

module.exports = { supabase };
