const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

/**
 * GET /api/partners?scheme=term&lat=12.97&lng=77.59
 *
 * Flow step: Partner Locator/Router (last step)
 * Filters out partners with high NPA / low fund utilization
 * (is_eligible is a generated column in Postgres — see schema.sql).
 *
 * NOTE: npa_status and fund_utilization_pct are MOCKED — this data
 * isn't publicly available (see Feasibility slide / README). Distance
 * uses straight-line haversine on the mock lat/lng, not a real Maps API.
 */
router.get('/', async (req, res) => {
  try {
    const { scheme, lat, lng } = req.query;
    const { data: partners, error } = await supabase
      .from('channel_partners')
      .select('*');
    if (error) throw error;

    let relevant = partners.filter(p =>
      Array.isArray(p.schemes_handled) ? p.schemes_handled.includes(scheme) : true
    );

    if (lat && lng) {
      relevant = relevant
        .map(p => ({ ...p, distanceKm: haversine(Number(lat), Number(lng), p.latitude, p.longitude) }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json(
      relevant.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        npaStatus: p.npa_status,
        fundUtilizationPct: p.fund_utilization_pct,
        isEligible: p.is_eligible,
        distanceKm: p.distanceKm != null ? Math.round(p.distanceKm * 10) / 10 : null
      }))
    );
  } catch (err) {
    console.error('[partners] error:', err);
    res.status(500).json({ error: err.message });
  }
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
