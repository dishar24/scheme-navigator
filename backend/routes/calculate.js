const express = require('express');
const router = express.Router();
const { getCurrentRules } = require('../lib/rulesEngine');

/**
 * POST /api/calculate
 * body: { schemeId, projectCost }
 *
 * Flow step: Financial Calculator (after Recommendation, before Documents)
 */
router.post('/', async (req, res) => {
  try {
    const { schemeId, projectCost } = req.body;
    const rules = await getCurrentRules();
    const scheme = rules.find(r => r.scheme_id === schemeId);
    if (!scheme) return res.status(404).json({ error: 'Unknown scheme' });

    const loanAmount = Math.min(
      Number(projectCost) * (scheme.funding_pct / 100),
      scheme.max_project_cost
    );
    const months = 36; // demo assumption — repayment period after moratorium
    const monthlyRate = scheme.interest_rate / 100 / 12;
    const emi =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    res.json({
      loanAmount: Math.round(loanAmount),
      interestRate: scheme.interest_rate,
      moratoriumMonths: scheme.moratorium_months,
      repaymentMonths: months,
      estimatedEmi: Math.round(emi)
    });
  } catch (err) {
    console.error('[calculate] error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
