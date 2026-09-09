const BASE = '/api';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  recommend: (payload) =>
    fetch(`${BASE}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handle),

  calculate: (payload) =>
    fetch(`${BASE}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handle),

  partners: (schemeId, lat, lng) =>
    fetch(`${BASE}/partners?scheme=${schemeId}&lat=${lat}&lng=${lng}`).then(handle),

  adminSchemes: () => fetch(`${BASE}/admin/schemes`).then(handle),

  adminNewVersion: (schemeId, payload) =>
    fetch(`${BASE}/admin/schemes/${schemeId}/new-version`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handle),

  adminScan: () =>
    fetch(`${BASE}/admin/scan`, { method: 'POST' }).then(handle),

  checkEligibilityUpdate: (applicantId) =>
    fetch(`${BASE}/admin/eligibility-update/${applicantId}`).then(handle)
};
