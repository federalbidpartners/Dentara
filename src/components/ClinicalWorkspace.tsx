import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Box,
  BrainCircuit,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  FilePlus2,
  Image as ImageIcon,
  Layers3,
  Maximize2,
  PlusCircle,
  Rotate3D,
  Save,
  ScanLine,
  Sparkles,
  Stethoscope,
  Wand2,
  ZoomIn
} from "lucide-react";
import * as THREE from "three";
import { getAttachmentChecklist, getClinicalAiSuggestions, getCodeAdvisor, getDiagnosticAssist, getEstimateIQ, getImagingFindings, getNarrativeDraft } from "../lib/engines";
import {
  ChartCommandResult,
  ChartEntry,
  ChartStatus,
  DentalSurfaceRecord,
  Dentition,
  NotationSystem,
  Patient,
  ProcedureLine,
  ProcedureScope,
  SmartProcedureSuggestion,
  ToothCondition,
  ToothFinding,
  ToothSurface
} from "../lib/types";
import {
  convertToNotation,
  parseChartCommand,
  procedureCodes,
  searchProcedureCodes,
  suggestProcedureCodes,
  validateProcedureSelection
} from "../lib/procedureCatalog";
import { ConfidenceChip, RiskChip } from "./StatusChip";

interface ClinicalWorkspaceProps {
  patient: Patient;
  onCreateTask: (title: string) => void;
}

const upperTeeth = Array.from({ length: 16 }, (_, index) => index + 1);
const lowerTeeth = Array.from({ length: 16 }, (_, index) => 32 - index);
const pediatricUpperTeeth = Array.from({ length: 10 }, (_, index) => index + 1);
const pediatricLowerTeeth = Array.from({ length: 10 }, (_, index) => 20 - index);
const posteriorSurfaces: ToothSurface[] = ["M", "O", "D", "B", "L", "R"];
const anteriorSurfaces: ToothSurface[] = ["M", "I", "D", "F", "L", "R"];
const allSurfaces: ToothSurface[] = ["M", "O", "I", "D", "B", "F", "L", "R"];
const statusOptions: ChartStatus[] = ["Planned", "Existing", "Completed", "Watch", "Referred", "Declined", "Insurance Pending"];
const conditionLabels: { key: ToothCondition; label: string }[] = [
  { key: "caries", label: "Caries" },
  { key: "restoration", label: "Restoration" },
  { key: "crown", label: "Crown" },
  { key: "rct", label: "RCT" },
  { key: "implant", label: "Implant" },
  { key: "missing", label: "Missing" },
  { key: "watch", label: "Watch" }
];

const procedureTemplates = [
  { condition: "caries" as const, label: "Composite filling", description: "Posterior composite", baseCode: "D2391", fee: 185 },
  { condition: "crown" as const, label: "Crown", description: "Porcelain/ceramic crown", baseCode: "D2740", fee: 1280 },
  { condition: "rct" as const, label: "Root canal", description: "Molar root canal therapy", baseCode: "D3330", fee: 1420 },
  { condition: "watch" as const, label: "Watch", description: "Monitor tooth/surface", baseCode: "WATCH", fee: 0 }
];

