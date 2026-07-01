# Security And Compliance Checklist

Use this checklist before allowing any real practice, patient, insurance, claim, attachment, or payment data into Dentara.

## Administrative Safeguards

- Complete a HIPAA Security Rule risk analysis.
- Maintain risk management, incident response, disaster recovery, backup, access control, vendor management, workforce security, and breach notification policies.
- Sign BAAs with all vendors that create, receive, maintain, or transmit PHI on behalf of Dentara or dental practices.
- Train workforce members and define sanctions for policy violations.
- Document support access approvals, reasons, time limits, and review cadence.

## Technical Safeguards

- Enforce MFA for every production user.
- Enforce server-side RBAC by organization, location, role, and support-access reason.
- Encrypt traffic with TLS and set HSTS in production.
- Encrypt database, backups, files, and sensitive fields such as DOB, member IDs, phone, email, address, tax IDs, and attachment metadata.
- Create immutable audit logs for PHI access, edits, exports, deletes, claim actions, AI access, support access, admin changes, and integration events.
- Prevent PHI from entering app logs, analytics, error traces, prompt traces, model telemetry, or support tools.
- Use secret management, key rotation, dependency scanning, container/image scanning, and vulnerability response.
- Test backup restore and disaster recovery.

## AI Controls

- Do not send PHI to non-BAA model providers.
- Prefer deterministic rules for first-line dental billing workflows.
- Log prompt version, model version, input classification, output, confidence, reviewer, and final action where AI is used.
- Require human review for estimates, claims, denials, patient messages, and any output affecting payment or patient communication.
- Require provider review for X-ray findings, odontogram entries, 3D/model visualizations, clinical AI suggestions, clinical narratives, CDT/code suggestions, and treatment-plan recommendations.
- Maintain evaluation sets for BenefitSense, ClaimGuard, EstimateIQ, and RevenueLeak.

## Product Safety Rules

- Never guarantee insurance payment.
- Every estimate must show caveats and confidence.
- Never present CDT/code advisor output as coding advice or a final billing determination.
- Never present image findings as diagnosis. Findings must be provider-reviewed and documented.
- Never present AI Clinical Copilot output as a final diagnosis or autonomous treatment decision. It must show evidence, confidence, and provider-review controls.
- Never present 3D tooth/model overlays as diagnostic ground truth. They are visualization aids until validated clinical imaging pipelines are implemented.
- Claim submission must require explicit user approval until compliance and payer workflows are fully validated.
- No autonomous diagnosis.
- No real PHI in demos, screenshots, training data, support examples, or sales collateral without explicit written approval and appropriate safeguards.

## Source Anchors

- HHS HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- HHS Business Associates: https://www.hhs.gov/hipaa/for-professionals/covered-entities/business-associates/index.html
- NIST SP 800-66r2: https://csrc.nist.gov/pubs/sp/800/66/r2/final
