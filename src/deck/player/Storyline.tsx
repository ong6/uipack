import { storylineOf, talkSeconds, type LintFinding } from "../storyline";
import type { DeckSlide } from "../types";
import { pad } from "./format";

const severityLabel = { error: "Fix", warn: "Check", tip: "Tip" } as const;

/** The ghost deck: headlines in order with their roles. Read alone, it should carry the argument. */
export function Storyline({
  slides,
  index,
  findings,
  onPick,
}: {
  slides: DeckSlide[];
  index: number;
  findings?: LintFinding[];
  onPick: (index: number) => void;
}) {
  const entries = storylineOf(slides);
  const deckWide = findings?.filter((f) => !f.slideId) ?? [];
  const minutes = Math.round(talkSeconds(slides) / 6) / 10;
  return (
    <div className="uipack-deck-storyline">
      <p className="uipack-deck-storyline__intro">
        Read only the headlines. They should make the whole argument. Talk track ≈ {minutes} min.
      </p>
      {deckWide.length > 0 && (
        <ul className="uipack-deck-storyline__findings" aria-label="Deck checks">
          {deckWide.map((f, i) => (
            <li key={i} data-severity={f.severity}>
              <b>{severityLabel[f.severity]}</b> {f.message}
            </li>
          ))}
        </ul>
      )}
      <ol>
        {entries.map((e, i) => {
          const own = findings?.filter((f) => f.slideId === e.id) ?? [];
          return (
            <li key={e.id} data-appendix={e.appendix ? "" : undefined}>
              <button type="button" data-tile="" aria-current={i === index ? "true" : undefined} onClick={() => onPick(i)}>
                <span className="uipack-deck-storyline__num">{pad(e.number)}</span>
                <span className="uipack-deck-storyline__role">{e.roleLabel ?? "—"}</span>
                <span className="uipack-deck-storyline__title">{e.title}</span>
              </button>
              {own.length > 0 && (
                <ul className="uipack-deck-storyline__findings">
                  {own.map((f, j) => (
                    <li key={j} data-severity={f.severity}>
                      <b>{severityLabel[f.severity]}</b> {f.message}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
