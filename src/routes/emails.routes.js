/**
 * Routes proxy pour les emails (Edge Function Supabase)
 */
const express = require('express')
const router  = express.Router()
const { verifySupabaseToken } = require('../middleware/supabase-auth.middleware')

const SUPABASE_URL     = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * POST /api/emails/send
 * Envoie un email via l'Edge Function send-email
 */
router.post('/send', verifySupabaseToken, async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ status: 'error', ...data })
    }

    return res.json({ status: 'ok', ...data })
  } catch (err) {
    console.error('[emails/send] Erreur:', err.message)
    return res.status(500).json({ status: 'error', message: err.message })
  }
})

module.exports = router
