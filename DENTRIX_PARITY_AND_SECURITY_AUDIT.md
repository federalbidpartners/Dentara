# Dentrix Parity And Security Audit

This audit compares Dentara's current demo to major Dentrix/Dentrix Ascend capability areas. It is intentionally strict: a beautiful frontend demo is not the same thing as a production dental practice management system.

## Current Status

| Area | Dentara demo status | Production gap |
| --- | --- | --- |
| Scheduling | Premium day calendar, provider lanes, readiness and schedule intelligence. | Real appointment CRUD, recurring schedules, provider blocks, reminders, waitlist, room/operatories, calendar sync. |
| Patient records | Fake patient pane, demographics, benefits, timeline, readiness. | Real patient chart, medical history, contacts, responsible party, documents, consents, merge/dedupe, deceased/inactive status. |
| Clinical charting | Surface odontogram, chart entries, perio quick chart, 3D viewer, X-ray demo, AI copilot. | Persistent chart, clinical locking/signatures, audit trail, voice charting, clinical note templates, diagnosis library, real imaging/device integration. |
| Treatment planning | Queue, fees, estimates, pre-auth helper concepts. | Full case plans, phases, alternatives, acceptance tracking, financing, e-signatures, plan history. |
| CDT/coding | Reviewed sample CDT-like codes and validation script. | Licensed/current CDT library, payer-specific policy rules, annual code updates, clinical/billing review workflow. |
| Insurance | BenefitSense demo, ClaimGuard demo, attachment checklist. | 270/271 eligibility, 837D claims, 275 attachments, 276/277 status, 835 ERA, clearinghouse integration, COB, fee schedules. |
| Billing/ledger | RevenueLeak demo and balances. | Ledger, payments, adjustments, refunds, statements, deposits, payment plans, AR aging, month-end close. |
| Imaging | Demo bitewing image, overlays, brightness/contrast controls, 3D visual prototype. | Acquisition agent, device support, DICOM/CBCT, annotations, measurements, image audit logs, storage retention, diagnostic validation. |
| Patient engagement | Task concepts and confirmations. | SMS/email/voice, reminders, recalls, forms, portal, online booking, consent, opt-outs, message templates. |
| Reporting/analytics | Revenue and readiness demo panels. | Custom reports, exports, production/collection dashboards, provider/location rollups, audit reports, reconciliation. |
| Multi-location/enterprise | Demo provider/location labels. | Tenant isolation, multi-site permissions, centralized reporting, location-specific configuration, migration tools. |
| Security/compliance | PHI-safe demo mode, role-gated reveal, local audit simulation, security headers. | Production auth/MFA, server RBAC, immutable audit logs, encryption, BAA vendors, risk analysis, incident response, backup/DR. |
| AI | Deterministic AI-like copilot suggestions. | BAA-approved model path, PHI controls, evals, prompt/version logs, provider review, regulatory classification review. |
| Mobile/App Store | App Store readiness plan documented. | Expo/React Native app, secure mobile auth, offline policy, device testing, TestFlight, EAS production builds. |

## Security Improvements Added

- `vercel.json` security headers for static hosting.
- `public/_headers` for static hosts such as Cloudflare Pages/Netlify-style deployments.
- `scripts/validate-demo.mjs` to prevent old-brand regressions and unreviewed CDT-like codes.
- TypeScript pinned to `5.6.3` so `pnpm build` completes reliably.

## Known Non-Negotiables Before Real Dentist Use

1. Do not use real PHI in the current frontend-only demo.
2. Do not submit real claims from the current demo.
3. Do not use AI suggestions as diagnosis.
4. Do not rely on sample CDT logic as billing advice.
5. Do not market as HIPAA compliant until administrative, technical, physical, vendor, and legal safeguards are in place.

## Visual/UX Health

The current UI has a strong premium direction: dense operational screens, restrained navy/white clinical palette, modern schedule lanes, clinical charting, X-ray viewer, and AI copilot. Remaining visual hardening should focus on:

- More true empty states.
- More error states.
- Loading/skeleton states.
- Keyboard focus states for every clinical action.
- Confirmation modals for destructive clinical/billing actions.
- A cohesive icon audit after the feature set stabilizes.
