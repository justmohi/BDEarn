import { 
  collection, 
  doc, 
  runTransaction, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  WithdrawalRequest, 
  WalletTransaction, 
  UserWallet, 
  WalletType 
} from '../types';
import { generateIdempotencyKey, isValidBdMobileNumber } from '../utils/security';

export const MIN_WITHDRAWAL_BDT = 3000;

export interface SubmitWithdrawalParams {
  userId: string;
  userEmail: string;
  walletType: WalletType;
  walletNumber: string;
  amount: number;
}

/**
 * Submits a manual bKash or Nagad withdrawal request.
 * Atomically validates balance >= minimum withdrawal amount and reserves funds to prevent double-spending.
 */
export async function submitWithdrawalRequest(params: SubmitWithdrawalParams): Promise<{ requestId: string; transactionId: string }> {
  const { userId, userEmail, walletType, walletNumber, amount } = params;

  if (amount < MIN_WITHDRAWAL_BDT) {
    throw new Error(`Minimum withdrawal amount is BDT ৳${MIN_WITHDRAWAL_BDT}.`);
  }

  if (!isValidBdMobileNumber(walletNumber)) {
    throw new Error('Please enter a valid 11-digit Bangladeshi mobile number (013-019).');
  }

  // Prevent duplicate withdrawal requests while one is pending
  const existingPendingQuery = query(
    collection(db, 'withdrawalRequests'),
    where('userId', '==', userId),
    where('status', '==', 'pending')
  );
  const pendingDocs = await getDocs(existingPendingQuery);
  if (!pendingDocs.empty) {
    throw new Error('You already have a pending withdrawal request in queue. Please wait for administration to process it.');
  }

  const requestId = `wreq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const idempotencyKey = generateIdempotencyKey('wdraw_res', userId);
  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    await runTransaction(db, async (tx) => {
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await tx.get(walletRef);

      if (!walletSnap.exists()) {
        throw new Error('Wallet not found for this account.');
      }

      const walletData = walletSnap.data() as UserWallet;
      const currentAvailable = walletData.availableBalance || 0;

      if (currentAvailable < MIN_WITHDRAWAL_BDT) {
        throw new Error(`Withdrawable balance (৳${currentAvailable}) is below the required ৳${MIN_WITHDRAWAL_BDT} minimum.`);
      }

      if (amount > currentAvailable) {
        throw new Error(`Requested amount (৳${amount}) exceeds available balance (৳${currentAvailable}).`);
      }

      // Check for an active pending request to prevent duplicate submissions
      const reqRef = doc(db, 'withdrawalRequests', requestId);

      // Deduct from available, add to reserved
      const newAvailable = currentAvailable - amount;
      const newReserved = (walletData.reservedBalance || 0) + amount;

      tx.update(walletRef, {
        availableBalance: newAvailable,
        reservedBalance: newReserved,
        updatedAt: new Date().toISOString()
      });

      // Create withdrawal request document
      const withdrawalData: WithdrawalRequest = {
        id: requestId,
        userId,
        userEmail,
        walletType,
        walletNumber,
        amount,
        status: 'pending',
        requestedAt: new Date().toISOString()
      };
      tx.set(reqRef, withdrawalData);

      // Record immutable ledger entry
      const txRef = doc(db, 'walletTransactions', transactionId);
      const transactionData: WalletTransaction = {
        id: transactionId,
        userId,
        type: 'withdrawal_reserve',
        amount,
        status: 'completed',
        description: `Reserved for ${walletType} payout to ${walletNumber}`,
        referenceId: requestId,
        idempotencyKey,
        createdAt: new Date().toISOString()
      };
      tx.set(txRef, transactionData);
    });

    return { requestId, transactionId };
  } catch (err) {
    console.error('submitWithdrawalRequest error:', err);
    throw err;
  }
}

/**
 * Admin action: Complete manual payout by providing bKash/Nagad TrxID
 */
export async function completeWithdrawalPayout(
  requestId: string,
  transactionRef: string,
  adminNotes: string,
  adminEmail: string
): Promise<void> {
  if (!transactionRef || transactionRef.trim().length < 4) {
    throw new Error('Valid Transaction Reference (TrxID) is required.');
  }

  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const idempotencyKey = generateIdempotencyKey('wdraw_pay', requestId);

  try {
    await runTransaction(db, async (tx) => {
      const reqRef = doc(db, 'withdrawalRequests', requestId);
      const reqSnap = await tx.get(reqRef);

      if (!reqSnap.exists()) {
        throw new Error('Withdrawal request not found.');
      }

      const reqData = reqSnap.data() as WithdrawalRequest;
      if (reqData.status === 'paid') {
        throw new Error('This request has already been marked as paid.');
      }
      if (reqData.status === 'rejected') {
        throw new Error('Cannot complete a rejected request.');
      }

      const walletRef = doc(db, 'wallets', reqData.userId);
      const walletSnap = await tx.get(walletRef);

      if (walletSnap.exists()) {
        const walletData = walletSnap.data() as UserWallet;
        const currentReserved = walletData.reservedBalance || 0;
        const currentPaid = walletData.paidCommission || 0;

        tx.update(walletRef, {
          reservedBalance: Math.max(0, currentReserved - reqData.amount),
          paidCommission: currentPaid + reqData.amount,
          updatedAt: new Date().toISOString()
        });
      }

      // Mark request as paid
      tx.update(reqRef, {
        status: 'paid',
        transactionRef: transactionRef.trim(),
        adminNotes: adminNotes || '',
        processedAt: new Date().toISOString()
      });

      // Record transaction
      const txRef = doc(db, 'walletTransactions', txId);
      const ledgerEntry: WalletTransaction = {
        id: txId,
        userId: reqData.userId,
        type: 'withdrawal_payout',
        amount: reqData.amount,
        status: 'completed',
        description: `Manual ${reqData.walletType} payout completed (TrxID: ${transactionRef})`,
        referenceId: requestId,
        idempotencyKey,
        createdAt: new Date().toISOString()
      };
      tx.set(txRef, ledgerEntry);

      // Record audit log
      const auditRef = doc(db, 'auditLogs', `log_${Date.now()}`);
      tx.set(auditRef, {
        id: auditRef.id,
        actorId: 'admin',
        actorEmail: adminEmail,
        action: 'PAYOUT_COMPLETED',
        details: `Completed payout of ৳${reqData.amount} via ${reqData.walletType} to ${reqData.walletNumber}. TrxID: ${transactionRef}`,
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    console.error('completeWithdrawalPayout error:', err);
    throw err;
  }
}

/**
 * Admin action: Reject withdrawal request and refund reserved balance to user
 */
export async function rejectWithdrawalPayout(
  requestId: string,
  rejectReason: string,
  adminEmail: string
): Promise<void> {
  if (!rejectReason || rejectReason.trim().length === 0) {
    throw new Error('A reason for rejection must be provided.');
  }

  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const idempotencyKey = generateIdempotencyKey('wdraw_ref', requestId);

  try {
    await runTransaction(db, async (tx) => {
      const reqRef = doc(db, 'withdrawalRequests', requestId);
      const reqSnap = await tx.get(reqRef);

      if (!reqSnap.exists()) {
        throw new Error('Withdrawal request not found.');
      }

      const reqData = reqSnap.data() as WithdrawalRequest;
      if (reqData.status === 'paid') {
        throw new Error('Cannot reject a request that has already been paid.');
      }
      if (reqData.status === 'rejected') {
        throw new Error('This request has already been rejected.');
      }

      const walletRef = doc(db, 'wallets', reqData.userId);
      const walletSnap = await tx.get(walletRef);

      if (walletSnap.exists()) {
        const walletData = walletSnap.data() as UserWallet;
        const currentReserved = walletData.reservedBalance || 0;
        const currentAvailable = walletData.availableBalance || 0;

        // Refund reserved amount back to available balance!
        tx.update(walletRef, {
          reservedBalance: Math.max(0, currentReserved - reqData.amount),
          availableBalance: currentAvailable + reqData.amount,
          updatedAt: new Date().toISOString()
        });
      }

      // Mark request as rejected
      tx.update(reqRef, {
        status: 'rejected',
        adminNotes: rejectReason.trim(),
        processedAt: new Date().toISOString()
      });

      // Record refund ledger entry
      const txRef = doc(db, 'walletTransactions', txId);
      const ledgerEntry: WalletTransaction = {
        id: txId,
        userId: reqData.userId,
        type: 'withdrawal_refund',
        amount: reqData.amount,
        status: 'completed',
        description: `Refund for rejected ${reqData.walletType} withdrawal: ${rejectReason}`,
        referenceId: requestId,
        idempotencyKey,
        createdAt: new Date().toISOString()
      };
      tx.set(txRef, ledgerEntry);

      // Audit log
      const auditRef = doc(db, 'auditLogs', `log_${Date.now()}`);
      tx.set(auditRef, {
        id: auditRef.id,
        actorId: 'admin',
        actorEmail: adminEmail,
        action: 'PAYOUT_REJECTED',
        details: `Rejected payout of ৳${reqData.amount} for request ${requestId}. Reason: ${rejectReason}. Funds refunded.`,
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    console.error('rejectWithdrawalPayout error:', err);
    throw err;
  }
}

/**
 * Admin action: Credit verified commission to a publisher with idempotency
 */
export async function creditCommissionToUser(
  userId: string,
  amount: number,
  monthYear: string,
  notes: string,
  adminEmail: string
): Promise<void> {
  if (amount <= 0) throw new Error('Amount must be positive.');
  
  // Verify commission hasn't already been credited for this monthYear
  const existingCommQuery = query(
    collection(db, 'commissions'),
    where('userId', '==', userId),
    where('monthYear', '==', monthYear),
    where('status', '==', 'approved')
  );
  const existingCommDocs = await getDocs(existingCommQuery);
  if (!existingCommDocs.empty) {
    throw new Error(`Commission for ${monthYear} has already been credited to user ${userId}.`);
  }

  const idempotencyKey = `comm_${monthYear}_${userId}`;
  const commissionId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    await runTransaction(db, async (tx) => {
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await tx.get(walletRef);

      if (!walletSnap.exists()) {
        throw new Error('User wallet not found.');
      }

      const walletData = walletSnap.data() as UserWallet;
      const currentAvailable = walletData.availableBalance || 0;
      const currentLifetime = walletData.lifetimeApproved || 0;
      const currentMonthApproved = walletData.currentMonthApproved || 0;

      // Update wallet atomically
      tx.update(walletRef, {
        availableBalance: currentAvailable + amount,
        lifetimeApproved: currentLifetime + amount,
        currentMonthApproved: currentMonthApproved + amount,
        updatedAt: new Date().toISOString()
      });

      // Record commission doc
      const commRef = doc(db, 'commissions', commissionId);
      tx.set(commRef, {
        id: commissionId,
        userId,
        monthYear,
        amount,
        status: 'approved',
        notes: notes || 'Verified Monthly Publisher Revenue Share',
        idempotencyKey,
        createdAt: new Date().toISOString()
      });

      // Record ledger transaction
      const txRef = doc(db, 'walletTransactions', txId);
      tx.set(txRef, {
        id: txId,
        userId,
        type: 'commission_credit',
        amount,
        status: 'completed',
        description: `Verified Commission Credit for ${monthYear}`,
        referenceId: commissionId,
        idempotencyKey,
        createdAt: new Date().toISOString()
      });

      // Audit log
      const auditRef = doc(db, 'auditLogs', `log_${Date.now()}`);
      tx.set(auditRef, {
        id: auditRef.id,
        actorId: 'admin',
        actorEmail: adminEmail,
        action: 'COMMISSION_CREDITED',
        details: `Credited ৳${amount} to user ${userId} for ${monthYear}`,
        timestamp: new Date().toISOString()
      });
    });
  } catch (err) {
    console.error('creditCommissionToUser error:', err);
    throw err;
  }
}
