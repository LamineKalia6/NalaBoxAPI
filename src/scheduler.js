/**
 * scheduler.js
 * Cron interne NalaBox — appelle les Edge Functions Supabase toutes les 5 minutes
 * pour traiter les notifications et emails planifiés.
 */

const cron = require('node-cron')

const SUPABASE_URL         = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY     = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

async function callWorker(functionName) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn(`⚠️  [Scheduler] Variables Supabase manquantes — ${functionName} ignoré`)
    return
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })

    const json = await res.json()

    if (json.processed > 0 || json.failed > 0) {
      console.log(`✅ [${functionName}] processed=${json.processed} failed=${json.failed ?? 0}`)
    }
  } catch (err) {
    console.error(`❌ [${functionName}] Erreur:`, err.message)
  }
}

function startScheduler() {
  // Toutes les 5 minutes
  cron.schedule('*/5 * * * *', () => {
    callWorker('process-scheduled-notifications')
    callWorker('process-scheduled-emails')
  })

  console.log('🕐 Scheduler démarré — workers toutes les 5 minutes')
}

module.exports = { startScheduler }
