require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'openai/gpt-oss-20b';

/**
 * AI Explanation Layer.
 *
 * IMPORTANT: this function only turns an ALREADY-DECIDED result into
 * plain language. It never decides eligibility itself — that decision
 * comes from rulesEngine.evaluate(), which is deterministic. This
 * keeps the "AI explains, rules decide" separation from the PPT real
 * in the code, not just on a slide.
 *
 * Falls back to a template string if GROQ_API_KEY isn't set, so the
 * rest of the app still works without a key during setup/demo.
 */
async function explainResult({ eligible, income, capUsed, projectCost, schemeName }) {
  if (!GROQ_API_KEY) {
    return templateExplanation({ eligible, income, capUsed, projectCost, schemeName });
  }

  try {
    const prompt = eligible
      ? `In one short, plain-language sentence for a first-time loan applicant, explain why someone with an annual income of ₹${income} qualifies for the "${schemeName}" (income cap ₹${capUsed}, project cost ₹${projectCost}). Do not mention AI or models. Be warm but factual.`
      : `In one short, plain-language sentence for a first-time loan applicant, explain why someone with an annual income of ₹${income} does NOT qualify for the "${schemeName}" (income cap ₹${capUsed}). Do not mention AI or models. Be warm but factual, and do not suggest alternatives.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.3
      })
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || templateExplanation({ eligible, income, capUsed, projectCost, schemeName });
  } catch (err) {
    console.error('[explain] Groq call failed, falling back to template:', err.message);
    return templateExplanation({ eligible, income, capUsed, projectCost, schemeName });
  }
}

function templateExplanation({ eligible, income, capUsed, projectCost, schemeName }) {
  const fmt = n => Math.round(n).toLocaleString('en-IN');
  if (eligible) {
    return `Your income (₹${fmt(income)}) is within the ₹${fmt(capUsed)} cap, and your project cost of ₹${fmt(projectCost)} fits the ${schemeName} bracket.`;
  }
  return `Your income (₹${fmt(income)}) exceeds the ₹${fmt(capUsed)} cap for the ${schemeName}.`;
}

module.exports = { explainResult };
