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

// ============================================================
// ROUTES POUR LES PRODUITS
// ============================================================

// Route pour obtenir les produits avec pagination
app.get('/api/products/paginated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const categoryId = req.query.categoryId;
    
    let query = supabase.from('products').select().eq('isDispo', true);
    if (categoryId) query = query.eq('categoryId', categoryId);
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erreur pagination produits:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour rechercher des produits
app.get('/api/products/search', async (req, res) => {
  try {
    const searchQuery = req.query.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    if (!searchQuery) {
      return res.status(400).json({ message: "Paramètre 'query' requis" });
    }
    
    const { data, error } = await supabase
      .from('products')
      .select()
      .eq('isDispo', true)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erreur recherche produits:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour créer un produit
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description, categoryId, isDispo = true } = req.body;
    
    // Validation simple
    if (!name || !price || !categoryId) {
      return res.status(400).json({ 
        message: 'Nom, prix et catégorie sont requis' 
      });
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        { 
          name, 
          price, 
          description, 
          categoryId, 
          isDispo,
          created_at: new Date()
        }
      ])
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erreur création produit:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour modifier un produit
app.put('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, description, categoryId, isDispo } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (description !== undefined) updates.description = description;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (isDispo !== undefined) updates.isDispo = isDispo;
    
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erreur mise à jour produit:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour supprimer un produit
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.status(200).json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression produit:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// ============================================================
// ROUTES POUR LES CATÉGORIES
// ============================================================

// Route pour obtenir toutes les catégories
app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select()
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erreur récupération catégories:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour obtenir une catégorie par son ID
app.get('/api/categories/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const { data, error } = await supabase
      .from('categories')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erreur récupération catégorie:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// ============================================================
// ROUTES POUR LES SAUCES
// ============================================================

// Route pour obtenir toutes les sauces avec leurs produits
app.get('/api/sauces', async (req, res) => {
  try {
    const { data: saucesData, error } = await supabase
      .from('sauces')
      .select()
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Pour chaque sauce, récupérer les produits associés
    const sauces = await Promise.all(saucesData.map(async (sauce) => {
      const { data: relations, error: relError } = await supabase
        .from('sauce_products')
        .select('*, product:products(*)')
        .eq('sauce_id', sauce.id);
        
      if (relError) throw relError;
      
      return {
        ...sauce,
        products: relations.map(rel => ({
          product: rel.product,
          preparationOptions: rel.preparation_options || []
        }))
      };
    }));
    
    res.json(sauces);
  } catch (error) {
    console.error('Erreur récupération sauces:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// ============================================================
// ROUTES POUR LES PROMOTIONS
// ============================================================

// Route pour obtenir les promotions actives
app.get('/api/promos', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('specialPromos')
      .select()
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erreur récupération promos:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// ============================================================
// ROUTES POUR LES COMMANDES
// ============================================================

// Route pour obtenir les commandes d'un utilisateur
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('userId', userId)
      .order('createOrder', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    
    // Pour chaque commande, récupérer les articles
    const orders = await Promise.all(data.map(async (order) => {
      const { data: cartItems, error: itemsError } = await supabase
        .from('cartItems')
        .select()
        .eq('orderId', order.id);
        
      if (itemsError) throw itemsError;
      
      return {
        ...order,
        items: cartItems
      };
    }));
    
    res.json(orders);
  } catch (error) {
    console.error('Erreur récupération commandes:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log('Connexion à Supabase établie');
});