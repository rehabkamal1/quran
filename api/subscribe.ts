import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory / serverless store for subscriptions (Can be connected to Supabase/KV/Upstash in production)
const subscriptions: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription payload' });
    }

    const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subscriptions.push(subscription);
    }

    return res.status(200).json({ success: true, count: subscriptions.length });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ count: subscriptions.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export { subscriptions };
