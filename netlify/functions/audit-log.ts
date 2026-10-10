export async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { actorEmail, action, details } = JSON.parse(event.body || '{}');
    console.log(`[NETLIFY AUDIT ${new Date().toISOString()}] ${actorEmail || 'anon'}: ${action} - ${JSON.stringify(details)}`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recorded: true })
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to record audit' })
    };
  }
}
