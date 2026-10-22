/* The verification gate's model, truth first: a fixed, deterministic run of
   proposals, one measured value each, one limit. A value at or under the
   limit passes to the result tray; over it, the proposal is returned and comes
   back later, revised, as a second attempt. Everything the figure shows (the
   dial, which way a token goes, the readout) is read from here. The numbers
   are illustrative, not data from a real system. */

/** The check's limit, in the dial's units (0 to 10). */
export const LIMIT = 6;
/** The dial's full scale. */
export const SCALE = 10;

export type Verdict = "pass" | "return";

export interface Check {
  /** 0-based position in the endless run. */
  index: number;
  /** Which proposal this is (a revised proposal keeps its id). */
  proposal: number;
  /** 1 for a first try, 2 for the revision of a returned proposal. */
  attempt: number;
  /** The measured value: the token's height under the gauge, 0–10. */
  value: number;
  verdict: Verdict;
}

/** One cycle of twelve checks: proposals 3, 6 and 9 are returned and pass on their second attempt. */
const CYCLE: ReadonlyArray<readonly [proposal: number, attempt: number, value: number]> = [
  [1, 1, 4.2],
  [2, 1, 5.1],
  [3, 1, 6.6],
  [4, 1, 3.8],
  [5, 1, 5.6],
  [3, 2, 4.9],
  [6, 1, 6.9],
  [7, 1, 4.4],
  [8, 1, 5.8],
  [6, 2, 5.3],
  [9, 1, 6.3],
  [9, 2, 5.5],
];

export const CYCLE_LENGTH = CYCLE.length;

export const verdictOf = (value: number): Verdict => (value <= LIMIT + 1e-9 ? "pass" : "return");

export function checkAt(index: number): Check {
  const at = ((index % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;
  const [proposal, attempt, value] = CYCLE[at]!;
  return { index, proposal: proposal + Math.floor(index / CYCLE_LENGTH) * 9, attempt, value, verdict: verdictOf(value) };
}

export interface Tally {
  checked: number;
  passed: number;
  returned: number;
}

/** The counts after the first `count` checks of the run. */
export function tallyOf(count: number): Tally {
  const tally: Tally = { checked: 0, passed: 0, returned: 0 };
  for (let index = 0; index < Math.max(0, Math.floor(count)); index++) {
    tally.checked++;
    if (checkAt(index).verdict === "pass") tally.passed++;
    else tally.returned++;
  }
  return tally;
}

export const tallyText = ({ checked, passed, returned }: Tally) => `checked ${checked} · passed ${passed} · returned ${returned}`;

export const one = (value: number) => (Math.round(value * 10) / 10).toFixed(1);

/** The first passing and the first returned check: the single runs the "pass" and "return" poses show. */
export const PASS_CHECK = checkAt(0);
export const RETURN_CHECK = checkAt(2);

export function verdictText(check: Check) {
  return check.verdict === "pass"
    ? `reads ${one(check.value)} ≤ ${one(LIMIT)} · passed`
    : `reads ${one(check.value)} > ${one(LIMIT)} · returned`;
}
