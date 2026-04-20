import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProfileSetup({ user, onComplete }) {
  const [name, setName] = useState(user.displayName || '');
  const [dob, setDob] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !dob) return;
    setSaving(true);
    const profile = { name: name.trim(), dob, email: user.email, photoURL: user.photoURL || '' };
    await setDoc(doc(db, 'profiles', user.uid), profile);
    onComplete(profile);
  };

  return (
    <div className="profile-setup-page">
      <div className="setup-card">
        <div className="setup-header">
          <div className="login-icon" style={{ fontSize: '2rem' }}>✈</div>
          <h2>Set Up Your Logbook</h2>
          <p>Just two things to get started.</p>
        </div>
        <form onSubmit={handleSave} className="setup-form">
          <div className="field-group">
            <label>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="How should we call you?"
              required
            />
          </div>
          <div className="field-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              required
            />
            <span className="field-hint">Used to show your age on each flight</span>
          </div>
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? 'Setting up...' : 'Start my Logbook →'}
          </button>
        </form>
      </div>
    </div>
  );
}
