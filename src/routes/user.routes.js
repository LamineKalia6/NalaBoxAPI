/**
 * Routes utilisateurs
 */
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// Routes temporaires - À compléter
router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: "Profil utilisateur - Fonctionnalité à venir" });
});

router.get('/referral', verifyToken, (req, res) => {
  res.json({ message: "Informations de parrainage - Fonctionnalité à venir" });
});

module.exports = router;
