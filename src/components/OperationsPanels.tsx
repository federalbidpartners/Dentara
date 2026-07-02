import { CheckCircle2, Landmark, LockKeyhole, SendHorizonal, ShieldCheck } from "lucide-react";
import { hipaaReadinessControls, launchReadiness } from "../lib/compliance";
import { getClearinghouseOptions, getGeneratedTasks, getInsuranceWorkflow, getRevenueLeaks } from "../lib/engines";
import { Patient, Task } from "../lib/types";
import { RiskChip } from "./StatusChip";

interface OperationsPanelsProps {
  patients: Patient[];
  tasks: Task[];
  onTaskStatus: (taskId: string) => void;
}

export function OperationsPanels({ patients, tasks, onTaskStatus }: OperationsPanelsProps) {
  const generated = getGeneratedTasks(patients);
  const mergedTasks = [...tasks, ...generated].slice(0, 7);
  const leaks = getRevenueLeaks(patients);
  const insuranceSteps = patients.flatMap((patient) => getInsuranceWorkflow(patient));
  const blockedTransactions = insuranceSteps.filter((step) => step.status === "Blocked").length;
  const reviewTransactions = insuranceSteps.filter((step) => step.status === "Needs Review").length;
  const clearinghouseOptions = getClearinghouseOptions();

  return (
    <section className="operations-grid">
      <article className="ops-panel">
        <div className="panel-title">
          <h3>NextAction Task Inbox</h3>
          <span>{mergedTasks.filter((task) => task.status !== "Done").length} open</span>
        </div>
        <div className="task-list">
          {mergedTasks.map((task) => {
            const patient = patients.find((item) => item.id === task.patientId);
            return (
              <button className={`task-row ${task.status === "Done" ? "done" : ""}`} key={task.id} onClick={() => onTaskStatus(task.id)}>
                <CheckCircle2 size={17} />
                <div>
                  <strong>{task.title}</strong>
                  <span>{patient?.name ?? "Unknown patient"} · {task.owner} · {task.due}</span>
                </div>
                <RiskChip risk={task.severity} />
              </button>
            );
          })}
        </div>
      </article>

      <article className="ops-panel">
        <div className="panel-title">
          <h3>RevenueLeak AI</h3>
          <span>Owner view</span>
        </div>
        <div className="leak-list">
          {leaks.map((leak) => (
            <div className="leak-row" key={leak.label}>
              <div>
                <strong>{leak.label}</strong>
                <span>{leak.detail}</span>
              </div>
              <div className="leak-value">{typeof leak.value === "number" && leak.value > 20 ? currency(leak.value) : leak.value}</div>
              <RiskChip risk={leak.severity} />
            </div>
          ))}
        </div>
      </article>

      <article className="ops-panel insurance-panel">
        <div className="panel-title">
          <h3>Insurance API Hub</h3>
          <span>{blockedTransactions} blocked · {reviewTransactions} review</span>
        </div>
        <div className="insurance-summary">
          <Landmark size={18} />
          <div>
            <strong>Clearinghouse-ready workflow</strong>
            <span>Eligibility, 837D claims, attachments, status, and ERA posting are separated so live APIs can be added safely.</span>
          </div>
        </div>
        <div className="transaction-grid">
          {["270/271", "837D", "275", "276/277", "835"].map((transaction) => {
            const steps = insuranceSteps.filter((step) => step.transaction === transaction);
            const blocked = steps.filter((step) => step.status === "Blocked").length;
            const review = steps.filter((step) => step.status === "Needs Review").length;
            const status = blocked > 0 ? "Blocked" : review > 0 ? "Needs Review" : "Ready";
            return (
              <button className={`transaction-tile ${status.toLowerCase().replace(" ", "-")}`} key={transaction}>
                <SendHorizonal size={14} />
                <strong>{transaction}</strong>
                <span>{status}</span>
              </button>
            );
          })}
        </div>
        <div className="vendor-list">
          {clearinghouseOptions.map((option) => (
            <div className="vendor-row" key={option.name}>
              <strong>{option.name}</strong>
              <span>{option.fit}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="ops-panel compliance-panel">
        <div className="panel-title">
          <h3>HIPAA Readiness Center</h3>
          <span>Not legal certification</span>
        </div>
        <div className="control-grid">
          {hipaaReadinessControls.map((control) => (
            <div className="control-row" key={control.name}>
              <ShieldCheck size={16} />
              <div>
                <strong>{control.name}</strong>
                <span>{control.status} · {control.evidence}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="launch-box">
          <LockKeyhole size={17} />
          <div>
            <strong>Before real PHI</strong>
            <span>{launchReadiness[0]}</span>
          </div>
        </div>
      </article>
    </section>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
