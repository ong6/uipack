import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  DocsLayout,
  docsSearchEntries,
  groupDocsResults,
  packDocsSearchIndex,
  searchDocs,
  unpackDocsSearchIndex,
  type DocsSection,
} from "../src/docs";
import {
  HOP_LIFT,
  HOP_LIFT_LEFT,
  hopCount,
  hopDuration,
  hopPlan,
  hopPose,
  markerTransform,
  morphPose,
  navRoute,
  navTripChange,
  navTripDuration,
  visibleRoute,
} from "../src/docs/DocsMarkers";

const page = `---
spec: x
---

# Writing rules

The house voice for every page. Answer first.

## Title forms

A deck you present takes a short verdict.

\`\`\`ts
const hidden = "code is not indexed";
\`\`\`

### Read-alone titles

A [full sentence](style.md) claim, with **bold** and \`code\`.

| Kind | Form |
| --- | --- |
| Figure | Claim |
`;

describe("docs search entries", () => {
  const entries = docsSearchEntries(page, { title: "Writing", href: "/foundations/writing", section: "rules" });

  it("cuts a page at its h2 and h3 headings, with the ids DocsMarkdown renders, and plain text", () => {
    expect(entries.map((e) => [e.heading, e.anchor])).toEqual([
      ["", ""],
      ["Title forms", "title-forms"],
      ["Read-alone titles", "read-alone-titles"],
    ]);
    expect(entries[0].text).toBe("The house voice for every page. Answer first.");
    expect(entries[1].text).not.toContain("hidden");
    expect(entries[2].text).toBe("A full sentence claim, with bold and code. Kind Form Figure Claim");
    expect(entries.every((e) => e.section === "rules" && e.page === "Writing")).toBe(true);
  });

  it("packs to a smaller file and unpacks with the same matches", () => {
    const long = docsSearchEntries(`# Long\n\n${"alpha beta gamma ".repeat(60)}zeta-omega rarely`, {
      title: "Long",
      href: "/long",
    });
    const file = packDocsSearchIndex([...entries, ...long], { opening: 40 });
    expect(file.pages).toHaveLength(2);
    const back = unpackDocsSearchIndex(JSON.parse(JSON.stringify(file)));
    expect(back[back.length - 1].text.length).toBeLessThanOrEqual(40);
    // A word past the opening is still found, through the entry's terms.
    expect(searchDocs(back, "rarely")[0]?.entry.page).toBe("Long");
    expect(searchDocs(back, "omega")[0]?.entry.page).toBe("Long");
    expect(JSON.stringify(file).length).toBeLessThan(JSON.stringify([...entries, ...long]).length);
  });
});

describe("searchDocs", () => {
  const entries = [
    ...docsSearchEntries(page, { title: "Writing", href: "/foundations/writing", section: "rules" }),
    ...docsSearchEntries("# Charts\n\nSpanChart and LayerStack.\n\n## Writing a chart title\n\nUse a claim.", {
      title: "Charts",
      href: "/charts",
      section: "build",
    }),
  ];

  it("needs every word, prefers the title, then a heading, then the text", () => {
    expect(searchDocs(entries, "")).toEqual([]);
    expect(searchDocs(entries, "nothing-like-this")).toEqual([]);
    const writing = searchDocs(entries, "writing");
    expect(writing[0].entry).toMatchObject({ page: "Writing", heading: "" });
    expect(writing.map((r) => r.entry.page)).toContain("Charts");
    expect(searchDocs(entries, "verdict deck")[0].entry.heading).toBe("Title forms");
    expect(searchDocs(entries, "title verdict").map((r) => r.entry.heading)).toEqual(["Title forms"]);
  });

  it("matches word starts, and inside a word from three letters; folds case and accents", () => {
    expect(searchDocs(entries, "spanc")[0].entry.page).toBe("Charts");
    expect(searchDocs(entries, "STACK")[0].entry.page).toBe("Charts");
    expect(searchDocs(entries, "ye")).toEqual([]);
    expect(searchDocs(entries, "aye")[0].entry.page).toBe("Charts");
    expect(searchDocs(entries, "vérdict")[0].entry.heading).toBe("Title forms");
  });

  it("groups results by section, best section first", () => {
    const groups = groupDocsResults(searchDocs(entries, "chart"));
    expect(groups[0].section).toBe("build");
  });
});

