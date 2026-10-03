export default async function handler(req, res) {
  // Set CORS headers for browser safety
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const targetWebhooks = [
    'https://os.phoenixrise.com.br/api/public/webhooks/HEl5S7aEep1SyoDSp5F2UnqmykQ13Y7d',
    'https://crm-phoenixrise.vercel.app/api/webhook'
  ];

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

  try {
    const results = await Promise.allSettled(
      targetWebhooks.map(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Phoenix-Rise-Website-Proxy/1.0'
            },
            body: JSON.stringify(payload)
          });
          const text = await response.text();
          console.log(`[Proxy Webhook] Sent to ${url} | Status: ${response.status} | Body: ${text}`);
          return { url, status: response.status, response: text };
        } catch (err) {
          console.error(`[Proxy Webhook Error] ${url}:`, err);
          throw err;
        }
      })
    );

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('[Proxy Error]:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