export function ClinicalWorkspace({ patient, onCreateTask }: ClinicalWorkspaceProps) {
  const seededEntries = useMemo(() => seedChartEntries(patient), [patient]);
  const initialTooth = Number(patient.plannedProcedure.tooth ?? patient.toothFindings[0]?.tooth ?? 14);
  const [chartEntries, setChartEntries] = useState<ChartEntry[]>(seededEntries);
  const [chartHistory, setChartHistory] = useState<ChartEntry[][]>([]);
  const [redoStack, setRedoStack] = useState<ChartEntry[][]>([]);
  const [selectedTooth, setSelectedTooth] = useState(initialTooth);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([initialTooth]);
  const [selectedSurfaces, setSelectedSurfaces] = useState<ToothSurface[]>(normalizeSurfaces(patient.plannedProcedure.surface ?? patient.toothFindings[0]?.surface ?? "O"));
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>("caries");
  const [selectedStatus, setSelectedStatus] = useState<ChartStatus>("Planned");
  const [selectedScope, setSelectedScope] = useState<ProcedureScope>("surface");
  const [notationSystem, setNotationSystem] = useState<NotationSystem>("Universal");
  const [dentition, setDentition] = useState<Dentition>("Adult");
  const [commandText, setCommandText] = useState("MOD filling #19");
  const [commandResult, setCommandResult] = useState<ChartCommandResult | null>(null);
  const [procedureQuery, setProcedureQuery] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [activeProcedure, setActiveProcedure] = useState(procedureTemplates[0]);

  useEffect(() => {
    const nextTooth = Number(patient.plannedProcedure.tooth ?? patient.toothFindings[0]?.tooth ?? 14);
    setChartEntries(seededEntries);
    setChartHistory([]);
    setRedoStack([]);
    setSelectedTooth(nextTooth);
    setSelectedTeeth([nextTooth]);
    setSelectedSurfaces(normalizeSurfaces(patient.plannedProcedure.surface ?? patient.toothFindings[0]?.surface ?? "O"));
    setSelectedCondition(patient.toothFindings[0]?.condition ?? "caries");
    setSelectedScope("surface");
    setCommandResult(null);
    setProcedureQuery("");
    setNoteDraft("");
  }, [patient, seededEntries]);

  const codeOptions = getCodeAdvisor(patient);
  const imagingFindings = getImagingFindings(patient);
  const aiSuggestions = getClinicalAiSuggestions(patient, noteDraft);
  const diagnosticAssist = getDiagnosticAssist(patient, noteDraft);
  const checklist = getAttachmentChecklist(patient);
  const estimate = getEstimateIQ(patient);
  const selectedEntries = chartEntries.filter((entry) => entry.tooth === selectedTooth);
  const selectedFinding = patient.toothFindings.find((finding) => finding.tooth === selectedTooth) ?? patient.toothFindings[0];
  const visibleSurfaceOptions = surfaceOptionsForTooth(selectedTooth, dentition);
  const selectedProcedure = buildProcedure(activeProcedure.condition, selectedTooth, selectedSurfaces);
  const procedureSearchResults = searchProcedureCodes(procedureQuery || activeProcedure.label, 6);
  const smartSuggestions = suggestProcedureCodes({
    toothNumber: selectedScope === "full-mouth" ? undefined : selectedTooth,
    surfaces: selectedSurfaces,
    scope: selectedScope,
    phrase: procedureQuery || commandText || activeProcedure.label,
    attachments: patient.attachments,
    clinicalNotes: noteDraft
  });
  const selectedCatalogCode = smartSuggestions[0]?.procedureCode ?? procedureSearchResults[0] ?? procedureCodes[0];
  const activeValidation = validateProcedureSelection({
    procedureCode: selectedCatalogCode,
    toothNumber: selectedScope === "full-mouth" ? undefined : String(selectedTooth),
    surfaces: selectedSurfaces,
    scope: selectedCatalogCode.requiresSurface ? "surface" : selectedScope,
    serviceDate: "2026-07-02",
    attachments: patient.attachments,
    clinicalNotes: noteDraft
  });
  const treatmentQueue = useMemo(() => {
    const plannedChartLines = chartEntries
      .filter((entry) => entry.status === "Planned" && entry.fee > 0)
      .map<ProcedureLine>((entry) => ({
        code: entry.code,
        description: entry.description,
        fee: entry.fee,
        category: entry.condition === "crown" || entry.condition === "rct" ? "major" : "basic",
        tooth: String(entry.tooth),
        surface: entry.surfaces.join("")
      }));
    return [patient.plannedProcedure, ...plannedChartLines].slice(0, 6);
  }, [chartEntries, patient.plannedProcedure]);
  const treatmentQueueTotal = treatmentQueue.reduce((sum, procedure) => sum + procedure.fee, 0);

  function setChartEntriesWithHistory(nextEntries: ChartEntry[]) {
    setChartHistory((current) => [chartEntries, ...current].slice(0, 20));
    setRedoStack([]);
    setChartEntries(nextEntries);
  }

  function undoChart() {
    const [previous, ...rest] = chartHistory;
    if (!previous) return;
    setRedoStack((current) => [chartEntries, ...current].slice(0, 20));
    setChartHistory(rest);
    setChartEntries(previous);
  }

  function redoChart() {
    const [next, ...rest] = redoStack;
    if (!next) return;
    setChartHistory((current) => [chartEntries, ...current].slice(0, 20));
    setRedoStack(rest);
    setChartEntries(next);
  }

  function handleToothSelect(tooth: number, additive = false) {
    setSelectedTooth(tooth);
    setSelectedScope("surface");
    setSelectedSurfaces((current) => reconcileSurfacesForTooth(current, tooth, dentition));
    setSelectedTeeth((current) => {
      if (!additive) return [tooth];
      if (current.includes(tooth)) {
        const next = current.filter((item) => item !== tooth);
        return next.length > 0 ? next : [tooth];
      }
      return [...current, tooth].sort((a, b) => a - b);
    });
  }

  function selectScope(scope: ProcedureScope, scopeId?: string) {
    setSelectedScope(scope);
    if (scope === "full-mouth") {
      setSelectedTeeth(dentition === "Adult" ? [...upperTeeth, ...lowerTeeth].sort((a, b) => a - b) : [...pediatricUpperTeeth, ...pediatricLowerTeeth].sort((a, b) => a - b));
      return;
    }
    if (scope === "quadrant" && scopeId) {
      const teeth = quadrantTeeth(scopeId, dentition);
      setSelectedTeeth(teeth);
      setSelectedTooth(teeth[0] ?? selectedTooth);
      return;
    }
    if (scope === "arch" && scopeId) {
      const teeth = archTeeth(scopeId, dentition);
      setSelectedTeeth(teeth);
      setSelectedTooth(teeth[0] ?? selectedTooth);
      return;
    }
    setSelectedTeeth([selectedTooth]);
  }

  function toggleSurface(surface: ToothSurface) {
    setSelectedSurfaces((current) => {
      if (current.includes(surface)) {
        const next = current.filter((item) => item !== surface);
        return next.length === 0 ? ["O"] : next;
      }
      return [...current, surface];
    });
  }

  function applySurfacePreset(nextSurfaces: ToothSurface[], condition = activeProcedure.condition) {
    setSelectedSurfaces(reconcileSurfacesForTooth(nextSurfaces, selectedTooth, dentition));
    setSelectedCondition(condition);
    const matchingTemplate = procedureTemplates.find((template) => template.condition === condition);
    if (matchingTemplate) setActiveProcedure(matchingTemplate);
  }

  function reviewCommand() {
    const result = parseChartCommand(commandText);
    setCommandResult(result);
    if (result.toothNumbers.length > 0) {
      setSelectedTooth(result.toothNumbers[0]);
      setSelectedTeeth(result.toothNumbers);
    }
    if (result.surfaces.length > 0) setSelectedSurfaces(result.surfaces);
    if (result.scope) setSelectedScope(result.scope);
    if (result.matchedCode) setProcedureQuery(result.matchedCode.code);
  }

  function acceptCommandResult() {
    if (!commandResult?.matchedCode || commandResult.errors.length > 0) return;
    addProcedureEntries({
      code: commandResult.matchedCode.code,
      description: commandResult.matchedCode.plainEnglishDescription,
      fee: commandResult.matchedCode.defaultFee,
      condition: conditionFromCode(commandResult.matchedCode.code),
      surfaces: commandResult.surfaces.length > 0 ? commandResult.surfaces : selectedSurfaces,
      teeth: commandResult.toothNumbers.length > 0 ? commandResult.toothNumbers : selectedTeeth,
      note: `${commandResult.note} Command reviewed by provider before saving.`,
      source: "command"
    });
    setCommandResult(null);
  }

  function applySmartSuggestion(suggestion: SmartProcedureSuggestion) {
    addProcedureEntries({
      code: suggestion.procedureCode.code,
      description: suggestion.procedureCode.plainEnglishDescription,
      fee: suggestion.procedureCode.defaultFee,
      condition: conditionFromCode(suggestion.procedureCode.code),
      surfaces: suggestion.surfaces.length > 0 ? suggestion.surfaces : selectedSurfaces,
      teeth: suggestion.toothNumber ? [Number(suggestion.toothNumber)] : selectedTeeth,
      note: `${suggestion.reason} Documentation: ${suggestion.documentation.join(", ") || "provider note"}.`,
      source: "ai-suggestion"
    });
  }

  function addProcedureEntries(params: {
    code: string;
    description: string;
    fee: number;
    condition: ToothCondition;
    surfaces: ToothSurface[];
    teeth: number[];
    note: string;
    source?: "manual" | "command" | "ai-suggestion";
  }) {
    const teeth = params.teeth.length > 0 ? params.teeth : [selectedTooth];
    const entries = teeth.map<ChartEntry>((tooth, index) => ({
      id: `chart-${Date.now()}-${tooth}-${index}`,
      tooth,
      surfaces: reconcileSurfacesForTooth(params.surfaces, tooth, dentition),
      surfaceRecords: createSurfaceRecords({
        tooth,
        surfaces: reconcileSurfacesForTooth(params.surfaces, tooth, dentition),
        condition: params.condition,
        status: selectedStatus,
        code: params.code,
        note: noteDraft || params.note,
        source: params.source ?? "manual"
      }),
      coverage: coverageForCondition(params.condition),
      condition: params.condition,
      status: selectedStatus,
      code: params.code,
      description: params.description,
      fee: params.fee,
      note: noteDraft || params.note,
      provider: patient.provider,
      createdAt: "Today"
    }));
    setSelectedCondition(params.condition);
    setChartEntriesWithHistory([...entries, ...chartEntries]);
    setNoteDraft("");
    onCreateTask(`${selectedStatus} ${params.description} on ${teeth.map((tooth) => `#${tooth}`).join(", ")} ${params.surfaces.join("")}`);
  }

  function applyProcedure(template = activeProcedure) {
    const procedure = buildProcedure(template.condition, selectedTooth, selectedSurfaces);
    const surfacesForEntry = reconcileSurfacesForTooth(selectedSurfaces, selectedTooth, dentition);
    const note = noteDraft || smartNote(template.condition, selectedTooth, surfacesForEntry, selectedStatus);
    const entry: ChartEntry = {
      id: `chart-${Date.now()}`,
      tooth: selectedTooth,
      surfaces: surfacesForEntry,
      surfaceRecords: createSurfaceRecords({
        tooth: selectedTooth,
        surfaces: surfacesForEntry,
        condition: template.condition,
        status: selectedStatus,
        code: procedure.code,
        note,
        source: "manual"
      }),
      coverage: coverageForCondition(template.condition),
      condition: template.condition,
      status: selectedStatus,
      code: procedure.code,
      description: procedure.description,
      fee: procedure.fee,
      note,
      provider: patient.provider,
      createdAt: "Today"
    };
    setSelectedCondition(template.condition);
    setActiveProcedure(template);
    setChartEntriesWithHistory([entry, ...chartEntries]);
    setNoteDraft("");
    onCreateTask(`${selectedStatus} ${procedure.description} on #${selectedTooth} ${selectedSurfaces.join("")}`);
  }

  function writeAiNoteDraft() {
    const procedure = buildProcedure(activeProcedure.condition, selectedTooth, selectedSurfaces);
    setNoteDraft(
      [
        `CC/HPI: ${patient.clinicalHandoff}`,
        `Tooth/Surface: #${selectedTooth} ${selectedSurfaces.join("")}.`,
        `Objective: ${diagnosticAssist.noteSections[1]?.replace("Objective: ", "") ?? "Provider to document clinical findings."}`,
        `Assessment: Provider to confirm final diagnosis; AI suggestion is decision support only.`,
        `Plan: ${selectedStatus} ${procedure.description} (${procedure.code}). Verify CDT coding, payer policy, and attachments before claim submission.`
      ].join("\n")
    );
  }

  return (
    <section className="clinical-workspace">
      <div className="patient-strip">
        <div className="patient-monogram">{patient.name.split(" ").map((part) => part[0]).join("")}</div>
        <div>
          <h2>{patient.name}</h2>
          <p>{patient.age} · {patient.visitType} · {patient.provider}</p>
        </div>
        <Metric label="Next Appt" value={`${patient.appointmentTime} today`} />
        <Metric label="Patient Est." value={currency(estimate.patientEstimate)} />
        <Metric label="Queued Tx" value={currency(treatmentQueueTotal)} />
        <button className="primary-small">Patient Actions</button>
      </div>

      <div className="clinical-tabs">
        {["Overview", "Clinical", "Treatment Plan", "Perio", "Imaging", "3D", "Documents", "Notes", "Account"].map((tab) => (
          <button className={tab === "Clinical" ? "active" : ""} key={tab}>{tab}</button>
        ))}
      </div>

      <div className="clinical-grid advanced-clinical-grid">
        <div className="clinical-left">
          <article className="clinical-card tooth-card">
            <div className="clinical-heading">
              <h3>Advanced Odontogram</h3>
              <span>Tooth, surface, quadrant, arch, or full-mouth</span>
            </div>
            <div className="odontogram-toolbar">
              <label>
                <span>Dentition</span>
                <select
                  value={dentition}
                  onChange={(event) => {
                    const nextDentition = event.target.value as Dentition;
                    setDentition(nextDentition);
                    setSelectedSurfaces((current) => reconcileSurfacesForTooth(current, selectedTooth, nextDentition));
                  }}
                >
                  <option>Adult</option>
                  <option>Pediatric</option>
                </select>
              </label>
              <label>
                <span>Notation</span>
                <select value={notationSystem} onChange={(event) => setNotationSystem(event.target.value as NotationSystem)}>
                  <option>Universal</option>
                  <option>Palmer</option>
                  <option>FDI</option>
                </select>
              </label>
              <button onClick={undoChart} disabled={chartHistory.length === 0} title="Undo charting change"><CornerUpLeft size={14} />Undo</button>
              <button onClick={redoChart} disabled={redoStack.length === 0} title="Redo charting change"><CornerUpRight size={14} />Redo</button>
            </div>
            <ModernOdontogram
              dentition={dentition}
              notationSystem={notationSystem}
              entries={chartEntries}
              findings={patient.toothFindings}
              selectedTeeth={selectedTeeth}
              selectedTooth={selectedTooth}
              selectedSurfaces={selectedSurfaces}
              onSelectTooth={handleToothSelect}
              onSurfaceClick={toggleSurface}
            />
            <div className="tooth-legend">
              {conditionLabels.map((item) => (
                <span key={item.key}><i className={`condition-dot ${item.key}`} />{item.label}</span>
              ))}
            </div>
            <div className="scope-row">
              <button className={selectedScope === "tooth" ? "active" : ""} onClick={() => selectScope("tooth")}>Tooth</button>
              {["UR", "UL", "LL", "LR"].map((quadrant) => (
                <button key={quadrant} onClick={() => selectScope("quadrant", quadrant)}>Q {quadrant}</button>
              ))}
              {["Upper", "Lower"].map((arch) => (
                <button key={arch} onClick={() => selectScope("arch", arch)}>{arch}</button>
              ))}
              <button className={selectedScope === "full-mouth" ? "active" : ""} onClick={() => selectScope("full-mouth")}>Full Mouth</button>
            </div>
            <div className="surface-row surface-builder">
              <strong>#{convertToNotation(selectedTooth, notationSystem, dentition)} · {selectedTeeth.length} selected</strong>
              {visibleSurfaceOptions.map((surface) => (
                <button className={selectedSurfaces.includes(surface) ? "active" : ""} key={surface} onClick={() => toggleSurface(surface)}>
                  {surface}<small>{surfaceLabel(surface)}</small>
                </button>
              ))}
            </div>
            <div className="surface-preset-row">
              <button onClick={() => applySurfacePreset(["M", isAnteriorTooth(selectedTooth, dentition) ? "I" : "O"], "caries")}>MO/MI</button>
              <button onClick={() => applySurfacePreset(["D", isAnteriorTooth(selectedTooth, dentition) ? "I" : "O"], "caries")}>DO/DI</button>
              <button onClick={() => applySurfacePreset(["M", isAnteriorTooth(selectedTooth, dentition) ? "I" : "O", "D"], "caries")}>MOD/MID</button>
              <button onClick={() => applySurfacePreset(["B"], "caries")}>Buccal/Facial</button>
              <button onClick={() => applySurfacePreset(fullCoverageSurfaces(selectedTooth, dentition), "crown")}>Crown coverage</button>
              <button onClick={() => applySurfacePreset(["R"], "rct")}>Root</button>
            </div>
            <SurfaceMap
              tooth={selectedTooth}
              dentition={dentition}
              selectedSurfaces={selectedSurfaces}
              condition={selectedCondition}
              entries={selectedEntries}
              status={selectedStatus}
              onSurfaceClick={toggleSurface}
            />
            <StructuredSurfacePreview
              tooth={selectedTooth}
              surfaces={selectedSurfaces}
              condition={selectedCondition}
              status={selectedStatus}
              code={selectedProcedure.code}
              dentition={dentition}
            />
            <div className="finding-summary">
              <RiskChip risk={selectedFinding?.severity ?? "Low"} />
              <span>{selectedFinding?.note ?? "No active chart finding on this tooth."}</span>
            </div>
            <div className="shortcut-strip">
              <span>Shift-click teeth for multi-select</span>
              <span>Root = R</span>
              <span>Codes validate before claim handoff</span>
            </div>
          </article>

          <article className="clinical-card chart-command-card">
            <div className="clinical-heading">
              <h3><Sparkles size={16} />Natural-Language Charting</h3>
              <button onClick={reviewCommand}>Review command</button>
            </div>
            <div className="command-bar">
              <input value={commandText} onChange={(event) => setCommandText(event.target.value)} placeholder="Try: MOD filling #19 or extract 1, 16, 17, 32" />
              <button onClick={reviewCommand}><Wand2 size={14} />Parse</button>
            </div>
            {commandResult && (
              <div className={`command-review ${commandResult.errors.length ? "blocked" : "ready"}`}>
                <div>
                  <strong>{commandResult.matchedCode?.code ?? "Needs review"}</strong>
                  <span>{commandResult.note}</span>
                  {commandResult.errors.map((error) => <small key={error}>{error}</small>)}
                </div>
                <button onClick={acceptCommandResult} disabled={!commandResult.matchedCode || commandResult.errors.length > 0}>Accept draft</button>
              </div>
            )}
          </article>

          <article className="clinical-card note-builder-card">
            <div className="clinical-heading">
              <h3>Chairside Note + Filling Builder</h3>
              <button onClick={() => applyProcedure()}><PlusCircle size={15} />Add to chart</button>
            </div>
            <div className="procedure-grid">
              {procedureTemplates.map((template) => (
                <button
                  className={activeProcedure.label === template.label ? "active" : ""}
                  key={template.label}
                  onClick={() => {
                    setActiveProcedure(template);
                    setSelectedCondition(template.condition);
                  }}
                >
                  <span>{template.label}</span>
                  <strong>{buildProcedure(template.condition, selectedTooth, selectedSurfaces).code}</strong>
                </button>
              ))}
            </div>
            <div className="status-row">
              {statusOptions.map((status) => (
                <button className={selectedStatus === status ? "active" : ""} key={status} onClick={() => setSelectedStatus(status)}>
                  {status}
                </button>
              ))}
            </div>
            <label className="note-field">
              <span>Clinical note for #{selectedTooth} {selectedSurfaces.join("")}</span>
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder={smartNote(activeProcedure.condition, selectedTooth, selectedSurfaces, selectedStatus)}
              />
            </label>
            <div className="note-assist">
              <button onClick={writeAiNoteDraft}><Wand2 size={14} />Draft provider note</button>
              <button onClick={() => onCreateTask("Provider to complete diagnostic checklist")}><ClipboardCheck size={14} />Diagnostic checklist</button>
            </div>
            <div className="smart-code-preview">
              <div>
                <span>Smart code</span>
                <strong>{selectedProcedure.code}</strong>
              </div>
              <div>
                <span>Procedure</span>
                <strong>{selectedProcedure.description}</strong>
              </div>
              <div>
                <span>Fee</span>
                <strong>{currency(selectedProcedure.fee)}</strong>
              </div>
            </div>
          </article>

          <article className="clinical-card perio-card">
            <div className="clinical-heading">
              <h3>Perio Quick Chart</h3>
              <RiskChip risk={patient.perioRisk} />
            </div>
            <div className="perio-grid" aria-label="Periodontal probing chart">
              {Array.from({ length: 32 }, (_, index) => {
                const tooth = index < 16 ? index + 1 : 32 - (index - 16);
                const base = patient.perioRisk === "High" ? 4 : patient.perioRisk === "Medium" ? 3 : 2;
                const value = tooth === selectedTooth ? base + 2 : base + ((tooth + index) % 3 === 0 ? 1 : 0);
                return <span className={value >= 5 ? "risk" : value >= 4 ? "watch" : ""} key={`${tooth}-${index}`}>{value}</span>;
              })}
            </div>
            <div className="perio-metrics">
              <Metric label="Plaque" value={`${patient.plaquePercent}%`} />
              <Metric label="Bleeding" value={`${patient.bleedingPercent}%`} />
              <Metric label="Perio Risk" value={patient.perioRisk} />
              <Metric label="Updated" value="Today" />
            </div>
          </article>
        </div>

        <div className="clinical-center">
          <article className="clinical-card render-card">
            <div className="clinical-heading">
              <h3>3D Tooth + Restoration Viewer</h3>
              <div className="viewer-tools">
                <button className="active"><Rotate3D size={14} />Rotate</button>
                <button><Layers3 size={14} />Layers</button>
                <button><Box size={14} />Occlusion</button>
              </div>
            </div>
            <Tooth3DViewer tooth={selectedTooth} surfaces={selectedSurfaces} condition={selectedCondition} />
            <div className="render-inspector">
              <span>Selected #{selectedTooth}</span>
              <strong>{selectedSurfaces.join(", ")} · {selectedCondition}</strong>
              <small>Prototype 3D scene for orientation, restoration planning, and future CBCT/model overlays.</small>
            </div>
          </article>

          <article className="clinical-card ai-copilot-card">
            <div className="clinical-heading">
              <h3><BrainCircuit size={16} />AI Clinical Copilot</h3>
              <button onClick={() => onCreateTask("Provider to review AI clinical suggestions")}><CheckCircle2 size={14} />Provider review</button>
            </div>
            <p className="ai-disclaimer">Decision support only. Suggestions must be confirmed by the dentist before diagnosis, treatment planning, or billing.</p>
            <div className="diagnostic-brief">
              <div>
                <span>Assist focus</span>
                <strong>{diagnosticAssist.likelyFocus}</strong>
              </div>
              <RiskChip risk={diagnosticAssist.risk} />
              <ul>
                {diagnosticAssist.checklist.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="smart-planner-card">
              <div className="readiness-meter">
                <span>Claim readiness</span>
                <strong>{activeValidation.claimReadinessScore}%</strong>
                <i style={{ width: `${activeValidation.claimReadinessScore}%` }} />
              </div>
              {smartSuggestions.slice(0, 3).map((suggestion) => (
                <div className="smart-suggestion-card" key={suggestion.id}>
                  <div>
                    <strong>{suggestion.procedureCode.code} · {suggestion.procedureCode.plainEnglishDescription}</strong>
                    <span>{suggestion.reason}</span>
                    <small>{suggestion.documentation.join(" · ")}</small>
                  </div>
                  <ConfidenceChip confidence={suggestion.confidence} />
                  <button onClick={() => applySmartSuggestion(suggestion)}>Add draft</button>
                </div>
              ))}
            </div>
            <div className="ai-suggestion-list">
              {aiSuggestions.slice(0, 4).map((suggestion) => (
                <div className="ai-suggestion" key={suggestion.id}>
                  <div className="ai-suggestion-top">
                    <span>{suggestion.source}</span>
                    <RiskChip risk={suggestion.risk} />
                  </div>
                  <strong>{suggestion.title}</strong>
                  <p>{suggestion.detail}</p>
                  <div className="evidence-row">
                    {suggestion.evidence.slice(0, 2).map((item) => (
                      <small key={item}>{item}</small>
                    ))}
                  </div>
                  <button onClick={() => onCreateTask(suggestion.nextStep)}><Sparkles size={14} />{suggestion.nextStep}</button>
                </div>
              ))}
            </div>
          </article>

          <article className="clinical-card imaging-card">
            <div className="clinical-heading">
              <h3>Imaging Viewer</h3>
              <div className="viewer-tools">
                <button><ScanLine size={14} />Pan</button>
                <button className="active">BWx</button>
                <button>PA</button>
                <button><Maximize2 size={14} />2x2</button>
                <button>Compare</button>
                <button className="active">AI Findings</button>
              </div>
            </div>
            <div className="xray-layout">
              <div className="xray-frame">
                <img src="/demo-bitewing-xray.png" alt="Fictional dental bitewing X-ray demo" />
                {imagingFindings.slice(0, 2).map((finding, index) => (
                  <span className={`xray-marker marker-${index + 1}`} key={finding.title}>{finding.toothArea}</span>
                ))}
                <button className="xray-expand" aria-label="Open X-ray full screen"><Maximize2 size={17} /></button>
              </div>
              <div className="xray-controls">
                <Control label="Brightness" value="0" />
                <Control label="Contrast" value="+8" />
                <Control label="Zoom" value="128%" />
                <button><ZoomIn size={14} /> Enhance</button>
                <button><Camera size={14} /> Compare</button>
              </div>
            </div>
            <div className="xray-thumbs">
              {[1, 2, 3, 4].map((thumb) => (
                <button className={thumb === 2 ? "active" : ""} key={thumb}>
                  <img src="/demo-bitewing-xray.png" alt="" />
                </button>
              ))}
            </div>
          </article>
        </div>

        <div className="clinical-right">
          <article className="clinical-card tooth-inspector-card">
            <div className="clinical-heading">
              <h3>Tooth Inspector</h3>
              <button onClick={() => onCreateTask(`Review tooth #${selectedTooth} clinical chart`)}><Save size={14} />Review</button>
            </div>
            <div className="tooth-inspector-hero">
              <span>#{convertToNotation(selectedTooth, notationSystem, dentition)}</span>
              <div>
                <strong>{selectedEntries.length} charted items</strong>
                <small>{selectedScope} · {selectedTeeth.length} teeth · {selectedSurfaces.join("")} selected</small>
              </div>
            </div>
            <div className="selection-summary">
              <span>Selected teeth</span>
              <strong>{selectedTeeth.map((tooth) => convertToNotation(tooth, notationSystem, dentition)).join(", ")}</strong>
            </div>
            <div className="chart-entry-list">
              {selectedEntries.length === 0 ? (
                <p>No charted procedures on this tooth yet. Click a surface and add a note or filling.</p>
              ) : (
                selectedEntries.map((entry) => (
                  <div className="chart-entry" key={entry.id}>
                    <span className={`status-dot ${statusClass(entry.status)}`} />
                    <div>
                      <strong>{entry.surfaces.join("")} · {entry.description}</strong>
                      <small>{entry.code} · {entry.status} · {entry.provider}</small>
                      <p>{entry.note}</p>
                    </div>
                    {entry.fee > 0 && <b>{currency(entry.fee)}</b>}
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="clinical-card code-card procedure-search-card">
            <div className="clinical-heading">
              <h3>Procedure Code Search</h3>
              <button onClick={() => onCreateTask("Provider to verify CDT code against current manual")}>Add from plan</button>
            </div>
            <p className="code-warning">Demo seed only. A licensed CDT source must be imported by the practice before production billing.</p>
            <label className="code-search">
              <span>Search by phrase, code, or surface</span>
              <input value={procedureQuery} onChange={(event) => setProcedureQuery(event.target.value)} placeholder="crown, MOD filling, D2393" />
            </label>
            <div className={`validation-box ${activeValidation.severity}`}>
              <strong>{selectedCatalogCode.code} · {activeValidation.claimReadinessScore}% ready</strong>
              {activeValidation.messages.slice(0, 2).map((message) => <span key={message}>{message}</span>)}
              {activeValidation.missingDocumentation.slice(0, 2).map((item) => <span key={item}>Missing: {item}</span>)}
            </div>
            {procedureSearchResults.map((procedure) => (
              <button className="procedure-result" key={procedure.id} onClick={() => setProcedureQuery(procedure.code)}>
                <div>
                  <strong>{procedure.code} · {procedure.plainEnglishDescription}</strong>
                  <span>{procedure.category} · {procedure.allowedScopes.join(", ")}</span>
                  <small>{procedure.requiredClinicalEvidence.join(" · ")}</small>
                </div>
                <b>{currency(procedure.defaultFee)}</b>
              </button>
            ))}
            {codeOptions.map((code) => (
              <div className="code-option" key={code.code}>
                <div>
                  <strong>{code.code}</strong>
                  <span>{code.label}</span>
                  <small>{code.appliesTo}</small>
                </div>
                <ConfidenceChip confidence={code.confidence} />
              </div>
            ))}
            <div className="admin-import-box">
              <strong>Admin CDT Import Ready</strong>
              <span>Versioned code tables, fee schedules, tooth/surface rules, insurance metadata, and audit trails are modeled for a licensed import workflow.</span>
            </div>
            <h4>Documentation Required</h4>
            <ul className="doc-list">
              {codeOptions[0]?.documentation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="clinical-card treatment-queue">
            <div className="clinical-heading">
              <h3>Treatment Plan Queue</h3>
              <strong>{currency(treatmentQueueTotal)}</strong>
            </div>
            {treatmentQueue.map((procedure, index) => (
              <div className="plan-row" key={`${procedure.code}-${index}`}>
                <span>{index + 1}</span>
                <div>
                  <strong>{procedure.tooth ? `${procedure.tooth} · ` : ""}{procedure.description}</strong>
                  <small>{procedure.code}{procedure.surface ? ` · ${procedure.surface}` : ""}</small>
                </div>
                <b>{currency(procedure.fee)}</b>
              </div>
            ))}
          </article>
        </div>
      </div>

      <div className="imaging-bottom clinical-worklist">
        <div>
          <h4>AI Findings ({imagingFindings.length})</h4>
          {imagingFindings.map((finding) => (
            <div className="ai-finding" key={finding.title}>
              <AlertTriangle size={15} />
              <span>{finding.title}: {finding.detail}</span>
              <RiskChip risk={finding.severity} />
            </div>
          ))}
        </div>
        <div>
          <h4>Attachments & X-ray Checklist</h4>
          {checklist.map((item) => (
            <div className="checkline" key={item.label}>
              <input type="checkbox" checked={item.complete} readOnly />
              <span>{item.label}</span>
              <strong className={item.complete ? "complete" : item.required ? "missing" : ""}>{item.complete ? "Complete" : item.required ? "Missing" : "Optional"}</strong>
            </div>
          ))}
        </div>
        <div className="narrative-box">
          <h4>Narrative Generator</h4>
          <p>{getNarrativeDraft(patient)}</p>
          <button onClick={() => onCreateTask("Insert provider-reviewed clinical narrative")}><Copy size={14} />Insert to clinical note</button>
        </div>
      </div>

        <div className="wish-actions">
        {[
          ["One-click crown narrative", Wand2],
          ["Pre-auth packet builder", FilePlus2],
          ["Missing attachment detector", ClipboardCheck],
          ["Before/after compare", ImageIcon],
          ["Chairside patient estimate", Sparkles],
          ["AI diagnostic checklist", BrainCircuit],
          ["Hygiene recall gap", Stethoscope],
          ["Clinical handoff note", Copy],
          ["Finalize surfaces + codes", CheckCircle2]
        ].map(([label, Icon]) => {
          const TypedIcon = Icon as typeof Wand2;
          return (
            <button key={String(label)} onClick={() => onCreateTask(String(label))}>
              <TypedIcon size={18} />
              <span>{String(label)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ModernOdontogram({
  dentition,
  notationSystem,
  entries,
  findings,
  selectedTeeth,
  selectedTooth,
  selectedSurfaces,
  onSelectTooth,
  onSurfaceClick
}: {
  dentition: Dentition;
  notationSystem: NotationSystem;
  entries: ChartEntry[];
  findings: ToothFinding[];
  selectedTeeth: number[];
  selectedTooth: number;
  selectedSurfaces: ToothSurface[];
  onSelectTooth: (tooth: number, additive?: boolean) => void;
  onSurfaceClick: (surface: ToothSurface) => void;
}) {
  const upper = dentition === "Adult" ? upperTeeth : pediatricUpperTeeth;
  const lower = dentition === "Adult" ? lowerTeeth : pediatricLowerTeeth;

  function renderRow(teeth: number[], arch: "upper" | "lower") {
    return (
      <div className={`odontogram-row ${arch} ${dentition.toLowerCase()}`}>
        {teeth.map((tooth) => {
          const finding = findings.find((item) => item.tooth === tooth);
          const entry = entries.find((item) => item.tooth === tooth);
          const condition = entry?.condition ?? finding?.condition ?? "watch";
          const surfaceOptions = surfaceOptionsForTooth(tooth, dentition);
          const chartedRecords = new Map((entry?.surfaceRecords ?? []).map((record) => [record.surface, record]));
          const chartedSurfaces = new Set(entry?.surfaces ?? []);
          const selected = selectedTeeth.includes(tooth);
          return (
            <div
              className={`modern-tooth ${condition} ${selected ? "selected" : ""} ${selectedTooth === tooth ? "focused" : ""}`}
              key={tooth}
            >
              <button
                className="tooth-select-button"
                onClick={(event) => onSelectTooth(tooth, event.shiftKey)}
                aria-label={`Select tooth ${convertToNotation(tooth, notationSystem, dentition)}`}
              >
                <span className="tooth-label">{convertToNotation(tooth, notationSystem, dentition)}</span>
              </button>
              <span className="tooth-surfaces" aria-hidden="true">
                {surfaceOptions.map((surface) => (
                  <button
                    className={`mini-surface ${surface.toLowerCase()} ${chartedSurfaces.has(surface) ? `charted ${chartedRecords.get(surface)?.condition ?? condition}` : ""} ${selected && selectedSurfaces.includes(surface) ? "active" : ""}`}
                    key={surface}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectTooth(tooth);
                      onSurfaceClick(surface);
                    }}
                    aria-label={`Select ${surfaceLabel(surface)} surface on tooth ${convertToNotation(tooth, notationSystem, dentition)}`}
                  >
                    {surface}
                  </button>
                ))}
              </span>
              {(finding || entry) && <b>{entry?.code ?? finding?.condition}</b>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="odontogram-stage">
      {renderRow(upper, "upper")}
      <div className="arch-divider">
        <span>Upper</span>
        <i />
        <span>Lower</span>
      </div>
      {renderRow(lower, "lower")}
    </div>
  );
}

function ToothArch({
  teeth,
  entries,
  findings,
  selectedTooth,
  onSelect,
  arch
}: {
  teeth: number[];
  entries: ChartEntry[];
  findings: ToothFinding[];
  selectedTooth: number;
  onSelect: (tooth: number) => void;
  arch: "upper" | "lower";
}) {
  return (
    <div className={`tooth-arch ${arch}`}>
      {teeth.map((tooth) => {
        const finding = findings.find((item) => item.tooth === tooth);
        const entry = entries.find((item) => item.tooth === tooth);
        const condition = entry?.condition ?? finding?.condition ?? "";
        return (
          <button
            className={`tooth ${condition} ${selectedTooth === tooth ? "selected" : ""}`}
            key={tooth}
            onClick={() => onSelect(tooth)}
            aria-label={`Tooth ${tooth}`}
          >
            <span className="tooth-number">{tooth}</span>
            <span className="tooth-shape">
              {["M", "O", "D"].map((surface) => (
                <i key={surface} className={entry?.surfaces.includes(surface as ToothSurface) ? "charted" : ""} />
              ))}
            </span>
            {(finding || entry) && <i className={`condition-dot ${condition}`} />}
          </button>
        );
      })}
    </div>
  );
}

function SurfaceMap({
  tooth,
  dentition,
  selectedSurfaces,
  condition,
  entries,
  status,
  onSurfaceClick
}: {
  tooth: number;
  dentition: Dentition;
  selectedSurfaces: ToothSurface[];
  condition: ToothCondition;
  entries: ChartEntry[];
  status: ChartStatus;
  onSurfaceClick: (surface: ToothSurface) => void;
}) {
  const visibleSurfaces = surfaceOptionsForTooth(tooth, dentition);
  const surfaceRecords = new Map(entries.flatMap((entry) => entry.surfaceRecords ?? []).map((record) => [record.surface, record]));
  return (
    <div className="surface-map" aria-label="Clickable tooth surfaces">
      {visibleSurfaces.map((surface) => {
        const chartedRecord = surfaceRecords.get(surface);
        const legacyEntry = entries.find((entry) => entry.surfaces.includes(surface));
        const chartedCondition = chartedRecord?.condition ?? legacyEntry?.condition;
        return (
          <button
            className={`${surface.toLowerCase()} ${selectedSurfaces.includes(surface) ? "active" : ""} ${chartedCondition ?? condition}`}
            key={surface}
            onClick={() => onSurfaceClick(surface)}
            title={`${surfaceLabel(surface)} surface`}
          >
            <strong>{surface}</strong>
            <span>{surfaceLabel(surface)}</span>
            {selectedSurfaces.includes(surface) && <small>{status}</small>}
          </button>
        );
      })}
    </div>
  );
}

function StructuredSurfacePreview({
  tooth,
  surfaces: selectedSurfaces,
  condition,
  status,
  code,
  dentition
}: {
  tooth: number;
  surfaces: ToothSurface[];
  condition: ToothCondition;
  status: ChartStatus;
  code: string;
  dentition: Dentition;
}) {
  const records = createSurfaceRecords({
    tooth,
    surfaces: reconcileSurfacesForTooth(selectedSurfaces, tooth, dentition),
    condition,
    status,
    code,
    note: "Draft surface selection",
    source: "manual"
  });

  return (
    <div className="structured-surface-preview">
      <div>
        <span>Structured chart data</span>
        <strong>{records.length} surface record{records.length === 1 ? "" : "s"} ready</strong>
      </div>
      <div className="surface-record-grid">
        {records.map((record) => (
          <span className={`surface-record ${record.condition}`} key={`${record.surface}-${record.condition}`}>
            <b>{record.surface}</b>
            {record.label} · {record.condition} · {record.coverage}
          </span>
        ))}
      </div>
    </div>
  );
}

function Tooth3DViewer({ tooth, surfaces: selectedSurfaces, condition }: { tooth: number; surfaces: ToothSurface[]; condition: ToothCondition }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fbff");
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 2.1, 7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight("#ffffff", 2.5);
    key.position.set(3, 5, 4);
    scene.add(key);
    scene.add(new THREE.AmbientLight("#bcd7ff", 1.4));

    const group = new THREE.Group();
    scene.add(group);

    const enamel = new THREE.MeshStandardMaterial({ color: "#fbf7ec", roughness: 0.48, metalness: 0.02 });
    const rootMat = new THREE.MeshStandardMaterial({ color: "#ead3b5", roughness: 0.7 });
    const fillMat = new THREE.MeshStandardMaterial({ color: surfaceColor(condition), roughness: 0.32, metalness: 0.08 });

    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.28, 48, 28), enamel);
    crown.scale.set(1.18, 0.88, 0.96);
    crown.position.y = 0.9;
    group.add(crown);

    [-0.52, 0.52].forEach((x) => {
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.15, 2.55, 24), rootMat);
      root.position.set(x, -0.72, 0);
      root.rotation.z = x > 0 ? -0.08 : 0.08;
      group.add(root);
    });

    const grooveMat = new THREE.MeshStandardMaterial({ color: "#d6c9b8", roughness: 0.85 });
    const groove = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.025, 12, 60), grooveMat);
    groove.rotation.x = Math.PI / 2;
    groove.position.set(0, 1.55, 0.03);
    group.add(groove);

    selectedSurfaces.forEach((surface, index) => {
      const restoration = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.32), fillMat);
      const offset = surfaceOffset(surface);
      restoration.position.set(offset.x, 1.82 + index * 0.012, offset.z);
      restoration.rotation.y = offset.rotate;
      group.add(restoration);
    });

    const grid = new THREE.GridHelper(5, 8, "#d6e2ef", "#e8eff7");
    grid.position.y = -2.04;
    scene.add(grid);

    let frame = 0;
    const resizeObserver = new ResizeObserver(() => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    });
    resizeObserver.observe(mount);

    function animate() {
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.006;
      group.rotation.x = Math.sin(Date.now() * 0.0008) * 0.05;
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [condition, selectedSurfaces, tooth]);

  return <div className="tooth-3d-canvas" ref={mountRef} role="img" aria-label={`3D rendering of tooth ${tooth}`} />;
}

function Control({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span>{label}</span>
      <input type="range" min="-10" max="10" defaultValue="0" />
      <strong>{value}</strong>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="clinical-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function seedChartEntries(patient: Patient): ChartEntry[] {
  return patient.toothFindings.map((finding, index) => {
    const procedure = buildProcedure(finding.condition, finding.tooth, normalizeSurfaces(finding.surface));
    const normalizedSurfaces = reconcileSurfacesForTooth(normalizeSurfaces(finding.surface), finding.tooth, "Adult");
    const status: ChartStatus = finding.condition === "watch" ? "Watch" : finding.condition === "restoration" ? "Existing" : "Planned";
    const note = finding.note;
    return {
      id: `${patient.id}-finding-${index}`,
      tooth: finding.tooth,
      surfaces: normalizedSurfaces,
      surfaceRecords: createSurfaceRecords({
        tooth: finding.tooth,
        surfaces: normalizedSurfaces,
        condition: finding.condition,
        status,
        code: procedure.code,
        note,
        source: "seed"
      }),
      coverage: coverageForCondition(finding.condition),
      condition: finding.condition,
      status,
      code: procedure.code,
      description: procedure.description,
      fee: finding.condition === "watch" || finding.condition === "restoration" ? 0 : procedure.fee,
      note,
      provider: patient.provider,
      createdAt: "Seed"
    };
  });
}

function normalizeSurfaces(surfaceText: string): ToothSurface[] {
  if (/all|full/i.test(surfaceText)) return ["M", "O", "D", "B", "L"];
  const normalized = surfaceText.toUpperCase().split("").filter((surface): surface is ToothSurface => allSurfaces.includes(surface as ToothSurface));
  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["O"];
}

function isAnteriorTooth(tooth: number, dentition: Dentition) {
  if (dentition === "Pediatric") return (tooth >= 3 && tooth <= 8) || (tooth >= 13 && tooth <= 18);
  return (tooth >= 6 && tooth <= 11) || (tooth >= 22 && tooth <= 27);
}

function surfaceOptionsForTooth(tooth: number, dentition: Dentition): ToothSurface[] {
  return isAnteriorTooth(tooth, dentition) ? anteriorSurfaces : posteriorSurfaces;
}

function reconcileSurfacesForTooth(selected: ToothSurface[], tooth: number, dentition: Dentition): ToothSurface[] {
  const options = surfaceOptionsForTooth(tooth, dentition);
  const mapped = selected.map<ToothSurface>((surface) => {
    if (isAnteriorTooth(tooth, dentition) && surface === "O") return "I";
    if (isAnteriorTooth(tooth, dentition) && surface === "B") return "F";
    if (!isAnteriorTooth(tooth, dentition) && surface === "I") return "O";
    if (!isAnteriorTooth(tooth, dentition) && surface === "F") return "B";
    return surface;
  });
  const filtered = mapped.filter((surface): surface is ToothSurface => options.includes(surface as ToothSurface));
  return filtered.length > 0 ? Array.from(new Set(filtered)) : [options.includes("O") ? "O" : "I"];
}

function fullCoverageSurfaces(tooth: number, dentition: Dentition) {
  return surfaceOptionsForTooth(tooth, dentition).filter((surface) => surface !== "R");
}

function surfaceLabel(surface: ToothSurface) {
  const labels: Record<ToothSurface, string> = {
    M: "Mesial",
    O: "Occlusal",
    I: "Incisal",
    D: "Distal",
    B: "Buccal",
    F: "Facial",
    L: "Lingual",
    R: "Root"
  };
  return labels[surface];
}

function createSurfaceRecords(params: {
  tooth: number;
  surfaces: ToothSurface[];
  condition: ToothCondition;
  status: ChartStatus;
  code: string;
  note: string;
  source: "manual" | "command" | "ai-suggestion" | "seed";
}): DentalSurfaceRecord[] {
  const coverage = coverageForCondition(params.condition);
  return params.surfaces.map((surface) => ({
    surface,
    label: surfaceLabel(surface),
    condition: params.condition,
    status: params.status,
    material: materialForCondition(params.condition, params.code),
    extent: extentForCondition(params.condition, params.surfaces.length),
    coverage: surface === "R" ? "root" : coverage,
    code: params.code,
    note: params.note,
    source: params.source,
    chartedAt: "Today"
  }));
}

function coverageForCondition(condition: ToothCondition) {
  if (condition === "crown") return "full-coverage";
  if (condition === "missing") return "missing-tooth";
  if (condition === "watch") return "watch";
  if (condition === "rct") return "root";
  return "surface";
}

function materialForCondition(condition: ToothCondition, code: string) {
  if (condition === "crown") return code === "D2750" ? "porcelain-metal" : "ceramic";
  if (condition === "restoration" || condition === "caries") return "composite";
  return "none";
}

function extentForCondition(condition: ToothCondition, surfaceCount: number) {
  if (condition === "crown" || condition === "missing") return "full";
  if (condition === "watch") return "incipient";
  if (surfaceCount >= 4) return "extensive";
  if (surfaceCount >= 2) return "moderate";
  return "localized";
}

function buildProcedure(condition: ToothCondition, tooth: number, selectedSurfaces: ToothSurface[]): ProcedureLine {
  const restorativeSurfaces = selectedSurfaces.filter((surface) => surface !== "R");
  const surfaceCount = restorativeSurfaces.length || 1;
  if (condition === "crown") return { code: "D2740", description: "Porcelain/ceramic crown", fee: 1280, category: "major", tooth: String(tooth) };
  if (condition === "rct") return { code: "D3330", description: "Molar root canal therapy", fee: 1420, category: "major", tooth: String(tooth) };
  if (condition === "watch") return { code: "WATCH", description: "Clinical watch note", fee: 0, category: "basic", tooth: String(tooth), surface: selectedSurfaces.join("") };
  const code = surfaceCount <= 1 ? "D2391" : surfaceCount === 2 ? "D2392" : surfaceCount === 3 ? "D2393" : "D2394";
  const description = `Posterior composite - ${surfaceCount} surface${surfaceCount > 1 ? "s" : ""}`;
  return { code, description, fee: 185 + Math.max(surfaceCount - 1, 0) * 75, category: "basic", tooth: String(tooth), surface: selectedSurfaces.join("") };
}

function smartNote(condition: ToothCondition, tooth: number, selectedSurfaces: ToothSurface[], status: ChartStatus) {
  const surfaceText = selectedSurfaces.join("");
  if (condition === "watch") return `${status} watch on tooth #${tooth} ${surfaceText}. Re-evaluate at next recall with radiograph/photos as indicated.`;
  if (condition === "crown") return `${status} crown on tooth #${tooth}. Existing structure and radiographic findings reviewed; provider to verify final narrative.`;
  if (condition === "rct") return `${status} endodontic therapy on tooth #${tooth}. Symptoms, testing, and diagnostic imaging require provider confirmation.`;
  return `${status} composite restoration charted on tooth #${tooth} ${surfaceText} for caries/restoration replacement. Provider reviewed surfaces and documentation.`;
}

function surfaceColor(condition: ToothCondition) {
  const colors: Record<ToothCondition, string> = {
    caries: "#e5484d",
    restoration: "#3b82f6",
    crown: "#c59d5f",
    rct: "#8b5cf6",
    implant: "#64748b",
    missing: "#94a3b8",
    watch: "#f59e0b"
  };
  return colors[condition];
}

function surfaceOffset(surface: ToothSurface) {
  const offsets: Record<ToothSurface, { x: number; z: number; rotate: number }> = {
    O: { x: 0, z: 0, rotate: 0 },
    I: { x: 0, z: 0, rotate: 0 },
    M: { x: -0.46, z: 0, rotate: 0.25 },
    D: { x: 0.46, z: 0, rotate: -0.25 },
    B: { x: 0, z: -0.4, rotate: 0 },
    L: { x: 0, z: 0.4, rotate: 0 },
    F: { x: 0, z: -0.52, rotate: 0 },
    R: { x: 0, z: 0.56, rotate: 0 }
  };
  return offsets[surface];
}

function conditionFromCode(code: string): ToothCondition {
  if (code === "WATCH") return "watch";
  if (code === "D2740" || code === "D2750" || code === "D6240") return "crown";
  if (code === "D3330") return "rct";
  if (code === "D7140") return "missing";
  if (code.startsWith("D23")) return "caries";
  return "restoration";
}

function quadrantTeeth(quadrant: string, dentition: Dentition) {
  const adult: Record<string, number[]> = {
    UR: [1, 2, 3, 4, 5, 6, 7, 8],
    UL: [9, 10, 11, 12, 13, 14, 15, 16],
    LL: [17, 18, 19, 20, 21, 22, 23, 24],
    LR: [25, 26, 27, 28, 29, 30, 31, 32]
  };
  const pediatric: Record<string, number[]> = {
    UR: [1, 2, 3, 4, 5],
    UL: [6, 7, 8, 9, 10],
    LL: [11, 12, 13, 14, 15],
    LR: [16, 17, 18, 19, 20]
  };
  return dentition === "Adult" ? adult[quadrant] ?? [] : pediatric[quadrant] ?? [];
}

function archTeeth(arch: string, dentition: Dentition) {
  if (dentition === "Adult") return arch === "Upper" ? upperTeeth : lowerTeeth;
  return arch === "Upper" ? pediatricUpperTeeth : pediatricLowerTeeth;
}

function statusClass(status: ChartStatus) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
