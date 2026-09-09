import { useState } from 'react';
import { api } from './api';
import StepInput from './components/StepInput';
import StepRecommend from './components/StepRecommend';
import StepCalculator from './components/StepCalculator';
import StepDocs from './components/StepDocs';
import StepPartners from './components/StepPartners';
import AdminPanel from './components/AdminPanel';
import EligibilityUpdateCard from './components/EligibilityUpdateCard';

const STEP_LABELS = ['Your Details', 'Recommendation', 'Calculator', 'Documents', 'Find Partner'];

export default function App() {
  const [mode, setMode] = useState('apply'); // 'apply' | 'admin'
  const [step, setStep] = useState(1);
  const [input, setInput] = useState(null);
  const [result, setResult] = useState(null);
  const [finalScheme, setFinalScheme] = useState(null);
  const [applicantId, setApplicantId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleInputSubmit(payload) {
    setLoading(true);
    setError(null);
    try {
      const r = await api.recommend(payload);
      setInput(payload);
      setResult(r);
      setApplicantId(r.applicantId);
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setStep(1);
    setInput(null);
    setResult(null);
    setFinalScheme(null);
    setApplicantId(null);
    setError(null);
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <div className="eyebrow">SIH26092 · CYVANTA</div>
          <h1>Scheme Navigator</h1>
          <div className="sub">Helping SC entrepreneurs find the right concessional credit scheme — and the right partner to reach.</div>
        </div>
        <div className="mode-switch">
          <button className={`mode-btn ${mode === 'apply' ? 'active' : ''}`} onClick={() => setMode('apply')}>Applicant View</button>
          <button className={`mode-btn ${mode === 'admin' ? 'active' : ''}`} onClick={() => setMode('admin')}>Admin Panel</button>
        </div>
      </div>

      {mode === 'admin' ? (
        <AdminPanel />
      ) : (
        <>
          <div className="steps-bar">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const cls = n < step ? 'done' : n === step ? 'current' : '';
              return <div className={`step-pill ${cls}`} key={label}>{n}. {label}</div>;
            })}
          </div>

          {applicantId && step > 1 && (
            <EligibilityUpdateCard applicantId={applicantId} />
          )}

          {step === 1 && (
            <StepInput onSubmit={handleInputSubmit} loading={loading} error={error} />
          )}

          {step === 2 && result && (
            <StepRecommend
              result={result}
              input={input}
              onBack={() => setStep(1)}
              onNext={(finalResult) => {
                setFinalScheme(finalResult.scheme);
                setStep(3);
              }}
            />
          )}

          {step === 3 && finalScheme && (
            <StepCalculator
              scheme={finalScheme}
              projectCost={input.projectCost}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && finalScheme && (
            <StepDocs
              scheme={finalScheme}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}

          {step === 5 && finalScheme && (
            <StepPartners
              scheme={finalScheme}
              onBack={() => setStep(4)}
              onRestart={handleRestart}
            />
          )}
        </>
      )}
    </div>
  );
}
