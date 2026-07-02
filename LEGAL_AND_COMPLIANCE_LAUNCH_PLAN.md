# Dentara Legal And Compliance Launch Plan

This document is a legal-readiness operating plan for Dentara. It is not legal advice and does not certify compliance. Dentara must not process real PHI, submit real claims, or market itself as production-ready for HIPAA-regulated use until the launch gates below are complete, reviewed by qualified counsel, and supported by production evidence.

## Launch Decision

Current status: **blocked for real PHI and real claims**.

Dentara may be used as a fictional-data product demo. It may not be used for live patient care, live insurance submission, standalone clinical diagnosis, or production dental-office operations until every gate in this file is complete.

## Legal Role

Dentara will usually be a HIPAA **business associate** when it creates, receives, maintains, or transmits PHI for dental practices. Dental practices are typically covered entities. If Dentara subcontracts hosting, storage, support, analytics, AI, clearinghouse, messaging, or monitoring services that touch PHI, those vendors must be treated as subcontractor business associates where applicable.

## Required Launch Gates

| Gate | Required evidence | Owner |
| --- | --- | --- |
| HIPAA risk analysis | Written risk analysis covering all ePHI Dentara creates, receives, maintains, or transmits. | Security + counsel |
| Risk management plan | Prioritized remediation plan with owners, due dates, residual risk acceptance, and executive sign-off. | Security |
| Business associate agreement | Counsel-approved BAA template for dental practices and signed BAAs with all PHI-touching vendors. | Legal |
| Vendor due diligence | Security questionnaires, SOC 2/HITRUST or equivalent reports where available, BAA/DPA review, subprocessors, breach terms. | Legal + security |
| Production authentication | MFA, RBAC, tenant isolation, short sessions, secure recovery, account lockout, least privilege. | Engineering |
| Audit controls | Immutable server-side audit logs for PHI access, edits, exports, support access, AI access, claim actions, admin changes. | Engineering |
| Encryption | TLS, HSTS, encryption at rest, encrypted backups, secrets management, key rotation, field-level encryption for high-risk identifiers. | Engineering |
| PHI-safe logging | No PHI in logs, analytics, traces, error reporting, support tickets, prompt telemetry, screenshots, or demo data. | Engineering + support |
| Incident response | Written incident response plan, breach assessment workflow, contact tree, tabletop exercise, and notification templates. | Security + legal |
| Breach notification | Process for business associate notice to covered entities without unreasonable delay and no later than 60 days after discovery. | Legal + security |
| AI clinical safety | Human-in-the-loop AI, evidence display, confidence/limitations, validation set, prompt/version logging, FDA CDS/SaMD review. | Clinical + legal |
| Dental coding | ADA CDT commercial license or documented customer-license workflow; annual code update process. | Legal + billing |
| Insurance billing | Clearinghouse contracts, payer enrollment, sandbox testing, claim approval workflow, attachment handling, ERA reconciliation controls. | Billing + engineering |
| State/privacy review | Review state dental board, consumer privacy, biometric/imaging, telehealth, data retention, and breach laws for target states. | Counsel |
| Terms/privacy | Counsel-approved BAA, MSA/SaaS terms, privacy policy, security addendum, support access terms, AI terms, DPA where needed. | Legal |

## Minimum Production Controls

Dentara production must enforce:

- Organization and location tenant isolation on every database query.
- Server-side authorization for every route and API, not only UI hiding.
- MFA for all users, with stronger controls for admins and support.
- Time-bound support access with customer approval, reason capture, and audit review.
- Immutable audit logging with tamper-resistant storage and retention.
- Encrypted attachments and imaging files with strict access policies.
- Backup and disaster recovery testing with documented recovery objectives.
- Dependency scanning, secret scanning, vulnerability response, and penetration testing.
- Data retention and deletion workflows aligned with contracts and applicable law.

## AI And Diagnosis Guardrails

Dentara must not claim to diagnose disease. AI features must be framed as documentation and decision support for licensed professionals. Every AI output that affects diagnosis, treatment, billing, claims, patient communication, or imaging interpretation must:

- Show evidence and limitations.
- Require provider review before final action.
- Preserve the provider's final judgment separately from the AI suggestion.
- Be logged with model/prompt version and review outcome.
- Use a BAA-approved AI path before any PHI is processed.
- Undergo FDA CDS/SaMD classification review before release if the feature analyzes patient-specific medical information or imaging in a way users cannot independently review.

## Billing And CDT Requirements

Dentara must not submit real claims until:

- ADA CDT licensing is resolved for commercial use or customers provide an authorized current CDT source.
- Payer and clearinghouse contracts permit the workflow.
- Payer enrollment is complete where required.
- 270/271, 837D, 275, 276/277, 835, 277CA, and ERA workflows are tested in sandbox and pilot.
- Claim submission requires explicit user approval and captures who submitted, when, what changed, and what attachments were included.
- Estimates include caveats and never guarantee payment.

## Contract Package To Prepare With Counsel

- Business Associate Agreement for dental practices.
- SaaS Master Subscription Agreement.
- Security addendum.
- Support access and emergency access policy.
- Privacy policy and website/app data notice.
- Data Processing Addendum for non-HIPAA personal data where required.
- AI feature terms and clinical decision-support limitations.
- Incident response and breach notification templates.
- Subprocessor list and vendor-change notice process.

## Source Anchors

- HHS HIPAA Security Rule summary: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- HHS HIPAA Privacy Rule summary: https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html
- HHS business associate guidance: https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html
- HHS breach notification guidance: https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html
- FDA Clinical Decision Support Software guidance: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software
- ADA CDT commercial licensing: https://www.ada.org/publications/ada-store-products/licensing-for-commercial-users
- FTC Health Breach Notification Rule: https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule
