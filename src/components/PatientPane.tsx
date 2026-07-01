import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Info, ShieldCheck } from "lucide-react";
import { getBenefitSense, getClaimGuard, getEstimateIQ, getVisitReadiness } from "../lib/engines";
import { maskMemberId } from "../lib/compliance";
import { AuditEvent, Patient } from "../lib/types";
import { ConfidenceChip, ReadinessChip, RiskChip } from "./StatusChip";

interface PatientPaneProps {
  patient: Patient;
  revealPhi: boolean;
  audits: AuditEvent[];
  onRunCheck: () => void;
  onCreateTask: (title: string) => void;
}

export function PatientPane({ patient, revealPhi, audits, onRunCheck, onCreateTask }: PatientPaneProps) {
  const readiness = getVisitReadiness(patient);
  const benefit = getBenefitSense(patient);
  const claim = getClaimGuard(patient);
  const estimate = getEstimateIQ(patient);

  return (
    <aside className="patient-pane">
      <div className="patient-header">
        <div>
          <div className="patient-name-line">
            <h2>{patient.name}</h2>
            <ReadinessChip band={readiness.band} />
          </div>
          <p>{patient.age} · {revealPhi ? patient.dob : "DOB masked"} · {revealPhi ? patient.phone : "phone masked"}</p>
          <p>{patient.plan} · ID: {maskMemberId(patient.memberId, revealPhi)}</p>
        </div>
        <button className="primary-small">
          Open Patient
          <ExternalLink size={14} />
        </button>
      </div>

      <section className="side-card">
        <div className="section-heading">
          <h3>Patient Timeline</h3>
          <button>View all</button>
        </div>
        <div className="timeline">
          {["Scheduled", "Confirmed", "Verified", "Treating", "Billed", "Paid"].map((step, index) => (
            <div className={`timeline-step ${index <= 2 ? "done" : ""}`} key={step}>
              <span>{index < 2 ? <CheckCircle2 size={15} /> : index === 2 ? <ShieldCheck size={15} /> : <FileText size={15} />}</span>
              <small>{step}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="side-card">
        <div className="section-heading">
          <div>
            <h3>BenefitSense</h3>
            <p>Eligibility summary</p>
          </div>
          <ConfidenceChip confidence={benefit.confidence} />
        </div>
        <div className="benefit-grid">
          <Metric label="Annual Max" value={currency(patient.annualMax)} />
          <Metric label="Used / Remaining" value={`${currency(patient.annualMax - patient.annualMaxRemaining)} / ${currency(patient.annualMaxRemaining)}`} accent />
          <Metric label="Deductible Met" value={currency(patient.deductibleMet)} />
          <Metric label="Coverage" value={benefit.coverageText} />
          <Metric label="Frequency" value={patient.frequency} />
          <Metric label="Waiting Periods" value={patient.waitingPeriods} />
        </div>
        {benefit.caveats.length > 0 && <p className="caveat">{benefit.caveats[0]}</p>}
      </section>

      <section className="side-card">
        <div className="section-heading">
          <div>
            <h3>ClaimGuard</h3>
            <p>Pre-claim findings</p>
          </div>
          <RiskChip risk={claim.risk} />
        </div>
        <div className="finding-list">
          {claim.findings.length === 0 ? (
            <div className="empty-state"><CheckCircle2 size={17} /> No blocking issues found.</div>
          ) : (
            claim.findings.slice(0, 3).map((finding) => (
              <div className={`finding ${finding.severity}`} key={finding.title}>
                {finding.severity === "blocker" || finding.severity === "warning" ? <AlertTriangle size={18} /> : <Info size={18} />}
                <div>
                  <strong>{finding.title}</strong>
                  <span>{finding.detail}</span>
                </div>
                <button onClick={() => onCreateTask(finding.fix)}>{finding.severity === "blocker" ? "Fix" : "Review"}</button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="side-card">
        <div className="section-heading">
          <div>
            <h3>EstimateIQ</h3>
            <p>Patient responsibility</p>
          </div>
          <ConfidenceChip confidence={estimate.confidence} />
        </div>
        <div className="estimate-grid">
          <Metric label="Total Fee" value={currency(estimate.totalFee)} />
          <Metric label="Insurance Est." value={currency(estimate.insuranceEstimate)} accent />
          <Metric label="Patient Est." value={currency(estimate.patientEstimate)} />
          <Metric label="Deductible Applied" value={currency(estimate.deductibleApplied)} />
          <Metric label="Coinsurance" value={currency(estimate.coinsurance)} />
          <Metric label="Balance Due" value={currency(patient.balanceDue)} />
        </div>
      </section>

      <section className="side-card">
        <div className="section-heading">
          <div>
            <h3>Compliance Guard</h3>
            <p>Audit and notes</p>
          </div>
          <span className="chip confidence high">No Issues</span>
        </div>
        <div className="audit-mini">
          {audits.slice(0, 3).map((audit) => (
            <div key={audit.id}>
              <ShieldCheck size={14} />
              <span>{audit.action}</span>
              <small>{audit.actor} · {audit.reason}</small>
            </div>
          ))}
        </div>
        <button className="text-button" onClick={onRunCheck}>Run compliance check</button>
      </section>
    </aside>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="mini-metric">
      <span>{label}</span>
      <strong className={accent ? "accent" : ""}>{value}</strong>
    </div>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
