/**
 * Routes panier
 */
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// Routes temporaires - À compléter
router.get('/', verifyToken, (req, res) => {
  res.json({ message: "Contenu du panier - Fonctionnalité à venir" });
});

router.post('/items', verifyToken, (req, res) => {
  res.json({ message: "Ajout au panier - Fonctionnalité à venir" });
});

module.exports = router;
