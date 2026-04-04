import { useState, useEffect } from 'react'

const TOKEN_KEY = 'iq_access_token'

function decodeTokenPayload(token) {
  try {
    // JWT payload is the second segment, base64url encoded
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

function isTokenValid(token) {
  if (!token) return false
  const payload = decodeTokenPayload(token)
  if (!payload) return false
  const now = Math.floor(Date.now() / 1000)
  const expiry = payload.exp // standard JWT claim set by jsonwebtoken's expiresIn
  return typeof expiry === 'number' && now < expiry
}

export default function SubscriptionGate({ children }) {
  const [status, setStatus] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    return isTokenValid(token) ? 'granted' : 'checking'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'granted') return

    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')

    if (!sessionId) {
      setStatus('paywall')
      return
    }

    // Clear session_id from URL immediately before async work
    params.delete('session_id')
    const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState({}, '', cleanUrl)

    setStatus('verifying')
    fetch('/.netlify/functions/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token)
          setStatus('granted')
        } else {
          setError('Payment could not be confirmed. Please contact support.')
          setStatus('paywall')
        }
      })
      .catch(() => {
        setError('Verification failed. Please try again.')
        setStatus('paywall')
      })
  }, [])

  if (status === 'granted') return children

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not start checkout. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  const isVerifying = status === 'checking' || status === 'verifying'

  if (isVerifying) {
    return (
      <div style={styles.container}>
        <div style={styles.logoRow}>
          <div style={styles.logo}>IrriCount</div>
          <div style={styles.subtitle}>fueled by SystemLogiq</div>
        </div>
        <div style={styles.loadingText}>
          {status === 'verifying' ? 'Confirming payment\u2026' : 'Loading\u2026'}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.logoRow}>
        <div style={styles.logo}>IrriCount</div>
        <div style={styles.subtitle}>fueled by SystemLogiq</div>
        <div style={styles.valueStatement}>
          Professional irrigation quoting — built for the field.
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.priceLabel}>$99<span style={styles.pricePer}> / month</span></div>

        <ul style={styles.featureList}>
          {[
            'Instant field quotes — spray, rotor, drip & more',
            'Offline-capable PWA — works without signal',
            'Save & recall quotes from any job site',
            'PDF export for client handoff',
          ].map(feat => (
            <li key={feat} style={styles.featureItem}>
              <span style={styles.check}>✓</span> {feat}
            </li>
          ))}
        </ul>

        {error && <div style={styles.errorMsg}>{error}</div>}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{ ...styles.subscribeBtn, opacity: loading ? 0.65 : 1 }}
        >
          {loading ? 'Redirecting\u2026' : 'Subscribe — $99/mo'}
        </button>
      </div>

      <div style={styles.footer}>© 2026 SystemLogiq LLC — Authorized access only</div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  },
  logoRow: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#00876A',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#007A99',
    marginTop: '4px',
  },
  valueStatement: {
    fontSize: '15px',
    color: '#aaa',
    marginTop: '14px',
    maxWidth: '280px',
    lineHeight: '1.5',
    margin: '14px auto 0',
  },
  loadingText: {
    color: '#666',
    fontSize: '14px',
    marginTop: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '320px',
    backgroundColor: '#141414',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #2a2a2a',
  },
  priceLabel: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '18px',
  },
  pricePer: {
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#888',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  featureItem: {
    fontSize: '14px',
    color: '#bbb',
  },
  check: {
    color: '#00876A',
    fontWeight: 'bold',
    marginRight: '6px',
  },
  errorMsg: {
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  subscribeBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#00876A',
    color: '#ffffff',
    cursor: 'pointer',
    minHeight: '52px',
  },
  footer: {
    marginTop: '40px',
    fontSize: '11px',
    color: '#444',
  },
}
