const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { getCurrentRules, evaluate } = require('../lib/rulesEngine');

/**
 * GET /api/admin/schemes
 * Returns the current version of every scheme, for the admin table.
 */
router.get('/schemes', async (req, res) => {
  try {
    const rules = await getCurrentRules();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/schemes/:schemeId/new-version
 * body: { incomeCap, maxProjectCost?, fundingPct?, interestRate?, moratoriumMonths? }
 *
 * Does NOT overwrite the existing row — marks it is_current=false and
 * inserts a new row with a bumped version number. This is what makes
 * "version-controlled rules engine" on the Feasibility slide real.
 */
router.post('/schemes/:schemeId/new-version', async (req, res) => {
  try {
    const { schemeId } = req.params;
    const updates = req.body;

    const { data: current, error: curErr } = await supabase
      .from('scheme_rules')
      .select('*')
      .eq('scheme_id', schemeId)
      .eq('is_current', true)
      .single();
    if (curErr) throw curErr;

    const { error: updateErr } = await supabase
      .from('scheme_rules')
      .update({ is_current: false })
      .eq('id', current.id);
    if (updateErr) throw updateErr;

    const { data: next, error: insertErr } = await supabase
      .from('scheme_rules')
      .insert({
        scheme_id: current.scheme_id,
        scheme_name: current.scheme_name,
        version: current.version + 1,
        is_current: true,
        income_cap: updates.incomeCap ?? current.income_cap,
        max_project_cost: updates.maxProjectCost ?? current.max_project_cost,
        funding_pct: updates.fundingPct ?? current.funding_pct,
        interest_rate: updates.interestRate ?? current.interest_rate,
        moratorium_months: updates.moratoriumMonths ?? current.moratorium_months,
        documents: current.documents,
        last_verified: new Date().toISOString()
      })
      .select()
      .single();
    if (insertErr) throw insertErr;

    res.json(next);
  } catch (err) {
    console.error('[admin/new-version] error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/scan
 *
 * THE POLICY-CHANGE IMPACT SCANNER (key innovation from the PPT).
 * Re-runs every saved applicant against the CURRENT rules and diffs
 * against their eligibility at the time they applied.
 */
router.post('/scan', async (req, res) => {
  try {
    const { data: applicants, error: appErr } = await supabase
      .from('applicants')
      .select('*')
      .neq('name', 'What-If Preview')
      .order('created_at', { ascending: false });
    if (appErr) throw appErr;

    const currentRules = await getCurrentRules();

    const results = applicants.map(a => {
      const now = evaluate(a.income, a.project_cost, currentRules);
      const before = a.eligible_at_submission;
      const after = now.eligible;

      let change = 'no_change';
      if (!before && after) change = 'newly_eligible';
      else if (before && !after) change = 'no_longer_eligible';

      return {
        applicantId: a.id,
        name: a.name,
        income: a.income,
        projectCost: a.project_cost,
        before,
        after,
        change
      };
    });

    res.json({ scannedAt: new Date().toISOString(), results });
  } catch (err) {
    console.error('[admin/scan] error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
