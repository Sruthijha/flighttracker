# ✈ Logbook — Personal Flight Tracker

A beautiful, private flight tracker. Track every trip you've taken, see layover times, sort by airline or destination, and see how old you were on each flight.

## Features
- Google login via Firebase Auth
- Trip-based tracking (each trip = one or more flight legs)
- Automatic layover calculation between legs
- Airline autocomplete with IATA codes & brand colors (50+ airlines)
- Airport autocomplete (100+ airports worldwide)
- "Age at flight" calculated from your date of birth
- Sort & filter by airline, destination, date
- Stats: total flights, hours in air, countries, airports
- Flight status tags: Completed / Delayed / Cancelled

---

## Setup (15 minutes)

### Step 1: Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `my-logbook`) → Create
3. In the left sidebar → **Authentication** → Get started → Enable **Google** provider
4. In the left sidebar → **Firestore Database** → Create database → Start in **production mode** → choose a region
5. In Firestore → **Rules** tab → paste this and click Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /trips/{tripId} {
      allow read, write, delete: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }
  }
}
```

6. Go to **Project Settings** (gear icon) → **General** → scroll to **Your apps** → click **Web** (`</>`) → Register app → Copy the config values

### Step 2: GitHub Repo

1. Create a new GitHub repo (e.g. `flighttracker`)
2. Push this code to the `main` branch
3. In your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → add each:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

4. In repo **Settings** → **Pages** → Source: **GitHub Actions**

### Step 3: Fix the base path

In `vite.config.js`, change `/flighttracker/` to match your repo name:

```js
base: '/your-repo-name/',
```

### Step 4: Add your domain to Firebase Auth

1. Firebase console → Authentication → Settings → Authorized domains
2. Add: `your-github-username.github.io`

### Step 5: Deploy

Push to `main` → GitHub Actions will build and deploy automatically.

Your site will be live at: `https://your-username.github.io/your-repo-name/`

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your Firebase values in .env.local

npm install
npm run dev
```

---

## Tech Stack
- React 18 + Vite
- Firebase Auth + Firestore
- date-fns for time calculations
- Deployed via GitHub Pages + GitHub Actions
# force rebuild
