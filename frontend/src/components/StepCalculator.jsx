import { useEffect, useState } from 'react';
import { api } from '../api';

const fmt = n => Math.round(n).toLocaleString('en-IN');

export default function StepCalculator({ scheme, projectCost, onBack, onNext }) {
  const [calc, setCalc] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.calculate({ schemeId: scheme.id, projectCost })
      .then(setCalc)
      .catch(e => setError(e.message));
  }, [scheme, projectCost]);

  if (error) return <div className="card"><div className="error-box">{error}</div></div>;
  if (!calc) return <div className="card"><div className="loading">Calculating…</div></div>;

  return (
    <div className="card">
      <h2>Financial Calculator</h2>
      <div className="desc">{scheme.name} — projected repayment terms</div>
      <div className="kv-grid">
        <div className="kv-cell"><div className="k">Loan Amount</div><div className="v">₹{fmt(calc.loanAmount)}</div></div>
        <div className="kv-cell"><div className="k">Interest Rate</div><div className="v">{calc.interestRate}%</div></div>
        <div className="kv-cell"><div className="k">Moratorium</div><div className="v">{calc.moratoriumMonths} mo</div></div>
        <div className="kv-cell"><div className="k">Est. EMI</div><div className="v">₹{fmt(calc.estimatedEmi)}</div></div>
      </div>
      <div className="why-box">
        Based on a {calc.repaymentMonths}-month repayment period after moratorium.
      </div>
      <button className="ghost" onClick={onBack}>← Back</button>
      <button className="primary" onClick={onNext}>Continue to Documents</button>
    </div>
  );
}
