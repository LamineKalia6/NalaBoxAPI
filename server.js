
const express = require('express');
const cors = require('cors');
const { supabase } = require('./supabase');
require('dotenv').config();

// création de l'application express
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware pour analyser le JSON
app.use(express.json());
app.use(cors());

// Route de base 
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenu sur l\'API NalaBox',
    version: '1.0.0'
  });
});

// Route pour obtenir tous les produits 
app.get('/api/products', async (req, res) => {
  try {
    // Requête Supabase pour récuperer tous les produits
    const { data, error } = await supabase.from('products').select('*');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error.message);
    res.status(500).json({message: "Erreur serveur"});
  }
});

// Route pour obtenir un produit par son ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id; // Ne pas utiliser parseInt
    
    // Ajouter un log pour voir l'ID reçu
    console.log("ID recherché:", id);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    // Ajouter un log pour voir la réponse de Supabase
    console.log("Réponse Supabase:", { data, error });
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erreur:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});


// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log('Connexion à Supabase établie');
});