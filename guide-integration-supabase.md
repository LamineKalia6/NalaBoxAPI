# Guide d'intégration de Supabase dans l'API Simple

Ce guide vous explique comment connecter votre API simple à Supabase comme base de données. Nous allons procéder étape par étape pour vous assurer de bien comprendre chaque élément.

## Étape 1 : Installer les dépendances nécessaires

Ajoutez la bibliothèque Supabase et dotenv à votre projet :

```bash
npm install @supabase/supabase-js dotenv
```

> **Pourquoi ?** 
> - `@supabase/supabase-js` est le client officiel qui permet d'interagir avec Supabase
> - `dotenv` charge les variables d'environnement depuis un fichier `.env`

## Étape 2 : Configurer le fichier .env

Nous avons déjà créé ce fichier avec les informations de connexion à Supabase :

```
# Configuration Supabase pour Simple API
SUPABASE_URL=https://fvaitiwbauakpnhygpkt.supabase.co
SUPABASE_KEY=votre_cle_anon
SUPABASE_SECRET_KEY=votre_cle_service_role

# Configuration du serveur
PORT=3002
```

> **Pourquoi un fichier .env ?**
> - Sépare les secrets (clés API) du code
> - Permet de changer les valeurs sans modifier le code
> - Ne sera pas commité dans Git (ajoutez-le à .gitignore)

## Étape 3 : Créer un fichier de configuration Supabase

Créez un nouveau fichier `supabase.js` dans votre dossier `simple-api` :

```javascript
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
```

> **À comprendre :**
> - On importe la fonction `createClient` de la bibliothèque Supabase
> - `dotenv.config()` charge les variables depuis le fichier .env
> - On vérifie que les variables nécessaires existent
> - On crée et exporte l'instance du client Supabase

## Étape 4 : Créer les tables dans Supabase

Avant de modifier notre API, nous devons créer les tables dans Supabase :

