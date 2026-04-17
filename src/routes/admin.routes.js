/**
 * Routes administrateur
 */
const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Appliquer la vérification du token et du rôle admin à toutes les routes
router.use(verifyToken, isAdmin);

// Routes temporaires - À compléter
router.get('/dashboard', (req, res) => {
  res.json({ message: "Tableau de bord administrateur - Fonctionnalité à venir" });
});

router.get('/orders', (req, res) => {
  res.json({ message: "Gestion des commandes - Fonctionnalité à venir" });
});

router.get('/inventory', (req, res) => {
  res.json({ message: "Gestion des stocks - Fonctionnalité à venir" });
});

router.get('/users', (req, res) => {
  res.json({ message: "Gestion des utilisateurs - Fonctionnalité à venir" });
});

module.exports = router;
