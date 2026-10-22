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
 *   selects it, so an article can link to a filtered view;
 * - the "Find a company" field appears: it matches names, tags and deals,
 *   ignoring case and accents, shows matches whether featured or not, and
 *   combines with the filters; Escape or its clear button resets it;
 * - showing all rows or the featured subset is announced;
 * - on fine pointers, the column under the pointer in the rows shows a faint
 *   band and its header lights up (headers do this without script).
 *
 * Returns a cleanup function that removes every listener.
 */
import { prefersReducedMotion } from "../env";
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
  const search = find<HTMLInputElement>("[data-span-search]");
  const noMatch = find<HTMLElement>("[data-span-nomatch]");
  const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  // What a query can match: what the row shows, the name, its tags and its
  // deal. Notes stay out: a match hidden in a closed note reads as noise.
  const haystacks = items.map((el) =>
    fold(
      [el.querySelector(".uipack-span__nv > b"), ...el.querySelectorAll(".uipack-span__sub > *")]
        .map((n) => n?.textContent ?? "")
        .join(" "),
    ),
  );
  let query = "";

  const sync = () => {
    for (const g of groups) g.current = root.querySelector<HTMLInputElement>(`.${g.cls}:checked`)?.value ?? null;
  };
  const filtered = () => groups.some((g) => g.current !== null) || Boolean(deals?.checked) || query !== "";
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

  const shownText = (n: number) =>
    (form.getAttribute("data-shown") ?? "{n} of {total} shown").replace("{n}", String(n)).replace("{total}", String(total));

  /** Apply the search: rows that miss are hidden; matches show whether featured or not. */
  const applySearch = () => {
    query = search ? fold(search.value.trim()) : "";
    root.toggleAttribute("data-span-searching", query !== "");
    items.forEach((el, i) => el.toggleAttribute("data-span-miss", query !== "" && !haystacks[i].includes(query)));
    for (const g of all<HTMLElement>(".uipack-span__group")) {
      g.toggleAttribute("data-span-miss", query !== "" && !g.querySelector(".uipack-span__item:not([data-span-miss])"));
    }
  };

  const update = (announce: boolean) => {
    markFindable();
    if (noMatch) noMatch.hidden = true;
    if (!filtered()) {
      if (status) status.textContent = "";
      if (announce && live) live.textContent = groups.map((g) => g.all.getAttribute("aria-label") ?? "").join(", ");
      return;
    }
    for (const group of all<HTMLElement>(".uipack-span__group")) {
      const count = group.querySelector<HTMLElement>("[data-span-count]");
      if (count)
        count.textContent = String([...group.querySelectorAll<HTMLElement>(".uipack-span__item")].filter(visible).length);
    }
    const shown = items.filter(visible).length;
    const text = shownText(shown);
    if (status) status.textContent = text;
    if (announce && live) live.textContent = text;
    // A search that finds nothing says so, unless the filters' own empty state already shows.
    if (noMatch) {
      const emptyShown = Boolean(find<HTMLElement>(".uipack-span__empty")?.getClientRects().length);
      noMatch.hidden = !(query && shown === 0 && !emptyShown);
      const p = noMatch.querySelector("p");
      if (p && search) p.textContent = (noMatch.getAttribute("data-span-nomatch") ?? "").replace("{q}", search.value.trim());
    }
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
    if (input === search) return;
    if (input === expand) {
      update(false);
      if (live)
        live.textContent = shownText(expand.checked ? total : items.filter((el) => el.hasAttribute("data-featured")).length);
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
      applySearch();
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
    // Escape in the search field clears the search first.
    if (event.key === "Escape" && search && event.target === search && search.value) {
      event.preventDefault();
      clearSearch(false);
      return;
    }
    if (event.key !== "Escape" || !(engaged || root.contains(event.target as Node)) || !filtered()) return;
    if (search?.value) clearSearch(false);
    for (const g of groups) if (g.current !== null) select(g.all);
    if (deals?.checked) select(deals, false);
  };
  const clearSearch = (focus: boolean) => {
    if (!search) return;
    search.value = "";
    applySearch();
    update(true);
    if (focus) search.focus({ preventScroll: true });
  };
  const onSearch = () => {
    applySearch();
    update(true);
  };
  // Enter in the search field would submit the form; there is nothing to submit.
  const onSubmit = (event: Event) => event.preventDefault();
  const onClearClick = (event: MouseEvent) => {
    if ((event.target as Element).closest?.("[data-span-clear-search]")) clearSearch(true);
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

  // Crosshair: the column under a mouse pointer gets a faint band. Column
  // edges come from the header labels, measured when the pointer enters.
  const cols = all<HTMLElement>(".uipack-span__col");
  const body = find<HTMLElement>(".uipack-span__body");
  const fine = win?.matchMedia?.("(hover: hover) and (pointer: fine)");
  let edges: DOMRect[] = [];
  let hovered = -1;
  const setHover = (k: number) => {
    if (k === hovered) return;
    cols[hovered]?.removeAttribute("data-span-hover");
    hovered = k;
    if (k < 0) {
      root.style.removeProperty("--sp-hover");
      root.style.removeProperty("--sp-hover-on");
      return;
    }
    cols[k].setAttribute("data-span-hover", "");
    root.style.setProperty("--sp-hover", String(k));
    root.style.setProperty("--sp-hover-on", "block");
  };
  const onBodyMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !fine?.matches) return;
    if (!edges.length) edges = cols.map((c) => c.getBoundingClientRect());
    setHover(edges.findIndex((r) => event.clientX >= r.left && event.clientX < r.right));
  };
  const onBodyLeave = () => {
    edges = [];
    setHover(-1);
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
  root.addEventListener("click", onClearClick);
  body?.addEventListener("pointermove", onBodyMove);
  body?.addEventListener("pointerleave", onBodyLeave);
  search?.addEventListener("input", onSearch);
  form.addEventListener("submit", onSubmit);
  const searchLabel = search?.closest("label");
  if (searchLabel) searchLabel.hidden = false;
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
    root.removeEventListener("click", onClearClick);
    body?.removeEventListener("pointermove", onBodyMove);
    body?.removeEventListener("pointerleave", onBodyLeave);
    setHover(-1);
    search?.removeEventListener("input", onSearch);
    if (searchLabel) searchLabel.hidden = true;
    if (search) search.value = "";
    applySearch();
    if (noMatch) noMatch.hidden = true;
    form.removeEventListener("submit", onSubmit);
    root.removeEventListener("change", onChange);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("beforematch", onBeforeMatch);
    form.removeEventListener("reset", onReset);
    doc.removeEventListener("pointerdown", onPointerDown, true);
    doc.removeEventListener("keydown", onDocKeyDown);
    win?.removeEventListener("hashchange", onHash);
    observer?.disconnect();
    root.style.removeProperty("--sp-head-h");
    for (const el of [...items, ...all<HTMLElement>(".uipack-span__group")]) {
      el.removeAttribute("hidden");
      el.removeAttribute("aria-hidden");
    }
    root.removeAttribute("data-span-enhanced");
    root.removeAttribute("data-span-counting");
    root.removeAttribute("data-span-find");
  };
}

/**
 * Optional enhancement for a rendered LayerStack. Without it every band and
 * rail is a plain in-page link; with it, following one scrolls smoothly to the
 * section (instantly under reduced motion, where the plain link is left
 * alone), records the hash and moves focus there so Tab continues from the
 * section. Returns a cleanup function.
 */
export function enhanceLayerStack(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const onClick = (event: MouseEvent) => {
    if (!win || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const link = (event.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
    if (!link || !root.contains(link) || prefersReducedMotion(win)) return;
    const hash = link.getAttribute("href")!;
    const target = doc.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    win.history.pushState(null, "", hash);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!target.matches("a[href], button, input, select, textarea, summary, [tabindex]")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };
  root.addEventListener("click", onClick);
  root.setAttribute("data-stack-enhanced", "");
  return () => {
    root.removeEventListener("click", onClick);
    root.removeAttribute("data-stack-enhanced");
  };
}
