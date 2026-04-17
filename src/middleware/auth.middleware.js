/**
 * Middleware d'authentification
 */
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware pour vérifier le token JWT
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Accès non autorisé. Token manquant'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token invalide ou expiré'
    });
  }
};

/**
 * Middleware pour vérifier le rôle Admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Accès refusé. Droits administrateur requis'
    });
  }
  
  next();
};

module.exports = {
  verifyToken,
  isAdmin
};
