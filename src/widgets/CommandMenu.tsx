import { Command } from "cmdk";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

/**
 * The command menu: cmdk's `Command`, skinned by `uipack/widgets.css` on the site's roles. Every cmdk
 * prop passes through (`ComponentProps<typeof Command>`); the wrapper only adds the skin's class and
 * turns on `loop` (the arrow keys wrap, as every menu in uipack does). Build the rest from the parts
 * below, which are cmdk's own components under uipack's names.
 */
export function CommandMenu({
  className,
  loop = true,
  skin = true,
  ...props
}: ComponentProps<typeof Command> & {
  /** `false` leaves out the skin's class, for a uipack part that styles the menu itself (the docs search). */
  skin?: boolean;
}) {
  return <Command className={classes(skin && "uipack-command", className)} loop={loop} {...props} />;
}

const classes = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ") || undefined;

/** cmdk's parts, unchanged: the skin styles them by their `cmdk-*` attributes, so they need no wrapper. */
export const CommandInput = Command.Input;
export const CommandList = Command.List;
export const CommandGroup = Command.Group;
export const CommandItem = Command.Item;
export const CommandEmpty = Command.Empty;
export const CommandLoading = Command.Loading;
export const CommandSeparator = Command.Separator;

export interface CommandDialogProps {
  open: boolean;
  /** Called on Escape, a click on the backdrop and the browser closing the dialog. */
  onClose: () => void;
  /** The dialog's accessible name ("Search the docs"). */
  label: string;
  className?: string;
  /** `false` leaves out the skin's class, as on `CommandMenu`. */
  skin?: boolean;
  children: ReactNode;
}

/**
 * A modal shell for a command menu: the browser's `<dialog>` (focus stays inside, Escape closes, focus
 * returns to what opened it), closed by a click on the backdrop. `open` drives it; it focuses the
 * first field inside when it opens.
 */
export function CommandDialog({ open, onClose, label, className, skin = true, children }: CommandDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      const field = el.querySelector<HTMLInputElement>("input");
      field?.focus();
      field?.select();
    } else if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={classes(skin && "uipack-command-dialog", className)}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

/** ⌘K / Ctrl-K (or ⌘ / Ctrl + `key`) opens the menu from anywhere on the page while `enabled`. */
export function useCommandShortcut(enabled: boolean, setOpen: (open: boolean) => void, key = "k") {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        setOpen(true);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [enabled, setOpen, key]);
}
