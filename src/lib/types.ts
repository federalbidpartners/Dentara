export type ReadinessBand = "Ready" | "Attention" | "Not Ready";
export type Confidence = "High" | "Medium" | "Low";
export type Risk = "Low" | "Medium" | "High";
export type Role = "Front Desk" | "Billing Lead" | "Owner" | "Compliance Officer";
export type ToothCondition = "caries" | "restoration" | "crown" | "rct" | "implant" | "missing" | "watch";
export type ToothSurface = "O" | "M" | "D" | "B" | "L" | "F";
export type ChartStatus = "Existing" | "Planned" | "Completed" | "Watch";

export interface Patient {
  id: string;
  name: string;
  age: number;
  dob: string;
  phone: string;
  plan: string;
  memberId: string;
  provider: string;
  appointmentTime: string;
  visitType: string;
  confirmed: boolean;
  formsComplete: boolean;
  medicalHistoryCurrent: boolean;
  insuranceActive: boolean;
  eligibilityCheckedDaysAgo: number;
  annualMax: number;
  annualMaxRemaining: number;
  deductible: number;
  deductibleMet: number;
  preventiveCoverage: number;
  basicCoverage: number;
  majorCoverage: number;
  frequency: string;
  waitingPeriods: string;
  plannedProcedure: ProcedureLine;
  balanceDue: number;
  attachments: string[];
  xrayAgeMonths: number;
  claimSubmitted: boolean;
  eraPosted: boolean;
  lastOutreachDaysAgo: number;
  unscheduledTreatment: number;
  perioRisk: Risk;
  bleedingPercent: number;
  plaquePercent: number;
  clinicalHandoff: string;
  toothFindings: ToothFinding[];
}

export interface ProcedureLine {
  code: string;
  description: string;
  fee: number;
  category: "preventive" | "basic" | "major";
  tooth?: string;
  surface?: string;
  narrative?: string;
}

export interface BenefitSummary {
  confidence: Confidence;
  missingFields: string[];
  caveats: string[];
  annualMaxRemaining: number;
  deductibleRemaining: number;
  coverageText: string;
}

export interface ClaimFinding {
  severity: "blocker" | "warning" | "info";
  title: string;
  detail: string;
  fix: string;
}

export interface ClaimGuardResult {
  risk: Risk;
  score: number;
  findings: ClaimFinding[];
}

export interface EstimateResult {
  totalFee: number;
  insuranceEstimate: number;
  patientEstimate: number;
  deductibleApplied: number;
  coinsurance: number;
  confidence: Confidence;
  caveats: string[];
}

export interface ReadinessResult {
  score: number;
  band: ReadinessBand;
  reasons: string[];
}

export interface Task {
  id: string;
  patientId: string;
  owner: Role;
  title: string;
  due: string;
  status: "Open" | "In Progress" | "Done";
  severity: Risk;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  reason: string;
  phiAccess: boolean;
}

export interface RevenueLeak {
  label: string;
  value: number;
  detail: string;
  severity: Risk;
}

export interface ToothFinding {
  tooth: number;
  surface: string;
  condition: ToothCondition;
  severity: Risk;
  note: string;
}

export interface ChartEntry {
  id: string;
  tooth: number;
  surfaces: ToothSurface[];
  condition: ToothCondition;
  status: ChartStatus;
  code: string;
  description: string;
  fee: number;
  note: string;
  provider: string;
  createdAt: string;
}

export interface CodeRecommendation {
  code: string;
  label: string;
  confidence: Confidence;
  appliesTo: string;
  documentation: string[];
  caveats: string[];
}

export interface ImagingFinding {
  title: string;
  detail: string;
  severity: Risk;
  toothArea: string;
}

export interface ClinicalAiSuggestion {
  id: string;
  source: "X-ray" | "Clinical note" | "Perio" | "Benefits" | "Schedule";
  title: string;
  detail: string;
  evidence: string[];
  nextStep: string;
  confidence: Confidence;
  risk: Risk;
  requiresProviderReview: boolean;
}

export interface ScheduleInsight {
  id: string;
  title: string;
  detail: string;
  impact: string;
  action: string;
  risk: Risk;
}
