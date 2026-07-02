# Dentara AI Dental OS

Dentara is a HIPAA-ready dental operations MVP for insurance readiness, claim-risk prevention, treatment estimates, tasking, revenue leakage, and compliance evidence.

This repository is a production-oriented market demo, not a legal certification. HIPAA compliance requires the software controls here plus signed BAAs, policies, risk analysis, secure hosting, workforce procedures, vendor review, and counsel/compliance validation before any real PHI is used.

## What Is Built

- Today Command Center with appointment readiness, benefit confidence, claim risk, balances, and next-best actions.
- Premium Day Calendar with provider lanes, readiness-coded appointment cards, scheduled production, same-day opportunity, confirmation risk, and AI schedule intelligence.
- BenefitSense engine for explainable benefit confidence, missing fields, caveats, deductible and annual maximum state.
- ClaimGuard engine for blocking errors, warnings, attachment/narrative checks, and claim-risk scoring.
- EstimateIQ engine for patient responsibility estimates with confidence and caveats.
- Clinical + Imaging Workspace with surface-level odontogram, perio quick chart, fake demo X-ray viewer, AI finding overlays, attachment checklist, narrative generator, and treatment queue.
- AI Clinical Copilot for provider-reviewed X-ray, clinical note, perio, benefits, and documentation suggestions. Demo mode uses deterministic rules only and does not call external AI services.
- Chairside charting workflow where dentists can select a tooth, click exact surfaces, add planned/existing/completed/watch status, write clinical notes, and add fillings or other procedures into the treatment queue.
- 3D tooth and restoration viewer powered by Three.js, designed as the first step toward CBCT/model overlays, restoration visualization, and more advanced clinical rendering.
- CDT Code Advisor for sample procedure-code suggestions, documentation requirements, payer caveats, and manual verification warnings.
- Dentist wish-list action bar: one-click crown narrative, pre-auth packet builder, missing attachment detector, before/after compare, chairside patient estimate, hygiene recall gap, clinical handoff note, and finalize-surfaces-and-codes workflow.
- RevenueLeak engine for risky unsubmitted claims, unposted ERAs, old balances, and unscheduled treatment.
- Insurance API Hub that separates real-world dental billing into eligibility (`270/271`), dental claim submission (`837D`), attachments/pre-auth (`275`), claim status (`276/277`), and ERA/payment posting (`835`) workflows.
- NextAction task generation and task completion workflow.
- Role-aware PHI reveal guard and local audit-event simulation.
- HIPAA Readiness Center with required launch controls.
- Fully fake seeded demo data. Do not use real patient data in this demo.

## Run Locally

```bash
pnpm install
pnpm dev
```

The app is configured for Vite on `http://127.0.0.1:5178`.

## HIPAA-Readiness Posture

Implemented in this market demo:

- PHI-safe demo mode with masked member/identifier fields.
- Role-gated PHI reveal behavior.
- Audit event creation for patient timeline views, PHI reveal attempts, and compliance checks.
- No external AI calls and no PHI sent to model providers.
- Explainable algorithms instead of black-box autonomous decisions.
- Human-in-the-loop claim and estimate workflow.
- Provider-review posture for X-ray findings, odontogram entries, clinical narratives, CDT/code suggestions, and treatment-plan recommendations.
- Compliance center for access control, audit controls, AI data handling, PHI minimization, and BAA dependencies.

Required before using real PHI:

- HIPAA risk analysis and risk management plan.
- BAAs with hosting, database/storage, auth, support, clearinghouse, messaging, analytics, AI, and infrastructure vendors where applicable.
- Production authentication with MFA, short session timeouts, secure cookies, RBAC enforcement, support access approvals, and account recovery controls.
- Encryption at rest and in transit, field-level encryption for sensitive identifiers, encrypted backups, and tested disaster recovery.
- Immutable server-side audit logs for PHI reads, exports, edits, claim actions, support access, AI access, and admin changes.
- PHI-safe observability: no PHI in logs, traces, metrics, analytics, prompt traces, or error reports.
- Secure SDLC: code review, dependency scanning, secret scanning, penetration testing, vulnerability response, and incident response procedures.
- Dental billing, payer, clearinghouse, CDT, and legal review before production claim workflows.

## Production Backend Roadmap

The UI currently runs with local fake data and deterministic engines. A production build should add:

- Multi-tenant database with `organization_id` and `location_id` isolation.
- Server-side RBAC and audit middleware.
- Open Dental read-only connector behind a PMS connector interface.
- Clearinghouse client interface for 270/271, 837D, 277CA, 276/277, 835, and 275 workflows.
- Recommended insurance API paths to evaluate first:
  - DentalXChange XConnect for dental-specific eligibility, claims, attachments, payment, and reconciliation APIs.
  - Stedi Dental Claims API for modern API-first 837D dental claim generation/submission.
  - Optum/Change Healthcare network APIs for eligibility, claim status, responses, and payer connectivity where dental workflows are supported.
- Encrypted file storage for attachments and EOBs.
- Background jobs for eligibility checks, PMS syncs, claim status polling, and revenue leakage scans.
- BAA-approved AI provider abstraction with no-PHI defaults, policy gates, eval fixtures, prompt/version logging, and human review.

## Production Readiness Reviews

- `DENTAL_CODE_AND_PRODUCT_READINESS.md` documents the sample CDT code posture and what is required before real dentist production use.
- `EXPO_APP_STORE_READINESS.md` documents the Expo Go, React Native, and Apple App Store path.
- `DENTRIX_PARITY_AND_SECURITY_AUDIT.md` documents Dentrix-style parity, current security posture, and production gaps.

## Current Design Reference

The implementation follows the generated UI concept at:

`public/dentara-ui-concept.png`

The upgraded clinical workspace follows the generated concept at:

`public/clinical-workspace-concept.png`

The advanced charting and 3D workflow follows the generated concept at:

`public/advanced-charting-concept.png`

The AI copilot and premium calendar workflow follows the generated concept at:

`public/ai-calendar-concept.png`

## Important Disclaimer

This project is product and engineering work. It is not legal advice, billing advice, clinical advice, coding advice, CDT coding advice, radiology interpretation, or a guarantee of HIPAA compliance.
