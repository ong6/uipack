import { libraryPages, type LibraryPage } from "./catalog";
import { useState, type ReactNode } from "react";
import { Wordmark } from "../src";

export function useShowcaseTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    const url = new URL(location.href);
    url.searchParams.set("theme", next);
    history.replaceState(null, "", url);
    setTheme(next);
  };
  return { theme, flip };
}

export function ShowcaseShell({
  active,
  theme,
  flip,
  children,
}: {
  active: LibraryPage;
  theme: "light" | "dark";
  flip: () => void;
  children: ReactNode;
}) {
  return (
    <main className="showcase-shell" data-theme={theme} data-style="technical">
      <header className="showcase-header">
        <a
          className="showcase-brand"
          href={`/?theme=${theme}`}
          aria-label="UIPACK home"
        >
          <Wordmark size={22} />
        </a>
        <nav aria-label="Library pages">
          {libraryPages.map((page) => (
            <a
              key={page.id}
              href={`${page.path}?theme=${theme}`}
              aria-current={active === page.id ? "page" : undefined}
            >
              {page.label}
            </a>
          ))}
        </nav>
        <button className="theme" type="button" onClick={flip}>
          {theme === "dark" ? "light" : "dark"} mode
        </button>
      </header>
      {active !== "styles" && (
        <div className="showcase-context">
          <a href={`/styles?theme=${theme}`}>Technical style</a>
          <span>{libraryPages.find((p) => p.id === active)?.label}</span>
        </div>
      )}
      {children}
    </main>
  );
}