describe("DocsLayout sections, markers, drawer and search", () => {
  const sections: DocsSection[] = [
    { id: "start", title: "Start", hue: "red", items: [{ title: "Overview", href: "/" }] },
    {
      id: "build",
      title: "Build",
      hue: "blue",
      icon: <svg data-testid="build-icon" />,
      items: [
        { title: "Recipes overview", href: "/recipes", group: "Recipes" },
        { title: "Deck player", href: "/deck", group: "Components", items: [{ title: "Bento", href: "/deck?b" }] },
      ],
    },
  ];

  it("folds sections: the current one open, a count on each, captions, and shut sections inert", () => {
    const { container } = render(
      <DocsLayout productTitle="P" productHref="/" sections={sections} activeHref="/deck?b" collapsible marker="plane">
        <p>Body</p>
      </DocsLayout>,
    );
    const side = within(container.querySelector<HTMLElement>(".uipack-docs__sidebar")!);
    const start = side.getByRole("button", { name: "Start" });
    const build = side.getByRole("button", { name: "Build" });
    expect(start).toHaveAttribute("aria-expanded", "false");
    expect(build).toHaveAttribute("aria-expanded", "true");
    expect(build.querySelector(".uipack-docs__nav-count")).toHaveTextContent("3");
    expect([...container.querySelectorAll(".uipack-docs__nav-caption")].map((c) => c.textContent)).toEqual(
      expect.arrayContaining(["Recipes", "Components"]),
    );
    expect(document.getElementById(start.getAttribute("aria-controls")!)).toHaveAttribute("inert");
    fireEvent.click(start);
    expect(start).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(start.getAttribute("aria-controls")!)).not.toHaveAttribute("inert");
    // The section's hue is on its row; the marker's drawing is decorative.
    expect(container.querySelector('.uipack-docs__sidebar [data-nav-section="build"]')).toHaveStyle({ "--docs-hue": "blue" });
    expect(container.querySelector(".uipack-docs__sidebar .uipack-docs__nav-track")).toHaveAttribute("aria-hidden", "true");
    expect(side.getByTestId("build-icon").closest("[aria-hidden]")).not.toBeNull();
  });

  it("draws the mark with its dot on the live cell, in the host's colour, and leaves the plane as it was", () => {
    const { container, rerender } = render(
      <DocsLayout
        productTitle="P"
        productHref="/"
        sections={sections}
        activeHref="/recipes"
        onThisPage={[{ id: "a", title: "A", level: 2 }]}
        marker="mark"
        markerLive={2}
        markerColor="teal"
      >
        <p>Body</p>
      </DocsLayout>,
    );
    expect(container.querySelector(".uipack-docs")).toHaveStyle({ "--docs-marker-dot": "teal" });
    for (const place of [".uipack-docs__sidebar", ".uipack-docs__toc"]) {
      const cells = [...container.querySelectorAll(`${place} .uipack-docs__marker-mark rect`)];
      expect(cells.map((c) => c.getAttribute("data-cell"))).toEqual(["0", "1", "2", "3"]);
      expect(cells.map((c) => c.hasAttribute("data-live"))).toEqual([false, false, true, false]);
      expect(cells[2].closest("svg")).toHaveAttribute("aria-hidden", "true");
    }
    // Without a live cell it is the mark as drawn everywhere: the dot bottom right.
    rerender(
      <DocsLayout productTitle="P" productHref="/" sections={sections} activeHref="/recipes" marker="mark">
        <p>Body</p>
      </DocsLayout>,
    );
    expect(container.querySelector(".uipack-docs__sidebar rect[data-live]")).toHaveAttribute("data-cell", "3");
    rerender(
      <DocsLayout productTitle="P" productHref="/" sections={sections} activeHref="/recipes" marker="plane" markerLive={2}>
        <p>Body</p>
      </DocsLayout>,
    );
    expect(container.querySelector(".uipack-docs__sidebar .uipack-docs__marker-plane")).not.toBeNull();
    expect(container.querySelector(".uipack-docs__marker-mark")).toBeNull();
  });

  it("hops by distance: small hops close to the trail, one for a neighbouring link, nine at most, each landing with a squash", () => {
    // A neighbouring link (one 34px row) is one hop; a longer trip is more small hops rather than a
    // few long ones, and over within 900ms: it is decoration on a page that is already there.
    expect(hopCount(34, hopDuration(34))).toBe(1);
    expect(hopCount(68, hopDuration(68))).toBe(2);
    expect(hopCount(226, hopDuration(226))).toBe(6);
    expect(hopCount(2000, hopDuration(2000))).toBe(9);
    expect(hopDuration(34)).toBe(368);
    expect(hopDuration(2000)).toBe(900);
    // Never a hop shorter than 100ms, whatever the distance.
    expect(hopCount(400, 500)).toBe(5);
    // One plain hop of three over 240px: on the ground at each end, highest half-way through its
    // flight (4 to 7px off the line), then squashed (wider, shorter) before it rests at its own size.
    expect(hopPose(0, 3, 240)).toMatchObject({ hop: 0, along: 0, lift: 0, sx: 1, sy: 1 });
    const apex = hopPose(0.4 / 3, 3, 240);
    expect(apex.lift).toBeCloseTo(7, 1);
    expect(apex.along).toBeCloseTo(0.5 / 3, 2);
    expect(apex.sy).toBeGreaterThan(1);
    const landing = hopPose(0.9 / 3, 3, 240);
    expect(landing).toMatchObject({ hop: 0, lift: 0 });
    expect(landing.along).toBeCloseTo(1 / 3, 5);
    expect(landing.sx).toBeGreaterThan(1.05);
    expect(landing.sy).toBeLessThan(0.95);
    expect(hopPose(0.5, 3, 240).hop).toBe(1);
    const rest = hopPose(1, 3, 240);
    expect(rest).toMatchObject({ hop: 2, along: 1, lift: 0, deg: 0 });
    expect(rest.sx).toBeCloseTo(1, 5);
    expect(hopPose(0.4, 1, 10).lift).toBeCloseTo(4, 1);
    // The squash keeps the mark's bottom edge on the ground; at rest the transform is the plane's.
    expect(markerTransform(16, 100, 0)).toBe("translate(16.00 100.00) rotate(0.0)");
    expect(markerTransform(16, 100, 0, 1.16, 0.82)).toBe("translate(16.00 101.22) scale(1.160 0.820)");
    expect(markerTransform(16, 100, 90, 0.5, 0.5, true)).toBe("translate(16.00 100.00) rotate(90.0) scale(0.500 0.500)");
  });

  it("varies the hops: a plan from a seed, the same for the same trip, no kind twice running, every hop ending upright on the line", () => {
    const plan = hopPlan(1234, 9);
    expect(plan).toEqual(hopPlan(1234, 9));
    expect(plan).not.toEqual(hopPlan(4321, 9));
    for (const [i, step] of plan.entries()) {
      if (i) expect(step.kind).not.toBe(plan[i - 1].kind);
      expect(step.height).toBeGreaterThanOrEqual(0.75);
      expect(step.height).toBeLessThanOrEqual(1.25);
      // Whatever the kind, the hop starts and ends on the line, upright.
      expect(hopPose((i + 0.9) / 9, 9, 324, plan)).toMatchObject({ lift: 0, deg: 0 });
      // Never further off the line than 7px, and an arc to the left is lower: there is less room there.
      const peak = Math.max(...[0.2, 0.3, 0.4, 0.5, 0.6].map((f) => Math.abs(hopPose((i + f) / 9, 9, 324, plan).lift)));
      expect(peak).toBeLessThanOrEqual(step.side < 0 ? HOP_LIFT_LEFT : HOP_LIFT);
      // Every hop leaves the line.
      expect(peak).toBeGreaterThan(1.4);
    }
    expect(
      new Set(
        Array.from({ length: 40 }, (_, seed) =>
          hopPlan(seed, 4)
            .map((s) => s.kind + s.side)
            .join(),
        ),
      ).size,
    ).toBeGreaterThan(20);
  });

  it("changes between sections in a portal before the last hop: at rest at each end, out of sight in the open ring as it changes", () => {
    expect(morphPose(0)).toMatchObject({ scale: 1, ring: 0, swapped: false });
    const end = morphPose(1);
    expect(end.scale).toBeCloseTo(1, 5);
    expect(end.ring).toBeCloseTo(0, 5);
    expect(end.deg % 360).toBeCloseTo(0, 5);
    expect(morphPose(0.49).swapped).toBe(false);
    expect(morphPose(0.5)).toMatchObject({ scale: 0, ring: 1, swapped: true });
    // It comes out a little large and settles.
    expect(morphPose(0.8).scale).toBeCloseTo(1.1, 5);
  });

  it("keeps two links on one line on that line, and steps gently between the page column and a tree line", () => {
    // Two sub-pages of one tree: straight down the tree line, no trip in to the page column and back.
    expect(navRoute({ x: 46, y: 100 }, { x: 46, y: 134 })).toEqual([
      { x: 46, y: 100 },
      { x: 46, y: 134 },
    ]);
    // A page to its sub-page: along the column, then out over a step no steeper than the trip allows.
    const out = navRoute({ x: 16, y: 100 }, { x: 46, y: 134 });
    expect(out).toEqual([
      { x: 16, y: 100 },
      { x: 16, y: 117 },
      { x: 46, y: 134 },
    ]);
  });

  it("cuts a trip that starts out of the sidebar's view to the part seen, from the edge it comes in by", () => {
    // The old page's link is 1,500px above the visible box (600 to 1400): the trip starts at the box's top.
    const down = visibleRoute(navRoute({ x: 16, y: 100 }, { x: 16, y: 1000 }), 600, 1400);
    expect(down).toEqual([
      { x: 16, y: 600 },
      { x: 16, y: 1000 },
    ]);
    // From below, by the bottom edge, and still out to a sub-page's tree line.
    const up = visibleRoute(navRoute({ x: 46, y: 3000 }, { x: 46, y: 800 }), 600, 1400);
    expect(up[0]).toEqual({ x: 16, y: 1400 });
    expect(up.at(-1)).toEqual({ x: 46, y: 800 });
    // So the trip takes the time of the distance seen, and the mark changes sooner in it.
    const whole = navRoute({ x: 16, y: 100 }, { x: 16, y: 708 });
    const seen = visibleRoute(whole, 600, 1400);
    expect(navTripDuration(whole, "mark")).toBe(900);
    expect(navTripDuration(seen, "mark")).toBe(300 + 108 * 2);
    expect(navTripChange(seen)).toBeLessThan(navTripChange(whole));
    // A trip that starts in view, or never comes into view, is left alone.
    const inView = navRoute({ x: 16, y: 700 }, { x: 46, y: 900 });
    expect(visibleRoute(inView, 600, 1400)).toBe(inView);
    const away = navRoute({ x: 16, y: 100 }, { x: 16, y: 300 });
    expect(visibleRoute(away, 600, 1400)).toBe(away);
  });

  it("keeps the plain list and bar by default", () => {
    const { container } = render(
      <DocsLayout productTitle="P" productHref="/" sections={sections} activeHref="/recipes">
        <p>Body</p>
      </DocsLayout>,
    );
    expect(container.querySelector(".uipack-docs__nav-track")).toBeNull();
    expect(screen.queryByRole("button", { name: "Build" })).toBeNull();
    expect(container.querySelector(".uipack-docs__mobile-navigation")).not.toBeNull();
  });

  it('mobileNavigation="drawer" renders a named dialog instead of the disclosure; search adds the box', () => {
    const { container } = render(
      <DocsLayout
        productTitle="P"
        productHref="/"
        sections={sections}
        activeHref="/"
        mobileNavigation="drawer"
        navigationLabel="Library"
        search={{ load: async () => [] }}
        onThisPage={[{ id: "a", title: "A", level: 2 }]}
      >
        <p>Body</p>
      </DocsLayout>,
    );
    expect(container.querySelector(".uipack-docs__mobile-navigation")).toBeNull();
    expect(container.querySelector("dialog.uipack-docs__drawer")).toHaveAttribute("aria-label", "Library menu");
    expect(container.querySelector(".uipack-docs-search__button")).toHaveTextContent("Search docs");
    expect(container.querySelector("dialog.uipack-docs-search")).toHaveAttribute("aria-label", "Search the docs");
    // "On this page" also exists as the disclosure CSS shows where the rail has no room.
    expect(container.querySelector("details.uipack-docs__contents a")).toHaveAttribute("href", "#a");
  });
});
