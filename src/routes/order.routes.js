/**
 * Routes commandes
 */
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

// Routes temporaires - À compléter
router.get('/', verifyToken, (req, res) => {
  res.json({ message: "Liste des commandes - Fonctionnalité à venir" });
});

router.post('/', verifyToken, (req, res) => {
  res.json({ message: "Création de commande - Fonctionnalité à venir" });
});

router.get('/:id', verifyToken, (req, res) => {
  res.json({ message: `Détails de la commande ${req.params.id} - Fonctionnalité à venir` });
});

router.put('/:id/cancel', verifyToken, (req, res) => {
  res.json({ message: `Annulation de la commande ${req.params.id} - Fonctionnalité à venir` });
});

module.exports = router;
