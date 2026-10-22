import type { LibraryPage } from "./catalog";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";

/** Stands in for a page whose branch has not merged yet. The shell supplies its h1 and intro. */
export default function Placeholder({ active }: { active: LibraryPage }) {
  const { theme, flip } = useShowcaseTheme();
  return (
    <ShowcaseShell active={active} theme={theme} flip={flip}>
      <section data-route={active} data-placeholder>
        <h2>Status</h2>
        <p className="showcase-section-intro">Coming in this branch merge.</p>
      </section>
    </ShowcaseShell>
  );
}
