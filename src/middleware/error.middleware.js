/**
 * Middleware de gestion des erreurs
 */

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Logger l'erreur en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('Erreur:', err);
  }
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
