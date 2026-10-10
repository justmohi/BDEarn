import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Records a click made by the signed-in user.
 * This is a UI click count, not a verified Adsterra impression or payable event.
 */
export async function recordAdImageClick(userId: string, adId: string): Promise<void> {
  if (!userId || !adId) return;
  const statsRef = doc(db, 'adClickStats', userId);
  await setDoc(statsRef, {
    uid: userId,
    totalClicks: increment(1),
    lastClickedAdId: adId,
    lastClickedAt: serverTimestamp(),
  }, { merge: true });
}
