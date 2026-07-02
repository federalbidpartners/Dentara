import {
  BenefitSummary,
  ClearinghouseOption,
  ClinicalAiSuggestion,
  ClaimFinding,
  ClaimGuardResult,
  ClaimSubmissionSummary,
  CodeRecommendation,
  Confidence,
  DiagnosticAssistResult,
  EstimateResult,
  ImagingFinding,
  InsuranceWorkflowStep,
  Patient,
  PracticeGrowthFeature,
  ReadinessResult,
  RevenueLeak,
  Risk,
  ScheduleInsight,
  Task
} from "./types";

const confidenceRank: Record<Confidence, number> = { Low: 1, Medium: 2, High: 3 };

export function getBenefitSense(patient: Patient): BenefitSummary {
  const missingFields: string[] = [];
  const caveats: string[] = [];

  if (!patient.insuranceActive) caveats.push("Coverage appears inactive or could not be confirmed.");
  if (!patient.memberId) missingFields.push("Subscriber member ID");
  if (patient.frequency === "Unknown" || patient.frequency === "Not returned") missingFields.push("Frequency limits");
  if (patient.waitingPeriods.includes("Unknown") || patient.waitingPeriods.includes("possible")) missingFields.push("Waiting period confirmation");
  if (patient.annualMaxRemaining <= 0) caveats.push("Annual maximum remaining is low or unavailable.");
  if (patient.eligibilityCheckedDaysAgo > 7) caveats.push("Eligibility check is older than 7 days.");

  const confidence: Confidence =
    !patient.insuranceActive || missingFields.length > 2 || caveats.length > 2
      ? "Low"
      : missingFields.length > 0 || caveats.length > 0
        ? "Medium"
        : "High";

  return {
    confidence,
    missingFields,
    caveats,
    annualMaxRemaining: patient.annualMaxRemaining,
    deductibleRemaining: Math.max(patient.deductible - patient.deductibleMet, 0),
    coverageText: `${patient.preventiveCoverage}% preventive / ${patient.basicCoverage}% basic / ${patient.majorCoverage}% major`
  };
}

export function getClaimGuard(patient: Patient): ClaimGuardResult {
  const findings: ClaimFinding[] = [];
  const p = patient.plannedProcedure;

  if (!patient.dob) findings.push(blocker("Missing patient DOB", "Claim header requires patient date of birth.", "Update patient demographics."));
  if (!patient.memberId) findings.push(blocker("Missing subscriber ID", "Payer cannot match eligibility or claim without member ID.", "Add subscriber/member ID."));
  if (!patient.insuranceActive) findings.push(blocker("Inactive coverage", "Eligibility response does not show active coverage.", "Reverify insurance or mark cash-pay workflow."));
  if (!p.code) findings.push(blocker("Missing CDT code", "Every dental claim line needs a procedure code.", "Add CDT code."));
  if (["D2750", "D3330", "D6240", "D7140"].includes(p.code) && !p.tooth) {
    findings.push(warning(`Tooth required for ${p.code}`, `${p.description} usually requires tooth number for claim clarity.`, "Add tooth number."));
  }
  if (p.code.startsWith("D23") && !p.surface) {
    findings.push(warning("Surface required", "Restorative procedures should include surface.", "Add tooth surface."));
  }
  if (["D2750", "D3330", "D6240"].includes(p.code) && !p.narrative) {
    findings.push(warning(`Narrative recommended for ${p.code}`, "Medical necessity narrative lowers avoidable review risk.", "Add narrative."));
  }
  if (["D2750", "D3330", "D6240", "D7140"].includes(p.code) && patient.attachments.length === 0) {
    findings.push(warning("Attachment recommended", "Recent X-ray or supporting documentation may be expected.", "Attach X-ray or perio chart."));
  }
  if (patient.xrayAgeMonths > 12 && ["D2750", "D3330", "D6240"].includes(p.code)) {
    findings.push(info("X-ray older than 12 months", `Bitewing dated ${patient.xrayAgeMonths} months ago.`, "Review whether a newer image is required."));
  }

  const blockerCount = findings.filter((f) => f.severity === "blocker").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const score = Math.min(100, blockerCount * 35 + warningCount * 18 + findings.length * 5);
  const risk: Risk = blockerCount > 0 || score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";

  return { risk, score, findings };
}

