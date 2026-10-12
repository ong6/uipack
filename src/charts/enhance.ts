/**
 * Optional progressive enhancement for a rendered SpanChart. Without it every
 * behaviour still works through native inputs and CSS; with it:
 *
 * - activating the selected layer or size again (click, tap, Space or Enter)
 *   clears that filter; Enter also selects, like Space; "Clear" returns focus
 *   to the "All layers" control;
 * - Escape clears every filter while focus is in the chart or the chart was
 *   the last thing clicked or tapped (Safari does not focus a radio when its
 *   label is clicked, so focus alone is not enough);
 * - group headings and the footer show live counts under a filter, and a
 *   polite live region announces them;
 * - collapsing the list, or filtering while the chart top is above the
 *   viewport, scrolls the chart top back into view;
 * - rows hidden in the featured view become findable with the browser's
 *   find-in-page where `hidden="until-found"` is supported (and stay hidden
 *   from screen readers until shown); a match expands the list;
 * - group labels stick under the header while their rows scroll past;
 * - a URL hash naming a filter input (e.g. `#ai-stack-layer-control`)
 *   selects it, so an article can link to a filtered view.
 *
 * Returns a cleanup function that removes every listener.
 */
export function enhanceSpanChart(root: HTMLElement): () => void {
  const form = root.querySelector<HTMLFormElement>("form.uipack-span__form");
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const find = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const all = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const groups = [
    { all: find<HTMLInputElement>(".uipack-span__all-input"), cls: "uipack-span__layer-input" },
    { all: find<HTMLInputElement>(".uipack-span__tier-all"), cls: "uipack-span__tier-input" },
  ].flatMap(({ all: allInput, cls }) => (allInput ? [{ all: allInput, cls, current: null as string | null }] : []));
  if (!form || !groups.length) return () => {};
  const deals = find<HTMLInputElement>(".uipack-span__deals-input");
  const expand = find<HTMLInputElement>(".uipack-span__expand");
  const live = find<HTMLElement>("[data-span-live]");
  const status = find<HTMLElement>("[data-span-status]");
  const items = all<HTMLElement>(".uipack-span__item");
  const total = items.length;
  const findable = typeof (root as unknown as { onbeforematch?: unknown }).onbeforematch !== "undefined";

  const sync = () => {
    for (const g of groups) g.current = root.querySelector<HTMLInputElement>(`.${g.cls}:checked`)?.value ?? null;
  };
  const filtered = () => groups.some((g) => g.current !== null) || Boolean(deals?.checked);
  const visible = (el: HTMLElement) => !el.hidden && el.getClientRects().length > 0;

  /** Rows hidden in the featured view carry hidden="until-found" so find-in-page can reach them. */
  const markFindable = () => {
    if (!findable) return;
    const collapsed = Boolean(expand && !expand.checked) && !filtered();
    const mark = (el: HTMLElement, hide: boolean) => {
      if (hide) {
        el.setAttribute("hidden", "until-found");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("hidden");
        el.removeAttribute("aria-hidden");
      }
    };
    for (const el of items) mark(el, collapsed && !el.hasAttribute("data-featured"));
    for (const el of all<HTMLElement>(".uipack-span__group")) mark(el, collapsed && !el.hasAttribute("data-featured"));
  };

  const update = (announce: boolean) => {
    markFindable();
    if (!filtered()) {
      if (status) status.textContent = "";
      if (announce && live) live.textContent = groups.map((g) => g.all.getAttribute("aria-label") ?? "").join(", ");
      return;
    }
    for (const group of all<HTMLElement>(".uipack-span__group")) {
      const count = group.querySelector<HTMLElement>("[data-span-count]");
      if (count) count.textContent = String([...group.querySelectorAll<HTMLElement>(".uipack-span__item")].filter(visible).length);
    }
    const shown = items.filter(visible).length;
    const text = (form.getAttribute("data-shown") ?? "{n} of {total} shown").replace("{n}", String(shown)).replace("{total}", String(total));
    if (status) status.textContent = text;
    if (announce && live) live.textContent = text;
  };

  /** Bring the chart top back when it has scrolled above the viewport. */
  const restore = () => {
    if (!win) return;
    const top = root.getBoundingClientRect().top;
    const offset = parseFloat(win.getComputedStyle(root).getPropertyValue("--uipack-span-sticky-top")) || 0;
    if (top < offset) win.scrollBy(0, top - offset);
  };

  const select = (input: HTMLInputElement, checked = true) => {
    input.checked = checked;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const owner = (el: EventTarget | null) =>
    el instanceof HTMLInputElement ? groups.find((g) => el === g.all || el.classList.contains(g.cls)) : undefined;

  // A click on a radio arrives with the radio already checked, so compare with
  // the value recorded at the last change: equal means a repeat activation.
  const onClick = (event: MouseEvent) => {
    const g = owner(event.target);
    const input = event.target as HTMLInputElement;
    if (g && input !== g.all && input.value === g.current) select(g.all);
  };
  const onChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input === expand) {
      update(false);
      if (!expand.checked) restore();
      return;
    }
    const g = owner(input);
    if (g && !input.checked) return;
    if (!g && input !== deals) return;
    sync();
    update(true);
    restore();
  };
  const onReset = () => {
    // The reset event fires before the controls change. Focus would otherwise
    // fall to the page when the pressed button disappears.
    win?.setTimeout(() => {
      sync();
      update(true);
      restore();
      groups[0].all.focus({ preventScroll: true });
    }, 0);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const input = event.target as HTMLInputElement;
    if (!(input instanceof HTMLInputElement)) return;
    const g = owner(input);
    // Space on the selected radio does nothing natively; make it clear, like a repeat click.
    if (event.key === " " && g && input !== g.all && input.value === g.current) {
      event.preventDefault();
      select(g.all);
      return;
    }
    if (event.key !== "Enter") return;
    if (g && input !== g.all) {
      event.preventDefault();
      select(input.value === g.current ? g.all : input);
    } else if (input === deals || input === expand) {
      event.preventDefault();
      select(input, !input.checked);
    }
  };

  // Escape is heard on the document so a pointer user whose focus never
  // entered the chart can still clear it.
  let engaged = false;
  const onPointerDown = (event: Event) => {
    engaged = root.contains(event.target as Node);
  };
  const onDocKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !(engaged || root.contains(event.target as Node)) || !filtered()) return;
    for (const g of groups) if (g.current !== null) select(g.all);
    if (deals?.checked) select(deals, false);
  };
  const onBeforeMatch = () => {
    if (expand && !expand.checked) select(expand);
  };
  const onHash = () => {
    const hash = win ? decodeURIComponent(win.location.hash.slice(1)) : "";
    const target = hash ? doc.getElementById(hash) : null;
    if (!(target instanceof HTMLInputElement) || !root.contains(target) || target === expand) return;
    if (target.type === "radio") select(target);
    else if (!target.checked) select(target);
    root.scrollIntoView({ block: "start" });
  };

  // Sticky group labels need the header's height, which changes with the
  // active-filter row; without a measurement they simply do not stick.
  const header = find<HTMLElement>(".uipack-span__header");
  const measure = () => header && root.style.setProperty("--sp-head-h", `${header.offsetHeight}px`);
  const Observer = win && (win as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
  const observer = Observer && header ? new Observer(measure) : null;
  observer?.observe(header!);
  measure();

  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("beforematch", onBeforeMatch);
  form.addEventListener("reset", onReset);
  doc.addEventListener("pointerdown", onPointerDown, true);
  doc.addEventListener("keydown", onDocKeyDown);
  win?.addEventListener("hashchange", onHash);
  root.setAttribute("data-span-enhanced", "");
  root.setAttribute("data-span-counting", "");
  if (findable) root.setAttribute("data-span-find", "");
  sync();
  update(false);
  onHash();

  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onChange);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("beforematch", onBeforeMatch);
    form.removeEventListener("reset", onReset);
    doc.removeEventListener("pointerdown", onPointerDown, true);
    doc.removeEventListener("keydown", onDocKeyDown);
    win?.removeEventListener("hashchange", onHash);
    observer?.disconnect();
    root.style.removeProperty("--sp-head-h");
    for (const el of root.querySelectorAll("[hidden]")) {
      el.removeAttribute("hidden");
      el.removeAttribute("aria-hidden");
    }
    root.removeAttribute("data-span-enhanced");
    root.removeAttribute("data-span-counting");
    root.removeAttribute("data-span-find");
  };
}
