import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Server health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'EarnBD Backend API',
    currency: 'BDT',
    minWithdrawalAmount: 5000,
    timestamp: new Date().toISOString()
  });
});

// Server-side validation for withdrawal eligibility
app.post('/api/validate-withdrawal', (req: Request, res: Response) => {
  const { amount, walletNumber, walletType, availableBalance } = req.body;

  if (!walletType || !['bKash', 'Nagad'].includes(walletType)) {
    return res.status(400).json({ error: 'Invalid wallet type. Must be bKash or Nagad.' });
  }

  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!walletNumber || !phoneRegex.test(String(walletNumber).replace(/[\s-]/g, ''))) {
    return res.status(400).json({ error: 'Invalid Bangladeshi mobile number (must be 11 digits starting with 013-019).' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 5000) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is BDT 5,000.' });
  }

  if (typeof availableBalance === 'number' && numAmount > availableBalance) {
    return res.status(400).json({ error: 'Requested amount exceeds available balance.' });
  }

  return res.json({
    valid: true,
    amount: numAmount,
    walletType,
    walletNumber
  });
});

// Audit logging endpoint
app.post('/api/audit-log', (req: Request, res: Response) => {
  const { actorEmail, action, details } = req.body;
  console.log(`[AUDIT ${new Date().toISOString()}] ${actorEmail || 'anonymous'}: ${action} - ${JSON.stringify(details)}`);
  res.json({ recorded: true });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EarnBD Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
