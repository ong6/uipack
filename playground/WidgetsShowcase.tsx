import { useState } from "react";
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandMenu, Toaster, toast } from "../src/widgets";
import "../src/widgets/widgets.css";
import { useShowcaseTheme } from "./ShowcaseShell";
import "./widgets-showcase.css";

const PAGES = [
  { group: "Build", items: ["Build a page", "Build a figure", "Build a deck", "Write copy"] },
  { group: "Check", items: ["Grade a page", "Review a page"] },
];

/**
 * `widgets` (docs/components/widgets.md): the command menu inline, as a site's skin draws it, and a
 * button that raises a toast with Undo. Choosing a command toasts its name instead of navigating.
 */
export function WidgetsDemo() {
  const { theme } = useShowcaseTheme();
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="widgets-demo" data-theme={theme}>
      <div className="widgets-demo__menu">
        <CommandMenu label="Jump to">
          <CommandInput placeholder="Jump to a page" />
          <CommandList>
            <CommandEmpty>No pages match.</CommandEmpty>
            {PAGES.map((g) => (
              <CommandGroup key={g.group} heading={g.group}>
                {g.items.map((item) => (
                  <CommandItem
                    key={item}
                    onSelect={() => {
                      setLast(item);
                      toast(`Opened “${item}”`);
                    }}
                  >
                    {item}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </CommandMenu>
      </div>
      <div className="widgets-demo__toast">
        <button
          type="button"
          className="widgets-demo__button"
          onClick={() => toast("Draft saved", { action: { label: "Undo", onClick: () => toast("Draft restored") } })}
        >
          Save draft
        </button>
        <p className="widgets-demo__note" aria-live="polite">
          {last ? `Last command: ${last}` : "Arrow keys and Enter choose a command; Save draft raises a toast."}
        </p>
      </div>
      <Toaster theme={theme === "dark" ? "dark" : "light"} />
    </div>
  );
}