export function getEstimateIQ(patient: Patient): EstimateResult {
  const benefits = getBenefitSense(patient);
  const fee = patient.plannedProcedure.fee;
  const coveragePct =
    patient.plannedProcedure.category === "preventive"
      ? patient.preventiveCoverage
      : patient.plannedProcedure.category === "basic"
        ? patient.basicCoverage
        : patient.majorCoverage;
  const deductibleRemaining = Math.max(patient.deductible - patient.deductibleMet, 0);
  const deductibleApplied = patient.plannedProcedure.category === "preventive" ? 0 : Math.min(deductibleRemaining, fee);
  const coveredBase = Math.max(fee - deductibleApplied, 0);
  const rawInsurance = coveredBase * (coveragePct / 100);
  const insuranceEstimate = Math.min(rawInsurance, patient.annualMaxRemaining);
  const patientEstimate = Math.max(fee - insuranceEstimate, 0);
  const caveats = [...benefits.caveats];

  if (insuranceEstimate < rawInsurance) caveats.push("Annual maximum may cap insurance estimate.");
  if (benefits.missingFields.length > 0) caveats.push(`Manual review: ${benefits.missingFields.join(", ")}.`);
  if (!patient.insuranceActive) caveats.push("Estimate should not be presented as insurance-backed until coverage is reverified.");

  return {
    totalFee: fee,
    insuranceEstimate,
    patientEstimate,
    deductibleApplied,
    coinsurance: Math.max(coveredBase - rawInsurance, 0),
    confidence: caveats.length > 1 ? "Low" : confidenceRank[benefits.confidence] === 3 ? "High" : "Medium",
    caveats
  };
}

export function getVisitReadiness(patient: Patient): ReadinessResult {
  const benefit = getBenefitSense(patient);
  const claim = getClaimGuard(patient);
  const estimate = getEstimateIQ(patient);
  let score = 0;
  const reasons: string[] = [];

  if (patient.insuranceActive && patient.eligibilityCheckedDaysAgo <= 7) score += 25;
  else reasons.push("Insurance is inactive, stale, or unverified.");

  if (patient.formsComplete && patient.medicalHistoryCurrent) score += 15;
  else reasons.push("Forms or medical history need review.");

  if (patient.confirmed) score += 10;
  else reasons.push("Appointment is not confirmed.");

  if (patient.balanceDue === 0 || patient.lastOutreachDaysAgo <= 14) score += 10;
  else reasons.push("Patient balance needs outreach.");

  if (estimate.confidence !== "Low") score += 15;
  else reasons.push("Estimate confidence is low.");

  if (claim.risk === "Low") score += 15;
  else if (claim.risk === "Medium") score += 7;
  else reasons.push("ClaimGuard found high-risk claim issues.");

  if (benefit.confidence !== "Low") score += 10;
  else reasons.push("Benefit confidence is low.");

  return {
    score,
    band: score >= 70 ? "Ready" : score >= 45 ? "Attention" : "Not Ready",
    reasons
  };
}

export function getNextAction(patient: Patient): string {
  const claim = getClaimGuard(patient);
  const benefit = getBenefitSense(patient);
  if (!patient.insuranceActive || !patient.memberId) return "Verify benefits";
  if (!patient.formsComplete || !patient.medicalHistoryCurrent) return "Request forms";
  if (!patient.confirmed) return "Confirm arrival";
  if (patient.balanceDue > 0 && patient.lastOutreachDaysAgo > 14) return "Collect balance";
  if (claim.risk !== "Low") return "Fix claim";
  if (benefit.confidence !== "High") return "Review caveats";
  return "Confirm arrival";
}

export function getGeneratedTasks(patientList: Patient[]): Task[] {
  return patientList.flatMap((patient) => {
    const tasks: Task[] = [];
    const readiness = getVisitReadiness(patient);
    const claim = getClaimGuard(patient);
    if (readiness.band !== "Ready") {
      tasks.push({
        id: `auto-readiness-${patient.id}`,
        patientId: patient.id,
        owner: "Front Desk",
        title: getNextAction(patient),
        due: "Before visit",
        status: "Open",
        severity: readiness.band === "Not Ready" ? "High" : "Medium"
      });
    }
    claim.findings.slice(0, 1).forEach((finding, index) => {
      tasks.push({
        id: `auto-claim-${patient.id}-${index}`,
        patientId: patient.id,
        owner: "Billing Lead",
        title: finding.fix,
        due: "Today",
        status: "Open",
        severity: claim.risk
      });
    });
    return tasks;
  });
}

