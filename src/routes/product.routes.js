/**
 * Routes produits
 */
const express = require('express');
const router = express.Router();

// Routes temporaires - À compléter
router.get('/', (req, res) => {
  res.json({ message: "Liste des produits - Fonctionnalité à venir" });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Détails du produit ${req.params.id} - Fonctionnalité à venir` });
});

module.exports = router;
