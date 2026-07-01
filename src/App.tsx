import { useMemo, useState } from "react";
import { auditEvents, patients as seedPatients, seedTasks } from "./data/mockData";
import { createAuditEvent, canRevealPhi } from "./lib/compliance";
import { AuditEvent, Patient, Role, Task } from "./lib/types";
import { getVisitReadiness } from "./lib/engines";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { MetricCards } from "./components/MetricCards";
import { ScheduleTable } from "./components/ScheduleTable";
import { PatientPane } from "./components/PatientPane";
import { OperationsPanels } from "./components/OperationsPanels";
import { ClinicalWorkspace } from "./components/ClinicalWorkspace";

export function App() {
  const [patients] = useState<Patient[]>(seedPatients);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0].id);
  const [role, setRole] = useState<Role>("Front Desk");
  const [query, setQuery] = useState("");
  const [revealPhi, setRevealPhi] = useState(false);
  const [providerFilter, setProviderFilter] = useState("All Providers");
  const [readinessFilter, setReadinessFilter] = useState("All Readiness");
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [audits, setAudits] = useState<AuditEvent[]>(auditEvents);
  const [workspaceMode, setWorkspaceMode] = useState<"today" | "clinical">("today");

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0];

  const visiblePatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesQuery = [patient.name, patient.provider, patient.plan, patient.visitType, patient.plannedProcedure.code].some((value) =>
        value.toLowerCase().includes(query.toLowerCase())
      );
      const matchesProvider = providerFilter === "All Providers" || patient.provider === providerFilter;
      const matchesReadiness = readinessFilter === "All Readiness" || getVisitReadiness(patient).band === readinessFilter;
      return matchesQuery && matchesProvider && matchesReadiness;
    });
  }, [patients, query, providerFilter, readinessFilter]);

  function handleSelectPatient(id: string) {
    const patient = patients.find((item) => item.id === id);
    setSelectedPatientId(id);
    if (patient) {
      setAudits((current) => [
        createAuditEvent({
          actor: `${role} (SL)`,
          action: "Viewed patient timeline",
          target: patient.name,
          reason: "Today Command Center review",
          phiAccess: true
        }),
        ...current
      ]);
    }
  }

  function handleRevealPhi(value: boolean) {
    if (value && !canRevealPhi(role)) {
      setAudits((current) => [
        createAuditEvent({
          actor: `${role} (SL)`,
          action: "Blocked PHI reveal",
          target: "Patient identifiers",
          reason: "Role lacks reveal permission",
          phiAccess: false
        }),
        ...current
      ]);
      return;
    }
    setRevealPhi(value);
    setAudits((current) => [
      createAuditEvent({
        actor: `${role} (SL)`,
        action: value ? "Revealed PHI fields" : "Masked PHI fields",
        target: "Today dashboard",
        reason: "Role-based workflow",
        phiAccess: value
      }),
      ...current
    ]);
  }

  function handleRoleChange(nextRole: Role) {
    setRole(nextRole);
    if (!canRevealPhi(nextRole)) setRevealPhi(false);
  }

  function createTask(title: string) {
    setTasks((current) => [
      {
        id: `manual-${Date.now()}`,
        patientId: selectedPatient.id,
        owner: "Billing Lead",
        title,
        due: "Today",
        status: "Open",
        severity: "Medium"
      },
      ...current
    ]);
  }

  function toggleTask(taskId: string) {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: task.status === "Done" ? "Open" : "Done" } : task)));
  }

  function runComplianceCheck() {
    setAudits((current) => [
      createAuditEvent({
        actor: "Compliance Guard",
        action: "Policy guard passed",
        target: selectedPatient.name,
        reason: "No external AI/PHI transfer configured in demo",
        phiAccess: false
      }),
      ...current
    ]);
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="workspace">
        <Topbar
          role={role}
          onRoleChange={handleRoleChange}
          query={query}
          onQueryChange={setQuery}
          revealPhi={revealPhi}
          onRevealPhiChange={handleRevealPhi}
        />
        <main className={`main-grid ${workspaceMode === "clinical" ? "clinical-mode" : ""}`}>
          <section className="command-center">
            <div className="workspace-switcher">
              <button className={workspaceMode === "today" ? "active" : ""} onClick={() => setWorkspaceMode("today")}>Today Command Center</button>
              <button className={workspaceMode === "clinical" ? "active" : ""} onClick={() => setWorkspaceMode("clinical")}>Clinical + Imaging</button>
              <span>{selectedPatient.name} · {selectedPatient.visitType}</span>
            </div>
            {workspaceMode === "today" ? (
              <>
                <MetricCards patients={patients} />
                <ScheduleTable
                  patients={visiblePatients}
                  selectedPatientId={selectedPatientId}
                  onSelectPatient={handleSelectPatient}
                  revealPhi={revealPhi}
                  providerFilter={providerFilter}
                  onProviderFilterChange={setProviderFilter}
                  readinessFilter={readinessFilter}
                  onReadinessFilterChange={setReadinessFilter}
                />
                <OperationsPanels patients={patients} tasks={tasks} onTaskStatus={toggleTask} />
              </>
            ) : (
              <ClinicalWorkspace patient={selectedPatient} onCreateTask={createTask} />
            )}
          </section>
          {workspaceMode === "today" && (
            <PatientPane patient={selectedPatient} revealPhi={revealPhi} audits={audits} onRunCheck={runComplianceCheck} onCreateTask={createTask} />
          )}
        </main>
      </div>
    </div>
  );
}
