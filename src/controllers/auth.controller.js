/**
 * Contrôleur d'authentification
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db.config');
const { supabase } = require('../config/supabase.config');

/**
 * Inscription d'un nouvel utilisateur
 */
const register = async (req, res, next) => {
  try {
    const { name, phone, email, address, password, referralCode } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const userCheck = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Ce numéro de téléphone est déjà enregistré'
      });
    }
    
    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Générer un code de parrainage unique
    const userReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    let referrerId = null;
    
    // Vérifier et appliquer le code de parrainage si fourni
    if (referralCode) {
      const referrer = await db.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode]
      );
      
      if (referrer.rows.length > 0) {
        referrerId = referrer.rows[0].id;
      }
    }
    
    // Insérer le nouvel utilisateur dans la base de données
    const newUser = await db.query(
      `INSERT INTO users 
       (id, name, phone, email, address, password_hash, referral_code, referrer_id, referral_credits) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, name, phone, email, referral_code`,
      [
        uuidv4(), 
        name, 
        phone, 
        email || null, 
        address, 
        hashedPassword, 
        userReferralCode, 
        referrerId, 
        referrerId ? 5000 : 0
      ]
    );
    
    // Mettre à jour les points du parrain si applicable
    if (referrerId) {
      await db.query(
        'UPDATE users SET referral_points = referral_points + 10 WHERE id = $1',
        [referrerId]
      );
    }
    
    // Créer et retourner le JWT
    const token = generateToken(newUser.rows[0].id);
    const refreshToken = generateRefreshToken(newUser.rows[0].id);
    
    return res.status(201).json({
      status: 'success',
      message: 'Inscription réussie',
      data: {
        user: {
          id: newUser.rows[0].id,
          name: newUser.rows[0].name,
          phone: newUser.rows[0].phone,
          email: newUser.rows[0].email,
          referralCode: newUser.rows[0].referral_code
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Connexion utilisateur
 */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    
    // Vérifier si l'utilisateur existe
    const userResult = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Numéro de téléphone ou mot de passe incorrect'
      });
    }
    
    const user = userResult.rows[0];
    
    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Numéro de téléphone ou mot de passe incorrect'
      });
    }
    
    // Générer le token et le refresh token
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    return res.status(200).json({
      status: 'success',
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          referralCode: user.referral_code
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rafraîchir le token JWT
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token requis'
      });
    }
    
    try {
      // Vérifier le refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Générer un nouveau token
      const token = generateToken(decoded.id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Token rafraîchi avec succès',
        data: {
          token
        }
      });
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token invalide ou expiré'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Déconnexion utilisateur
 * Note: Pour une déconnexion côté client, il suffit de supprimer les tokens
 * Cette fonction est maintenue pour compatibilité API
 */
const logout = (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Déconnexion réussie'
  });
};

/**
 * Générer un token JWT
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * Générer un refresh token JWT
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  register,
  login,
  refreshToken,
  logout
};
