import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

const json = (statusCode: number, data: Record<string, unknown>) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': process.env.URL || 'https://earnbd.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  },
  body: JSON.stringify(data)
});

function getAdminServices() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured in Netlify environment variables.');
  const serviceAccount = JSON.parse(raw);
  const app = getApps().find((item) => item.name === 'earnbd-referrals') || initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id
  }, 'earnbd-referrals');
  const databaseId = process.env.FIRESTORE_DATABASE_ID;
  const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  return { adminAuth: getAuth(app), db };
}

async function authenticate(event: any) {
  const header = event.headers?.authorization || event.headers?.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw Object.assign(new Error('Authentication required.'), { statusCode: 401 });
  const { adminAuth } = getAdminServices();
  const decoded = await adminAuth.verifyIdToken(match[1], true);
  return { uid: decoded.uid, email: decoded.email || '', emailVerified: decoded.email_verified === true };
}

async function isAdmin(uid: string, email: string, emailVerified: boolean, db: FirebaseFirestore.Firestore) {
  if (email.toLowerCase() === 'mohistudio95@gmail.com' && emailVerified) return true;
  const adminDoc = await db.doc(`admins/${uid}`).get();
  return adminDoc.exists && adminDoc.data()?.admin === true;
}

export async function handler(event: any) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const identity = await authenticate(event);
    const { adminAuth, db } = getAdminServices();
    const body = JSON.parse(event.body || '{}');
    const action = String(body.action || '');

    if (action === 'claim') {
      const referrerUid = String(body.referrerUid || '');
      if (!/^[A-Za-z0-9_-]{20,128}$/.test(referrerUid)) {
        return json(400, { error: 'Invalid referral code.' });
      }
      if (referrerUid === identity.uid) return json(400, { error: 'Self-referrals are not allowed.' });

      const referredAuthUser = await adminAuth.getUser(identity.uid);
      const createdAtMs = Date.parse(referredAuthUser.metadata.creationTime);
      // Referral attribution is accepted only shortly after the Firebase account is created.
      if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > 24 * 60 * 60 * 1000) {
        return json(409, { error: 'Referral attribution is only available for newly registered accounts.' });
      }

      const referralRef = db.collection('referrals').doc(identity.uid);
      const referrerRef = db.collection('users').doc(referrerUid);
      const referredRef = db.collection('users').doc(identity.uid);
      const referredWalletRef = db.collection('wallets').doc(identity.uid);

      const result = await db.runTransaction(async (tx) => {
        const [existingReferral, referrerSnap, referredSnap, walletSnap] = await Promise.all([
          tx.get(referralRef), tx.get(referrerRef), tx.get(referredRef), tx.get(referredWalletRef)
        ]);
        if (existingReferral.exists) return { alreadyClaimed: true };
        if (!referrerSnap.exists || referrerSnap.data()?.status !== 'active') {
          throw Object.assign(new Error('Referral code is invalid or the referrer is inactive.'), { statusCode: 400 });
        }

        const now = Timestamp.now();
        const eligibleAt = Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
        if (!referredSnap.exists) {
          tx.set(referredRef, {
            uid: identity.uid,
            email: referredAuthUser.email || identity.email,
            displayName: referredAuthUser.displayName || 'Publisher',
            role: 'user',
            status: 'active',
            createdAt: referredAuthUser.metadata.creationTime,
            updatedAt: now.toDate().toISOString()
          });
        }
        if (!walletSnap.exists) {
          tx.set(referredWalletRef, {
            uid: identity.uid, availableBalance: 0, reservedBalance: 0,
            pendingCommission: 0, lifetimeApproved: 0, paidCommission: 0,
            currentMonthApproved: 0, previousMonthApproved: 0,
            updatedAt: now.toDate().toISOString()
          });
        }
        tx.create(referralRef, {
          id: identity.uid,
          referrerUid,
          referredUid: identity.uid,
          amount: 100,
          status: 'pending',
          createdAt: now,
          eligibleAt,
          approvedAt: null,
          approvedBy: null,
          rejectionReason: null
        });
        return { alreadyClaimed: false, eligibleAt: eligibleAt.toDate().toISOString() };
      });

      return json(200, { ok: true, ...result });
    }

    if (!['list', 'approve', 'reject'].includes(action)) {
      return json(400, { error: 'Unsupported referral action.' });
    }
    if (!(await isAdmin(identity.uid, identity.email, identity.emailVerified, db))) {
      return json(403, { error: 'Administrator permission required.' });
    }

    if (action === 'list') {
      const snap = await db.collection('referrals').orderBy('createdAt', 'desc').limit(250).get();
      const referrals = await Promise.all(snap.docs.map(async (docSnap) => {
        const item = docSnap.data();
        const [referrer, referred] = await Promise.all([
          db.collection('users').doc(String(item.referrerUid)).get(),
          db.collection('users').doc(String(item.referredUid)).get()
        ]);
        return {
          id: docSnap.id,
          ...item,
          createdAt: item.createdAt?.toDate?.().toISOString() || item.createdAt || null,
          eligibleAt: item.eligibleAt?.toDate?.().toISOString() || item.eligibleAt || null,
          approvedAt: item.approvedAt?.toDate?.().toISOString() || item.approvedAt || null,
          referrerEmail: referrer.data()?.email || '',
          referredEmail: referred.data()?.email || ''
        };
      }));
      return json(200, { ok: true, referrals });
    }

    const referralId = String(body.referralId || '');
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(referralId)) return json(400, { error: 'Invalid referral ID.' });
    const referralRef = db.collection('referrals').doc(referralId);
    const referralSnap = await referralRef.get();
    if (!referralSnap.exists) return json(404, { error: 'Referral not found.' });
    const referral = referralSnap.data()!;

    if (action === 'reject') {
      if (!['pending', 'eligible'].includes(String(referral.status))) {
        return json(409, { error: 'Only pending or eligible referrals can be rejected.' });
      }
      const reason = String(body.reason || '').trim().slice(0, 500);
      if (!reason) return json(400, { error: 'A rejection reason is required.' });
      await referralRef.update({
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: identity.uid
      });
      await db.collection('auditLogs').add({
        actorId: identity.uid, actorEmail: identity.email,
        action: 'referral_rejected', details: `Referral ${referralId}: ${reason}`,
        timestamp: new Date().toISOString()
      });
      return json(200, { ok: true, status: 'rejected' });
    }

    const nowMs = Date.now();
    const eligibleAtMs = referral.eligibleAt?.toMillis?.() ?? Date.parse(String(referral.eligibleAt));
    if (!Number.isFinite(eligibleAtMs) || nowMs < eligibleAtMs) {
      return json(409, { error: 'The 30-day eligibility period has not completed yet.' });
    }

    const [referrerProfile, referredProfile, referredUserAuth] = await Promise.all([
      db.collection('users').doc(String(referral.referrerUid)).get(),
      db.collection('users').doc(String(referral.referredUid)).get(),
      adminAuth.getUser(String(referral.referredUid))
    ]);
    if (!referrerProfile.exists || referrerProfile.data()?.status !== 'active') {
      return json(409, { error: 'Referrer account is not active.' });
    }
    if (!referredProfile.exists || referredProfile.data()?.status !== 'active' || referredUserAuth.disabled || !referredUserAuth.emailVerified) {
      return json(409, { error: 'Referred account must remain active and have a verified email.' });
    }

    const walletRef = db.collection('wallets').doc(String(referral.referrerUid));
    const txRef = db.collection('walletTransactions').doc(`referral_${referralId}`);
    await db.runTransaction(async (tx) => {
      const [freshReferral, walletSnap, ledgerSnap] = await Promise.all([
        tx.get(referralRef), tx.get(walletRef), tx.get(txRef)
      ]);
      if (!freshReferral.exists) throw new Error('Referral not found.');
      if (freshReferral.data()?.status === 'approved') return;
      if (!['pending', 'eligible'].includes(String(freshReferral.data()?.status))) {
        throw new Error('Referral is no longer eligible for approval.');
      }
      if (ledgerSnap.exists) throw new Error('Duplicate referral credit prevented.');
      if (!walletSnap.exists) throw new Error('Referrer wallet not found.');
      const wallet = walletSnap.data()!;
      const amount = Number(freshReferral.data()?.amount);
      if (!Number.isFinite(amount) || amount !== 100) throw new Error('Unexpected referral bonus amount.');
      tx.update(walletRef, {
        availableBalance: Number(wallet.availableBalance || 0) + amount,
        lifetimeApproved: Number(wallet.lifetimeApproved || 0) + amount,
        currentMonthApproved: Number(wallet.currentMonthApproved || 0) + amount,
        updatedAt: new Date().toISOString()
      });
      tx.update(referralRef, {
        status: 'approved',
        approvedAt: FieldValue.serverTimestamp(),
        approvedBy: identity.uid
      });
      tx.create(txRef, {
        id: txRef.id,
        userId: String(referral.referrerUid),
        type: 'referral_bonus',
        amount,
        status: 'completed',
        description: `Referral bonus for ${String(referral.referredUid)}`,
        referenceId: referralId,
        idempotencyKey: `referral_${referralId}`,
        createdAt: new Date().toISOString()
      });
      tx.create(db.collection('auditLogs').doc(), {
        actorId: identity.uid, actorEmail: identity.email,
        action: 'referral_bonus_approved', details: `Approved BDT ${amount} for referral ${referralId}`,
        timestamp: new Date().toISOString()
      });
    });

    return json(200, { ok: true, status: 'approved', amount: 100 });
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500;
    if (statusCode >= 500) console.error('Referral function error:', error);
    return json(statusCode, { error: statusCode === 500 ? 'Referral service is not configured or an internal error occurred.' : (error.message || 'Request failed.') });
  }
}
