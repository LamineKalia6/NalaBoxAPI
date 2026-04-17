/**
 * Middleware d'authentification via token Supabase
 * Vérifie le JWT Supabase et s'assure que l'utilisateur est admin
 */
require('dotenv').config();

const SUPABASE_URL     = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Vérifie le token Supabase auprès de l'API auth Supabase
 * et exige que l'utilisateur ait le rôle 'admin'
 */
const verifySupabaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Token manquant' })
  }

  const token = authHeader.split(' ')[1]

  try {
    // Récupère le profil via Supabase Auth
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SERVICE_ROLE_KEY,
      },
    })

    if (!authRes.ok) {
      return res.status(401).json({ status: 'error', message: 'Token invalide ou expiré' })
    }

    const authUser = await authRes.json()

    // Vérifie le rôle dans la table users (metadata ou DB)
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${authUser.id}&select=role`,
      {
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
      }
    )

    const profiles = await profileRes.json()
    const role = profiles?.[0]?.role

    if (role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Accès refusé. Droits admin requis' })
    }

    req.supabaseUser = { ...authUser, role }
    next()
  } catch (err) {
    console.error('[supabase-auth] Erreur:', err.message)
    return res.status(500).json({ status: 'error', message: 'Erreur vérification auth' })
  }
}

module.exports = { verifySupabaseToken }