export function getRevenueLeaks(patientList: Patient[]): RevenueLeak[] {
  const unsent = patientList.filter((p) => !p.claimSubmitted && getClaimGuard(p).risk !== "Low");
  const unposted = patientList.filter((p) => p.claimSubmitted && !p.eraPosted);
  const balances = patientList.filter((p) => p.balanceDue > 0 && p.lastOutreachDaysAgo > 14);
  const unscheduled = patientList.filter((p) => p.unscheduledTreatment > 0);

  return [
    { label: "Risky unsubmitted claims", value: unsent.length, detail: "Claims need fix before submission.", severity: unsent.length > 2 ? "High" : "Medium" },
    { label: "Unposted ERAs", value: unposted.length, detail: "Payments received or expected but not posted.", severity: unposted.length > 0 ? "Medium" : "Low" },
    { label: "Balances without outreach", value: balances.reduce((sum, p) => sum + p.balanceDue, 0), detail: "Patient balances older than outreach policy.", severity: balances.length > 1 ? "High" : "Medium" },
    { label: "Unscheduled treatment", value: unscheduled.reduce((sum, p) => sum + p.unscheduledTreatment, 0), detail: "Open treatment with benefits or urgency.", severity: unscheduled.length > 2 ? "High" : "Medium" }
  ];
}

export function getCodeAdvisor(patient: Patient): CodeRecommendation[] {
  const procedure = patient.plannedProcedure;
  const sharedCaveats = [
    "Verify final coding against the current CDT manual and payer policy.",
    "Do not submit until provider documentation supports the selected code."
  ];

  if (procedure.code === "D2750" || procedure.description.toLowerCase().includes("crown")) {
    return [
      {
        code: "D2740",
        label: "Crown - porcelain/ceramic",
        confidence: procedure.code === "D2750" ? "Medium" : "High",
        appliesTo: `Tooth ${procedure.tooth ?? "unspecified"} crown option`,
        documentation: ["Pre-op radiograph", "Clinical photos if available", "Tooth shade", "Narrative with medical necessity", "Frequency/replacement history"],
        caveats: ["Payer may require pre-authorization for posterior crowns.", ...sharedCaveats]
      },
      {
        code: "D2750",
        label: "Crown - porcelain fused to high noble metal",
        confidence: procedure.code === "D2750" ? "High" : "Medium",
        appliesTo: `Tooth ${procedure.tooth ?? "unspecified"} crown option`,
        documentation: ["Pre-op radiograph", "Material selection", "Narrative", "Prior placement date if replacement"],
        caveats: sharedCaveats
      }
    ];
  }

  if (procedure.code === "D2392" || procedure.description.toLowerCase().includes("composite")) {
    return [
      {
        code: "D2392",
        label: "Posterior composite - two surfaces",
        confidence: "High",
        appliesTo: `Tooth ${procedure.tooth ?? "unspecified"} ${procedure.surface ?? ""}`,
        documentation: ["Tooth number", "Surface(s)", "Caries/restoration note", "Radiograph if payer requires"],
        caveats: sharedCaveats
      },
      {
        code: "D2391",
        label: "Posterior composite - one surface",
        confidence: "Medium",
        appliesTo: "If final prep is one surface",
        documentation: ["Final surface count", "Clinical note"],
        caveats: sharedCaveats
      }
    ];
  }

  if (procedure.code === "D3330") {
    return [
      {
        code: "D3330",
        label: "Endodontic therapy - molar",
        confidence: "High",
        appliesTo: `Tooth ${procedure.tooth ?? "unspecified"}`,
        documentation: ["Periapical radiograph", "Diagnosis", "Pulpal/periapical status", "Final obturation note"],
        caveats: sharedCaveats
      }
    ];
  }

  return [
    {
      code: procedure.code,
      label: procedure.description,
      confidence: "Medium",
      appliesTo: procedure.tooth ? `Tooth ${procedure.tooth}` : "Planned treatment",
      documentation: ["Provider clinical note", "Procedure-specific required fields", "Payer documentation policy"],
      caveats: sharedCaveats
    }
  ];
}

export function getImagingFindings(patient: Patient): ImagingFinding[] {
  const findings: ImagingFinding[] = [];
  if (patient.xrayAgeMonths > 12) {
    findings.push({
      title: "X-ray recency warning",
      detail: `Most recent bitewing is ${patient.xrayAgeMonths} months old. Confirm payer/provider requirement before claim.`,
      severity: "Medium",
      toothArea: patient.plannedProcedure.tooth ? `#${patient.plannedProcedure.tooth}` : "Posterior"
    });
  }
  patient.toothFindings
    .filter((finding) => finding.condition === "caries" || finding.condition === "watch")
    .slice(0, 2)
    .forEach((finding) => {
      findings.push({
        title: finding.condition === "caries" ? "Possible caries correlation" : "Watch area correlation",
        detail: `${finding.note} Surface ${finding.surface}. Provider review required.`,
        severity: finding.severity,
        toothArea: `#${finding.tooth}`
      });
    });
  return findings;
}

