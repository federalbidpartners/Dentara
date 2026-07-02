import {
  ChartCommandResult,
  CodeVersion,
  Confidence,
  Dentition,
  ProcedureCategory,
  ProcedureCode,
  ProcedureScope,
  ProcedureToothRule,
  ProcedureValidationResult,
  SmartProcedureSuggestion,
  ToothSurface,
  TreatmentPlanItem
} from "./types";

export const demoCodeVersion: CodeVersion = {
  id: "demo-cdt-2026",
  label: "Demo CDT-style seed 2026",
  effectiveDate: "2026-01-01",
  importedAt: "2026-07-02",
  source: "demo"
};

export const procedureCategories: ProcedureCategory[] = [
  { id: "diagnostic", name: "Diagnostic", sortOrder: 1 },
  { id: "preventive", name: "Preventive", sortOrder: 2 },
  { id: "restorative", name: "Restorative", sortOrder: 3 },
  { id: "endo", name: "Endodontics", sortOrder: 4 },
  { id: "perio", name: "Periodontics", sortOrder: 5 },
  { id: "fixed", name: "Fixed Prosthodontics", sortOrder: 6 },
  { id: "surgery", name: "Oral Surgery", sortOrder: 7 },
  { id: "internal", name: "Internal Charting", sortOrder: 99 }
];

// Demo seed only. Do not replace this with the full CDT set unless the practice provides
// a licensed ADA CDT source file through the admin import workflow.
export const procedureCodes: ProcedureCode[] = [
  codeSeed("pc-D0140", "D0140", "Limited oral evaluation demo label", "Problem-focused exam", "diagnostic", false, false, ["full-mouth"], 145, ["limited exam", "problem exam", "emergency exam"], ["Clinical concern", "Provider findings"], []),
  codeSeed("pc-D1110", "D1110", "Adult prophylaxis demo label", "Adult cleaning", "preventive", false, false, ["full-mouth"], 138, ["cleaning", "prophy adult", "adult prophy"], ["Periodontal status reviewed"], []),
  codeSeed("pc-D2391", "D2391", "Posterior composite one-surface demo label", "White filling - one surface", "restorative", true, true, ["surface"], 185, ["white filling", "composite", "one surface filling"], ["Tooth", "Surface", "Caries/restoration note"], []),
  codeSeed("pc-D2392", "D2392", "Posterior composite two-surface demo label", "White filling - two surfaces", "restorative", true, true, ["surface"], 310, ["white filling", "two surface filling", "MO filling", "DO filling"], ["Tooth", "Surfaces", "Caries/restoration note"], ["X-ray if payer requires"]),
  codeSeed("pc-D2393", "D2393", "Posterior composite three-surface demo label", "White filling - three surfaces", "restorative", true, true, ["surface"], 385, ["MOD filling", "three surface filling", "white filling"], ["Tooth", "Surfaces", "Caries/restoration note"], ["X-ray if payer requires"]),
  codeSeed("pc-D2394", "D2394", "Posterior composite four-plus-surface demo label", "White filling - four or more surfaces", "restorative", true, true, ["surface"], 470, ["large filling", "four surface filling", "white filling"], ["Tooth", "Surfaces", "Clinical note"], ["X-ray if payer requires"]),
  codeSeed("pc-D2740", "D2740", "Ceramic crown demo label", "Tooth-colored crown", "restorative", true, false, ["tooth"], 1280, ["crown", "ceramic crown", "cap"], ["Tooth", "Medical necessity narrative", "Material"], ["Pre-op X-ray", "Clinical photo"]),
  codeSeed("pc-D2750", "D2750", "PFM crown demo label", "Porcelain-metal crown", "restorative", true, false, ["tooth"], 1250, ["crown", "pfm crown", "cap"], ["Tooth", "Narrative", "Prior placement date if replacement"], ["Pre-op X-ray"]),
  codeSeed("pc-D3330", "D3330", "Molar endodontic therapy demo label", "Molar root canal", "endo", true, false, ["tooth"], 1420, ["root canal", "molar endo", "rct"], ["Diagnosis", "Pulpal/periapical status", "Testing"], ["PA X-ray"]),
  codeSeed("pc-D4910", "D4910", "Periodontal maintenance demo label", "Perio maintenance cleaning", "perio", false, false, ["full-mouth"], 220, ["perio maintenance", "perio cleaning"], ["Perio history", "Bleeding/plaque review"], ["Perio chart"]),
  codeSeed("pc-D6240", "D6240", "Pontic demo label", "Bridge replacement tooth", "fixed", true, false, ["tooth"], 1450, ["bridge", "pontic"], ["Pontic/abutment plan", "Narrative"], ["Pre-op X-ray", "Clinical photo"]),
  codeSeed("pc-D7140", "D7140", "Simple extraction demo label", "Remove erupted tooth", "surgery", true, false, ["tooth"], 290, ["extract", "extraction", "remove tooth"], ["Tooth", "Reason for extraction"], ["X-ray"]),
  codeSeed("pc-WATCH", "WATCH", "Internal watch note", "Monitor tooth or surface", "internal", false, false, ["tooth", "surface"], 0, ["watch", "monitor"], ["Watch note"], [])
];

