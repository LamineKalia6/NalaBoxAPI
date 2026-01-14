const express = require('express');
const cors = require('cors');
const { supabase } = require('./supabase');
const https = require('https');
require('dotenv').config();

// création de l'application express
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware pour analyser le JSON
app.use(express.json());
app.use(cors());

// Système de ping pour éviter la mise en veille sur Render
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes en millisecondes
const APP_URL = 'https://nalaboxapi.onrender.com'; // URL de l'API déployée

function pingServer() {
  console.log('Ping du serveur pour éviter la mise en veille...');
  https.get(APP_URL, (res) => {
    console.log(`Ping réussi avec statut: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Erreur lors du ping:', err.message);
  });
}

// Démarrer le ping périodique si nous sommes en production
if (process.env.NODE_ENV === 'production') {
  setInterval(pingServer, PING_INTERVAL);
  console.log('Système de ping activé');
}

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
    const { id, name, price, description, categoryId, isDispo = true, imgUrl, isPopular = false } = req.body;
    
    // Validation simple
    if (!name || !price || !categoryId) {
      return res.status(400).json({ 
        message: 'Nom, prix et catégorie sont requis' 
      });
    }
    
    // Importer crypto si pas déjà fait
    const crypto = require('crypto');
    
    // Générer un UUID si l'ID n'est pas fourni
    const productId = id || crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        { 
          id: productId,
          name, 
          price, 
          description, 
          categoryId, 
          isDispo,
          imgUrl,
          isPopular,
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

// Route pour obtenir un produit par son ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erreur récupération produit:', error.message);
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

// Route pour valider un code promo
app.post('/api/validate-promo', async (req, res) => {
  try {
    const { promoCode, cartTotal } = req.body;

    if (!promoCode) {
      return res.status(400).json({ message: 'Code promo requis' });
    }

    const now = new Date().toISOString();

    // Recherche du code promo actif
    const { data, error } = await supabase
      .from('specialPromos')
      .select()
      .eq('promo_code', promoCode)
      .lte('start_date', now)
      .gte('end_date', now)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Code promo invalide ou expiré' 
      });
    }

    // Vérifier si le montant minimum du panier est atteint (si applicable)
    if (data.min_cart_value && cartTotal < data.min_cart_value) {
      return res.json({
        valid: false,
        message: `Le montant minimum d'achat pour ce code promo est de ${data.min_cart_value} GNF`,
        promo: data,
        minimumRequired: data.min_cart_value
      });
    }

    // Code promo valide
    res.json({
      valid: true,
      message: 'Code promo appliqué avec succès',
      promo: data,
      discountAmount: data.discount_percent ? (cartTotal * data.discount_percent / 100) : 0,
      discountPercent: data.discount_percent || 0,
      freeDelivery: data.free_delivery || false
    });
  } catch (error) {
    console.error('Erreur validation code promo:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// ============================================================
// ROUTES POUR LES CENTRES DE DISTRIBUTION
// ============================================================

// Route pour obtenir tous les centres de distribution
app.get('/api/distribution-centers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('distribution_centers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erreur récupération centres de distribution:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour obtenir un centre de distribution par son ID
app.get('/api/distribution-centers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const { data, error } = await supabase
      .from('distribution_centers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Centre de distribution non trouvé' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erreur récupération centre de distribution:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour calculer les frais de livraison
app.post('/api/calculate-delivery-fee', async (req, res) => {
  try {
    const { location, totalAmount } = req.body;
    
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Localisation requise (lat/lng)' });
    }
    
    // Récupérer les centres de distribution
    const { data: centers, error: centersError } = await supabase
      .from('distribution_centers')
      .select('*');
    
    if (centersError) throw centersError;
    
    if (!centers || centers.length === 0) {
      return res.status(404).json({ message: 'Aucun centre de distribution disponible' });
    }
    
    // Trouver le centre le plus proche
    let nearestCenter = null;
    let shortestDistance = Infinity;
    
    centers.forEach(center => {
      if (center.location && center.location.lat && center.location.lng) {
        const distance = calculateDistance(
          location.lat, location.lng,
          center.location.lat, center.location.lng
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestCenter = center;
        }
      }
    });
    
    if (!nearestCenter) {
      return res.status(500).json({ message: 'Impossible de déterminer le centre le plus proche' });
    }
    
    // Calculer les frais de livraison
    let deliveryFee = nearestCenter.baseDeliveryFee;
    deliveryFee += Math.ceil(shortestDistance) * nearestCenter.perKmFee;
    
    // Appliquer la livraison gratuite si le montant est suffisant
    const freeDeliveryThreshold = nearestCenter.freeDeliveryThreshold || 0;
    const hasFreeDelivery = totalAmount && totalAmount >= freeDeliveryThreshold;
    
    res.json({
      deliveryFee: hasFreeDelivery ? 0 : deliveryFee,
      hasFreeDelivery,
      distance: shortestDistance,
      center: nearestCenter
    });
  } catch (error) {
    console.error('Erreur calcul frais de livraison:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Fonction pour calculer la distance entre deux points géographiques (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
}

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

// ============================================================
// ROUTES POUR LES UTILISATEURS ET L'AUTHENTIFICATION
// ============================================================

// Route pour l'inscription d'un utilisateur
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullname, phone } = req.body;
    
    // Validation basique
    if (!email || !password || !fullname) {
      return res.status(400).json({ 
        message: 'Email, mot de passe et nom complet sont requis' 
      });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    if (existingUser) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Inscription avec Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullname,
          phone: phone || ''
        }
      }
    });
    
    if (error) throw error;
    
    // Créer un profil dans la table profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email,
          full_name: fullname,
          phone: phone || '',
          created_at: new Date()
        }
      ]);
    
    if (profileError) throw profileError;
    
    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullname
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour la connexion d'un utilisateur
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation basique
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email et mot de passe sont requis' 
      });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Récupérer les informations du profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) throw profileError;
    
    res.json({
      message: 'Connexion réussie',
      session: data.session,
      user: {
        ...data.user,
        profile
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour déconnecter un utilisateur
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur déconnexion:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour récupérer un profil utilisateur
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erreur récupération profil:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour mettre à jour un profil utilisateur
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, address, avatar_url } = req.body;
    
    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erreur mise à jour profil:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// ============================================================
// ROUTES POUR LES FAVORIS
// ============================================================

// Route pour obtenir les favoris d'un utilisateur
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Si aucun favori, retourner un tableau vide
    if (!data || data.length === 0) {
      return res.json([]);
    }
    
    // Récupérer les détails des produits favoris
    const productIds = data.map(fav => fav.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);
    
    if (productsError) throw productsError;
    
    res.json(products);
  } catch (error) {
    console.error('Erreur récupération favoris:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour ajouter un produit aux favoris
app.post('/api/favorites', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    
    if (!userId || !productId) {
      return res.status(400).json({ message: 'ID utilisateur et ID produit requis' });
    }
    
    // Vérifier si déjà en favoris
    const { data: existing, error: checkError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existing) {
      return res.status(409).json({ message: 'Ce produit est déjà dans les favoris' });
    }
    
    // Ajouter aux favoris
    const { error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, product_id: productId }]);
    
    if (error) throw error;
    
    res.status(201).json({ message: 'Produit ajouté aux favoris' });
  } catch (error) {
    console.error('Erreur ajout favori:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour demander la réinitialisation du mot de passe
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) throw error;
    
    res.json({ message: 'Instructions de réinitialisation envoyées à votre email' });
  } catch (error) {
    console.error('Erreur demande réinitialisation:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour générer un code de parrainage pour un utilisateur
app.get('/api/referral/code/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'ID utilisateur requis' });
    }
    
    // Vérifier si l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si l'utilisateur a déjà un code de parrainage
    const codeParrainage = user.codeParrainage || generateReferralCode(userId);
    
    // Si pas de code existant, mettre à jour le profil avec le nouveau code
    if (!user.codeParrainage) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ codeParrainage })
        .eq('id', userId);
        
      if (updateError) throw updateError;
    }
    
    res.json({ code: codeParrainage });
  } catch (error) {
    console.error('Erreur génération code parrainage:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour appliquer un code de parrainage
app.post('/api/referral/apply', async (req, res) => {
  try {
    const { code, filleulId } = req.body;
    
    if (!code || !filleulId) {
      return res.status(400).json({ message: 'Code de parrainage et ID du filleul requis' });
    }
    
    // Vérifier si le filleul existe
    const { data: filleul, error: filleulError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', filleulId)
      .single();
      
    if (filleulError) throw filleulError;
    
    if (!filleul) {
      return res.status(404).json({ message: 'Utilisateur filleul non trouvé' });
    }
    
    // Vérifier si le filleul est déjà parrainé
    const { data: existingReferral, error: checkError } = await supabase
      .from('parrainages')
      .select('*')
      .eq('idFilleul', filleulId)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    if (existingReferral) {
      return res.status(409).json({ message: 'Cet utilisateur a déjà été parrainé' });
    }
    
    // Trouver le parrain par le code
    const { data: parrain, error: parrainError } = await supabase
      .from('profiles')
      .select('*')
      .eq('codeParrainage', code)
      .single();
      
    if (parrainError) throw parrainError;
    
    if (!parrain) {
      return res.status(404).json({ message: 'Code de parrainage invalide' });
    }
    
    // Vérifier que le parrain n'est pas le filleul
    if (parrain.id === filleulId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas utiliser votre propre code de parrainage' });
    }
    
    // Vérifier si le filleul est dans la liste noire
    const { data: blacklisted, error: blacklistError } = await supabase
      .from('parrainage_blacklist')
      .select('*')
      .or(`email.eq.${filleul.email},phone.eq.${filleul.phone || ''}`)
      .maybeSingle();
      
    if (blacklistError) throw blacklistError;
    
    if (blacklisted) {
      return res.status(403).json({ message: 'Cet utilisateur ne peut pas être parrainé' });
    }
    
    // Créer le parrainage
    const { data: parrainage, error: createError } = await supabase
      .from('parrainages')
      .insert([
        {
          idParrain: parrain.id,
          idFilleul: filleulId,
          dateParrainage: new Date().toISOString(),
          estValide: false
        }
      ])
      .select();
      
    if (createError) throw createError;
    
    // Succès
    res.status(201).json({
      message: 'Code de parrainage appliqué avec succès',
      parrainage: parrainage[0]
    });
  } catch (error) {
    console.error('Erreur application code parrainage:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Route pour valider un parrainage après achat du filleul
app.put('/api/referral/validate/:parrainageId', async (req, res) => {
  try {
    const { parrainageId } = req.params;
    
    if (!parrainageId) {
      return res.status(400).json({ message: 'ID du parrainage requis' });
    }
    
    // Vérifier si le parrainage existe
    const { data: parrainage, error: checkError } = await supabase
      .from('parrainages')
      .select('*, parrain:idParrain(*), filleul:idFilleul(*)')
      .eq('id', parrainageId)
      .single();
      
    if (checkError) throw checkError;
    
    if (!parrainage) {
      return res.status(404).json({ message: 'Parrainage non trouvé' });
    }
    
    if (parrainage.estValide) {
      return res.status(409).json({ message: 'Ce parrainage a déjà été validé' });
    }
    
    // Mettre à jour le parrainage
    const { error: updateError } = await supabase
      .from('parrainages')
      .update({ estValide: true })
      .eq('id', parrainageId);
      
    if (updateError) throw updateError;
    
    // Ajouter des points de fidélité au parrain
    const pointsToAdd = 500; // 500 points pour le parrain
    
    const { error: pointsError } = await supabase
      .from('profiles')
      .update({ pointsFidelite: parrainage.parrain.pointsFidelite + pointsToAdd })
      .eq('id', parrainage.idParrain);
      
    if (pointsError) throw pointsError;
    
    res.json({
      message: 'Parrainage validé avec succès',
      pointsAdded: pointsToAdd
    });
  } catch (error) {
    console.error('Erreur validation parrainage:', error.message);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

// Fonction pour générer un code de parrainage basé sur l'ID utilisateur
function generateReferralCode(userId) {
  // Générer un code alphanumérique de 8 caractères
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = 'NALA';
  let code = prefix;
  
  // Ajouter 4 caractères aléatoires
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log('Connexion à Supabase établie');
});