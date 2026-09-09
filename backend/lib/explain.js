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
      ? `You are writing an eligibility explanation in ${targetLanguage} for a loan applicant.

FACTS PROVIDED:
- Scheme: "${schemeName}"
- Applicant's annual income: ₹${income}
- Income limit for this scheme: ₹${capUsed}
- Project cost: ₹${projectCost}
- Eligibility status: ELIGIBLE

STRICT REQUIREMENTS:
Write EXACTLY 3 complete sentences. No more, no less.
- Sentence 1: State that the applicant IS ELIGIBLE for the "${schemeName}".
- Sentence 2: Explain that their income of ₹${income} is within the ₹${capUsed} limit and their project cost of ₹${projectCost} fits this scheme.
- Sentence 3: Tell them to proceed to calculate loan details and explore required documents.

Use ONLY the facts provided above. Do not mention AI, models, or technology. Write in plain ${targetLanguage}. No bullet points. No headings. No markdown. Return ONLY the 3 sentences. Each sentence must be complete. Do not stop mid-sentence. Keep the total response between 45-80 words.`
      : `You are writing an eligibility explanation in ${targetLanguage} for a loan applicant.

FACTS PROVIDED:
- Scheme: "${schemeName}"
- Applicant's annual income: ₹${income}
- Income limit for this scheme: ₹${capUsed}
- Eligibility status: NOT ELIGIBLE

STRICT REQUIREMENTS:
Write EXACTLY 3 complete sentences. No more, no less.
- Sentence 1: State that the applicant is NOT ELIGIBLE for the "${schemeName}".
- Sentence 2: Explain that their income of ₹${income} exceeds the ₹${capUsed} income limit for this scheme.
- Sentence 3: Suggest they check other schemes or reapply if their income changes.

Use ONLY the facts provided above. Do not mention AI, models, or technology. Write in plain ${targetLanguage}. No bullet points. No headings. No markdown. Return ONLY the 3 sentences. Each sentence must be complete. Do not stop mid-sentence. Keep the total response between 45-80 words.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
        temperature: 0.3
      })
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    
    // Validate the response
    if (!isValidExplanation(text)) {
      console.warn('[explain] Groq response failed validation, using template');
      return templateExplanation({ eligible, income, capUsed, projectCost, schemeName, language });
    }
    
    return text;
  } catch (err) {
    console.error('[explain] Groq call failed, falling back to template:', err.message);
    return templateExplanation({ eligible, income, capUsed, projectCost, schemeName, language });
  }
}

/**
 * Validates that the Groq explanation is complete and usable.
 * Returns false if the text is empty, too short, or appears incomplete.
 */
function isValidExplanation(text) {
  if (!text || typeof text !== 'string') return false;
  
  const trimmed = text.trim();
  
  // Must be at least 30 characters (suspiciously short otherwise)
  if (trimmed.length < 30) return false;
  
  // Must contain at least 2 sentences (look for sentence-ending punctuation)
  const sentenceEndings = trimmed.match(/[.!?।॥]/g);
  if (!sentenceEndings || sentenceEndings.length < 2) return false;
  
  // Should not end with an incomplete word/sentence marker
  if (trimmed.endsWith('...') || trimmed.endsWith(',')) return false;
  
  // Should not contain markdown headers or bullet points
  if (trimmed.includes('#') || trimmed.match(/^\s*[-*•]/m)) return false;
  
  return true;
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
