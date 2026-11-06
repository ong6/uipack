/**
 * Tier-2 tally: turns blinded judge verdicts back into "B vs A" results with the packet key.
 * Pairwise first: the preference is the result; scores matter only as paired deltas (same judge,
 * same rubric, same sitting) and relative to the calibration anchor. Pure functions.
 */

/** Which source each label stood for in one judge's packet. */
export interface PacketKey {
  packets: Record<string, { A: "a" | "b"; B: "a" | "b" }>;
  sources: { a: string; b: string; anchor?: string };
  rubric: { file: string; version: string; sha256: string };
  brief: { file: string; sha256: string };
  createdAt: string;
}

/** What a judge returns (docs/grading/protocol.md, "Judge output"). */
export interface JudgeVerdict {
  packet: string;
  rubric: string;
  rubricVersion: string;
  criteria: { id: string; A: number; B: number; R?: number; evidence?: unknown }[];
  overall: { A: number; B: number; R?: number };
  preference: "A" | "B" | "tie";
  margin?: "slight" | "clear" | "decisive";
  defects?: unknown;
}

export interface Tally {
  judges: number;
  /** Share of judges preferring b (ties count half). */
  winRateB: number;
  /** b minus a, overall, per judge, then the mean. */
  overallDeltas: number[];
  meanOverallDelta: number;
  /** b minus a per criterion, mean across judges. */
  criterionDeltas: Record<string, number>;
  /** Mean scores of a, b and the anchor: read a target relative to the anchor, never alone. */
  mean: { a: number; b: number; anchor: number | null };
  /** a and b minus the anchor's score (null without an anchor). */
  relativeToAnchor: { a: number; b: number } | null;
  /** How many judges preferred whichever side they saw as A: all of them hints at position bias. */
  preferredFirstShown: number;
  /** Two judges' overall deltas differ by 2 or more, or their preferences point opposite ways. */
  disagreement: boolean;
  needsThirdJudge: boolean;
  problems: string[];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const round = (x: number) => Math.round(x * 100) / 100;

export function tallyJudges(key: PacketKey, verdicts: JudgeVerdict[]): Tally {
  const problems: string[] = [];
  const rows = verdicts.flatMap((v) => {
    const map = key.packets[v.packet];
    if (!map) {
      problems.push(`verdict for unknown packet "${v.packet}"`);
      return [];
    }
    if (String(v.rubricVersion) !== String(key.rubric.version))
      problems.push(`${v.packet} scored rubric version ${v.rubricVersion}, the packet carried ${key.rubric.version}`);
    const side = (label: "A" | "B") => map[label];
    const score = (o: { A: number; B: number }, s: "a" | "b") => (side("A") === s ? o.A : o.B);
    const pref = v.preference === "tie" ? "tie" : side(v.preference);
    return [
      {
        packet: v.packet,
        a: score(v.overall, "a"),
        b: score(v.overall, "b"),
        anchor: v.overall.R ?? null,
        pref,
        firstShownWon: v.preference === "A",
        criteria: Object.fromEntries(v.criteria.map((c) => [c.id, score(c, "b") - score(c, "a")])),
      },
    ];
  });
  const prefersB = rows.reduce((n, r) => n + (r.pref === "b" ? 1 : r.pref === "tie" ? 0.5 : 0), 0);
  const deltas = rows.map((r) => r.b - r.a);
  let disagreement = false;
  for (let i = 0; i < rows.length; i++)
    for (let j = i + 1; j < rows.length; j++) {
      const opposite = (rows[i].pref === "a" && rows[j].pref === "b") || (rows[i].pref === "b" && rows[j].pref === "a");
      if (Math.abs(deltas[i] - deltas[j]) >= 2 || opposite) disagreement = true;
    }
  const ids = [...new Set(rows.flatMap((r) => Object.keys(r.criteria)))];
  const anchors = rows.map((r) => r.anchor).filter((x): x is number => x !== null);
  const m = {
    a: round(mean(rows.map((r) => r.a))),
    b: round(mean(rows.map((r) => r.b))),
    anchor: anchors.length ? round(mean(anchors)) : null,
  };
  if (rows.length < 2) problems.push("fewer than two judges: run the second judge in the opposite order");
  return {
    judges: rows.length,
    winRateB: rows.length ? round(prefersB / rows.length) : 0,
    overallDeltas: deltas,
    meanOverallDelta: round(mean(deltas)),
    criterionDeltas: Object.fromEntries(
      ids.map((id) => [id, round(mean(rows.filter((r) => id in r.criteria).map((r) => r.criteria[id])))]),
    ),
    mean: m,
    relativeToAnchor: m.anchor === null ? null : { a: round(m.a - m.anchor), b: round(m.b - m.anchor) },
    preferredFirstShown: rows.filter((r) => r.firstShownWon).length,
    disagreement,
    needsThirdJudge: disagreement && rows.length < 3,
    problems,
  };
}

export function formatTally(t: Tally): string {
  const lines = [
    `Judges: ${t.judges}${t.needsThirdJudge ? " (disagree by 2+ or opposite preferences: run a third judge)" : t.disagreement ? " (disagreement resolved by a third judge)" : ""}`,
    `Win rate of B over A: ${(t.winRateB * 100).toFixed(0)}%`,
    `Paired overall delta (B − A): mean ${t.meanOverallDelta >= 0 ? "+" : ""}${t.meanOverallDelta} (per judge: ${t.overallDeltas.join(", ")})`,
    `Per criterion (B − A): ${Object.entries(t.criterionDeltas)
      .map(([k, v]) => `${k} ${v >= 0 ? "+" : ""}${v}`)
      .join(", ")}`,
    t.relativeToAnchor
      ? `Against the anchor (${t.mean.anchor}): A ${t.relativeToAnchor.a >= 0 ? "+" : ""}${t.relativeToAnchor.a}, B ${t.relativeToAnchor.b >= 0 ? "+" : ""}${t.relativeToAnchor.b}`
      : "No anchor scored: absolute numbers are not interpretable",
    `Position: ${t.preferredFirstShown} of ${t.judges} judge(s) preferred the side shown first`,
    ...t.problems.map((p) => `Problem: ${p}`),
  ];
  return lines.join("\n");
}
