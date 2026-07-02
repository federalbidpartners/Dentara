# AI Clinical Safety And FDA Review

Dentara's AI features must be built as provider-reviewed clinical decision support, not standalone clinical diagnosis.

## Current Product Boundary

Current demo AI is deterministic and uses fictional data. It can:

- Suggest documentation prompts.
- Draft provider-review notes.
- Flag missing attachments or stale X-rays.
- Explain insurance and claim-readiness risks.
- Help organize clinical and billing evidence.

It must not:

- Diagnose caries, periodontal disease, endodontic disease, oral cancer, or any other condition.
- Interpret radiographs as final findings.
- Make autonomous treatment decisions.
- Submit claims or choose final CDT codes without user approval.
- Represent 3D renderings as validated clinical imaging.

## FDA/CDS Review Gate

Before release, each AI or imaging function must be classified with counsel and regulatory experts:

| Function | Current risk posture | Required review |
| --- | --- | --- |
| Note drafting from provider-entered text | Lower risk if provider can independently review all source information. | CDS review, prompt evaluation, human approval. |
| CDT/code suggestions | Billing decision support, not clinical diagnosis. | ADA CDT licensing, payer policy review, billing compliance. |
| X-ray overlays and image findings | Higher risk if image analysis influences diagnosis. | FDA CDS/SaMD review, clinical validation, dataset governance. |
| 3D/CBCT/model overlays | Higher risk if used diagnostically. | Device/software function review, validation, quality system analysis. |
| Patient-facing diagnosis/treatment recommendations | High risk. | Do not launch without regulatory and clinical review. |

## Required AI Controls

- BAA-approved AI provider or local model architecture before PHI.
- No training on customer PHI unless explicitly contracted and legally reviewed.
- No PHI in model telemetry, logs, analytics, traces, or support tooling.
- Prompt/version logging and output retention policy.
- Evidence display for every suggestion.
- Provider accept/edit/reject workflow.
- Bias, accuracy, hallucination, and unsafe-output evaluation set.
- Red-team tests for prompt injection, PHI leakage, unsafe medical advice, and billing fraud.
- Separate "AI suggested" from "provider finalized" in the audit log.

## Required UI Language

Use:

- "Provider review required."
- "Decision support only."
- "Dentara does not diagnose."
- "Verify CDT code and payer policy before submission."

Avoid:

- "AI-generated diagnosis."
- "Automatically detects cavities."
- "Guaranteed payer approval."
- "Certified for HIPAA-regulated production use" unless counsel approves the exact claim and supporting evidence.

## Release Rule

No AI feature may be released to production if a reasonable user could treat it as standalone diagnosis, autonomous billing, or an FDA-regulated imaging interpretation tool without the corresponding regulatory review, validation, labeling, auditability, and contract controls.
