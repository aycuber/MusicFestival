import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const logInteraction = async (festivalId, newScore) => {
  const user = auth.currentUser;
  if (!user) {
    console.warn('No user logged in – cannot log interaction.');
    return;
  }

  const docId = `${user.uid}_${festivalId}`;
  const ref = doc(db, 'eventInteractions', docId);

  try {
    const existing = await getDoc(ref);
    const oldScore = existing.exists() ? existing.data().score : 0;

    if (newScore > oldScore) {
      await setDoc(ref, {
        userId: user.uid,
        festivalId,
        score: newScore,
        timestamp: new Date().toISOString(),
      });
      console.log(`Logged interaction for ${festivalId} with score ${newScore}`);
    } else {
      console.log('Interaction exists with equal or higher score — not updated.');
    }
  } catch (err) {
    console.error('Failed to log interaction:', err);
  }
};
