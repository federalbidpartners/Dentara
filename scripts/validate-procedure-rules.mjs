const procedures = [
  seed("D1110", false, false, ["full-mouth"], []),
  seed("D2391", true, true, ["surface"], []),
  seed("D2392", true, true, ["surface"], ["X-ray if payer requires"]),
  seed("D2393", true, true, ["surface"], ["X-ray if payer requires"]),
  seed("D2394", true, true, ["surface"], ["X-ray if payer requires"]),
  seed("D2740", true, false, ["tooth"], ["Pre-op X-ray", "Clinical photo"]),
  seed("D3330", true, false, ["tooth"], ["PA X-ray"]),
  seed("D7140", true, false, ["tooth"], ["X-ray"]),
  seed("WATCH", false, false, ["tooth", "surface"], [])
];

function seed(code, requiresTooth, requiresSurface, allowedScopes, attachmentsRequired) {
  return {
    code,
    active: true,
    requiresTooth,
    requiresSurface,
    allowedScopes,
    attachmentsRequired,
    insuranceBillingMetadata: {
      narrativeRecommended: requiresSurface || attachmentsRequired.length > 0
    }
  };
}

function findCode(code) {
  const procedure = procedures.find((item) => item.code === code);
  if (!procedure) throw new Error(`Missing fixture ${code}`);
  return procedure;
}

function validateProcedureSelection({ procedureCode, toothNumber, surfaces, scope, attachments, clinicalNotes }) {
  const messages = [];
  const missingDocumentation = [];
  let score = 100;

  if (!procedureCode.active) {
    messages.push(`${procedureCode.code} is inactive for the selected service date.`);
    score -= 35;
  }
  if (procedureCode.requiresTooth && !toothNumber) {
    messages.push(`${procedureCode.code} requires a tooth selection.`);
    score -= 45;
  }
  if (procedureCode.requiresSurface && surfaces.length === 0) {
    messages.push(`${procedureCode.code} requires at least one valid surface.`);
    score -= 45;
  }
  if (!procedureCode.allowedScopes.includes(scope)) {
    messages.push(`${procedureCode.code} is valid for ${procedureCode.allowedScopes.join(", ")} scope, not ${scope}.`);
    score -= 35;
  }
  if (scope === "full-mouth" && toothNumber) {
    messages.push("Full-mouth procedures should not be attached to a single tooth.");
    score -= 35;
  }
  if (procedureCode.insuranceBillingMetadata.narrativeRecommended && clinicalNotes.trim().length < 18) {
    missingDocumentation.push("Provider narrative");
    score -= 12;
  }
  procedureCode.attachmentsRequired.forEach((attachment) => {
    const normalized = attachment.toLowerCase().split("-").join(" ");
    const hasAttachment = attachments.some((item) => normalized.includes(item.split("-").join(" ").toLowerCase()));
    if (!hasAttachment) {
      missingDocumentation.push(attachment);
      score -= 10;
    }
  });

  const blocked = messages.some((message) => message.includes("requires") || message.includes("should not be attached") || message.includes("inactive"));
  return {
    valid: !blocked,
    severity: blocked ? "blocked" : missingDocumentation.length > 0 ? "draft" : "pass",
    messages,
    missingDocumentation,
    claimReadinessScore: Math.max(0, Math.min(100, score))
  };
}

function parseChartCommand(raw) {
  const lower = raw.toLowerCase();
  const toothNumbers = Array.from(new Set((raw.match(/\b(?:[1-9]|[12]\d|3[0-2])\b/g) ?? []).map(Number)));
  const compact = raw.toUpperCase().replace(/[^A-Z]/g, "");
  const surfaceSet = new Set();
  if (compact.includes("MOD")) ["M", "O", "D"].forEach((surface) => surfaceSet.add(surface));
  if (compact.includes("MO")) ["M", "O"].forEach((surface) => surfaceSet.add(surface));
  if (compact.includes("DO")) ["D", "O"].forEach((surface) => surfaceSet.add(surface));
  ["M", "O", "D", "B", "L", "R"].forEach((surface) => {
    if (new RegExp(`\\b${surface}\\b`).test(raw.toUpperCase())) surfaceSet.add(surface);
  });
  const surfaceLetters = Array.from(surfaceSet);
  const code =
    lower.includes("extract") ? "D7140" :
    surfaceLetters.length === 1 ? "D2391" :
    surfaceLetters.length === 2 ? "D2392" :
    surfaceLetters.length === 3 ? "D2393" :
    surfaceLetters.length >= 4 ? "D2394" :
    lower.includes("clean") ? "D1110" :
    undefined;

  return {
    toothNumbers,
    surfaces: surfaceLetters,
    matchedCode: code ? findCode(code) : undefined
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const filling = validateProcedureSelection({
  procedureCode: findCode("D2393"),
  toothNumber: "19",
  surfaces: ["M", "O", "D"],
  scope: "surface",
  attachments: ["x-ray if payer requires"],
  clinicalNotes: "Provider reviewed recurrent caries and MOD surface selection."
});
assert(filling.valid, "Three-surface restoration with tooth and surfaces should be valid.");
assert(filling.severity === "pass", "Complete restoration documentation should pass.");

const missingSurface = validateProcedureSelection({
  procedureCode: findCode("D2392"),
  toothNumber: "19",
  surfaces: [],
  scope: "surface",
  attachments: [],
  clinicalNotes: ""
});
assert(!missingSurface.valid && missingSurface.severity === "blocked", "Surface procedure without surfaces must be blocked.");

const fullMouthWrongScope = validateProcedureSelection({
  procedureCode: findCode("D1110"),
  toothNumber: "19",
  surfaces: [],
  scope: "full-mouth",
  attachments: [],
  clinicalNotes: "Adult prophylaxis reviewed."
});
assert(!fullMouthWrongScope.valid, "Full-mouth procedure attached to a single tooth should not be valid.");

const crownDraft = validateProcedureSelection({
  procedureCode: findCode("D2740"),
  toothNumber: "30",
  surfaces: [],
  scope: "tooth",
  attachments: [],
  clinicalNotes: "Crown due to fracture."
});
assert(crownDraft.valid && crownDraft.severity === "draft", "Missing crown attachments should create a draft, not a structural block.");

const command = parseChartCommand("MOD filling #19");
assert(command.matchedCode?.code === "D2393", "MOD filling command should map to the three-surface restoration seed.");
assert(command.toothNumbers[0] === 19, "MOD filling command should capture tooth 19.");
assert(command.surfaces.join("") === "MOD", "MOD filling command should capture M/O/D surfaces.");

const extraction = parseChartCommand("extract 1, 16, 17, 32");
assert(extraction.matchedCode?.code === "D7140", "Extraction command should map to extraction seed.");
assert(extraction.toothNumbers.length === 4, "Extraction command should capture four teeth.");

console.log("Procedure rule validation passed.");
