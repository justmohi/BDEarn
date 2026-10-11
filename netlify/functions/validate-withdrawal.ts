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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { amount, walletNumber, walletType, availableBalance } = JSON.parse(event.body || '{}');

    if (!walletType || !['bKash', 'Nagad'].includes(walletType)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid wallet type. Must be bKash or Nagad.' })
      };
    }

    const normalizedWalletNumber = String(walletNumber || '').replace(/[\\s-]/g, '');
    const phoneRegex = /^01[3-9]\\d{8}$/;
    if (!phoneRegex.test(normalizedWalletNumber)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid Bangladeshi mobile number (must be 11 digits starting with 013-019).' })
      };
    }

    const numAmount = Number(amount);
    if (!Number.isSafeInteger(numAmount) || numAmount < 3000) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Minimum withdrawal amount is BDT 3,000, using whole-number amounts only.' })
      };
    }

    if (typeof availableBalance === 'number' && numAmount > availableBalance) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Requested amount exceeds available balance.' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valid: true,
        amount: numAmount,
        walletType,
        walletNumber: normalizedWalletNumber
      })
    };
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request body.' })
    };
  }
}
