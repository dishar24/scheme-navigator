const express = require('express');
const router = express.Router();
const { getCurrentRules, evaluate } = require('../lib/rulesEngine');
const { explainResult } = require('../lib/explain');
const supabase = require('../lib/supabase');

/**
 * POST /api/recommend
 * body: { name, income, projectCost, educationStatus }
 *
 * Flow: User Input -> Rules Engine -> Recommendation Ranking -> AI Explanation Layer
 * Also SAVES the applicant, which is what makes the Policy-Change
 * Scanner possible later.
 */
router.post('/', async (req, res) => {
  try {
    const { name, income, projectCost, educationStatus } = req.body;
    if (income == null || projectCost == null) {
      return res.status(400).json({ error: 'income and projectCost are required' });
    }

    const rules = await getCurrentRules();
    const result = evaluate(Number(income), Number(projectCost), rules);
    const explanation = await explainResult({
      eligible: result.eligible,
      income: Number(income),
      capUsed: result.capUsed,
      projectCost: Number(projectCost),
      schemeName: result.scheme.scheme_name
    });

    // Save applicant profile for future Policy-Change scans
    const { data: saved, error: saveErr } = await supabase
      .from('applicants')
      .insert({
        name: name || `Applicant ${Date.now()}`,
        income: Number(income),
        project_cost: Number(projectCost),
        education_status: educationStatus || 'unspecified',
        matched_scheme_id: result.scheme.scheme_id,
        matched_scheme_version: result.scheme.version,
        eligible_at_submission: result.eligible
      })
      .select()
      .single();
    if (saveErr) throw saveErr;

    res.json({
      applicantId: saved.id,
      scheme: {
        id: result.scheme.scheme_id,
        name: result.scheme.scheme_name,
        maxProjectCost: result.scheme.max_project_cost,
        fundingPct: result.scheme.funding_pct,
        interestRate: result.scheme.interest_rate,
        moratoriumMonths: result.scheme.moratorium_months,
        documents: result.scheme.documents,
        version: result.scheme.version
      },
      eligible: result.eligible,
      matchPct: result.matchPct,
      capUsed: result.capUsed,
      explanation
    });
  } catch (err) {
    console.error('[recommend] error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
