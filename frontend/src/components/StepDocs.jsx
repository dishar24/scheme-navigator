import { useState } from 'react';

export default function StepDocs({ scheme, onBack, onNext }) {
  const [checked, setChecked] = useState({});

  function toggle(doc) {
    setChecked(prev => ({ ...prev, [doc]: !prev[doc] }));
  }

  return (
    <div className="card">
      <h2>Document Checklist</h2>
      <div className="desc">Required for {scheme.name} — tick what you already have</div>
      {scheme.documents.map(doc => (
        <div className="doc-item" key={doc}>
          <input type="checkbox" checked={!!checked[doc]} onChange={() => toggle(doc)} />
          <div className="name">{doc}</div>
        </div>
      ))}
      <div style={{ marginTop: 20 }}>
        <button className="ghost" onClick={onBack}>← Back</button>
        <button className="primary" onClick={onNext}>Find Nearest Partner</button>
      </div>
    </div>
  );
}
