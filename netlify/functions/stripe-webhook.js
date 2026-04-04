import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const handler = async (event) => {
  const sig = event.headers['stripe-signature']

  let webhookEvent
  try {
    // constructEvent requires the raw unmodified body — handle base64 encoding if present
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body

    webhookEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  switch (webhookEvent.type) {
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed':
      // Secondary revocation signal. Active token revocation is deferred to Phase 2
      // (requires identity layer). Tokens expire naturally at the 30-day boundary.
      console.log(`Webhook: ${webhookEvent.type}`, webhookEvent.data.object.id)
      break
    default:
      console.log(`Unhandled webhook event: ${webhookEvent.type}`)
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
