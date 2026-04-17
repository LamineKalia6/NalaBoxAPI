/**
 * Routes sauces
 */
const express = require('express');
const router = express.Router();

// Routes temporaires - À compléter
router.get('/', (req, res) => {
  res.json({ message: "Liste des sauces - Fonctionnalité à venir" });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Détails de la sauce ${req.params.id} - Fonctionnalité à venir` });
});

module.exports = router;
