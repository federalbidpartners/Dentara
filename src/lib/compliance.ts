import { AuditEvent, Role } from "./types";

export const hipaaReadinessControls = [
  {
    name: "Access control",
    status: "Designed - not production certified",
    evidence: "Role-aware UI, support access gate, least-privilege route map."
  },
  {
    name: "Audit controls",
    status: "Demo only",
    evidence: "Every PHI-viewing action appends a local audit event with actor, target, reason, and timestamp."
  },
  {
    name: "Person authentication",
    status: "Production dependency",
    evidence: "Requires production MFA auth provider before real PHI."
  },
  {
    name: "Transmission security",
    status: "Production dependency",
    evidence: "Requires TLS, HSTS, secure cookies, and encrypted vendor channels in deployment."
  },
  {
    name: "PHI minimization",
    status: "Demo only",
    evidence: "Demo uses fictional records and masked member IDs by default."
  },
  {
    name: "AI data handling",
    status: "Guarded",
    evidence: "No PHI is sent to external AI in this demo. Production model calls require BAA-approved providers and human review."
  },
  {
    name: "Business associate agreements",
    status: "Required before launch",
    evidence: "Hosting, storage, auth, clearinghouse, messaging, analytics, and AI vendors need BAA review where applicable."
  }
];

export const legalLaunchBlockers = [
  {
    area: "HIPAA risk analysis",
    blocker: "No written production risk analysis and remediation sign-off.",
    requiredEvidence: "Risk register, threat model, control mapping, remediation owners, residual-risk acceptance."
  },
  {
    area: "BAA contracts",
    blocker: "No signed BAAs with customer practices and PHI-touching vendors.",
    requiredEvidence: "Counsel-approved BAA template, vendor BAAs, subprocessor list, contract repository."
  },
  {
    area: "Production controls",
    blocker: "Frontend demo controls are not a substitute for server-side HIPAA safeguards.",
    requiredEvidence: "MFA, RBAC, tenant isolation, immutable audit logs, encryption, backups, DR evidence."
  },
  {
    area: "AI clinical safety",
    blocker: "AI must not be marketed or used as standalone clinical diagnosis.",
    requiredEvidence: "CDS/SaMD review, provider-review workflow, evaluation set, model/prompt audit logs."
  },
  {
    area: "Insurance billing",
    blocker: "Real claims require clearinghouse contracts, payer enrollment, and submission controls.",
    requiredEvidence: "Sandbox tests, payer enrollment, 837D/275/276/277/835 workflow evidence, claim approval logs."
  },
  {
    area: "CDT licensing",
    blocker: "Commercial CDT use requires ADA licensing or an approved customer-license workflow.",
    requiredEvidence: "ADA license, current-year update process, billing review, payer policy review."
  },
  {
    area: "Breach response",
    blocker: "No production breach assessment and notification process is in force.",
    requiredEvidence: "Incident response plan, tabletop exercise, notification templates, 60-day outer-limit workflow."
  }
];

export const legalSourceAnchors = [
  {
    label: "HHS HIPAA Security Rule",
    url: "https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html"
  },
  {
    label: "HHS Business Associate Agreement guidance",
    url: "https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html"
  },
  {
    label: "HHS Breach Notification Rule",
    url: "https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html"
  },
  {
    label: "FDA Clinical Decision Support guidance",
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software"
  },
  {
    label: "ADA CDT commercial licensing",
    url: "https://www.ada.org/publications/ada-store-products/licensing-for-commercial-users"
  }
];

export function maskMemberId(memberId: string, reveal: boolean): string {
  if (reveal) return memberId || "Missing";
  if (!memberId) return "Missing";
  return `${memberId.slice(0, 3)}••••${memberId.slice(-2)}`;
}

export function canRevealPhi(role: Role): boolean {
  return role === "Billing Lead" || role === "Compliance Officer";
}

export function createAuditEvent(params: {
  actor: string;
  action: string;
  target: string;
  reason: string;
  phiAccess?: boolean;
}): AuditEvent {
  return {
    id: `audit-${Date.now()}`,
    timestamp: new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    actor: params.actor,
    action: params.action,
    target: params.target,
    reason: params.reason,
    phiAccess: params.phiAccess ?? false
  };
}

export const launchReadiness = [
  "Complete HIPAA risk analysis and remediation plan.",
  "Sign BAAs with hosting, storage, auth, clearinghouse, support, messaging, analytics, and AI vendors where applicable.",
  "Deploy production MFA, RBAC, short session timeouts, encrypted backups, and incident response procedures.",
  "Run penetration testing, dependency scanning, secret scanning, and disaster recovery exercises.",
  "Document support access workflow with time-bound access, required reason, and immutable audit logs.",
  "Create dental-office BAA template, privacy/security policies, and breach notification process.",
  "Resolve ADA CDT licensing and clearinghouse/payer enrollment before real claims.",
  "Complete FDA/CDS review before marketing AI as anything beyond provider-reviewed decision support.",
  "Use no real PHI until legal, compliance, clearinghouse enrollment, and production infrastructure are complete."
];
