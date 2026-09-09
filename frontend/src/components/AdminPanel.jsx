import { useEffect, useState } from 'react';
import { api } from '../api';

const fmt = n => Math.round(n).toLocaleString('en-IN');

const CHANGE_LABEL = {
  newly_eligible: 'Newly Eligible',
  no_longer_eligible: 'No Longer Eligible',
  no_change: 'No change'
};

export default function AdminPanel() {
  const [schemes, setSchemes] = useState(null);
  const [edits, setEdits] = useState({});
  const [scan, setScan] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function loadSchemes() {
    api.adminSchemes().then(setSchemes).catch(e => setError(e.message));
  }

  useEffect(loadSchemes, []);

  async function saveNewVersion(schemeId) {
    setBusy(true);
    setError(null);
    try {
      const incomeCap = Number(edits[schemeId]);
      await api.adminNewVersion(schemeId, { incomeCap });
      setScan(null);
      loadSchemes();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function runScan() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.adminScan();
      setScan(result.results);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!schemes) return <div className="card"><div className="loading">Loading schemes…</div></div>;

  return (
    <div className="card">
      <h2>Scheme Rules — Knowledge Base</h2>
      <div className="desc">Edit a rule and save a new version. Nothing is overwritten — old versions are kept for comparison.</div>
      {error && <div className="error-box">{error}</div>}
      <table className="rules-table">
        <thead>
          <tr><th>Scheme</th><th>Income Cap (₹)</th><th>Version</th><th></th></tr>
        </thead>
        <tbody>
          {schemes.map(s => (
            <tr key={s.scheme_id}>
              <td><strong>{s.scheme_name}</strong></td>
              <td>
                <input
                  type="number"
                  defaultValue={s.income_cap}
                  onChange={e => setEdits(prev => ({ ...prev, [s.scheme_id]: e.target.value }))}
                />
              </td>
              <td><span className="version-tag">v{s.version}</span></td>
              <td>
                <button
                  className="ghost"
                  style={{ padding: '6px 14px', fontSize: 13, margin: 0 }}
                  disabled={busy}
                  onClick={() => saveNewVersion(s.scheme_id)}
                >
                  Save New Version
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="primary" disabled={busy} onClick={runScan}>
        {busy ? 'Working…' : 'Run Policy-Change Impact Scan'}
      </button>

      {scan && (
        <>
          <h2 style={{ marginTop: 28, fontSize: 17 }}>Impact Scan Results</h2>
          <table className="scan-table">
            <thead>
              <tr><th>Applicant</th><th>Income</th><th>Before</th><th>After</th><th>Change</th></tr>
            </thead>
            <tbody>
              {scan.map(r => (
                <tr key={r.applicantId}>
                  <td>{r.name}</td>
                  <td>₹{fmt(r.income)}</td>
                  <td>{r.before ? 'Eligible' : 'Not Eligible'}</td>
                  <td>{r.after ? 'Eligible' : 'Not Eligible'}</td>
                  <td><span className={`flip-badge ${r.change}`}>{CHANGE_LABEL[r.change]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
