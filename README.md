# EarnBD - Bangladesh Earning & Advertising Platform

EarnBD is a modern, mobile-first digital advertising directory and transparent publisher revenue sharing platform engineered for users in Bangladesh. Built with React 19, TypeScript, Tailwind CSS, an Express server, Firebase Authentication, and Google Cloud Firestore.

## 🎯 Key Features & Rules

1. **BDT (৳) Currency Standard**: All monetary metrics and transaction ledgers are strictly denominated in Bangladeshi Taka (BDT).
2. **Minimum Withdrawal Rule (৳5,000 Threshold)**:
   - Available balance must be at least **BDT 5,000** to initiate a payout request.
   - Sub-৳5,000 balances cannot submit requests.
   - Unpaid approved balances roll over seamlessly into subsequent calendar months.
3. **bKash & Nagad Manual Disbursements**:
   - Users select their preferred mobile wallet and enter an 11-digit Bangladeshi mobile number (`013` - `019`).
   - The platform **NEVER** requests wallet PINs, OTPs, or passwords.
   - Admin reviews the request, executes the transfer manually via bKash/Nagad, and inputs the official Transaction Reference (TrxID).
   - If rejected, the reserved funds are atomically returned to the user's available balance with an audit reason.
4. **Zero-Incentivized Click Policy (Adsterra & Global Network Compliance)**:
   - EarnBD strictly prohibits Paid-to-Click (PTC), forced ad viewing, automated bots, or paying users for visiting links.
   - Visiting directory sponsor cards does not yield per-click credits.
   - Publisher commissions are derived solely from verified monthly net receipts.
5. **Zero-Trust ABAC Firestore Security Rules**:
   - Default deny on all documents.
   - Users can only read their own profile, wallet, and withdrawal records.
   - Wallet balances can only be credited/mutated by trusted admin/backend logic.
   - Safe external URL verification blocks dangerous URI schemes (`javascript:`, `data:`, `file:`).

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend / API**: Express 4, Node.js with Vite middleware (`server.ts`)
- **Database & Auth**: Google Cloud Firestore, Firebase Authentication
- **Security Rules**: Firestore Rules v2 (ABAC) with atomic transaction guarantees

## 🚀 Setup & Local Execution

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Full-Stack Dev Server**:
   ```bash
   npm run dev
   ```
   The app will run on port 3000.

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Start Production Server**:
   ```bash
   npm start
   ```

## 🔒 Firebase Configuration & Security Rules

The application uses `firebase-applet-config.json` generated during Firebase provisioning. Security rules (`firestore.rules`) enforce:
- Ownership checks on `/users/{userId}`, `/wallets/{userId}`, `/withdrawalRequests/{requestId}`.
- Immutable ledger in `/walletTransactions/{txId}`.
- Administrative gates via bootstrap email (`mohistudio95@gmail.com`) and `/admins/{uid}` document.
