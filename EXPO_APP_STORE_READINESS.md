# Expo And App Store Readiness

Dentara is currently a Vite React web application. Expo Go runs React Native/Expo applications, so this codebase cannot be opened directly in Expo Go without a mobile port or an Expo shell.

## Recommended Mobile Architecture

Use a monorepo structure when moving to mobile:

```text
dentara-os/
  apps/
    web/       # current Vite app
    mobile/    # Expo React Native app
  packages/
    core/      # shared engines, types, validation, CDT helpers
    design/    # shared tokens and product language
```

Move these files into `packages/core` first:

- `src/lib/types.ts`
- `src/lib/engines.ts`
- `src/lib/compliance.ts`
- selected demo fixtures from `src/data/mockData.ts`

Then rebuild the UI in Expo using React Native primitives. Do not try to directly reuse DOM elements such as `div`, `table`, CSS grid, browser-only CSS, or raw HTML inputs inside React Native.

## Expo Go vs App Store Path

- Expo Go is useful for early React Native screens that only use Expo SDK-compatible modules.
- A real App Store build should use EAS Build and likely a development build once native capabilities are needed.
- Imaging, secure storage, push notifications, biometrics, document scanning, file uploads, camera workflows, and app-specific native config should be tested in an Expo development build, not only Expo Go.

## App Store Requirements To Plan For

- Apple Developer account.
- Stable iOS bundle identifier, for example `com.dentara.app`.
- Real privacy policy and support URL.
- App Store screenshots, description, age rating, and data-safety disclosures.
- HIPAA-ready backend before real patient data.
- TestFlight QA with dentists before production release.
- EAS production build and EAS Submit or manual App Store Connect upload.

## Current Decision

The current app is not yet an Expo app. The safest next step is to create `apps/mobile` as a real Expo app, share the engines/types, and rebuild the highest-value mobile flows natively: login, schedule, patient overview, clinical copilot, chart review, and task queue.
