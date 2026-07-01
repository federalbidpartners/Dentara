import { AuditEvent, Role } from "./types";

export const hipaaReadinessControls = [
  {
    name: "Access control",
    status: "Designed",
    evidence: "Role-aware UI, support access gate, least-privilege route map."
  },
  {
    name: "Audit controls",
    status: "Implemented in demo",
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
    status: "Implemented in demo",
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
  "Use no real PHI until legal, compliance, clearinghouse enrollment, and production infrastructure are complete."
];
