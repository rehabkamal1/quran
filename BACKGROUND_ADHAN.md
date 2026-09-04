# Phase 2 — Background Adhan & Push Notifications Architecture

This document describes the two-layer architecture for Adhan playback and prayer notifications in the Quran Web App.

---

## 🏗️ Architecture Overview

The system is separated into two distinct, independent layers to guarantee maximum reliability while adhering strictly to modern browser security and autoplay policies:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Quran Web App System Architecture               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Layer 1 — Existing Foreground Adhan System                           │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ • AdhanContext.tsx                                             │   │
│   │ • Persistent HTMLAudioElement ('/audio/adhan.mp3')             │   │
│   │ • User Gesture Audio Unlock (audioUnlocked state)              │   │
│   │ • Date-based setTimeout scheduling                             │   │
│   │ • Missed Prayer Recovery (checkMissedOrDuePrayer)              │   │
│   │ • LocalStorage key duplicate prevention ('2026-09-05:Fajr')    │   │
│   │ • Foreground re-sync (visibilitychange, focus, pageshow)       │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   Layer 2 — Background Notification System                             │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ • backgroundNotificationService.ts                             │   │
│   │ • custom-sw (src/sw.ts) handling 'push' & 'notificationclick'  │   │
│   │ • prayerNotificationScheduler.ts                               │   │
│   │ • PWA Web App Manifest ('/manifest.webmanifest')               │   │
│   │ • Independent settings state (no conflict with adhanEnabled)  │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 System Behavior Matrix

| Application State | Layer 1 — Foreground Audio (adhan.mp3) | Layer 2 — Background Notification |
| :--- | :--- | :--- |
| **Tab Open (Active)** | 🟢 Plays full audio automatically | 🟢 Optional interactive banner |
| **Tab in Background** | 🟢 Plays audio if unlocked in session | 🟢 Service Worker Notification arrives |
| **Tab Closed / PWA Background** | 🔴 Browser freezes DOM Audio | 🟢 Web Push Notification arrives via SW |
| **Device Lock Screen** | 🔴 Audio depends on OS background policy | 🟢 Lock screen notification displayed |

---

## 🔑 Environment Variables

To configure Web Push notifications with a push provider or server:

```env
# Public VAPID Key for Web Push subscription (Safe for frontend)
VITE_PUBLIC_VAPID_KEY=your_public_vapid_key_here
```

> ⚠️ **SECURITY NOTICE:** NEVER place VAPID private keys or Push Provider API secrets in `VITE_` frontend variables or source code. Secrets MUST remain server-side.

---

## 🚀 Push Provider Options (No Backend Required)

Since this project is frontend-first, background push notifications can be connected to external push services without building a custom Node/Laravel server:

1. **OneSignal (Recommended Free Tier):**
   - Add OneSignal Web Push SDK snippet in `index.html`.
   - Set up scheduled notification triggers based on prayer timing API payloads.
2. **Firebase Cloud Messaging (FCM):**
   - Import Firebase Messaging SDK into `src/sw.ts`.
   - Register FCM Web Push token on user activation.

---

## ⚠️ Browser & OS Limitations

1. **iOS Safari:**
   - Web Push requires the app to be added to Home Screen (PWA mode) on iOS 16.4+.
   - Unmuted audio playback (`audio.play()`) cannot be initiated without an active tab session unlocked by a user gesture (`event.isTrusted === true`).
2. **Android Background Throttling:**
   - Chrome on Android may throttle DOM `setTimeout` when battery saver is active.
   - Upon opening/returning to the tab, `checkMissedOrDuePrayer` immediately catches up and plays any missed prayer from the last 30 minutes.

---

## 🧪 Testing Checklist

- [x] `npm run build` succeeds without TS or bundler errors.
- [x] Foreground Adhan audio playback remains 100% operational.
- [x] Gesture audio unlock banner functions on page reload.
- [x] Service Worker (`sw.ts`) registers and handles `push` & `notificationclick` events.
- [x] Notification clicks navigate to `/prayer` route.
