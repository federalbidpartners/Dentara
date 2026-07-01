# Dental Code And Product Readiness

Dentara currently uses sample CDT decision-support logic for a market demo. It is not a production coding authority, diagnosis engine, clearinghouse, PMS replacement, or legal/compliance certification.

## CDT Sample Codes In The Demo

| Code | Demo use | Review status |
| --- | --- | --- |
| D0140 | Limited oral evaluation | Sample label aligned; verify against current CDT manual before billing. |
| D1110 | Adult prophylaxis | Sample label aligned; verify payer and frequency rules. |
| D2391 | Resin-based composite, one posterior surface | Used by surface builder; verify final surface count. |
| D2392 | Resin-based composite, two posterior surfaces | Used by surface builder and seeded case; verify final surface count. |
| D2393 | Resin-based composite, three posterior surfaces | Used by surface builder; verify final surface count. |
| D2394 | Resin-based composite, four or more posterior surfaces | Used by surface builder; verify final surface count. |
| D2740 | Crown - porcelain/ceramic | Sample crown option; verify material and payer policy. |
| D2750 | Crown - porcelain fused to high noble metal | Seeded crown case; verify material and replacement history. |
| D3330 | Endodontic therapy, molar tooth | Seeded endodontic consult; provider diagnosis required. |
| D4910 | Periodontal maintenance | Seeded perio case; verify perio history/frequency. |
| D6240 | Pontic - porcelain fused to high noble metal | Seeded bridge case; verify tooth/area and attachments. |
| D7140 | Extraction, erupted tooth or exposed root | Seeded extraction case; verify clinical documentation. |

`WATCH` is an internal charting status only. It must never be submitted as a CDT code.

## Must-Have Before Dentist Production Use

- Current licensed ADA CDT source integrated or manually verified by billing team.
- PMS integration or import/export workflow for patients, appointments, procedures, providers, and ledgers.
- Clearinghouse integration for eligibility, claims, attachments, claim status, and ERAs.
- Provider-approved diagnosis, imaging, perio, and treatment-plan workflows.
- Server-side authentication, MFA, RBAC, audit logs, encryption, backups, and tenant isolation.
- BAA-approved hosting, storage, AI, analytics, support, and messaging vendors.
- Legal/compliance review for HIPAA, state privacy rules, medical/dental board obligations, and payer rules.
- Clinical safety review and validation for any AI or radiograph-related feature.

## Current Decision

This app is appropriate as a polished demo and product prototype with fake data. It is not ready for real PHI, real claims, real diagnosis, or live patient care until the production items above are implemented and validated.
