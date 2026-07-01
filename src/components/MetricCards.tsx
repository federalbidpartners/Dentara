import { CheckCircle2, CircleDollarSign, XCircle, AlertCircle, CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { Patient } from "../lib/types";
import { getEstimateIQ, getVisitReadiness } from "../lib/engines";

interface MetricCardsProps {
  patients: Patient[];
}

export function MetricCards({ patients }: MetricCardsProps) {
  const readiness = patients.map(getVisitReadiness);
  const ready = readiness.filter((r) => r.band === "Ready").length;
  const attention = readiness.filter((r) => r.band === "Attention").length;
  const notReady = readiness.filter((r) => r.band === "Not Ready").length;
  const expectedCollections = patients.reduce((sum, patient) => sum + getEstimateIQ(patient).patientEstimate + patient.balanceDue, 0);

  return (
    <section className="metric-grid" aria-label="Daily metrics">
      <MetricCard title="Appts Today" value={patients.length.toString()} detail={`${patients.filter((p) => p.confirmed).length} confirmed`} icon={<CalendarDays />} tone="blue" />
      <MetricCard title="Ready" value={ready.toString()} detail={`${Math.round((ready / patients.length) * 100)}%`} icon={<CheckCircle2 />} tone="green" />
      <MetricCard title="Attention" value={attention.toString()} detail={`${Math.round((attention / patients.length) * 100)}%`} icon={<AlertCircle />} tone="amber" />
      <MetricCard title="Not Ready" value={notReady.toString()} detail={`${Math.round((notReady / patients.length) * 100)}%`} icon={<XCircle />} tone="red" />
      <MetricCard title="Est. Collections" value={currency(expectedCollections)} detail="Includes estimates + balances" icon={<CircleDollarSign />} tone="mint" />
    </section>
  );
}

function MetricCard({ title, value, detail, icon, tone }: { title: string; value: string; detail: string; icon: ReactNode; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
      <div className="metric-icon">{icon}</div>
    </article>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
