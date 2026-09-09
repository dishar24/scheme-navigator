import { useState, useCallback } from 'react';
import { api } from '../api';

const fmt = n => Math.round(n).toLocaleString('en-IN');

export default function StepRecommend({ result, input, onWhatIf, onBack, onNext }) {
  const [whatIfIncome, setWhatIfIncome] = useState(input.income);
  const [whatIfResult, setWhatIfResult] = useState(result);
  const [loading, setLoading] = useState(false);

  // debounced re-check against the real backend as the slider moves
  const runWhatIf = useCallback(async (val) => {
    setLoading(true);
    try {
      const r = await api.recommend({
        name: 'What-If Preview',
        income: Number(val),
        projectCost: input.projectCost,
        educationStatus: input.educationStatus
      });
      setWhatIfResult(r);
    } catch (e) {
      // silently keep previous result on error — slider shouldn't break the flow
    } finally {
      setLoading(false);
    }
  }, [input]);

  function handleSlider(val) {
    setWhatIfIncome(val);
    runWhatIf(val);
  }

  const r = whatIfResult;

  return (
    <div className="card">
      <div className={`match-badge ${r.eligible ? '' : 'no'}`}>
        {r.eligible ? `${r.matchPct}% Match` : 'Not Eligible'}
      </div>
      <div className="scheme-name display">{r.scheme.name}</div>
      <div className={`why-box ${r.eligible ? '' : 'no'}`}>
        {r.explanation}
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