export function getAttachmentChecklist(patient: Patient) {
  const procedure = patient.plannedProcedure.code;
  const crownLike = ["D2740", "D2750", "D6240", "D3330"].some((code) => procedure === code);
  return [
    { label: "Bitewings", complete: patient.attachments.includes("bitewing-xray"), required: crownLike },
    { label: "Periapical X-ray", complete: patient.attachments.includes("pa-xray"), required: crownLike || procedure === "D3330" },
    { label: "Clinical photos", complete: patient.attachments.includes("clinical-photo"), required: crownLike },
    { label: "Periodontal chart", complete: patient.perioRisk !== "High" || patient.attachments.includes("perio-chart"), required: patient.perioRisk !== "Low" },
    { label: "Medical history reviewed", complete: patient.medicalHistoryCurrent, required: true }
  ];
}

export function getNarrativeDraft(patient: Patient): string {
  const procedure = patient.plannedProcedure;
  const tooth = procedure.tooth ? `#${procedure.tooth}` : "the planned tooth";
  const imaging = getImagingFindings(patient);
  const imagingSentence = imaging.length > 0 ? ` Radiographic review notes ${imaging[0].detail.toLowerCase()}` : "";
  return `${procedure.description} planned for tooth ${tooth} due to documented clinical findings. ${patient.clinicalHandoff}${imagingSentence} Estimate and claim should remain under provider review; insurance payment is not guaranteed.`;
}

export function getClinicalAiSuggestions(patient: Patient, noteDraft = ""): ClinicalAiSuggestion[] {
  const imaging = getImagingFindings(patient);
  const diagnosticAssist = getDiagnosticAssist(patient, noteDraft);
  const suggestions: ClinicalAiSuggestion[] = imaging.map((finding, index) => ({
    id: `image-${patient.id}-${index}`,
    source: "X-ray",
    title: finding.title === "X-ray recency warning" ? "Confirm updated imaging before diagnosis or claim" : `Review ${finding.toothArea} against clinical chart`,
    detail:
      finding.title === "X-ray recency warning"
        ? "The radiograph may be too old for confident clinical comparison or payer documentation."
        : "The charted condition and radiographic marker point to an area that deserves provider review.",
    evidence: [finding.detail, `Area: ${finding.toothArea}`, "Generated from demo X-ray metadata and charted findings"],
    nextStep: finding.title === "X-ray recency warning" ? "Capture/attach updated image if provider determines it is needed." : "Provider should confirm clinically, then accept or dismiss the suggestion.",
    confidence: finding.severity === "High" ? "Medium" : "Low",
    risk: finding.severity,
    requiresProviderReview: true
  }));

  patient.toothFindings.slice(0, 2).forEach((finding, index) => {
    suggestions.push({
      id: `note-${patient.id}-${index}`,
      source: "Clinical note",
      title: `Check documentation for #${finding.tooth} ${finding.surface}`,
      detail: "AI can help make the note more complete by prompting for symptoms, surfaces, radiographic evidence, and final provider assessment.",
      evidence: [finding.note, `Condition: ${finding.condition}`, `Severity: ${finding.severity}`],
      nextStep: "Ask whether symptoms, tests, anesthetic, isolation, material, and final surface count should be documented.",
      confidence: "Medium",
      risk: finding.severity,
      requiresProviderReview: true
    });
  });

  if (patient.perioRisk !== "Low" || patient.bleedingPercent >= 20) {
    suggestions.push({
      id: `perio-${patient.id}`,
      source: "Perio",
      title: "Review perio diagnosis support",
      detail: "Bleeding and plaque metrics suggest a hygiene/perio review before finalizing recall interval or treatment presentation.",
      evidence: [`Bleeding ${patient.bleedingPercent}%`, `Plaque ${patient.plaquePercent}%`, `Perio risk ${patient.perioRisk}`],
      nextStep: "Review probing depths, bleeding sites, radiographs, and interval recommendation with the provider.",
      confidence: "Medium",
      risk: patient.perioRisk,
      requiresProviderReview: true
    });
  }

  if (noteDraft.toLowerCase().includes("pain") || noteDraft.toLowerCase().includes("sensitivity") || patient.visitType.toLowerCase().includes("limited")) {
    suggestions.unshift({
      id: `symptoms-${patient.id}`,
      source: "Clinical note",
      title: "Add diagnostic questions from note context",
      detail: "The note/visit context suggests documenting symptom duration, triggers, percussion, cold response, and biting sensitivity.",
      evidence: [noteDraft || patient.visitType, "Symptom-driven visits need structured diagnostic fields"],
      nextStep: "Open quick diagnostic checklist and let provider confirm final diagnosis.",
      confidence: noteDraft ? "High" : "Medium",
      risk: "Medium",
      requiresProviderReview: true
    });
  }

  suggestions.unshift({
    id: `diagnostic-${patient.id}`,
    source: "Clinical note",
    title: `Provider review: ${diagnosticAssist.likelyFocus}`,
    detail: diagnosticAssist.checklist.slice(0, 2).join(" "),
    evidence: diagnosticAssist.noteSections.slice(0, 3),
    nextStep: "Open provider diagnostic checklist before finalizing note.",
    confidence: diagnosticAssist.confidence,
    risk: diagnosticAssist.risk,
    requiresProviderReview: true
  });

  if (!patient.insuranceActive || patient.xrayAgeMonths > 12 || patient.attachments.length === 0) {
    suggestions.push({
      id: `benefit-${patient.id}`,
      source: "Benefits",
      title: "Prevent avoidable treatment-plan friction",
      detail: "Before presenting the plan, confirm coverage and required attachments so the diagnosis discussion and estimate stay aligned.",
      evidence: [
        patient.insuranceActive ? "Insurance active" : "Insurance inactive or unverified",
        `${patient.xrayAgeMonths} month X-ray age`,
        `${patient.attachments.length} supporting attachments`
      ],
      nextStep: "Assign front desk/billing task before patient checkout.",
      confidence: "High",
      risk: !patient.insuranceActive ? "High" : "Medium",
      requiresProviderReview: false
    });
  }

  return suggestions.slice(0, 6);
}

