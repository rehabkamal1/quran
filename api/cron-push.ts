import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { subscriptions } from './subscribe';

const VAPID_PUBLIC_KEY = process.env.VITE_PUBLIC_VAPID_KEY || 'BAFB6WpLVCHxsLFayrn86zKPrEqjn4A2asyUul_YI2tHZ65dxdseCh5TEMK7oi3tEyEHWJrDIGRoqBsl5fscKVw';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'nCVj5omAK1fJv0YqWECZayNC4HIeBb_tK_j7BEMKls8';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@quranapp.local';

try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} catch (e) {
  console.warn('[Serverless VAPID Init Warning]:', e);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prayerName = (req.query.prayer as string) || (req.body?.prayer as string) || 'الصلاة';
  const payload = JSON.stringify({
    title: `حان الآن موعد أذان ${prayerName} 🕌`,
    body: `حي على الصلاة، حي على الفلاح — موعد أذان ${prayerName}`,
    url: '/prayer',
    prayerName,
    prayerKey: `${new Date().toISOString().split('T')[0]}:${prayerName}`,
  });

  const results = [];
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      results.push({ endpoint: sub.endpoint, status: 'success' });
    } catch (err: any) {
      console.error('[WebPush Serverless] Failed to send push:', err?.message);
      results.push({ endpoint: sub.endpoint, status: 'error', error: err?.message });
    }
  }

  return res.status(200).json({
    message: 'Cron prayer push execution completed',
    sentCount: results.length,
    results,
  });
}
