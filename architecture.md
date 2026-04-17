# Architecture NalaBox avec Supabase

## Vue d'ensemble

L'architecture NalaBox est composée de trois parties principales :

1. **Applications Client** (Mobile Flutter & Web Admin)
2. **API NalaBox** (Node.js + Express)
3. **Supabase** (Base de données PostgreSQL + Auth + Storage)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│                 │     │                 │     │                         │
│  App Mobile     │     │                 │     │  Supabase               │
│  (Flutter)      ├─────┤  API NalaBox    ├─────┤  - PostgreSQL DB        │
│                 │     │  (Node.js)      │     │  - Auth                 │
│                 │     │                 │     │  - Storage              │
└─────────────────┘     └─────────────────┘     │  - Realtime            │
                                                │                         │
┌─────────────────┐                             └─────────────────────────┘
│                 │                             
│  Admin Panel    │                             
│  (Web)          ├─────┐                       
│                 │     │                       
│                 │     │                       
└─────────────────┘     │                       
                        │                       
                        │                       
```

## Pourquoi cette architecture ?

1. **Sécurité** - L'API NalaBox sert de couche d'abstraction entre les clients et la base de données
2. **Logique métier centralisée** - Toutes les règles métier sont dans l'API, assurant la cohérence
3. **Flexibilité** - Possibilité de changer Supabase sans affecter les applications client
4. **Évolutivité** - Separation of concerns permettant une mise à l'échelle indépendante de chaque composant

## Technologies utilisées

### API NalaBox (Backend)
- **Node.js & Express** - Framework serveur pour l'API REST
- **JWT** - Pour l'authentification sécurisée
- **Joi** - Validation des données entrantes
- **Supabase-js** - Client pour interagir avec Supabase

### Applications Client
- **Flutter** - Pour l'application mobile multi-plateforme
- **React** - Pour le panneau d'administration web

### Supabase (Base de données & Services)
- **PostgreSQL** - Base de données relationnelle
- **Auth** - Service d'authentification
- **Storage** - Stockage des images (produits, sauces)
- **Realtime** - Pour les mises à jour en temps réel (suivi des commandes)

## Structure de la base de données

Supabase utilise PostgreSQL comme base de données. Voici la structure des tables principales :

### Table : users
- `id` (UUID, PK) - Identifiant unique
- `name` (VARCHAR) - Nom complet de l'utilisateur
- `phone` (VARCHAR) - Numéro de téléphone (format guinéen)
- `email` (VARCHAR, nullable) - Email optionnel
- `address` (VARCHAR) - Adresse de livraison
- `password_hash` (VARCHAR) - Mot de passe hashé
- `role` (VARCHAR) - Rôle de l'utilisateur ('user', 'admin')
- `referral_code` (VARCHAR) - Code de parrainage unique
- `referral_points` (INTEGER) - Points gagnés en parrainant
- `referral_credits` (INTEGER) - Crédits gagnés en tant que filleul
- `referrer_id` (UUID, FK) - ID du parrain
- `created_at` (TIMESTAMP) - Date de création

### Table : products
- `id` (UUID, PK) - Identifiant unique
- `name` (VARCHAR) - Nom du produit
- `description` (TEXT) - Description détaillée
- `price` (INTEGER) - Prix en francs guinéens
- `image` (TEXT[]) - Tableau d'URLs d'images
- `categoryId` (UUID, FK) - Catégorie du produit
- `unit` (VARCHAR) - Unité de vente (kg, botte, etc.)
- `isDispo` (BOOLEAN) - Disponibilité
- `stockQuantity` (INTEGER) - Quantité en stock
- `stockQuantityMax` (INTEGER) - Stock maximal
- `unitType` (VARCHAR) - Type d'unité ('weight', 'piece')
- `minQuantity` (INTEGER) - Quantité minimale d'achat
- `stepQuantity` (INTEGER) - Palier de quantité
- `priceUnit` (VARCHAR) - Unité de prix

### Table : categories
- `id` (UUID, PK) - Identifiant unique
- `name` (VARCHAR) - Nom de la catégorie
- `description` (TEXT, nullable) - Description
- `image` (TEXT, nullable) - URL de l'image

### Table : sauces
- `id` (UUID, PK) - Identifiant unique
- `name` (VARCHAR) - Nom de la sauce
- `description` (TEXT) - Description détaillée
- `preparationTime` (INTEGER) - Temps de préparation en minutes
- `discountedPrice` (INTEGER) - Prix du kit
- `image` (TEXT[]) - Tableau d'URLs d'images

### Table : sauce_products
- `sauce_id` (UUID, FK) - Référence à la sauce
- `product_id` (UUID, FK) - Référence au produit
- `preparation_options` (TEXT[]) - Instructions de préparation

### Table : orders
- `id` (UUID, PK) - Identifiant unique
- `user_id` (UUID, FK) - Utilisateur qui a passé la commande
- `status` (VARCHAR) - Statut de la commande
- `total_amount` (INTEGER) - Montant total
- `delivery_address` (VARCHAR) - Adresse de livraison
- `payment_method` (VARCHAR) - Méthode de paiement
- `notes` (TEXT, nullable) - Notes additionnelles
- `created_at` (TIMESTAMP) - Date de création
- `updated_at` (TIMESTAMP) - Date de mise à jour

### Table : order_items
- `id` (UUID, PK) - Identifiant unique
- `order_id` (UUID, FK) - Référence à la commande
- `product_id` (UUID, FK, nullable) - Produit commandé
- `sauce_id` (UUID, FK, nullable) - Sauce commandée
- `quantity` (INTEGER) - Quantité
- `unit_price` (INTEGER) - Prix unitaire
- `is_sauce_kit` (BOOLEAN) - Si c'est un kit de sauce

## Flux de données

### Inscription et Authentification
1. L'utilisateur s'inscrit via l'application mobile
2. L'application envoie les données à l'API NalaBox
3. L'API valide les données et crée un compte dans Supabase
4. L'API retourne un JWT au client pour les futures requêtes authentifiées

### Consultation du catalogue
1. L'application demande la liste des produits/catégories/sauces
2. L'API interroge Supabase et formate les données
3. L'API retourne les données structurées à l'application

### Processus de commande
1. L'utilisateur ajoute des produits au panier
2. L'utilisateur finalise sa commande
3. L'API enregistre la commande dans Supabase
4. L'API déclenche des notifications aux administrateurs
5. L'administrateur gère la commande via le panneau admin
6. Supabase Realtime notifie l'utilisateur des changements de statut

## Avantages de Supabase

1. **Pas d'infrastructure à gérer** - Service cloud entièrement géré
2. **Authentification intégrée** - Système d'auth prêt à l'emploi
3. **Stockage de fichiers** - Gestion simplifiée des images
4. **Notifications en temps réel** - Pour le suivi des commandes
5. **Interface d'administration** - Pour visualiser directement les données
6. **RLS (Row Level Security)** - Sécurité au niveau des lignes de la base de données

## Migration des données existantes

Pour migrer les données existantes vers Supabase :

1. Exécuter les scripts SQL sur la console Supabase pour créer les tables
2. Utiliser les scripts d'insertion existants (`nala_box_insertion_*.sql`) pour peupler la base
3. Ajuster les UUIDs si nécessaire pour assurer la compatibilité

## Configuration pour le développement

Pour configurer l'environnement de développement :

1. Créer un projet Supabase sur [supabase.com](https://supabase.com)
2. Récupérer les clés d'API (URL et clé anonyme)
3. Configurer ces clés dans le fichier `.env` de l'API NalaBox
4. Créer les tables dans Supabase via l'éditeur SQL
5. Lancer l'API NalaBox (`npm run dev`)

## Déploiement en production

Pour le déploiement en production :

1. Déployer l'API NalaBox sur un service comme Heroku, Vercel ou AWS
2. Configurer les variables d'environnement de production
3. Utiliser la clé de service Supabase pour l'environnement de production
4. Configurer CORS pour n'accepter que les domaines autorisés
5. Mettre en place un monitoring des erreurs et performances