export function getDiagnosticAssist(patient: Patient, noteDraft = ""): DiagnosticAssistResult {
  const lowerNote = noteDraft.toLowerCase();
  const hasPainSignal = ["pain", "ache", "sensitivity", "cold", "hot", "bite", "swelling"].some((term) => lowerNote.includes(term));
  const urgentFinding = patient.toothFindings.find((finding) => finding.severity === "High") ?? patient.toothFindings[0];
  const hasRadiographicConcern = patient.toothFindings.some((finding) => ["caries", "rct", "watch"].includes(finding.condition));
  const perioConcern = patient.perioRisk !== "Low" || patient.bleedingPercent >= 20 || patient.plaquePercent >= 25;
  const documentationRisk = getClaimGuard(patient).risk;

  const risk: Risk =
    urgentFinding?.severity === "High" || documentationRisk === "High" || hasPainSignal
      ? "High"
      : perioConcern || documentationRisk === "Medium"
        ? "Medium"
        : "Low";

  const confidence: Confidence =
    hasPainSignal && hasRadiographicConcern
      ? "High"
      : hasRadiographicConcern || noteDraft.length > 20
        ? "Medium"
        : "Low";

  const toothPhrase = urgentFinding ? `tooth #${urgentFinding.tooth} ${urgentFinding.surface}` : "the selected tooth";
  const likelyFocus =
    patient.visitType.toLowerCase().includes("limited") || hasPainSignal
      ? `diagnostic exam workflow for ${toothPhrase}`
      : perioConcern
        ? "perio documentation and recall interval"
        : `documentation completeness for ${patient.plannedProcedure.code}`;

  const checklist = [
    `Confirm chief complaint, duration, triggers, and current pain level for ${toothPhrase}.`,
    "Document provider-performed exam, radiograph review, objective findings, and differential considerations.",
    "Capture cold/percussion/palpation/bite test results when symptoms suggest pulpal or periapical disease.",
    "Confirm final diagnosis and treatment plan in the provider's words before billing or presenting the estimate."
  ];

  if (perioConcern) {
    checklist.push("Review probing depths, bleeding sites, plaque score, radiographic bone levels, and perio classification.");
  }
  if (!patient.medicalHistoryCurrent) {
    checklist.push("Update medical history, medications, allergies, and contraindication review before treatment.");
  }

  const noteSections = [
    `CC/HPI: ${noteDraft || patient.clinicalHandoff}`,
    `Objective: ${urgentFinding ? urgentFinding.note : "No high-risk tooth finding in demo data."}`,
    `Assessment: Provider to confirm diagnosis; AI cannot diagnose independently.`,
    `Plan: ${patient.plannedProcedure.description} ${patient.plannedProcedure.tooth ? `on #${patient.plannedProcedure.tooth}` : ""}.`
  ];

  return {
    risk,
    confidence,
    likelyFocus,
    checklist,
    noteSections,
    contraindicationPrompts: [
      "Allergies, anticoagulants, bisphosphonates, pregnancy status, recent surgery, cardiac precautions, and antibiotic premedication status.",
      "Confirm vitals, anesthetic limits, consent, and medical consult needs when clinically appropriate."
    ],
    guardrails: [
      "Dentara may suggest documentation prompts, but only a licensed dentist can diagnose.",
      "Do not submit claims until provider documentation, CDT code, surfaces, tooth numbers, and payer requirements are verified.",
      "External AI must run only through a BAA-approved, PHI-safe configuration with audit logs and retention controls."
    ]
  };
}

