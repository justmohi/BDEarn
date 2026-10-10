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
4. **Zero-Incentivized Click Policy (Global Advertising Network Compliance)**:
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

## 🎁 Referral Bonus System

- Every signed-in user can share a link in the format `/?ref=<referrer-firebase-uid>`.
- A valid new account receives a **BDT 100 pending referral record** for the referrer; it is not immediately withdrawable.
- The eligibility period is **30 complete days** from account registration.
- After 30 days, an administrator can approve the bonus only if both accounts are active and the referred user's Firebase email is verified.
- Approval credits the referrer's wallet once using a deterministic ledger ID. The existing **BDT 5,000 minimum withdrawal** still applies.
- Self-referrals, duplicate referral claims, client-side bonus changes, and premature approvals are rejected.
- User referral history is read-only from the client. Claims, approvals, and wallet credits are handled by `netlify/functions/referral.ts`.

### Required Netlify environment variables

Configure these in **Netlify → Site configuration → Environment variables**; do not commit private credentials to GitHub:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete Firebase service-account JSON for the same Firebase project used by this app. Keep it private.
- `FIRESTORE_DATABASE_ID`: the exact named Firestore database ID from `firebase-applet-config.json`.
- `URL`: your deployed site's origin, if you need to customize the function's CORS origin.

The referral function uses Firebase Admin SDK to verify Firebase ID tokens and to perform trusted Firestore transactions. Without the service-account environment variable, referral claims and admin reviews will return a configuration error. After setting the variables, redeploy the site.

**Important:** this referral feature is not a reward for ad clicks or ad views. Keep advertising-based rewards disabled unless the advertising provider has explicitly approved the monetization model.