1. Connectez-vous à [Supabase](https://app.supabase.com)
2. Accédez à votre projet 
3. Dans l'onglet "Table editor", créez une table `produits` avec les colonnes :
   - `id` (type: int8, primary key)
   - `nom` (type: text)
   - `prix` (type: int4) 
   - `categorie` (type: text)
   - `created_at` (type: timestamp, default: now())

> **Important :** 
> Supabase utilise PostgreSQL, vous pouvez donc profiter de toutes ses fonctionnalités comme les contraintes, les relations, etc.

## Étape 5 : Modifier server.js pour utiliser Supabase

Maintenant, modifiez votre fichier `server.js` pour utiliser Supabase au lieu de la base de données en mémoire :

```javascript
/**
 * API simple avec Supabase comme base de données
 */
const express = require('express');
const cors = require('cors');
const { supabase } = require('./supabase');
require('dotenv').config();

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware pour analyser le JSON
app.use(express.json());
app.use(cors());

// Route de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API Simple avec Supabase',
    version: '1.0.0' 
  });
});

// Route pour obtenir tous les produits
app.get('/api/produits', async (req, res) => {
  try {
    // Requête Supabase pour récupérer tous les produits
    const { data, error } = await supabase
      .from('produits')
      .select('*');
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir un produit par son ID
app.get('/api/produits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Requête Supabase pour récupérer un produit spécifique
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour ajouter un nouveau produit
app.post('/api/produits', async (req, res) => {
  try {
    const { nom, prix, categorie } = req.body;
    
    // Validation simple
    if (!nom || !prix || !categorie) {
      return res.status(400).json({ message: 'Veuillez fournir nom, prix et catégorie' });
    }
    
    // Insertion dans Supabase
    const { data, error } = await supabase
      .from('produits')
      .insert([{ nom, prix, categorie }])
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour modifier un produit existant
app.put('/api/produits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nom, prix, categorie } = req.body;
    
    // Validation simple
    if (!nom && !prix && !categorie) {
      return res.status(400).json({ message: 'Veuillez fournir au moins une valeur à modifier' });
    }
    
    // Mise à jour dans Supabase
    const { data, error } = await supabase
      .from('produits')
      .update({ nom, prix, categorie })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erreur lors de la modification du produit:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour supprimer un produit
app.delete('/api/produits/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Suppression dans Supabase
    const { error } = await supabase
      .from('produits')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.status(200).json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log('Connexion à Supabase établie');
});
```

> **Points importants à comprendre :**
>
> 1. **Async/Await** : Les fonctions de route sont désormais `async` car les appels à Supabase sont asynchrones
> 
> 2. **Structure de retour Supabase** : 
>    - Chaque appel Supabase retourne `{ data, error }`
>    - `data` contient les résultats quand tout va bien
>    - `error` contient les erreurs s'il y en a
>
> 3. **Gestion des erreurs** : Nous utilisons try/catch pour gérer les erreurs de manière élégante
>
> 4. **Méthodes Supabase** :
>    - `.from('produits')` : sélectionne la table
>    - `.select('*')` : récupère toutes les colonnes
>    - `.eq('id', id)` : filtre par égalité (WHERE id = ?)
>    - `.insert([...])` : insère des données
>    - `.update({...})` : met à jour des données
>    - `.delete()` : supprime des données
>    - `.single()` : attend un seul résultat

## Étape 6 : Créer un script pour ajouter des données initiales

Pour avoir des données à tester, créez un fichier `seed.js` :

```javascript
/**
 * Script pour remplir la table produits avec des données initiales
 */
const { supabase } = require('./supabase');

const produits = [
  { nom: "Tomate", prix: 2500, categorie: "Légumes frais" },
  { nom: "Oignon", prix: 1500, categorie: "Légumes frais" },
  { nom: "Poulet", prix: 10000, categorie: "Protéines" },
  { nom: "Riz", prix: 5000, categorie: "Céréales" }
];

async function seed() {
  try {
    console.log('Ajout des données initiales...');
    
    // Supprimer les données existantes
    await supabase.from('produits').delete().neq('id', 0);
    
    // Insérer les nouvelles données
    const { data, error } = await supabase
      .from('produits')
      .insert(produits);
    
    if (error) throw error;
    
    console.log('Données ajoutées avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'ajout des données:', error.message);
    process.exit(1);
  }
}

// Exécuter la fonction
seed();
```

> **Comment utiliser ce script :**
> - Exécutez-le avec `node seed.js` après avoir créé la table
> - Il supprime d'abord toutes les données existantes
> - Puis il ajoute les produits de base pour vos tests

## Étape 7 : Mettre à jour package.json

Modifiez votre fichier `package.json` pour ajouter les nouveaux scripts :

```json
{
  "name": "simple-api",
  "version": "1.0.0",
  "description": "API simple avec Supabase comme base de données",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.89.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

> **Les nouveaux scripts :**
> - `npm run seed` : exécute le script seed.js pour ajouter les données initiales

## Étape 8 : Tester avec Postman

1. **Démarrer l'API :** 
   ```bash
   npm install  # Pour installer les nouvelles dépendances
   npm run seed # Pour ajouter les données initiales
   npm start    # Pour démarrer le serveur
   ```

2. **Dans Postman :**
   - Créez une nouvelle collection "Simple API Supabase"
   - Ajoutez des requêtes pour tester chaque route :
     - GET http://localhost:3002/api/produits
     - GET http://localhost:3002/api/produits/1
     - POST http://localhost:3002/api/produits (avec JSON dans Body)
     - PUT http://localhost:3002/api/produits/1 (avec JSON dans Body)
     - DELETE http://localhost:3002/api/produits/1

## Conclusion

Votre API est maintenant connectée à Supabase ! Vous pouvez :

1. **Explorer davantage :**
   - Ajoutez une authentification avec Supabase Auth
   - Créez des relations entre tables (ex: produits et catégories)
   - Utilisez RLS (Row Level Security) pour sécuriser l'accès aux données

2. **Améliorations possibles :**
   - Validation plus robuste des données avec Joi ou Zod
   - Organisation du code en modèles et contrôleurs
   - Tests automatisés avec Jest

Ce guide vous a montré comment remplacer une base de données en mémoire par Supabase, une solution de base de données PostgreSQL complète avec API intégrée.