export function getInsuranceWorkflow(patient: Patient): InsuranceWorkflowStep[] {
  const claim = getClaimGuard(patient);
  const checklist = getAttachmentChecklist(patient);
  const missingRequiredAttachments = checklist.filter((item) => item.required && !item.complete);

  return [
    {
      id: `${patient.id}-eligibility`,
      transaction: "270/271",
      label: "Eligibility + benefits",
      status: patient.memberId && patient.insuranceActive && patient.eligibilityCheckedDaysAgo <= 7 ? "Ready" : "Blocked",
      detail: patient.insuranceActive
        ? `Benefits checked ${patient.eligibilityCheckedDaysAgo} day${patient.eligibilityCheckedDaysAgo === 1 ? "" : "s"} ago.`
        : "Coverage is inactive, missing, or stale.",
      action: patient.memberId ? "Run real-time eligibility" : "Add subscriber/member ID",
      vendorEndpoint: "DentalXChange Eligibility API, Stedi eligibility workflow, Optum/Change Healthcare eligibility"
    },
    {
      id: `${patient.id}-claim`,
      transaction: "837D",
      label: "Dental claim submission",
      status: claim.findings.some((finding) => finding.severity === "blocker") ? "Blocked" : claim.risk === "Low" ? "Ready" : "Needs Review",
      detail: claim.findings.length === 0 ? "Claim line is structurally ready in demo data." : `${claim.findings.length} claim issue${claim.findings.length === 1 ? "" : "s"} found.`,
      action: claim.risk === "Low" ? "Prepare 837D claim" : "Resolve ClaimGuard findings",
      vendorEndpoint: "DentalXChange Claim API or Stedi Dental Claims API"
    },
    {
      id: `${patient.id}-attachments`,
      transaction: "275",
      label: "Attachments + pre-auth packet",
      status: missingRequiredAttachments.length === 0 ? "Ready" : "Needs Review",
      detail:
        missingRequiredAttachments.length === 0
          ? "Required demo attachments are present or not required."
          : `${missingRequiredAttachments.map((item) => item.label).join(", ")} missing.`,
      action: missingRequiredAttachments.length === 0 ? "Attach supporting docs" : "Capture missing attachment",
      vendorEndpoint: "DentalXChange Attachment API, clearinghouse 275 attachment workflow"
    },
    {
      id: `${patient.id}-status`,
      transaction: "276/277",
      label: "Claim status polling",
      status: patient.claimSubmitted ? "Ready" : "Needs Review",
      detail: patient.claimSubmitted ? "Claim is submitted and can be polled." : "Submit the claim before status polling.",
      action: patient.claimSubmitted ? "Poll claim status" : "Submit or hold claim",
      vendorEndpoint: "Claim status API or clearinghouse mailbox"
    },
    {
      id: `${patient.id}-era`,
      transaction: "835",
      label: "ERA/payment posting",
      status: patient.claimSubmitted && !patient.eraPosted ? "Ready" : patient.eraPosted ? "Ready" : "Needs Review",
      detail: patient.eraPosted ? "ERA is posted." : patient.claimSubmitted ? "ERA is expected or ready to reconcile." : "No ERA until a claim is accepted.",
      action: patient.eraPosted ? "Reconcile ledger" : "Queue ERA autopost",
      vendorEndpoint: "ERA mailbox, Payment/Reconciliation API, or PMS ledger posting adapter"
    }
  ];
}

