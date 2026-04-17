/**
 * Point d'entrée principal de l'API NalaBox
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { startScheduler } = require('./scheduler');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const sauceRoutes = require('./routes/sauce.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notifications.routes');
const emailRoutes = require('./routes/emails.routes');

// Import des middlewares
const { errorHandler } = require('./middleware/error.middleware');
const { notFoundHandler } = require('./middleware/not-found.middleware');

// Configuration de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes par défaut
  max: process.env.RATE_LIMIT_MAX || 100, // 100 requêtes par fenêtre
  message: {
    status: 429,
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
  },
});

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting pour toutes les routes
app.use(limiter);

// Routes de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API NalaBox',
    version: '1.0.0',
    status: 'active'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sauces', sauceRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/emails', emailRoutes);

// Middlewares pour la gestion des erreurs
app.use(notFoundHandler);
app.use(errorHandler);

// Démarrage du serveur uniquement si le script est exécuté directement
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur NalaBox API démarré sur le port ${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV}`);
    startScheduler();
  });
}

module.exports = app;
