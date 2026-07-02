# Vendor BAA And DPA Matrix

Dentara cannot process real PHI until every PHI-touching vendor has been reviewed, approved, and contracted. This matrix is the required contract and security evidence list.

| Vendor category | Examples | PHI risk | Required before PHI |
| --- | --- | --- | --- |
| Cloud hosting | Vercel, AWS, Azure, GCP, Render, Fly.io | Hosts app/runtime that may process PHI. | BAA if PHI touches vendor systems, security review, region controls, logging review. |
| Database | Supabase, Postgres provider, managed database | Stores patient records, schedules, claims, audit logs. | BAA, encryption, backups, audit logs, tenant isolation, retention/deletion controls. |
| File/object storage | S3, GCS, Supabase Storage, Cloudflare R2 | Stores X-rays, attachments, EOBs, clinical docs. | BAA, encryption, access policies, lifecycle retention, malware scanning. |
| Authentication | Clerk, Auth0, Cognito, Supabase Auth | User identity, potentially PHI-adjacent metadata. | BAA or no-PHI architecture, MFA, session policy, logs review. |
| Clearinghouse | DentalXChange, Stedi, Optum/Change Healthcare, EDS | Claims, eligibility, attachments, ERAs. | BAA, payer enrollment, sandbox credentials, production contract, incident terms. |
| AI provider | OpenAI, Azure OpenAI, AWS Bedrock, Google Vertex, local models | May process clinical notes, X-rays, PHI. | BAA, zero-retention/no-training configuration, prompt logging controls, clinical safety review. |
| Error monitoring | Sentry, Datadog, New Relic, Honeycomb | Logs/errors may accidentally include PHI. | BAA or strict no-PHI configuration, scrubbing, sampling, retention limits. |
| Analytics | PostHog, Segment, GA, Amplitude | Clickstream can become PHI if tied to patient context. | Avoid for PHI screens or obtain BAA-capable setup with strong minimization. |
| Messaging | Twilio, SendGrid, Resend, email/SMS vendors | Patient reminders and communications. | BAA, message templates with minimum necessary data, consent/TCPA review. |
| Support/helpdesk | Zendesk, Intercom, Linear, email support | Support tickets may contain PHI. | BAA or no-PHI support rules, redaction, access logs, support training. |
| Payments | Stripe, merchant processor | Payment data and patient balances. | HIPAA applicability review, PCI posture, no clinical PHI in payment metadata. |
| Device/imaging | Sensors, X-ray/CBCT/DICOM integrations | Diagnostic images and patient identifiers. | BAA, device validation, storage controls, clinical review, FDA/SaMD analysis if applicable. |

## Required Vendor Review Questions

- Will the vendor create, receive, maintain, or transmit PHI for Dentara or a dental practice?
- Does the vendor sign a HIPAA BAA for this exact product and data flow?
- What subprocessors can access data, and how are customers notified of changes?
- Are logs, support tools, telemetry, backups, and analytics included in the BAA scope?
- What retention, deletion, breach notification, encryption, access control, and audit commitments are contractual?
- Can production be configured so PHI never reaches non-BAA services?

## Contract Rule

No PHI may flow to a vendor marked "BAA required" until the signed BAA, security review, data-flow diagram, and production configuration evidence are stored in the compliance evidence folder.
