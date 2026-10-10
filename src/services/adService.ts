import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AdCard } from '../types';
import { isValidExternalUrl } from '../utils/security';

export async function fetchAllAdCards(): Promise<AdCard[]> {
  try {
    const cardsCol = collection(db, 'adCards');
    const q = query(cardsCol, orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => d.data() as AdCard);
  } catch (err) {
    console.error('Error fetching ad cards from Firestore:', err);
    return [];
  }
}

export async function saveAdCard(cardData: Partial<AdCard>): Promise<string> {
  const cardId = cardData.id || `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  if (cardData.destinationUrl && !isValidExternalUrl(cardData.destinationUrl)) {
    throw new Error('Invalid destination URL. Only secure http:// and https:// URLs are permitted.');
  }

  const payload: AdCard = {
    id: cardId,
    title: cardData.title || 'Untitled Card',
    titleBn: cardData.titleBn || '',
    description: cardData.description || '',
    descriptionBn: cardData.descriptionBn || '',
    category: cardData.category || 'Technology',
    imageUrl: cardData.imageUrl || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    destinationUrl: cardData.destinationUrl || '',
    isSponsored: Boolean(cardData.isSponsored),
    isActive: cardData.isActive !== false,
    displayOrder: typeof cardData.displayOrder === 'number' ? cardData.displayOrder : 99,
    openInNewTab: cardData.openInNewTab !== false,
    createdAt: cardData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const cardRef = doc(db, 'adCards', cardId);
  await setDoc(cardRef, payload, { merge: true });
  return cardId;
}

export async function deleteAdCard(cardId: string): Promise<void> {
  await deleteDoc(doc(db, 'adCards', cardId));
}
