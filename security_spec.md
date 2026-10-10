# EarnBD Security Specification

## 1. Data Invariants
- Users cannot set their own role to 'admin'; roles must default to 'user'.
- Users cannot directly modify their wallet balances (`wallets/{userId}`) or create arbitrary balance credits.
- Users can create a withdrawal request only for their own `userId` with `status: 'pending'`, and minimum amount of 5,000 BDT.
- Pending withdrawal requests cannot be modified by the user once submitted.
- Only administrators can update withdrawal request statuses (`processing`, `approved`, `paid`, `rejected`), update transaction references, and modify ad cards.
- Ad cards are publicly readable if `isActive == true`, and only admins can create, update, or delete ad cards.
- Users cannot view other users' wallets, transactions, or withdrawal requests.
- Admins identified via `/admins/{uid}` document or verified bootstrap email `mohistudio95@gmail.com`.

## 2. Dirty Dozen Payloads (Designed to break laws of Identity, Integrity, and State)
1. **Self-Admin Escalation**: Non-admin user creates/updates `/users/{uid}` with `role: "admin"`. -> MUST FAIL.
2. **Ghost Balance Credit**: User creates/updates `/wallets/{uid}` with `availableBalance: 999999`. -> MUST FAIL.
3. **Impersonated Withdrawal**: User A submits `/withdrawalRequests/req1` with `userId: "user_B"`. -> MUST FAIL.
4. **Sub-Minimum Withdrawal**: User submits withdrawal request with `amount: 100` (below minimum 5000 BDT). -> MUST FAIL.
5. **Direct Payout Marking**: User updates their pending withdrawal to `status: "paid"`. -> MUST FAIL.
6. **Cross-User Ledger Sniffing**: User A attempts to list or read `/wallets/{userB}` or `/walletTransactions/{txId}` of user B. -> MUST FAIL.
7. **Ad Card Defacement**: Unauthenticated or normal user attempts to update `/adCards/{cardId}` destinationUrl to phishing link. -> MUST FAIL.
8. **Malicious Protocol Injection**: User/Admin attempts to save destination URL with `javascript:alert(1)`. -> MUST FAIL.
9. **Duplicate Status Transition**: Non-admin attempts to re-open a `paid` or `rejected` withdrawal request. -> MUST FAIL.
10. **Report Tampering**: Normal user creates or alters `/monthlyReports/{id}` or `/commissions/{id}`. -> MUST FAIL.
11. **Oversized String DoS**: Payload with 2MB title string in adCard or withdrawalRequest. -> MUST FAIL.
12. **Audit Log Erasure**: Any user or actor attempts to delete records from `/auditLogs/{id}`. -> MUST FAIL.
