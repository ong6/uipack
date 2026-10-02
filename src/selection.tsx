import {
  createContext,
  useContext,
  useId,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
export interface SelectedItem {
  id: string;
  label: string;
  /** Short explanation shown in a note beside the item. No note without it. */
  detail?: string;
  flow?: string;
  /** The selected element; the note is placed against it. */
  anchor?: Element;
}
export const SelectionContext = createContext<{
  enabled: boolean;
  selected: SelectedItem | null;
  select: (item: SelectedItem | null) => void;
}>({ enabled: false, selected: null, select: () => {} });
export function useItemSelection(
  label: string,
  detail?: string,
  flow?: string,
  enabled = true,
  /** Accessible name; must contain the item's visible text. Defaults to label. */
  name: string = label,
) {
  const id = useId();
  const context = useContext(SelectionContext);
  // Selecting must show something: a detail note, or a pinned flow highlight.
  if (!context.enabled || !enabled || !(detail || flow)) return {};
  const selected = context.selected?.id === id;
  const toggle = (anchor: Element) =>
    context.select(selected ? null : { id, label, detail, flow, anchor });
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": name,
    "aria-pressed": selected,
    "data-selected": selected ? "true" : undefined,
    onClick: (event: MouseEvent) => {
      event.stopPropagation();
      toggle(event.currentTarget);
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        toggle(event.currentTarget);
      }
    },
  };
}
