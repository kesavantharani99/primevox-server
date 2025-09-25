// server.js - simple verify-utr endpoint for PrimeVox
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const PLAYFAB_SECRET = process.env.PLAYFAB_SECRET || '';
const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID || '180CAD';

function computeExpiryDays(daysFromNow) {
  const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

app.post('/verify-utr', async (req, res) => {
  try {
    const { userId, utr, planKey, amount } = req.body || {};
    if (!userId || !utr) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    if (typeof utr !== 'string' || utr.length < 6) {
      return res.json({ ok: false, error: 'invalid_utr' });
    }

    // Simulate verification (replace with real provider later)
    const verified = true;
    if (!verified) {
      return res.json({ ok: false, error: 'verification_failed' });
    }

    const planLabel = planKey === 'plan1' ? 'Plan 1' : (planKey === 'plan2' ? 'Plan 2' : 'Premium');
    const expiry = computeExpiryDays(30);

    // Optionally update PlayFab server-side (requires secret key)
    if (PLAYFAB_SECRET) {
      try {
        const pfUrl = `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Server/UpdateUserInternalData`;
        const payload = {
          PlayFabId: userId,
          Data: { plan: planLabel, expiry }
        };
        await axios.post(pfUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-SecretKey': PLAYFAB_SECRET
          }
        }).catch(err => {
          console.warn('PlayFab update failed:', err.response?.data || err.message);
        });
      } catch (pfErr) {
        console.warn('PlayFab update error:', pfErr.message);
      }
    }

    return res.json({ ok: true, plan: planLabel, expiry });
  } catch (err) {
    console.error('verify-utr error', err);
    return res.status(500).json({ ok: false, error: 'server_error', detail: err.message });
  }
});

app.listen(PORT, () => console.log(`PrimeVox server running on port ${PORT}`));
