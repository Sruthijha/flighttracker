import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginPage from './components/LoginPage';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'profiles', firebaseUser.uid));
        if (snap.exists()) setProfile(snap.data());
        else setProfile(null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-plane">✈</div>
      <p>Boarding...</p>
    </div>
  );

  if (!user) return <LoginPage />;
  if (!profile) return <ProfileSetup user={user} onComplete={setProfile} />;
  return <Dashboard user={user} profile={profile} onProfileUpdate={setProfile} />;
}
