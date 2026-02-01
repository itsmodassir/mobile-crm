# Mobile CRM 🚀

A high-performance, local-first CRM built with React, Vite, and Capacitor. Designed for mobile-first usage with offline capabilities, Google Sheets synchronization, and monetization support.

## 🌟 Features
- **Local-First**: All data stored deeply on the device.
- **Offline Ready**: Full functionality without internet.
- **Google Sheets Sync**: Two-way synchronization for backup.
- **Native Android App**: Installable APK via Capacitor.
- **Monetization**: AdSense (Web) and AdMob (Android) integration.
- **WhatsApp Integration**: Single-click messaging with templates.

## 🛠️ Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Storage**: IndexedDB (`idb-keyval`)
- **Native Bridge**: CapacitorJS

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Android Studio (for Android build)

### 2. Installation
```bash
git clone <your-repo-url>
cd mobile-crm
npm install
```

### 3. Running Locally (Web)
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📱 Android Build (APK)

To build the native Android application:

1.  **Initialize Android Project** (First time only):
    ```bash
    npx cap add android
    ```

2.  **Sync Web Code to Native**:
    ```bash
    npm run build
    npx cap sync
    ```

3.  **Open Android Studio**:
    ```bash
    npx cap open android
    ```

4.  **Build APK**:
    - In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
    - Locate the `debug.apk` in `android/app/build/outputs/apk/debug/`.

---

## 💰 Monetization Setup

### Option A: Google AdSense (Web)
1.  Get your **Publisher ID** (`ca-pub-xxx`) from Google AdSense.
2.  Open `src/components/AdBanner.tsx`.
3.  Replace `const ADSENSE_PID = 'ca-pub-YOUR_PUBLISHER_ID'` with your ID.

### Option B: AdMob (Android)
1.  Get your **App ID** and **Ad Unit ID** from Google AdMob.
2.  Update `src/components/AdBanner.tsx`:
    ```typescript
    const ADMOB_BANNER_ID = 'ca-app-pub-YOUR_REAL_ID';
    ```
3.  (Optional) Update `android/app/src/main/AndroidManifest.xml` with your App ID if required by strict AdMob policies.

---

## ☁️ Google Cloud Sync Setup (Optional)
To enable Google Sheets Sync:
1.  Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2.  Enable **Google Drive API** and **Google Sheets API**.
3.  Create an **OAuth 2.0 Client ID**.
4.  Open `src/lib/googleSync.ts` and update `GOOGLE_CLIENT_ID`.

---

## 📜 License
Private Software. All rights reserved.
