# EventPro Mobile

Mobile app (Expo / React Native) that mirrors the web app: Discover, Profile, Organizer, Admin. Shares types and API client with the web via `@eventpro/shared`.

## How to run and test

### 1. Install and build shared package

From the **repo root** (so the `@eventpro/shared` workspace is linked):

```bash
npm install
cd packages/eventpro-shared && npm run build && cd ../..
```

### 2. Set the API URL

The app talks to your backend. Create **`eventpro-mobile/.env`** with the URL that matches how you run the app:

```bash
# eventpro-mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

- **iOS Simulator:** `http://localhost:8080` is correct (simulator shares your Mac’s network).
- **Android Emulator:** use `http://10.0.2.2:8080` so the emulator can reach your machine.
- **Physical device (Expo Go on your phone):** **do not use localhost.** The phone’s “localhost” is the phone itself. Use your **computer’s LAN IP** instead, e.g. `http://192.168.1.100:8080` (find it in System Settings → Network, or run `ipconfig getifaddr en0`). Phone and Mac must be on the same Wi‑Fi.

After changing `.env`, **restart Expo** (`npx expo start --clear`); the URL is read when the dev server starts.

### 3. Start the backend

From the repo root, start the API (e.g. run the Spring Boot app) so it’s available on the port you used in step 2.

### 4. Start the mobile app

```bash
cd eventpro-mobile
npx expo start
```

Then:

- Press **`i`** to open the **iOS Simulator** (macOS only).
- Press **`a`** to open the **Android Emulator** (if installed).
- Scan the QR code with **Expo Go** on a physical device (same Wi‑Fi as your machine).

### 5. Quick test flow

1. **Not logged in** – You should see the Login screen. Use “Create an account” and “Forgot password?” to reach Sign up / Forgot password.
2. **Log in** – Use the same credentials as the web app. After login you should see bottom tabs: **Events**, **Profile**, and (if organizer/admin) **Organizer**, **Admin**.
3. **Discover** – Open an event and tap “Get tickets” to reach the Checkout placeholder.
4. **Profile** – View profile, Order history, Pricing, then Sign out.
5. **Organizer** (organizer/admin only) – Open an event, then “Check-in” and try checking in a ticket ID (UUID).
6. **Admin** (admin only) – View stats and links to Users / Verification.

## Features (MVP)

- **Auth** – Login, Sign up, Forgot password; token in SecureStore.
- **Discover** – Public events list, event detail, checkout (placeholder).
- **Profile** – Profile, edit, settings, order history, pricing, sign out.
- **Organizer** – Dashboard (your events), event detail, tickets/enhancements placeholders, **Check-in** (ticket ID / QR).
- **Admin** – Overview stats, users, verification (placeholders).

## Reusing code

- **Types & API:** `@eventpro/shared` (see `packages/eventpro-shared`). Add new endpoints in the shared client and use them in web and mobile.
- **Web app:** `eventpro-frontend` can later import types from `@eventpro/shared` and optionally use `createEventProApi` with a web config (localStorage, baseURL from Vite env).
