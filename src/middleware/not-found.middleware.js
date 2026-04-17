/**
 * Middleware pour gérer les routes inexistantes
 */

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route non trouvée: ${req.originalUrl}`
  });
};

module.exports = { notFoundHandler };
