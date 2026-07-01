import {
  CalendarDays,
  ChevronDown,
  Clock3,
  MessageCircle,
  MoveRight,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TimerReset,
  Wand2
} from "lucide-react";
import { getBenefitSense, getClaimGuard, getNextAction, getScheduleInsights, getVisitReadiness } from "../lib/engines";
import { maskMemberId } from "../lib/compliance";
import { Patient } from "../lib/types";
import { ConfidenceChip, ReadinessChip, RiskChip } from "./StatusChip";

interface ScheduleTableProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  revealPhi: boolean;
  providerFilter: string;
  onProviderFilterChange: (value: string) => void;
  readinessFilter: string;
  onReadinessFilterChange: (value: string) => void;
}

const dayHours = ["8 AM", "9 AM", "10 AM", "11 AM"];

export function ScheduleTable({
  patients,
  selectedPatientId,
  onSelectPatient,
  revealPhi,
  providerFilter,
  onProviderFilterChange,
  readinessFilter,
  onReadinessFilterChange
}: ScheduleTableProps) {
  const providers = ["All Providers", ...Array.from(new Set(patients.map((patient) => patient.provider)))];
  const providerColumns = providers.filter((provider) => provider !== "All Providers");
  const insights = getScheduleInsights(patients);
  const production = patients.reduce((sum, patient) => sum + patient.plannedProcedure.fee, 0);
  const readyCount = patients.filter((patient) => getVisitReadiness(patient).band === "Ready").length;
  const unscheduled = patients.reduce((sum, patient) => sum + patient.unscheduledTreatment, 0);

  return (
    <section className="schedule-panel premium-calendar-panel">
      <div className="calendar-hero">
        <div>
          <div className="calendar-date-chip"><CalendarDays size={16} />Tuesday, June 30</div>
          <h2>Premium Day Calendar</h2>
          <p>Provider flow, chair readiness, AI schedule suggestions, and treatment opportunities in one view.</p>
        </div>
        <div className="calendar-hero-metrics">
          <Metric label="Scheduled production" value={currency(production)} />
          <Metric label="Ready visits" value={`${readyCount}/${patients.length}`} />
          <Metric label="Same-day opportunity" value={currency(unscheduled)} />
        </div>
      </div>

      <div className="table-toolbar premium-calendar-toolbar">
        <label className="mini-search">
          <Search size={16} />
          <input placeholder="Search schedule, patient, provider..." aria-label="Search today's schedule" />
        </label>
        <select value={providerFilter} onChange={(event) => onProviderFilterChange(event.target.value)} aria-label="Filter by provider">
          {providers.map((provider) => (
            <option key={provider}>{provider}</option>
          ))}
        </select>
        <select value={readinessFilter} onChange={(event) => onReadinessFilterChange(event.target.value)} aria-label="Filter by readiness">
          {["All Readiness", "Ready", "Attention", "Not Ready"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button className="secondary-button">
          <SlidersHorizontal size={16} />
          Filters
        </button>
        <button className="square-button" aria-label="Refresh">
          <RefreshCcw size={16} />
        </button>
      </div>

      <div className="schedule-intelligence">
        {insights.map((insight) => (
          <button className={`insight-card ${insight.risk.toLowerCase()}`} key={insight.id}>
            <Sparkles size={17} />
            <span>
              <strong>{insight.title}</strong>
              <small>{insight.detail}</small>
            </span>
            <b>{insight.action}</b>
          </button>
        ))}
      </div>

      <div className="calendar-board">
        <div className="time-rail">
          <span />
          {dayHours.map((hour) => <time key={hour}>{hour}</time>)}
        </div>
        <div className="provider-board" style={{ gridTemplateColumns: `repeat(${Math.max(providerColumns.length, 1)}, minmax(260px, 1fr))` }}>
          {providerColumns.map((provider) => {
            const providerPatients = patients.filter((patient) => patient.provider === provider);
            return (
              <div className="provider-column" key={provider}>
                <div className="provider-column-head">
                  <div>
                    <strong>{provider}</strong>
                    <span>{providerPatients.length} visits · {currency(providerPatients.reduce((sum, patient) => sum + patient.plannedProcedure.fee, 0))}</span>
                  </div>
                  <button aria-label={`Optimize ${provider} schedule`}><Wand2 size={15} /></button>
                </div>
                <div className="appointment-stack">
                  {providerPatients.map((patient) => (
                    <AppointmentCard
                      key={patient.id}
                      patient={patient}
                      selected={patient.id === selectedPatientId}
                      revealPhi={revealPhi}
                      onSelect={() => onSelectPatient(patient.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-footer">
        <span><ShieldCheck size={15} /> PHI-safe schedule intelligence · Last sync 8:15 AM</span>
        <button><TimerReset size={15} />Find 30-min opening</button>
        <button><MessageCircle size={15} />Send confirmations</button>
      </div>
    </section>
  );
}

function AppointmentCard({ patient, selected, revealPhi, onSelect }: { patient: Patient; selected: boolean; revealPhi: boolean; onSelect: () => void }) {
  const readiness = getVisitReadiness(patient);
  const benefit = getBenefitSense(patient);
  const claim = getClaimGuard(patient);

  return (
    <button className={`appointment-card ${selected ? "selected" : ""} ${readiness.band.toLowerCase().replace(" ", "-")}`} onClick={onSelect}>
      <div className="appointment-time">
        <Clock3 size={14} />
        <strong>{patient.appointmentTime}</strong>
        <span>{durationFor(patient.visitType)}</span>
      </div>
      <div className="appointment-main">
        <div className="appointment-title">
          <strong>{patient.name}</strong>
          <span>{patient.age} · {revealPhi ? patient.dob : maskMemberId(patient.memberId, false)}</span>
        </div>
        <p>{patient.visitType} · {patient.plannedProcedure.code}</p>
        <div className="appointment-chips">
          <ReadinessChip band={readiness.band} />
          <ConfidenceChip confidence={benefit.confidence} />
          <RiskChip risk={claim.risk} />
        </div>
        <div className="appointment-action">
          <span>{getNextAction(patient)}</span>
          <MoveRight size={15} />
        </div>
      </div>
      <div className="appointment-value">
        <strong>{currency(patient.plannedProcedure.fee)}</strong>
        <ChevronDown size={15} />
      </div>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="calendar-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function durationFor(visitType: string) {
  if (visitType.toLowerCase().includes("cleaning") || visitType.toLowerCase().includes("perio")) return "60m";
  if (visitType.toLowerCase().includes("consult") || visitType.toLowerCase().includes("limited")) return "45m";
  return "90m";
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
