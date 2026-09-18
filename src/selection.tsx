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
  detail?: string;
  flow?: string;
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
) {
  const id = useId();
  const context = useContext(SelectionContext);
  if (!context.enabled || !enabled) return {};
  const selected = context.selected?.id === id;
  const toggle = () =>
    context.select(selected ? null : { id, label, detail, flow });
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": label,
    "aria-pressed": selected,
    "data-selected": selected ? "true" : undefined,
    onClick: (event: MouseEvent) => {
      event.stopPropagation();
      toggle();
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }
    },
  };
}
