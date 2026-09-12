import { getPathCapabilityRecord } from "../data/pathCatalog";

const copyForPath = (pathKey: string) => {
  if (pathKey === "silkbind-jade") return {
    summary: "Provisional model · scenario-based estimate",
    detail: "Active model: 60-second Global 2.1 event/planner scenario. Target: 0.65 provisional selected-tier contract. Reference only: 49.5-second source/CN calculator rotation; the 0.45 legacy Jade default is not an active recommendation input.",
  };
  if (pathKey === "bamboocut-dust") return {
    summary: "Provisional model · local Global evidence is incomplete",
    detail: "Local fixtures are useful evidence, not absolute DPS validation. The observed roughly 46–47k versus modeled roughly 60–61k discrepancy remains unresolved; no auto-recalibration is applied.",
  };
  return null;
};

export default function PathProvenance({ pathKey }: { pathKey: string }) {
  const record = getPathCapabilityRecord(pathKey);
  const detail = copyForPath(pathKey);
  const summary = record.maturity === "REFERENCE_ONLY"
    ? "Reference only · mechanics/source material, not a calculator result"
    : record.maturity === "UNMODELED" || record.maturity === "UNKNOWN"
      ? "Numerical model unavailable · recommendation unavailable for this path"
      : detail?.summary ?? "Provisional model · scenario-based estimate";

  return <details className="workspace-inspector-details" data-testid="path-provenance">
    <summary>Model status: {summary}</summary>
    <p>{detail?.detail ?? (record.maturity === "REFERENCE_ONLY"
      ? "This path may show reference mechanics, but it has no DPS winner, optimization ranking, Best Build, or recommendation output."
      : record.maturity === "UNMODELED" || record.maturity === "UNKNOWN"
        ? "Current Global path recognition and reference material remain available; numerical coefficients and recommendations do not."
        : "Model output is provisional and depends on the active scenario, target, duration, and unresolved assumptions.")}</p>
  </details>;
}
