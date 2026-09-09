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
async function explainResult({ eligible, income, capUsed, projectCost, schemeName, language = 'english' }) {
  if (!GROQ_API_KEY) {
    return templateExplanation({ eligible, income, capUsed, projectCost, schemeName, language });
  }

  try {
    const languageMap = {
      english: 'English',
      hindi: 'Hindi',
      kannada: 'Kannada'
    };
    const targetLanguage = languageMap[language] || 'English';

    const prompt = eligible
      ? `Write a brief, helpful explanation in ${targetLanguage} for a first-time loan applicant explaining:
- They ARE ELIGIBLE for the "${schemeName}"
- Their annual income is ₹${income} (within the ₹${capUsed} income limit)
- Their project cost is ₹${projectCost}
- What they should do next (proceed to calculate loan details)

Keep it under 4 sentences, warm, encouraging, and easy to understand. Do not mention AI or models.`
      : `Write a brief, helpful explanation in ${targetLanguage} for a first-time loan applicant explaining:
- They are NOT ELIGIBLE for the "${schemeName}"
- Their annual income is ₹${income} (exceeds the ₹${capUsed} income limit)
- What this means and what they can do

Keep it under 4 sentences, warm but factual, and easy to understand. Do not mention AI or models.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.4
      })
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || templateExplanation({ eligible, income, capUsed, projectCost, schemeName, language });
  } catch (err) {
    console.error('[explain] Groq call failed, falling back to template:', err.message);
    return templateExplanation({ eligible, income, capUsed, projectCost, schemeName, language });
  }
}

function templateExplanation({ eligible, income, capUsed, projectCost, schemeName, language = 'english' }) {
  const fmt = n => Math.round(n).toLocaleString('en-IN');
  
  const templates = {
    english: {
      eligible: `You are eligible for the ${schemeName}! Your annual income of ₹${fmt(income)} is within the ₹${fmt(capUsed)} income limit, and your project cost of ₹${fmt(projectCost)} fits within this scheme. You can proceed to calculate your loan details and explore the required documents.`,
      notEligible: `You are not eligible for the ${schemeName}. Your annual income of ₹${fmt(income)} exceeds the ₹${fmt(capUsed)} income cap for this scheme. Please check if you qualify for other schemes or consider reapplying if your income changes.`
    },
    hindi: {
      eligible: `आप ${schemeName} के लिए पात्र हैं! आपकी वार्षिक आय ₹${fmt(income)} है जो ₹${fmt(capUsed)} की आय सीमा के भीतर है, और आपकी परियोजना लागत ₹${fmt(projectCost)} इस योजना में फिट होती है। आप अपने ऋण विवरण की गणना करने और आवश्यक दस्तावेजों का पता लगाने के लिए आगे बढ़ सकते हैं।`,
      notEligible: `आप ${schemeName} के लिए पात्र नहीं हैं। आपकी वार्षिक आय ₹${fmt(income)} इस योजना के लिए ₹${fmt(capUsed)} की आय सीमा से अधिक है। कृपया जांचें कि क्या आप अन्य योजनाओं के लिए योग्य हैं या यदि आपकी आय बदलती है तो फिर से आवेदन करने पर विचार करें।`
    },
    kannada: {
      eligible: `ನೀವು ${schemeName} ಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ! ನಿಮ್ಮ ವಾರ್ಷಿక ಆದಾಯ ₹${fmt(income)} ಇದು ₹${fmt(capUsed)} ಆದಾಯ ಮಿತಿಯೊಳಗಿದೆ, ಮತ್ತು ನಿಮ್ಮ ಯೋಜನಾ ವೆಚ್ಚ ₹${fmt(projectCost)} ಈ ಯೋಜನೆಯಲ್ಲಿ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ। ನೀವು ನಿಮ್ಮ ಸಾಲದ ವಿವರಗಳನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡಲು ಮತ್ತು ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳನ್ನು ಅನ್ವೇಷಿಸಲು ಮುಂದುವರಿಯಬಹುದು।`,
      notEligible: `ನೀವು ${schemeName} ಗೆ ಅರ್ಹರಲ್ಲ. ನಿಮ್ಮ ವಾರ್ಷಿಕ ಆದಾಯ ₹${fmt(income)} ಈ ಯೋಜನೆಗೆ ₹${fmt(capUsed)} ಆದಾಯ ಮಿತಿಯನ್ನು ಮೀರಿದೆ। ದಯವಿಟ್ಟು ನೀವು ಇತರ ಯೋಜನೆಗಳಿಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಾ ಎಂದು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಆದಾಯ ಬದಲಾದರೆ ಮರು ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದನ್ನು ಪರಿಗಣಿಸಿ।`
    }
  };

  const selectedLang = templates[language] || templates.english;
  return eligible ? selectedLang.eligible : selectedLang.notEligible;
}

module.exports = { explainResult };
