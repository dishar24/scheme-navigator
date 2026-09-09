import { useEffect, useState } from 'react';
import { api } from '../api';

// Demo default coordinates (Bangalore) — replace with real geolocation
// in production; the PS asks for user-location-based routing.
const DEMO_LAT = 12.9716;
const DEMO_LNG = 77.5946;

export default function StepPartners({ scheme, onBack, onRestart }) {
  const [partners, setPartners] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.partners(scheme.id, DEMO_LAT, DEMO_LNG)
      .then(setPartners)
      .catch(e => setError(e.message));
  }, [scheme]);

  return (
    <div className="card">
      <h2>Nearest Channel Partners</h2>
      <div className="desc">For {scheme.name} — partners with high NPA or low fund utilization are auto-excluded</div>
      {error && <div className="error-box">{error}</div>}
      {!partners && !error && <div className="loading">Loading partners…</div>}
      {partners && partners.map(p => (
        <div className={`partner-card ${p.isEligible ? '' : 'excluded'}`} key={p.id}>
          <div>
            <div className="name">{p.name}</div>
            <div className="type">{p.type} · Fund utilization {p.fundUtilizationPct}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`status-chip ${p.isEligible ? 'ok' : 'excluded'}`}>
              {p.isEligible ? 'Eligible' : 'High NPA — Excluded'}
            </span>
            <div className="dist">{p.distanceKm} km away</div>
          </div>
        </div>
      ))}
      <div className="mock-note">
        Partner NPA/fund-utilization values are simulated for this demo — real integration pending official data access.
      </div>
      <button className="ghost" onClick={onBack}>← Back</button>
      <button className="primary" onClick={onRestart}>Start New Application</button>
    </div>
  );
}