export function getClearinghouseOptions(): ClearinghouseOption[] {
  return [
    {
      name: "DentalXChange XConnect",
      category: "Dental clearinghouse API",
      status: "Sandbox target",
      fit: "Best dental-specific starting point for eligibility, claims, attachments, payments, and reconciliation APIs.",
      transactions: ["270/271", "837D", "275", "276/277", "835"],
      differentiator: "Dental-first gateway with claim validation, submission, status, attachments, payments, and reconciliation paths.",
      implementationNote: "Request developer access, sandbox credentials, payer enrollment requirements, write-access terms, and a BAA."
    },
    {
      name: "Stedi Dental Claims API",
      category: "API-first 837D",
      status: "Sandbox target",
      fit: "Modern API-first option for generating and submitting dental claims without hand-building X12.",
      transactions: ["837D"],
      differentiator: "JSON or raw X12 837D submission with 277CA and 835 response workflows through the clearinghouse.",
      implementationNote: "Use for 837D claim automation, then pair with eligibility/status/ERA services as needed."
    },
    {
      name: "Optum / Change Healthcare network APIs",
      category: "Network APIs",
      status: "Contract needed",
      fit: "Broad healthcare network path for eligibility, status, responses, and payer connectivity where dental workflows are supported.",
      transactions: ["270/271", "276/277", "835"],
      differentiator: "Useful for eligibility, claim status, response reports, ERA enrollment, and payer network connectivity.",
      implementationNote: "Validate dental payer coverage, enrollment steps, outage posture, BAA, and production credentialing."
    },
    {
      name: "Vyne Dental / FastAttach",
      category: "Dental attachments + RCM",
      status: "Attachment specialist",
      fit: "Strong dental attachment workflow for radiographs, intraoral images, perio charts, EOBs, narratives, and pre-treatment estimates.",
      transactions: ["275"],
      differentiator: "Attachment-focused workflow that can reduce missing-document delays and connect claim packets to payer requirements.",
      implementationNote: "Use as an attachment lane alongside claim submission until full clearinghouse coverage is contracted."
    },
    {
      name: "Availity Dental Claims",
      category: "REST transaction marketplace",
      status: "Contract needed",
      fit: "API marketplace path for dental claims, eligibility, claim status, attachments, and payer-list style workflows where available.",
      transactions: ["270/271", "837D", "275", "276/277"],
      differentiator: "REST API approach with broad administrative transaction tooling and payer connectivity review required.",
      implementationNote: "Confirm dental payer coverage, contract terms, BAA scope, and sandbox access before integration."
    },
    {
      name: "Claim.MD",
      category: "Clearinghouse integration",
      status: "Contract needed",
      fit: "Vendor-friendly clearinghouse option for claims, eligibility, ERA, and attachment files with simplified integration formats.",
      transactions: ["270/271", "837D", "275", "835"],
      differentiator: "Can support batch-oriented clearinghouse integration patterns and test-account rejection simulation.",
      implementationNote: "Verify dental 837D pathway, payer coverage, file/API formats, BAA terms, and production enrollment."
    },
    {
      name: "Open Dental API bridge",
      category: "PMS bridge",
      status: "PMS bridge",
      fit: "Practice-management connector for creating or syncing claims, procedures, providers, insurance plans, and claim procedures.",
      transactions: ["837D"],
      differentiator: "Keeps Dentara aligned with the system of record before clearinghouse submission.",
      implementationNote: "Use as a PMS adapter, not a clearinghouse replacement; enforce tenant isolation and audit every sync."
    },
    {
      name: "Vyne ClearCoverage / Onederful",
      category: "Eligibility APIs",
      status: "Eligibility specialist",
      fit: "Dental eligibility and benefits APIs for normalized, real-time coverage data before chairside estimates.",
      transactions: ["270/271"],
      differentiator: "Can improve estimate confidence and reduce manual benefit calls before treatment presentation.",
      implementationNote: "Pair with ClaimGuard and EstimateIQ; validate BAA, payer coverage, and response normalization."
    }
  ];
}

export function getClaimSubmissionSummary(patientList: Patient[]): ClaimSubmissionSummary {
  const workflows = patientList.map((patient) => ({
    patient,
    claim: getClaimGuard(patient),
    attachments: getAttachmentChecklist(patient)
  }));
  const readyClaims = workflows.filter((item) => item.claim.risk === "Low" && item.patient.insuranceActive).length;
  const blockedClaims = workflows.filter((item) => item.claim.findings.some((finding) => finding.severity === "blocker")).length;
  const reviewClaims = Math.max(workflows.length - readyClaims - blockedClaims, 0);
  const attachmentGaps = workflows.reduce((count, item) => count + item.attachments.filter((attachment) => attachment.required && !attachment.complete).length, 0);
  const cleanClaimRate = Math.round((readyClaims / Math.max(patientList.length, 1)) * 100);
  const estimatedRecoverable = patientList.reduce((sum, patient) => {
    const claim = getClaimGuard(patient);
    if (claim.risk === "Low" || patient.claimSubmitted) return sum;
    return sum + Math.min(patient.plannedProcedure.fee, patient.annualMaxRemaining);
  }, 0);

  return {
    cleanClaimRate,
    readyClaims,
    reviewClaims,
    blockedClaims,
    attachmentGaps,
    estimatedRecoverable,
    submissionQueueLabel: blockedClaims > 0 ? "Fix blockers first" : reviewClaims > 0 ? "Review before batch" : "Batch ready"
  };
}

