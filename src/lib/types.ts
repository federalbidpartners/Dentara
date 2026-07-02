export type ReadinessBand = "Ready" | "Attention" | "Not Ready";
export type Confidence = "High" | "Medium" | "Low";
export type Risk = "Low" | "Medium" | "High";
export type Role = "Front Desk" | "Billing Lead" | "Owner" | "Compliance Officer";
export type ToothCondition = "caries" | "restoration" | "crown" | "rct" | "implant" | "missing" | "watch";
export type ToothSurface = "M" | "O" | "I" | "D" | "B" | "F" | "L" | "R";
export type ChartStatus = "Existing" | "Planned" | "Completed" | "Watch" | "Referred" | "Declined" | "Insurance Pending";
export type NotationSystem = "Universal" | "Palmer" | "FDI";
export type Dentition = "Adult" | "Pediatric";
export type ProcedureScope = "tooth" | "surface" | "quadrant" | "arch" | "full-mouth";
export type TreatmentPlanStatus = "draft" | "proposed" | "accepted" | "scheduled" | "completed" | "billed" | "paid" | "denied" | "referred" | "declined";
export type RestorationCoverage = "surface" | "full-coverage" | "root" | "missing-tooth" | "watch";
export type RestorationMaterial = "composite" | "ceramic" | "porcelain-metal" | "amalgam" | "temporary" | "none";
export type SurfaceExtent = "incipient" | "localized" | "moderate" | "extensive" | "full";

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

export interface ProcedureCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CodeVersion {
  id: string;
  label: string;
  effectiveDate: string;
  importedAt: string;
  source: "demo" | "licensed-import";
}

export interface ProcedureCode {
  id: string;
  code: string;
  codeVersionId: string;
  officialDescription: string;
  plainEnglishDescription: string;
  categoryId: string;
  category: string;
  active: boolean;
  effectiveDate: string;
  retirementDate?: string;
  replacementCode?: string;
  requiresTooth: boolean;
  requiresSurface: boolean;
  allowedScopes: ProcedureScope[];
  defaultFee: number;
  synonyms: string[];
  insuranceBillingMetadata: {
    payerReviewRisk: Risk;
    preAuthRecommended: boolean;
    narrativeRecommended: boolean;
  };
  requiredClinicalEvidence: string[];
  attachmentsRequired: string[];
  favoriteRank?: number;
}

export interface ProcedureToothRule {
  procedureCodeId: string;
  validDentitions: Dentition[];
  validSurfaces: ToothSurface[];
  validScopes: ProcedureScope[];
  toothRequired: boolean;
  surfaceRequired: boolean;
}

export interface TreatmentPlanItem {
  id: string;
  patientId: string;
  providerId: string;
  toothNumber?: string;
  notationSystem: NotationSystem;
  surfaces: ToothSurface[];
  scope: ProcedureScope;
  quadrant?: "UR" | "UL" | "LR" | "LL";
  arch?: "Upper" | "Lower";
  procedureCodeId: string;
  procedureCodeVersionId: string;
  status: TreatmentPlanStatus;
  fee: number;
  insuranceEstimate: number;
  patientEstimate: number;
  clinicalNotes: string;
  documentationRequirements: string[];
  attachments: string[];
  claimReadinessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcedureValidationResult {
  valid: boolean;
  severity: "pass" | "draft" | "blocked";
  messages: string[];
  missingDocumentation: string[];
  claimReadinessScore: number;
}

export interface SmartProcedureSuggestion {
  id: string;
  procedureCode: ProcedureCode;
  confidence: Confidence;
  reason: string;
  scope: ProcedureScope;
  toothNumber?: string;
  surfaces: ToothSurface[];
  documentation: string[];
  denialWarnings: string[];
  claimReadinessScore: number;
}

export interface ChartCommandResult {
  raw: string;
  reviewRequired: boolean;
  intent: "procedure" | "multi-tooth" | "full-mouth" | "unknown";
  toothNumbers: number[];
  surfaces: ToothSurface[];
  matchedCode?: ProcedureCode;
  scope: ProcedureScope;
  note: string;
  errors: string[];
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
  surfaceRecords: DentalSurfaceRecord[];
  coverage: RestorationCoverage;
  condition: ToothCondition;
  status: ChartStatus;
  code: string;
  description: string;
  fee: number;
  note: string;
  provider: string;
  createdAt: string;
}

export interface DentalSurfaceRecord {
  surface: ToothSurface;
  label: string;
  condition: ToothCondition;
  status: ChartStatus;
  material: RestorationMaterial;
  extent: SurfaceExtent;
  coverage: RestorationCoverage;
  code: string;
  note: string;
  source: "manual" | "command" | "ai-suggestion" | "seed";
  chartedAt: string;
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
  source: "X-ray" | "Clinical note" | "Perio" | "Benefits" | "Schedule" | "Insurance";
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

export interface DiagnosticAssistResult {
  risk: Risk;
  confidence: Confidence;
  likelyFocus: string;
  checklist: string[];
  noteSections: string[];
  contraindicationPrompts: string[];
  guardrails: string[];
}

export type InsuranceTransactionKind = "270/271" | "837D" | "275" | "276/277" | "835";
export type InsuranceTransactionStatus = "Ready" | "Needs Review" | "Blocked";

export interface InsuranceWorkflowStep {
  id: string;
  transaction: InsuranceTransactionKind;
  label: string;
  status: InsuranceTransactionStatus;
  detail: string;
  action: string;
  vendorEndpoint: string;
}

export interface ClearinghouseOption {
  name: string;
  fit: string;
  transactions: InsuranceTransactionKind[];
  implementationNote: string;
  category?: string;
  status?: "Contract needed" | "Sandbox target" | "Attachment specialist" | "PMS bridge" | "Eligibility specialist";
  differentiator?: string;
}

export interface ClaimSubmissionSummary {
  cleanClaimRate: number;
  readyClaims: number;
  reviewClaims: number;
  blockedClaims: number;
  attachmentGaps: number;
  estimatedRecoverable: number;
  submissionQueueLabel: string;
}

export interface PracticeGrowthFeature {
  title: string;
  detail: string;
  metric: string;
  owner: Role;
}
