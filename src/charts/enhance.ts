/**
 * Optional progressive enhancement for a rendered SpanChart. Without it every
 * behaviour still works through native inputs and CSS; with it:
 *
 * - activating the selected column header or size chip again (click, tap,
 *   Space or Enter) clears that filter;
 * - Escape clears both filters while focus is in the chart or the chart was
 *   the last thing clicked or tapped (Safari does not focus a radio when its
 *   label is clicked, so focus alone is not enough);
 * - Enter on an unselected header or chip selects it, like Space;
 * - a polite live region announces the filtered count.
 *
 * Returns a cleanup function that removes every listener.
 */
export function enhanceSpanChart(root: HTMLElement): () => void {
  const filters = [
    { all: root.querySelector<HTMLInputElement>(".uipack-span__all-input"), cls: "uipack-span__layer-input" },
    { all: root.querySelector<HTMLInputElement>(".uipack-span__tier-all"), cls: "uipack-span__tier-input" },
  ].flatMap(({ all, cls }) => {
    if (!all) return [];
    const checked = root.querySelector<HTMLInputElement>(`.${cls}:checked`);
    return [{ all, cls, current: checked ? checked.value : null as string | null }];
  });
  if (!filters.length) return () => {};
  const live = root.querySelector<HTMLElement>("[data-span-live]");

  const owner = (el: EventTarget | null) =>
    el instanceof HTMLInputElement ? filters.find((f) => el === f.all || el.classList.contains(f.cls)) : undefined;
  const announce = () => {
    if (!live) return;
    const [layer, tier] = [filters.find((f) => f.cls.includes("layer")), filters.find((f) => f.cls.includes("tier"))];
    const key = `${layer?.current ?? "*"}|${tier?.current ?? "*"}`;
    if (key === "*|*") {
      live.textContent = filters.map((f) => f.all.getAttribute("aria-label") ?? f.all.closest("label")?.textContent ?? "").join(", ");
      return;
    }
    const status = [...root.querySelectorAll<HTMLElement>(".uipack-span__status [data-span-key]")].find(
      (el) => el.getAttribute("data-span-key") === key,
    );
    live.textContent = status?.textContent ?? "";
  };
  const select = (input: HTMLInputElement) => {
    input.checked = true;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // A click on a radio arrives with the radio already checked, so compare with
  // the value recorded at the last change: equal means a repeat activation.
  const onClick = (event: MouseEvent) => {
    const filter = owner(event.target);
    const input = event.target as HTMLInputElement;
    if (filter && input !== filter.all && input.value === filter.current) select(filter.all);
  };
  const onChange = (event: Event) => {
    const filter = owner(event.target);
    const input = event.target as HTMLInputElement;
    if (!filter || !input.checked) return;
    filter.current = input === filter.all ? null : input.value;
    announce();
  };
  // Escape is heard on the document so a pointer user whose focus never
  // entered the chart can still clear it.
  let engaged = false;
  const doc = root.ownerDocument;
  const onPointerDown = (event: Event) => {
    engaged = root.contains(event.target as Node);
  };
  const onDocKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !(engaged || root.contains(event.target as Node))) return;
    for (const filter of filters) if (filter.current !== null) select(filter.all);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const filter = owner(event.target);
    const input = event.target as HTMLInputElement;
    if (event.key === "Enter" && filter && input !== filter.all) {
      event.preventDefault();
      select(input.value === filter.current ? filter.all : input);
    }
  };

  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("keydown", onKeyDown);
  doc.addEventListener("pointerdown", onPointerDown, true);
  doc.addEventListener("keydown", onDocKeyDown);
  root.setAttribute("data-span-enhanced", "");
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onChange);
    root.removeEventListener("keydown", onKeyDown);
    doc.removeEventListener("pointerdown", onPointerDown, true);
    doc.removeEventListener("keydown", onDocKeyDown);
    root.removeAttribute("data-span-enhanced");
  };
}
