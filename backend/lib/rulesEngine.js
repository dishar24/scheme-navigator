const supabase = require('./supabase');

/**
 * Fetches the CURRENT version of every scheme's rules.
 */
async function getCurrentRules() {
  const { data, error } = await supabase
    .from('scheme_rules')
    .select('*')
    .eq('is_current', true);
  if (error) throw error;
  return data;
}

/**
 * Fetches a SPECIFIC version of a scheme's rules (used by the scanner
 * to re-check applicants against whichever version was current when
 * they applied, vs the new current version).
 */
async function getRulesVersion(schemeId, version) {
  const { data, error } = await supabase
    .from('scheme_rules')
    .select('*')
    .eq('scheme_id', schemeId)
    .eq('version', version)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Core deterministic matching logic.
 * Given an applicant's inputs and a set of scheme rule rows,
 * picks the tightest-fit scheme by project cost bracket, then
 * checks the income cap. AI is NOT involved in this decision —
 * see routes/recommend.js for where the explanation layer sits.
 */
function evaluate(income, projectCost, rules) {
  const candidates = rules
    .filter(r => projectCost <= r.max_project_cost)
    .sort((a, b) => a.max_project_cost - b.max_project_cost);

  const best = candidates[0] || rules.find(r => r.scheme_id === 'term') || rules[0];
  const eligible = income <= best.income_cap;
  const matchPct = eligible
    ? Math.max(70, 100 - Math.round((income / best.income_cap) * 20))
    : 0;

  return {
    scheme: best,
    eligible,
    matchPct,
    capUsed: best.income_cap
  };
}

module.exports = { getCurrentRules, getRulesVersion, evaluate };
