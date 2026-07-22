import React, {useState, useEffect} from 'react';

const ENDPOINT = 'https://form-api.ovenmedia.com/api/forms/newsletter';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'submitting' | 'ok' | 'error';

export default function NewsletterForm(): React.ReactElement {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (status !== 'ok') return;
    const timer = setTimeout(() => {
      setStatus('idle');
      setError('');
      setFormKey((k) => k + 1);
    }, 4000);
    return () => clearTimeout(timer);
  }, [status]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    if (!email || !EMAIL_RE.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setStatus('submitting');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email,
          company_url: String(fd.get('company_url') || ''), // honeypot
        }),
      });
      const data = await res.json().catch(() => ({ok: false}));
      if (res.ok && data.ok) {
        setStatus('ok');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const isOk = status === 'ok';
  const submitting = status === 'submitting';

  return (
    <div style={{position: 'relative'}}>
      {/* Normal content — fades out on success */}
      <div style={{opacity: isOk ? 0 : 1, transition: 'opacity 0.6s ease', pointerEvents: isOk ? 'none' : 'auto'}}>
        <h2 className="h2s fw-bold text-main mb-3">Stay Up to Date with OvenMedia Labs</h2>
        <p className="lead text-sub fw-light mb-4 col-lg-8 mx-auto">Get release notes, technical insights, and company news delivered to your inbox.</p>
        <form key={formKey} onSubmit={onSubmit} noValidate>
          <div className="col-lg-5 mx-auto">
            <div className="row g-2 align-items-center">
              <div className="col">
                <input
                  className={`newsletter-input${error ? ' is-invalid' : ''}`}
                  id="nl-email" name="email" type="email"
                  placeholder="Please enter your email address" maxLength={320}
                  aria-invalid={!!error}
                  onInput={() => error && setError('')}
                />
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-sm btn-secondary-outline2" disabled={submitting}>
                  {submitting ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
            </div>
            {error && <span className="consult-field-error d-block text-start mt-1">{error}</span>}
            {status === 'error' && (
              <p className="consult-error mt-2 mb-0 text-center small">
                Something went wrong. Please try again.
              </p>
            )}
            <div className="consult-hp" aria-hidden="true">
              <label htmlFor="nl-company-url">Company URL</label>
              <input id="nl-company-url" name="company_url" type="text" tabIndex={-1} autoComplete="off" />
            </div>
          </div>
          <div className="col-lg-10 mx-auto">
            <p className="text-mono-deep small mt-3 mb-0 text-center">
              By subscribing, you agree to receive emails from OvenMedia Labs. You can unsubscribe at any time.
            </p>
          </div>
        </form>
      </div>

      {/* Success message — fades in on success, centered over original content */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: isOk ? 1 : 0,
        transition: 'opacity 0.6s ease',
        pointerEvents: isOk ? 'auto' : 'none',
      }}>
        <p className="lead text-main fw-bold mb-2">You're subscribed!</p>
        <p className="text-sub small mb-0">Thanks for subscribing.<br/>We'll keep you updated with the latest news from OvenMedia Labs.</p>
      </div>
    </div>
  );
}
