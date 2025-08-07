import Ably from 'ably';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ABLY_API_KEY not configured on the server' });
  }

  try {
    // For ESM default import, Ably is the module, Rest is a property on it
    const client = new Ably.Rest(apiKey);

    const tokenParams = {
      clientId: 'chess-' + Math.random().toString(36).slice(2, 8),
      capability: JSON.stringify({ "chess:*": ["publish", "subscribe", "presence"] }),
      ttl: 1000 * 60 * 60 // 1 hour
    };

    const tokenRequest = await client.auth.createTokenRequest(tokenParams);
    return res.status(200).json(tokenRequest);
  } catch (err) {
    console.error('Error generating Ably token request:', err);
    return res.status(500).json({ error: 'Failed to generate Ably token request' });
  }
}
