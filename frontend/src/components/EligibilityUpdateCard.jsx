import { useEffect, useState } from 'react';
import { api } from '../api';

export default function EligibilityUpdateCard({ applicantId }) {
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicantId) {
      setLoading(false);
      return;
    }

    api.checkEligibilityUpdate(applicantId)
      .then(result => {
        if (result.hasUpdate) {
          setUpdate(result);
        }
      })
      .catch(err => {
        console.error('Failed to check eligibility update:', err);
      })
      .finally(() => setLoading(false));
  }, [applicantId]);

  if (loading || !update) return null;

  const isNewlyEligible = update.change === 'newly_eligible';
  const message = isNewlyEligible
    ? 'You are now eligible under the latest scheme rules.'
    : 'You are no longer eligible under the latest scheme rules.';

  return (
    <div className={`eligibility-update-card ${isNewlyEligible ? 'positive' : 'negative'}`}>
      <div className="update-header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="update-title">Eligibility Updated</span>
      </div>
      <div className="update-scheme">{update.schemeName}</div>
      <div className="update-message">{message}</div>
    </div>
  );
}
