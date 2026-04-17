/**
 * Routes catégories
 */
const express = require('express');
const router = express.Router();

// Routes temporaires - À compléter
router.get('/', (req, res) => {
  res.json({ message: "Liste des catégories - Fonctionnalité à venir" });
});

router.get('/:id/products', (req, res) => {
  res.json({ message: `Produits de la catégorie ${req.params.id} - Fonctionnalité à venir` });
});

module.exports = router;
