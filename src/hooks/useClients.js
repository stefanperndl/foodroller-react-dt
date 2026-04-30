import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useClients(user, isDietitian) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!user || !isDietitian) { setClients([]); return; }
    getDocs(collection(db, 'users', user.uid, 'clients'))
      .then((snap) => setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, [user, isDietitian]);

  const addClient = useCallback(async (data) => {
    if (!user) return;
    const ref = await addDoc(
      collection(db, 'users', user.uid, 'clients'),
      { ...data, createdAt: serverTimestamp() }
    );
    setClients((prev) => [...prev, { id: ref.id, ...data }]);
  }, [user]);

  const updateClient = useCallback(async (id, data) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'clients', id), data, { merge: true });
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, [user]);

  const deleteClient = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'clients', id));
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, [user]);

  return [clients, addClient, updateClient, deleteClient];
}