export const procedureToothRules: ProcedureToothRule[] = procedureCodes.map((procedure) => ({
  procedureCodeId: procedure.id,
  validDentitions: ["Adult", "Pediatric"],
  validSurfaces: ["M", "O", "I", "D", "B", "F", "L", "R"],
  validScopes: procedure.allowedScopes,
  toothRequired: procedure.requiresTooth,
  surfaceRequired: procedure.requiresSurface
}));

export function searchProcedureCodes(query: string, limit = 6): ProcedureCode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return procedureCodes.filter((code) => code.favoriteRank).sort((a, b) => (a.favoriteRank ?? 99) - (b.favoriteRank ?? 99)).slice(0, limit);

  return procedureCodes
    .map((procedure) => {
      const haystack = [
        procedure.code,
        procedure.officialDescription,
        procedure.plainEnglishDescription,
        procedure.category,
        ...procedure.synonyms
      ].join(" ").toLowerCase();
      const exact = procedure.code.toLowerCase() === normalized ? 100 : 0;
      const phrase = haystack.includes(normalized) ? 40 : 0;
      const words = normalized.split(/\s+/).filter(Boolean).reduce((score, word) => score + (haystack.includes(word) ? 8 : 0), 0);
      return { procedure, score: exact + phrase + words + (procedure.favoriteRank ? 8 - procedure.favoriteRank : 0) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.procedure)
    .slice(0, limit);
}

export function suggestProcedureCodes(params: {
  toothNumber?: number;
  surfaces: ToothSurface[];
  scope: ProcedureScope;
  phrase?: string;
  attachments: string[];
  clinicalNotes?: string;
}): SmartProcedureSuggestion[] {
  const phraseMatches = searchProcedureCodes(params.phrase ?? "", 4);
  const surfaceCount = params.surfaces.filter((surface) => surface !== "R").length;
  const surfaceRestoration =
    surfaceCount <= 1 ? "D2391" : surfaceCount === 2 ? "D2392" : surfaceCount === 3 ? "D2393" : "D2394";
  const candidates = new Map<string, ProcedureCode>();

  if (params.scope === "surface" && params.toothNumber) {
    const procedure = procedureCodes.find((code) => code.code === surfaceRestoration);
    if (procedure) candidates.set(procedure.id, procedure);
  }

  phraseMatches.forEach((procedure) => candidates.set(procedure.id, procedure));
  if (params.scope === "full-mouth") {
    ["D1110", "D0140", "D4910"].forEach((code) => {
      const procedure = procedureCodes.find((item) => item.code === code);
      if (procedure) candidates.set(procedure.id, procedure);
    });
  }

  return [...candidates.values()].slice(0, 4).map((procedure) => {
    const validation = validateProcedureSelection({
      procedureCode: procedure,
      toothNumber: params.toothNumber ? String(params.toothNumber) : undefined,
      surfaces: params.surfaces,
      scope: procedure.requiresSurface ? "surface" : params.scope,
      serviceDate: "2026-07-02",
      attachments: params.attachments,
      clinicalNotes: params.clinicalNotes ?? ""
    });
    const confidence: Confidence = procedure.code === surfaceRestoration || phraseMatches[0]?.id === procedure.id ? "High" : validation.claimReadinessScore > 70 ? "Medium" : "Low";
    return {
      id: `suggest-${procedure.id}-${params.toothNumber ?? params.scope}`,
      procedureCode: procedure,
      confidence,
      reason: explainSuggestion(procedure, params.surfaces, params.toothNumber, params.scope),
      scope: procedure.requiresSurface ? "surface" : procedure.allowedScopes[0],
      toothNumber: params.toothNumber ? String(params.toothNumber) : undefined,
      surfaces: procedure.requiresSurface ? params.surfaces : [],
      documentation: procedure.requiredClinicalEvidence,
      denialWarnings: validation.messages.filter((message) => message.toLowerCase().includes("missing") || message.toLowerCase().includes("requires")),
      claimReadinessScore: validation.claimReadinessScore
    };
  });
}

export function validateProcedureSelection(params: {
  procedureCode: ProcedureCode;
  toothNumber?: string;
  surfaces: ToothSurface[];
  scope: ProcedureScope;
  serviceDate: string;
  attachments: string[];
  clinicalNotes: string;
}): ProcedureValidationResult {
  const messages: string[] = [];
  const missingDocumentation: string[] = [];
  let score = 100;

  if (!params.procedureCode.active) {
    messages.push(`${params.procedureCode.code} is inactive for the selected service date.`);
    score -= 35;
  }
  if (params.procedureCode.retirementDate && params.serviceDate > params.procedureCode.retirementDate) {
    messages.push(`${params.procedureCode.code} retired on ${params.procedureCode.retirementDate}.`);
    score -= 35;
  }
  if (params.procedureCode.requiresTooth && !params.toothNumber) {
    messages.push(`${params.procedureCode.code} requires a tooth selection.`);
    score -= 45;
  }
  if (params.procedureCode.requiresSurface && params.surfaces.length === 0) {
    messages.push(`${params.procedureCode.code} requires at least one valid surface.`);
    score -= 45;
  }
  if (!params.procedureCode.allowedScopes.includes(params.scope)) {
    messages.push(`${params.procedureCode.code} is valid for ${params.procedureCode.allowedScopes.join(", ")} scope, not ${params.scope}.`);
    score -= 35;
  }
  if (params.scope === "full-mouth" && params.toothNumber) {
    messages.push("Full-mouth procedures should not be attached to a single tooth.");
    score -= 35;
  }
  if (params.procedureCode.insuranceBillingMetadata.narrativeRecommended && params.clinicalNotes.trim().length < 18) {
    missingDocumentation.push("Provider narrative");
    score -= 12;
  }
  params.procedureCode.attachmentsRequired.forEach((attachment) => {
    const normalized = attachment.toLowerCase().split("-").join(" ");
    const hasAttachment = params.attachments.some((item) => {
      const attachmentText = item.split("-").join(" ");
      return normalized.includes(attachmentText) || attachmentText.includes(normalized.split(" ")[0]);
    });
    if (!hasAttachment) {
      missingDocumentation.push(attachment);
      score -= 10;
    }
  });

  const blocked = messages.some((message) => message.includes("requires") || message.includes("should not be attached") || message.includes("inactive") || message.includes("retired"));
  return {
    valid: !blocked,
    severity: blocked ? "blocked" : missingDocumentation.length > 0 ? "draft" : "pass",
    messages: messages.length > 0 ? messages : ["Selection is structurally valid."],
    missingDocumentation,
    claimReadinessScore: Math.max(0, Math.min(100, score))
  };
}

export function parseChartCommand(raw: string): ChartCommandResult {
  const input = raw.trim();
  const lower = input.toLowerCase();
  const toothNumbers = Array.from(new Set((input.match(/\b(?:[1-9]|[12]\d|3[0-2])\b/g) ?? []).map(Number)));
  const surfaces = parseSurfaces(input);
  const scope: ProcedureScope = lower.includes("full mouth") || lower.includes("prophy") || lower.includes("cleaning") ? "full-mouth" : surfaces.length > 0 ? "surface" : "tooth";
  const matchedCode = searchProcedureCodes(input, 1)[0] ?? inferCodeFromCommand(lower, surfaces);
  const intent = matchedCode ? toothNumbers.length > 1 ? "multi-tooth" : scope === "full-mouth" ? "full-mouth" : "procedure" : "unknown";
  const errors: string[] = [];

  if (matchedCode?.requiresTooth && toothNumbers.length === 0) errors.push(`${matchedCode.code} needs a tooth number before saving.`);
  if (matchedCode?.requiresSurface && surfaces.length === 0) errors.push(`${matchedCode.code} needs at least one surface before saving.`);

  return {
    raw,
    reviewRequired: true,
    intent,
    toothNumbers,
    surfaces,
    matchedCode,
    scope: matchedCode?.allowedScopes.includes(scope) ? scope : matchedCode?.allowedScopes[0] ?? scope,
    note: matchedCode ? `Review ${matchedCode.plainEnglishDescription}${toothNumbers.length ? ` for #${toothNumbers.join(", #")}` : ""}${surfaces.length ? ` ${surfaces.join("")}` : ""}.` : "No procedure code matched yet.",
    errors
  };
}

export function createTreatmentPlanDraft(params: {
  patientId: string;
  providerId: string;
  procedureCode: ProcedureCode;
  toothNumber?: string;
  notationSystem: "Universal" | "Palmer" | "FDI";
  surfaces: ToothSurface[];
  scope: ProcedureScope;
  clinicalNotes: string;
  attachments: string[];
}): TreatmentPlanItem {
  const validation = validateProcedureSelection({
    procedureCode: params.procedureCode,
    toothNumber: params.toothNumber,
    surfaces: params.surfaces,
    scope: params.scope,
    serviceDate: "2026-07-02",
    attachments: params.attachments,
    clinicalNotes: params.clinicalNotes
  });

  return {
    id: `tx-${Date.now()}`,
    patientId: params.patientId,
    providerId: params.providerId,
    toothNumber: params.toothNumber,
    notationSystem: params.notationSystem,
    surfaces: params.surfaces,
    scope: params.scope,
    procedureCodeId: params.procedureCode.id,
    procedureCodeVersionId: params.procedureCode.codeVersionId,
    status: validation.valid ? "proposed" : "draft",
    fee: params.procedureCode.defaultFee,
    insuranceEstimate: Math.round(params.procedureCode.defaultFee * 0.5),
    patientEstimate: Math.round(params.procedureCode.defaultFee * 0.5),
    clinicalNotes: params.clinicalNotes,
    documentationRequirements: [...params.procedureCode.requiredClinicalEvidence, ...params.procedureCode.attachmentsRequired],
    attachments: params.attachments,
    claimReadinessScore: validation.claimReadinessScore,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function convertToNotation(toothNumber: number, notation: "Universal" | "Palmer" | "FDI", dentition: Dentition): string {
  if (notation === "Universal") return dentition === "Pediatric" ? pediatricUniversal[toothNumber] ?? String(toothNumber) : String(toothNumber);
  const quadrant = toothNumber <= 8 ? "UR" : toothNumber <= 16 ? "UL" : toothNumber <= 24 ? "LL" : "LR";
  const position = toothNumber <= 8 ? toothNumber : toothNumber <= 16 ? 17 - toothNumber : toothNumber <= 24 ? toothNumber - 16 : 33 - toothNumber;
  if (notation === "Palmer") return `${quadrant} ${position}`;
  const fdiQuadrant = quadrant === "UR" ? 1 : quadrant === "UL" ? 2 : quadrant === "LL" ? 3 : 4;
  return `${fdiQuadrant}${position}`;
}

function codeSeed(
  id: string,
  code: string,
  officialDescription: string,
  plainEnglishDescription: string,
  categoryId: string,
  requiresTooth: boolean,
  requiresSurface: boolean,
  allowedScopes: ProcedureScope[],
  defaultFee: number,
  synonyms: string[],
  requiredClinicalEvidence: string[],
  attachmentsRequired: string[]
): ProcedureCode {
  const category = procedureCategories.find((item) => item.id === categoryId)?.name ?? categoryId;
  return {
    id,
    code,
    codeVersionId: demoCodeVersion.id,
    officialDescription,
    plainEnglishDescription,
    categoryId,
    category,
    active: true,
    effectiveDate: demoCodeVersion.effectiveDate,
    requiresTooth,
    requiresSurface,
    allowedScopes,
    defaultFee,
    synonyms,
    insuranceBillingMetadata: {
      payerReviewRisk: attachmentsRequired.length > 0 || requiredClinicalEvidence.length > 2 ? "Medium" : "Low",
      preAuthRecommended: defaultFee >= 1000,
      narrativeRecommended: defaultFee >= 290 || requiresSurface
    },
    requiredClinicalEvidence,
    attachmentsRequired,
    favoriteRank: ["D2392", "D2393", "D2740", "D3330", "D1110"].includes(code) ? ["D2392", "D2393", "D2740", "D3330", "D1110"].indexOf(code) + 1 : undefined
  };
}

function parseSurfaces(input: string): ToothSurface[] {
  const compact = input.toUpperCase().replace(/[^A-Z]/g, "");
  const surfaceSet = new Set<ToothSurface>();
  if (compact.includes("MOD")) ["M", "O", "D"].forEach((surface) => surfaceSet.add(surface as ToothSurface));
  if (compact.includes("MO")) ["M", "O"].forEach((surface) => surfaceSet.add(surface as ToothSurface));
  if (compact.includes("DO")) ["D", "O"].forEach((surface) => surfaceSet.add(surface as ToothSurface));
  (["M", "O", "I", "D", "B", "F", "L", "R"] as ToothSurface[]).forEach((surface) => {
    if (new RegExp(`\\b${surface}\\b`).test(input.toUpperCase())) surfaceSet.add(surface);
  });
  return [...surfaceSet];
}

function inferCodeFromCommand(lower: string, surfaces: ToothSurface[]) {
  if (lower.includes("extract")) return procedureCodes.find((code) => code.code === "D7140");
  if (lower.includes("root canal") || lower.includes("rct")) return procedureCodes.find((code) => code.code === "D3330");
  if (lower.includes("crown") || lower.includes("cap")) return procedureCodes.find((code) => code.code === "D2740");
  if (lower.includes("filling") || lower.includes("composite") || lower.includes("white filling") || surfaces.length > 0) {
    const count = Math.max(surfaces.filter((surface) => surface !== "R").length, 1);
    const target = count <= 1 ? "D2391" : count === 2 ? "D2392" : count === 3 ? "D2393" : "D2394";
    return procedureCodes.find((code) => code.code === target);
  }
  if (lower.includes("prophy") || lower.includes("cleaning")) return procedureCodes.find((code) => code.code === "D1110");
  return undefined;
}

function explainSuggestion(procedure: ProcedureCode, surfaces: ToothSurface[], toothNumber: number | undefined, scope: ProcedureScope) {
  if (procedure.requiresSurface) {
    return `Suggested because tooth #${toothNumber ?? "?"} has ${surfaces.join(", ")} selected, matching a ${surfaces.length}-surface restoration pattern.`;
  }
  if (procedure.requiresTooth) return `Suggested because tooth #${toothNumber ?? "?"} is selected and the command/context matches ${procedure.plainEnglishDescription.toLowerCase()}.`;
  return `Suggested because the current scope is ${scope} and the phrase/context matches ${procedure.plainEnglishDescription.toLowerCase()}.`;
}

const pediatricUniversal: Record<number, string> = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
  5: "E",
  6: "F",
  7: "G",
  8: "H",
  9: "I",
  10: "J",
  11: "K",
  12: "L",
  13: "M",
  14: "N",
  15: "O",
  16: "P",
  17: "Q",
  18: "R",
  19: "S",
  20: "T"
};
