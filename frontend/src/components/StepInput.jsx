import { useState } from 'react';

export default function StepInput({ onSubmit, loading, error }) {
  const [income, setIncome] = useState('');
  const [projectCost, setProjectCost] = useState('');
  const [edu, setEdu] = useState('graduate');

  function handleSubmit() {
    if (!income || !projectCost) return;
    onSubmit({ income: Number(income), projectCost: Number(projectCost), educationStatus: edu });
  }

  return (
    <div className="card">
      <h2>Tell us about your project</h2>
      <div className="desc">Basic details — no documents needed yet.</div>
      {error && <div className="error-box">{error}</div>}
      <div className="field-row">
        <div>
          <label>Annual Family Income (₹)</label>
          <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="e.g. 480000" />
        </div>
        <div>
          <label>Estimated Project / Course Cost (₹)</label>
          <input type="number" value={projectCost} onChange={e => setProjectCost(e.target.value)} placeholder="e.g. 1200000" />
        </div>
      </div>
      <label>Education Status</label>
      <select value={edu} onChange={e => setEdu(e.target.value)}>
        <option value="undergraduate">Undergraduate</option>
        <option value="graduate">Graduate</option>
        <option value="postgraduate">Postgraduate</option>
      </select>
      <button className="primary" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Checking…' : 'Find My Scheme'}
      </button>
    </div>
  );
}
