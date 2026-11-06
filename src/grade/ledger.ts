/**
 * Tier-3 fix ledger: one JSON line per claimed fix (docs/grading/fix-ledger.md). A fix counts only
 * when it lives somewhere a producer reads, the next producer is shown to have used it, and someone
 * other than the improver checked that. Pure validation.
 */

export interface LedgerEntry {
  id: string;
  /** The defect it answers: the judge packet and the words (`"judge-2 r3: hero is an empty box"`). */
  defect: string;
  /** What was changed, in one sentence. */
  claimedFix: string;
  /** Where the fix lives: a repo, a path and the commit that holds it. */
  livesAt: { repo: string; path: string; commit: string };
  /** Who made the fix (an agent id or a person). */
  improver: string;
  /** Proof the next producer used it: the run, and the evidence (a transcript line, an import, a version string). */
  proof?: { producerRun: string; evidence: string };
  /** Who checked the proof; never the improver. */
  checkedBy?: string;
  status: "claimed" | "verified" | "failed";
  /** The regression-set brief ids the fix was measured on. */
  measuredOn?: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/** Problems in a ledger, one line each, prefixed with the entry's line number and id. */
export function validateLedger(entries: unknown[]): string[] {
  const out: string[] = [];
  const ids = new Set<string>();
  entries.forEach((e, i) => {
    const at = (msg: string) => out.push(`line ${i + 1}${isObj(e) && nonEmpty(e.id) ? ` (${String(e.id)})` : ""}: ${msg}`);
    if (!isObj(e)) return at("not a JSON object");
    for (const f of ["id", "defect", "claimedFix", "improver"]) if (!nonEmpty(e[f])) at(`${f} is required`);
    if (nonEmpty(e.id)) {
      if (ids.has(e.id as string)) at("duplicate id");
      ids.add(e.id as string);
    }
    if (!["claimed", "verified", "failed"].includes(e.status as string)) at(`status must be claimed, verified or failed`);
    const lives = e.livesAt;
    if (!isObj(lives) || !nonEmpty(lives.repo) || !nonEmpty(lives.path)) at("livesAt needs repo and path");
    else if (!/^[0-9a-f]{7,40}$/.test(String(lives.commit ?? "")))
      at("livesAt.commit must be a commit hash (a fix in a scratch copy does not count)");
    if (e.status !== "claimed") {
      const proof = e.proof;
      if (!isObj(proof) || !nonEmpty(proof.producerRun) || !nonEmpty(proof.evidence))
        at("a verified or failed fix needs proof.producerRun and proof.evidence");
      if (!nonEmpty(e.checkedBy)) at("a verified or failed fix needs checkedBy");
    }
    if (nonEmpty(e.checkedBy) && e.checkedBy === e.improver) at("checkedBy must be someone other than the improver");
  });
  return out;
}
