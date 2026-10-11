export async function handler() {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'ok',
      service: 'EarnBD Netlify Serverless API',
      currency: 'BDT',
      minWithdrawalAmount: 3000,
      timestamp: new Date().toISOString()
    })
  };
}
