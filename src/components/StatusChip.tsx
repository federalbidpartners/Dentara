import { Confidence, ReadinessBand, Risk } from "../lib/types";

export function ReadinessChip({ band }: { band: ReadinessBand }) {
  return <span className={`chip readiness ${band.toLowerCase().replace(" ", "-")}`}>{band}</span>;
}

export function RiskChip({ risk }: { risk: Risk }) {
  return <span className={`chip risk ${risk.toLowerCase()}`}>{risk}</span>;
}

export function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  return <span className={`chip confidence ${confidence.toLowerCase()}`}>{confidence}</span>;
}
