import { Fragment } from "react";

/**
 * Text for a label the stylesheet sets in uppercase. Words that uppercase
 * would change (a unit or number such as "32k" or "TB/s", a name such as
 * "GPUs") are wrapped in `keep`, which the stylesheet leaves as written.
 */
export function CaseSafe({ text, keep }: { text: string; keep: string }) {
  const parts = text.split(/(\s+)/);
  if (!parts.some(mangled)) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        mangled(part) ? (
          <span className={keep} key={i}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** A word whose uppercase form is not the same word: a digit beside letters, or a capital after the first letter beside a lowercase one. */
export const mangled = (word: string) =>
  (/\d/.test(word) && /[a-z]/.test(word)) || (/[a-z]/.test(word) && /^.+[A-Z]/u.test(word.replace(/^[^A-Za-z]*/, "")));
