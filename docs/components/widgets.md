# Widgets

Which library a page takes each widget from (toasts, the command menu, dialogs, sheets, menus, live numbers), and what `uipack/widgets` skins for you. An agent that builds one of these from scratch skips the details that make it feel finished (focus return, swipe, stacking, screen-reader announcements), so a page never hand-builds a widget this registry lists.

## The registry

Generated from `WIDGETS` in `scripts/site-model.ts` by `npm run docs:sync`.

<!-- generated:widget-registry -->
| Need | Library | From `uipack/widgets` | Use it for | Not for | Fallback |
| --- | --- | --- | --- | --- | --- |
| Command menu, ⌘K search | `cmdk` ^1.1.0 | `CommandMenu`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandEmpty`, `useCommandShortcut` | Jumping to a page or action from the keyboard; searching a long list of places | Choosing one of a few values in a form (a select) | Base UI Combobox |
| Toasts | `sonner` ^2.0.0 | `Toaster`, `toast` | Saying a background action finished (saved, sent), with Undo where it can be undone | An error the reader must fix (say it beside the field); anything that needs a decision (a dialog); a result the control itself can show (a copy button's inline “Copied”) | Base UI Toast |
| Dialog, alert dialog | `@base-ui/react` ^1.9.0 | Use the library directly | A decision or a short form that has to be answered before the page goes on | Content a reader browses or comes back to (give it a page or a sheet) | The browser's `<dialog>`, as `CommandDialog` uses it |
| Popover, menu, select, tabs, tooltip | `@base-ui/react` ^1.9.0 | Use the library directly | Any of these with keyboard, focus and screen-reader behaviour a reader expects | A tooltip that holds the only copy of something a touch reader needs | Radix Primitives |
| Bottom sheet, drawer | `@base-ui/react` ^1.9.0 | Use the library directly | Phone-first panels: filters, a menu, details for a row (Base UI Drawer). Not Vaul: its README says it is unmaintained (checked 2026-11-19) | Desktop navigation that fits in the page | Base UI Dialog styled as a sheet |
| A number that keeps changing | `@number-flow/react` ^0.6.0 | Use the library directly | Prices, counters and totals that update while the reader watches | A proof stat that counts up once on scroll (that is `NumberTicker` in `uipack/web`) | `NumberTicker` |
<!-- /generated -->

One library per need. A widget enters the registry when a site needs it; a replacement takes the old row's place, and the fallback column names where to go if a library is abandoned.

## Using `uipack/widgets`

```uipack-demo widgets
```

`cmdk` and `sonner` are optional peer dependencies: install the one whose widget the page uses, and import the skin once.

```sh
npm install cmdk@^1.1.0 sonner@^2.0.0
```

```tsx
import { CommandDialog, CommandInput, CommandItem, CommandList, CommandMenu, Toaster, toast, useCommandShortcut } from "uipack/widgets";
import "uipack/widgets.css";

function Jump() {
  const [open, setOpen] = useState(false);
  useCommandShortcut(true, setOpen); // ⌘K / Ctrl-K
  return (
    <CommandDialog open={open} onClose={() => setOpen(false)} label="Jump to">
      <CommandMenu label="Jump to">
        <CommandInput placeholder="Jump to a page" />
        <CommandList>
          <CommandItem onSelect={() => location.assign("/docs")}>Docs</CommandItem>
        </CommandList>
      </CommandMenu>
    </CommandDialog>
  );
}

// Once per page, then toast("Saved") from anywhere.
<Toaster />;
```

| Export | What it is |
| --- | --- |
| `CommandMenu` | cmdk's `Command` with the skin's class and `loop` on; every cmdk prop passes through. `skin={false}` drops the class for a part that styles itself |
| `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandEmpty`, `CommandLoading`, `CommandSeparator` | cmdk's parts, unchanged; the skin styles them by their `cmdk-*` attributes |
| `CommandDialog` | The browser's `<dialog>` as the menu's modal shell: focus stays inside, Escape and a backdrop click close it, focus returns to what opened it |
| `useCommandShortcut(enabled, setOpen, key = "k")` | ⌘ / Ctrl + `key` opens it from anywhere on the page |
| `Toaster`, `toast` | Sonner's, with bottom right, three visible and the skin's class as defaults; every Sonner prop passes through |

The docs site's own search (`DocsLayout`'s `search`) is built on `CommandMenu` and `CommandDialog`.

## Skins, not forks

- **Skin first, wrap last.** Each library is styled through its own class names and data attributes, in `uipack/widgets.css`, on the site's roles (`--ui-*`). A wrapper exists only to set defaults a site would get wrong, and it passes the library's props through instead of declaring its own.
- **A site changes its roles, never a widget's CSS.** A local override of a skin fails review.
- **Libraries used directly** (Base UI, NumberFlow) are styled on the same roles in the site, until a second site needs the same skin; then it moves into `uipack/widgets`.

## Writing for widgets

Toast text, confirm dialogs, empty states and error messages follow the writing rules for [web pages](../system/writing/web.md#widget-wording).

## Related

- [Web principles](../web-principles.md): one standout moment per page, and where to find designed components.
- [Docs layout](../docs-layout.md): the search that runs on this command menu.