export function getPracticeGrowthFeatures(patientList: Patient[]): PracticeGrowthFeature[] {
  const summary = getClaimSubmissionSummary(patientList);
  const unscheduledValue = patientList.reduce((sum, patient) => sum + patient.unscheduledTreatment, 0);
  const staleBenefits = patientList.filter((patient) => patient.eligibilityCheckedDaysAgo > 7 || !patient.insuranceActive).length;
  const unpostedEras = patientList.filter((patient) => patient.claimSubmitted && !patient.eraPosted).length;

  return [
    {
      title: "One-click claim packet builder",
      detail: "Bundles CDT lines, surfaces, narratives, X-rays, perio charts, and provider sign-off before submission.",
      metric: `${summary.readyClaims} ready`,
      owner: "Billing Lead"
    },
    {
      title: "Denial prevention autopilot",
      detail: "Flags missing subscriber data, stale eligibility, tooth/surface gaps, attachment gaps, and narrative risk.",
      metric: `${summary.blockedClaims + summary.reviewClaims} guarded`,
      owner: "Billing Lead"
    },
    {
      title: "Same-day production finder",
      detail: "Surfaces unscheduled treatment attached to today's patients with benefit and chairside estimate context.",
      metric: currencyPlain(unscheduledValue),
      owner: "Owner"
    },
    {
      title: "Eligibility command queue",
      detail: "Prioritizes stale benefits and inactive coverage before patients arrive so checkout feels effortless.",
      metric: `${staleBenefits} checks`,
      owner: "Front Desk"
    },
    {
      title: "ERA autopost readiness",
      detail: "Separates claim status, 277CA acknowledgments, 835 remittance, payment reconciliation, and ledger review.",
      metric: `${unpostedEras} pending`,
      owner: "Billing Lead"
    }
  ];
}

export function getScheduleInsights(patientList: Patient[]): ScheduleInsight[] {
  const notReady = patientList.filter((patient) => getVisitReadiness(patient).band !== "Ready");
  const unscheduledValue = patientList.reduce((sum, patient) => sum + patient.unscheduledTreatment, 0);
  const unconfirmed = patientList.filter((patient) => !patient.confirmed);
  const providerLoad = patientList.reduce<Record<string, number>>((acc, patient) => {
    acc[patient.provider] = (acc[patient.provider] ?? 0) + 1;
    return acc;
  }, {});
  const busiestProvider = Object.entries(providerLoad).sort((a, b) => b[1] - a[1])[0];

  return [
    {
      id: "readiness",
      title: "Protect the morning",
      detail: `${notReady.length} visits need readiness work before seating.`,
      impact: notReady.length > 0 ? "Reduces chair delays and claim rework" : "Schedule is ready to run",
      action: notReady.length > 0 ? "Open readiness queue" : "Keep monitoring",
      risk: notReady.length >= 3 ? "High" : notReady.length > 0 ? "Medium" : "Low"
    },
    {
      id: "production",
      title: "Recover unscheduled treatment",
      detail: `${currencyPlain(unscheduledValue)} in unscheduled treatment is attached to today’s patients.`,
      impact: "Creates same-day case acceptance opportunities",
      action: "Surface chairside prompts",
      risk: unscheduledValue > 2500 ? "High" : unscheduledValue > 0 ? "Medium" : "Low"
    },
    {
      id: "confirmation",
      title: "Confirmation risk",
      detail: `${unconfirmed.length} patient${unconfirmed.length === 1 ? "" : "s"} still need confirmation.`,
      impact: "Avoids holes in the provider schedule",
      action: "Send smart confirmation",
      risk: unconfirmed.length > 1 ? "Medium" : "Low"
    },
    {
      id: "load",
      title: "Provider flow",
      detail: busiestProvider ? `${busiestProvider[0]} has ${busiestProvider[1]} visits this morning.` : "No provider load detected.",
      impact: "Balances exams, hygiene handoffs, and treatment rooms",
      action: "Review operatory flow",
      risk: busiestProvider && busiestProvider[1] >= 4 ? "Medium" : "Low"
    }
  ];
}

function blocker(title: string, detail: string, fix: string): ClaimFinding {
  return { severity: "blocker", title, detail, fix };
}

function warning(title: string, detail: string, fix: string): ClaimFinding {
  return { severity: "warning", title, detail, fix };
}

function info(title: string, detail: string, fix: string): ClaimFinding {
  return { severity: "info", title, detail, fix };
}

function currencyPlain(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
