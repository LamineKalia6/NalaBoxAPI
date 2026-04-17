/**
 * Validateurs pour les routes d'authentification
 */
const Joi = require('joi');

/**
 * Middleware de validation pour l'inscription
 */
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(100)
      .messages({
        'string.base': 'Le nom doit être une chaîne de caractères',
        'string.empty': 'Le nom ne peut pas être vide',
        'string.min': 'Le nom doit contenir au moins {#limit} caractères',
        'string.max': 'Le nom ne peut pas dépasser {#limit} caractères',
        'any.required': 'Le nom est obligatoire'
      }),
    phone: Joi.string().required().pattern(/^\+224[567][0-9]{8}$/)
      .messages({
        'string.base': 'Le numéro de téléphone doit être une chaîne de caractères',
        'string.empty': 'Le numéro de téléphone ne peut pas être vide',
        'string.pattern.base': 'Le numéro de téléphone doit être au format guinéen (+224 suivi de 9 chiffres)',
        'any.required': 'Le numéro de téléphone est obligatoire'
      }),
    email: Joi.string().email().allow('', null)
      .messages({
        'string.email': 'Format d\'email invalide'
      }),
    address: Joi.string().required().min(5).max(255)
      .messages({
        'string.base': 'L\'adresse doit être une chaîne de caractères',
        'string.empty': 'L\'adresse ne peut pas être vide',
        'string.min': 'L\'adresse doit contenir au moins {#limit} caractères',
        'string.max': 'L\'adresse ne peut pas dépasser {#limit} caractères',
        'any.required': 'L\'adresse est obligatoire'
      }),
    password: Joi.string().required().min(6)
      .messages({
        'string.base': 'Le mot de passe doit être une chaîne de caractères',
        'string.empty': 'Le mot de passe ne peut pas être vide',
        'string.min': 'Le mot de passe doit contenir au moins {#limit} caractères',
        'any.required': 'Le mot de passe est obligatoire'
      }),
    referralCode: Joi.string().allow('', null)
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }

  next();
};

/**
 * Middleware de validation pour la connexion
 */
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    phone: Joi.string().required().pattern(/^\+224[567][0-9]{8}$/)
      .messages({
        'string.base': 'Le numéro de téléphone doit être une chaîne de caractères',
        'string.empty': 'Le numéro de téléphone ne peut pas être vide',
        'string.pattern.base': 'Le numéro de téléphone doit être au format guinéen (+224 suivi de 9 chiffres)',
        'any.required': 'Le numéro de téléphone est obligatoire'
      }),
    password: Joi.string().required()
      .messages({
        'string.base': 'Le mot de passe doit être une chaîne de caractères',
        'string.empty': 'Le mot de passe ne peut pas être vide',
        'any.required': 'Le mot de passe est obligatoire'
      })
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin
};
