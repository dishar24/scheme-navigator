import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../api';

const fmt = n => Math.round(n).toLocaleString('en-IN');

const LANGUAGES = [
  { code: 'english', label: 'English', native: 'English' },
  { code: 'hindi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kannada', label: 'Kannada', native: 'ಕನ್ನಡ' }
];

export default function StepRecommend({ result, input, onWhatIf, onBack, onNext }) {
  const [whatIfIncome, setWhatIfIncome] = useState(input.income);
  const [whatIfResult, setWhatIfResult] = useState(result);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [explanation, setExplanation] = useState(result.explanation);
  const [explanationLoading, setExplanationLoading] = useState(false);
  
  // Refs for debouncing and cancellation
  const debounceTimer = useRef(null);
  const requestCounter = useRef(0);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // What-If simulation with cancellation support
  const runWhatIf = useCallback(async (val, requestId) => {
    setLoading(true);
    try {
      const r = await api.recommend({
        name: 'What-If Preview',
        income: Number(val),
        projectCost: input.projectCost,
        educationStatus: input.educationStatus,
        language: selectedLanguage,
        isWhatIf: true  // Flag to prevent database persistence
      });
      
      // Only update if this is still the latest request
      if (requestId === requestCounter.current) {
        setWhatIfResult(r);
        setExplanation(r.explanation);
      }
    } catch (e) {
      // silently keep previous result on error — slider shouldn't break the flow
      console.error('What-If simulation error:', e);
    } finally {
      // Only clear loading if this is still the latest request
      if (requestId === requestCounter.current) {
        setLoading(false);
      }
    }
  }, [input, selectedLanguage]);

  // Debounced slider handler
  function handleSlider(val) {
    setWhatIfIncome(val);
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Increment request counter to invalidate previous requests
    requestCounter.current += 1;
    const currentRequestId = requestCounter.current;
    
    // Set new debounced timer (400ms delay)
    debounceTimer.current = setTimeout(() => {
      runWhatIf(val, currentRequestId);
    }, 400);
  }

  async function handleLanguageChange(langCode) {
    setSelectedLanguage(langCode);
    setExplanationLoading(true);
    try {
      const response = await api.regenerateExplanation({
        eligible: whatIfResult.eligible,
        income: whatIfIncome,
        capUsed: whatIfResult.capUsed,
        projectCost: input.projectCost,
        schemeName: whatIfResult.scheme.name,
        language: langCode
      });
      setExplanation(response.explanation);
    } catch (e) {
      console.error('Failed to regenerate explanation:', e);
    } finally {
      setExplanationLoading(false);
    }
  }

  const r = whatIfResult;

  return (
    <div className="card">
      <div className={`match-badge ${r.eligible ? '' : 'no'}`}>
        {r.eligible ? `${r.matchPct}% Match` : 'Not Eligible'}
      </div>
      <div className="scheme-name display">{r.scheme.name}</div>
      
      <div className="language-selector">
        <label style={{ marginBottom: '8px' }}>Language / भाषा / ಭಾಷೆ</label>
        <div className="language-buttons">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`lang-btn ${selectedLanguage === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={explanationLoading}
            >
              {lang.native}
            </button>
          ))}
        </div>
      </div>

      <div className={`why-box ${r.eligible ? '' : 'no'}`}>
        {explanationLoading ? 'Generating explanation...' : explanation}
      </div>

      <label>What-If Simulator — try a different income</label>
      <input
        type="range" min="100000" max="900000" step="10000"
        value={whatIfIncome}
        onChange={e => handleSlider(e.target.value)}
      />
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 18 }}>
        Simulated income: ₹{fmt(whatIfIncome)} {loading && '· checking…'}
      </div>

      <button className="ghost" onClick={onBack}>← Back</button>
      <button
        className="primary"
        disabled={!r.eligible}
        onClick={() => onNext(r)}
      >
        Continue to Calculator
      </button>
    </div>
  );
}
