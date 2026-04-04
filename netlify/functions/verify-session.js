import Stripe from 'stripe'
import jwt from 'jsonwebtoken'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const APP_URL = process.env.URL || 'http://localhost:5173'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' }
  }

  try {
    const { sessionId } = JSON.parse(event.body || '{}')
    if (!sessionId) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'sessionId required' }),
      }
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return {
        statusCode: 402,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment not confirmed' }),
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign(
      { grantedAt: now, stripeSessionId: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }
  } catch (err) {
    console.error('verify-session error:', err)
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Verification failed' }),
    }
  }
}
