import { readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { within } from "@testing-library/react";
import {
  Callout,
  ChangeNote,
  LayerHead,
  LinkList,
  NoteCard,
  NoteCluster,
  TermList,
  formatNoteDate,
  layerIndex,
  linkDomain,
  type NoteCardProps,
} from "../src/article";
import { LayerSection, harness, inference, notes, plannedNote } from "../examples/articleParts";

const mount = (el: ReactElement) => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(el);
  document.body.append(host);
  return host;
};
afterEach(() => {
  document.body.innerHTML = "";
});

const card: NoteCardProps = {
  href: "/prefill-vs-decode",
  kicker: "Inference",
  title: "Prefill and decode want different machines",
  description: "LLM inference has two phases with opposite bottlenecks. Which one you care about decides what hardware to buy.",
  date: "2026-08-30",
  minutes: 7,
};
const classesOf = (el: Element) => [...el.children].map((c) => c.className);

describe("formatting helpers", () => {
  it("formats ISO dates like the notes site and passes anything else through", () => {
    expect(formatNoteDate("2026-08-30")).toBe("30 Aug 2026");
    expect(formatNoteDate("2026-01-05")).toBe("5 Jan 2026");
    expect(formatNoteDate("2026-02-30")).toBe("2026-02-30");
    expect(formatNoteDate("2026-13-01")).toBe("2026-13-01");
    expect(formatNoteDate("Spring 2026")).toBe("Spring 2026");
  });

  it("derives a link's domain without www, and none for relative links", () => {
    expect(linkDomain("https://arxiv.org/abs/2309.06180")).toBe("arxiv.org");
    expect(linkDomain("https://www.anthropic.com/engineering/x")).toBe("anthropic.com");
    expect(linkDomain("http://jax-ml.github.io/scaling-book/")).toBe("jax-ml.github.io");
    expect(linkDomain("/prefill-vs-decode")).toBeUndefined();
    expect(linkDomain("#inference")).toBeUndefined();
    expect(linkDomain("mailto:a@b.c")).toBeUndefined();
    expect(linkDomain("https://")).toBeUndefined();
  });

  it("pads numeric layer indexes to two digits", () => {
    expect(layerIndex(8)).toBe("08");
    expect(layerIndex(12)).toBe("12");
    expect(layerIndex("8a")).toBe("8a");
  });
});

describe("NoteCard", () => {
  it("is one link whose children are kicker, title, description and meta", () => {
    const host = mount(<NoteCard {...card} />);
    const root = host.firstElementChild!;
    expect(root.tagName).toBe("A");
    expect(root.className).toBe("uipack-notecard");
    expect(root.getAttribute("href")).toBe("/prefill-vs-decode");
    expect(classesOf(root)).toEqual([
      "uipack-notecard__kicker",
      "uipack-notecard__title",
      "uipack-notecard__desc",
      "uipack-notecard__meta",
    ]);
    // No headings inside: the cards must not enter the page outline.
    expect(root.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
    expect(host.querySelectorAll("a")).toHaveLength(1);
  });

  it("keeps the full description and the meta in the link's accessible name", () => {
    const host = mount(<NoteCard {...card} />);
    const link = within(host).getByRole("link");
    const name = link.textContent!.replace(/\s+/g, " ");
    expect(name).toContain("Inference Prefill and decode want different machines LLM inference");
    expect(name).toContain("decides what hardware to buy. 30 Aug 2026 7 min read");
    expect(within(host).getByRole("link", { name: /Prefill and decode want different machines/ })).toBe(link);
  });

  it("prints the date with a machine-readable datetime and hides the arrow from assistive tech", () => {
    const host = mount(<NoteCard {...card} />);
    const time = host.querySelector("time.uipack-notecard__date")!;
    expect(time.getAttribute("datetime")).toBe("2026-08-30");
    expect(time.textContent).toBe("30 Aug 2026");
    expect(host.querySelector(".uipack-notecard__time")!.textContent).toBe("7 min read");
    const go = host.querySelector(".uipack-notecard__go")!;
    expect(go.getAttribute("aria-hidden")).toBe("true");
    expect(go.textContent).toBe("→");
  });

  it("omits optional parts and keeps a non-ISO date as text without datetime", () => {
    const host = mount(<NoteCard href="/x" title="T" description="D" date="Spring 2026" />);
    expect(host.querySelector(".uipack-notecard__kicker")).toBeNull();
    expect(host.querySelector(".uipack-notecard__time")).toBeNull();
    const time = host.querySelector("time")!;
    expect(time.hasAttribute("datetime")).toBe(false);
    expect(time.textContent).toBe("Spring 2026");
  });

  it("draws a planned note as a dashed box that is not a link and says Coming next", () => {
    const host = mount(<NoteCard {...plannedNote} href="/not-yet" date="2026-11-01" minutes={5} />);
    const root = host.firstElementChild!;
    expect(root.tagName).toBe("DIV");
    expect(root.className).toBe("uipack-notecard uipack-notecard--planned");
    expect(within(host).queryByRole("link")).toBeNull();
    expect(host.querySelector(".uipack-notecard__status")!.textContent).toBe("Coming next");
    expect(host.querySelector(".uipack-notecard__go, time, .uipack-notecard__time")).toBeNull();
    expect(
      mount(<NoteCard {...plannedNote} plannedLabel="Drafting" />).querySelector(".uipack-notecard__status")!.textContent,
    ).toBe("Drafting");
  });

  it("passes id and className through", () => {
    const root = mount(<NoteCard {...card} id="n1" className="extra" />).firstElementChild!;
    expect(root.id).toBe("n1");
    expect(root.className).toBe("uipack-notecard extra");
  });

  it("fails loudly on bad data, so a static build stops", () => {
    expect(() => renderToStaticMarkup(<NoteCard title="No link" description="d" />)).toThrow(/needs an `href`/);
    expect(() => renderToStaticMarkup(<NoteCard href="/x" title="" description="d" />)).toThrow(/needs a `title`/);
    expect(() => renderToStaticMarkup(<NoteCard href="/x" title="t" description="d" minutes={0} />)).toThrow(/minutes/);
    expect(() => renderToStaticMarkup(<NoteCard href="/x" title="t" description="d" status={"draft" as never} />)).toThrow(
      /unknown status/,
    );
  });
});

describe("NoteCluster", () => {
  const cluster = (
    <NoteCluster
      label="My notes on serving and product"
      note="One line."
      notes={[card, { ...card, href: "/q", title: "Q" }, plannedNote]}
    />
  );

  it("is a labelled dashed group around a list of cards", () => {
    const host = mount(cluster);
    const root = host.firstElementChild!;
    expect(root.className).toBe("uipack-cluster");
    expect(classesOf(root)).toEqual(["uipack-cluster__head", "uipack-cluster__note", "uipack-cluster__grid"]);
    expect(classesOf(root.querySelector(".uipack-cluster__head")!)).toEqual(["uipack-cluster__label", "uipack-cluster__count"]);
    const list = within(host).getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(list.getAttribute("role")).toBe("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    for (const li of items) {
      expect(li.className).toBe("uipack-cluster__item");
      expect(li.children).toHaveLength(1);
      expect(li.firstElementChild!.classList.contains("uipack-notecard")).toBe(true);
    }
    expect(within(host).getAllByRole("link")).toHaveLength(2);
  });

  it("counts its cards, hides the visible count from screen readers, and can override or hide it", () => {
    const count = mount(cluster).querySelector(".uipack-cluster__count")!;
    expect(count.textContent).toBe("3");
    expect(count.getAttribute("aria-hidden")).toBe("true");
    expect(mount(<NoteCluster label="L" notes={[card]} count={12} />).querySelector(".uipack-cluster__count")!.textContent).toBe(
      "12",
    );
    expect(mount(<NoteCluster label="L" notes={[card]} count={false} />).querySelector(".uipack-cluster__count")).toBeNull();
  });

  it("takes NoteCard children instead of data, and a wide modifier for the figure slot", () => {
    const host = mount(
      <NoteCluster label="L" wide>
        <NoteCard {...card} />
        {null}
        <NoteCard {...plannedNote} />
      </NoteCluster>,
    );
    expect(host.firstElementChild!.className).toBe("uipack-cluster uipack-cluster--wide");
    expect(host.querySelectorAll(".uipack-cluster__item")).toHaveLength(2);
    expect(host.querySelector(".uipack-cluster__count")!.textContent).toBe("2");
    expect(host.querySelector(".uipack-cluster__note")).toBeNull();
  });

  it("needs a label and at least one card", () => {
    expect(() => renderToStaticMarkup(<NoteCluster label="Empty" notes={[]} />)).toThrow(/at least one note/);
    expect(() => renderToStaticMarkup(<NoteCluster label="" notes={[card]} />)).toThrow(/needs a `label`/);
  });
});

describe("LayerHead", () => {
  it("shows the padded index, zone, metric and a Map link, with no heading of its own", () => {
    const host = mount(
      <LayerHead
        index={8}
        zone="Serving and product"
        metric={{ value: "~10 GB", label: "KV cache, one 32k chat" }}
        mapHref="#map"
      />,
    );
    const root = host.firstElementChild!;
    expect(root.className).toBe("uipack-layerhead");
    const row = root.querySelector(":scope > .uipack-layerhead__row")!;
    expect(classesOf(row)).toEqual(["uipack-layerhead__where", "uipack-layerhead__metric", "uipack-layerhead__map"]);
    expect(host.querySelector(".uipack-layerhead__index")!.textContent).toBe("Layer 08");
    expect(host.querySelector(".uipack-layerhead__sr")!.textContent).toBe("Layer ");
    expect(host.querySelector(".uipack-layerhead__zone")!.textContent).toBe("Serving and product");
    expect(host.querySelector(".uipack-layerhead__value")!.textContent).toBe("~10 GB");
    expect(host.querySelector(".uipack-layerhead__label")!.textContent).toBe("KV cache, one 32k chat");
    expect(host.querySelector(".uipack-layerhead__metric")!.textContent).toBe("~10 GB KV cache, one 32k chat");
    // The arrow is CSS; the link's name is the visible word.
    const link = within(host).getByRole("link", { name: "Map" });
    expect(link.getAttribute("href")).toBe("#map");
    expect(link.className).toBe("uipack-layerhead__map");
    expect(host.querySelector("h1, h2, h3, h4, h5, h6, [role=heading]")).toBeNull();
  });

  it("drops what it is not given", () => {
    const host = mount(<LayerHead index="10" />);
    expect(host.querySelector(".uipack-layerhead__index")!.textContent).toBe("Layer 10");
    expect(host.querySelector(".uipack-layerhead__zone, .uipack-layerhead__metric, a")).toBeNull();
    expect(
      mount(<LayerHead index={3} metric={{ value: "72" }} indexLabel="Step" mapLabel="Diagram" mapHref="#d" />).textContent,
    ).toBe("Step 03 72Diagram");
    expect(() => renderToStaticMarkup(<LayerHead index={3} metric={{ value: "" }} />)).toThrow(/metric.value/);
  });
});

describe("TermList", () => {
  it("is a label and a list of terms that are not links", () => {
    const host = mount(<TermList terms={inference.terms} />);
    const root = host.firstElementChild!;
    expect(root.className).toBe("uipack-terms");
    expect(classesOf(root)).toEqual(["uipack-terms__label", "uipack-terms__list"]);
    expect(host.querySelector(".uipack-terms__label")!.textContent).toBe("Learn");
    const list = within(host).getByRole("list");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(inference.terms);
    expect(list.querySelectorAll(".uipack-terms__term")).toHaveLength(inference.terms.length);
    expect(within(host).queryByRole("link")).toBeNull();
  });

  it("takes a label and refuses an empty list", () => {
    expect(mount(<TermList label="Terms" terms={["a", "", null]} />).querySelectorAll("li")).toHaveLength(1);
    expect(() => renderToStaticMarkup(<TermList terms={[]} />)).toThrow(/at least one term/);
  });
});

describe("Callout", () => {
  it("labels a self-test and keeps inline children", () => {
    const host = mount(
      <Callout kind="selftest">
        Why does <a href="#kv">one 32k conversation</a> matter?
      </Callout>,
    );
    const root = host.firstElementChild!;
    expect(root.className).toBe("uipack-callout uipack-callout--selftest");
    expect(classesOf(root)).toEqual(["uipack-callout__label", "uipack-callout__body"]);
    expect(root.querySelector(".uipack-callout__label")!.textContent).toBe("Self-test");
    expect(root.querySelector(".uipack-callout__body")!.innerHTML).toBe(
      'Why does <a href="#kv">one 32k conversation</a> matter?',
    );
  });

  it("defaults to a self-test, has a generic note kind and a label override", () => {
    expect(mount(<Callout>Q?</Callout>).firstElementChild!.className).toBe("uipack-callout uipack-callout--selftest");
    const note = mount(<Callout kind="note">Aside.</Callout>).firstElementChild!;
    expect(note.className).toBe("uipack-callout uipack-callout--note");
    expect(note.querySelector(".uipack-callout__label")!.textContent).toBe("Note");
    expect(mount(<Callout label="Check yourself">Q?</Callout>).querySelector(".uipack-callout__label")!.textContent).toBe(
      "Check yourself",
    );
    expect(() => renderToStaticMarkup(<Callout kind={"warn" as never}>x</Callout>)).toThrow(/unknown kind/);
    expect(() => renderToStaticMarkup(<Callout>{""}</Callout>)).toThrow(/content/);
  });
});

describe("ChangeNote", () => {
  it("is a label with an optional kicker, then the owner's content", () => {
    const host = mount(<ChangeNote kicker="2025–26">{inference.changed}</ChangeNote>);
    const root = host.firstElementChild!;
    expect(root.className).toBe("uipack-change");
    expect(classesOf(root)).toEqual(["uipack-change__label", "uipack-change__body"]);
    expect(root.querySelector(".uipack-change__label")!.textContent).toBe("What changed 2025–26");
    expect(root.querySelector(".uipack-change__kicker")!.textContent).toBe("2025–26");
    expect(within(root.querySelector(".uipack-change__body") as HTMLElement).getAllByRole("link")).toHaveLength(5);
    expect(mount(<ChangeNote>x</ChangeNote>).querySelector(".uipack-change__kicker")).toBeNull();
  });
});

describe("LinkList", () => {
  it("renders link rows with the title and a derived domain inside each link", () => {
    const host = mount(
      <LinkList
        links={[
          { href: "https://arxiv.org/abs/2309.06180", title: "The PagedAttention paper" },
          { href: "https://www.anthropic.com/engineering/x", title: "Effective context engineering" },
          { href: "/prefill-vs-decode", title: "Prefill vs decode" },
          { href: "https://example.com/a", title: "Named", domain: "Example" },
          { href: "https://example.com/b", title: "Hidden", domain: false },
        ]}
      />,
    );
    const root = host.firstElementChild!;
    expect(root.className).toBe("uipack-links");
    expect(classesOf(root)).toEqual(["uipack-links__label", "uipack-links__list"]);
    expect(root.querySelector(".uipack-links__label")!.textContent).toBe("Go deeper");
    const list = within(host).getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items.map((li) => li.className)).toEqual(Array(5).fill("uipack-links__item"));
    const links = within(list).getAllByRole("link");
    expect(links.map((a) => a.className)).toEqual(Array(5).fill("uipack-links__link"));
    expect(links.map((a) => a.textContent)).toEqual([
      "The PagedAttention paper arxiv.org",
      "Effective context engineering anthropic.com",
      "Prefill vs decode",
      "Named Example",
      "Hidden",
    ]);
    expect(classesOf(links[0])).toEqual(["uipack-links__title", "uipack-links__domain"]);
    expect(links[0].getAttribute("href")).toBe("https://arxiv.org/abs/2309.06180");
  });

  it("takes inline children as a fallback, after or instead of rows", () => {
    const host = mount(
      <LinkList label="Further">
        METR's <a href="https://arxiv.org/abs/2503.14499">long-tasks paper</a>.
      </LinkList>,
    );
    const root = host.firstElementChild!;
    expect(classesOf(root)).toEqual(["uipack-links__label", "uipack-links__body"]);
    expect(root.querySelector(".uipack-links__label")!.textContent).toBe("Further");
    expect(within(host).getByRole("link", { name: "long-tasks paper" })).toBeTruthy();
    expect(() => renderToStaticMarkup(<LinkList />)).toThrow(/links/);
    expect(() => renderToStaticMarkup(<LinkList links={[{ href: "", title: "x" }]} />)).toThrow(/href/);
  });
});

describe("class contract", () => {
  const css = readFileSync("src/article/article.css", "utf8");
  const docs = readFileSync("docs/article.md", "utf8");
  // Every option of every part, so every class the components can emit appears.
  const everything = (
    <>
      <LayerSection section={inference} id="inference" mapHref="#map" />
      <LayerSection section={harness} id="harness" wide />
      <NoteCard {...notes.prefillVsDecode} />
      <NoteCard {...plannedNote} />
      <NoteCluster label="L" note="N" notes={[card]} />
      <Callout kind="note">Aside.</Callout>
      <LinkList links={inference.links}>Fallback.</LinkList>
    </>
  );
  const emitted = () => {
    const host = mount(everything);
    return [...new Set([...host.querySelectorAll("[class]")].flatMap((el) => [...el.classList]))]
      .filter((c) => c.startsWith("uipack-"))
      .sort();
  };

  it("documents and styles every class the components emit", () => {
    const classes = emitted();
    expect(classes.length).toBeGreaterThan(30);
    for (const name of classes) {
      expect(docs, `docs/article.md is missing ${name}`).toContain(`\`${name}\``);
      expect(css, `article.css never styles ${name}`).toMatch(new RegExp(`\\.${name}(?![\\w-])`));
    }
  });

  it("styles nothing the components cannot emit", () => {
    const classes = new Set(emitted());
    const styled = new Set(css.match(/\.uipack-[\w-]+/g)!.map((s) => s.slice(1)));
    for (const name of styled) expect(classes.has(name), `${name} is styled but never emitted`).toBe(true);
  });

  it("is static: no inline styles, scripts, event handlers or ids it did not get", () => {
    const html = renderToStaticMarkup(everything);
    expect(html).not.toMatch(/ style=|<script|<style| on[a-z]+=/);
    const ids = [...mount(everything).querySelectorAll("[id]")].map((el) => el.id);
    expect(ids).toEqual(["inference", "harness"]);
  });

  it("uses only --uipack-* tokens from the host, each with a fallback", () => {
    const used = [...new Set(css.match(/var\(--uipack-[\w-]+/g)!.map((s) => s.slice(4)))].sort();
    expect(used).toEqual([
      "--uipack-accent",
      "--uipack-article-gap",
      "--uipack-article-step",
      "--uipack-article-wide",
      "--uipack-fg",
      "--uipack-label-font",
      "--uipack-mono",
      "--uipack-radius",
      "--uipack-sans",
      "--uipack-surface-raised",
    ]);
    for (const token of used) expect(css).toMatch(new RegExp(`var\\(${token},`));
    // Colours are tokens: the only literals are the Technical fallbacks inside var().
    const literals = css.replace(/var\(--uipack-[\w-]+, #[0-9a-f]{6}\)/g, "").match(/#[0-9a-f]{3,8}\b/gi);
    expect(literals).toBeNull();
  });
});

describe("the stylesheet keeps boxes for links", () => {
  const css = readFileSync("src/article/article.css", "utf8");
  const rule = (selector: string) => {
    const at = css.indexOf(`${selector} {`);
    expect(at, selector).toBeGreaterThan(-1);
    return css.slice(at, css.indexOf("}", at));
  };

  it("draws terms as plain text, each whole on one line, with a CSS dot that is not read aloud", () => {
    const term = rule(".uipack-terms .uipack-terms__term");
    expect(term).toMatch(/display: inline-block;/);
    expect(term).toMatch(/max-width: 100%;/);
    expect(term).not.toMatch(/border|background|padding/);
    expect(rule(".uipack-terms .uipack-terms__term:not(:last-child)::after")).toMatch(/content: "·" \/ "";/);
    expect(rule(".uipack-terms.uipack-terms")).toMatch(/font: 400 15px/);
  });

  it("gives a self-test a 3px accent rule and no box, unlike ChangeNote's 1.25px ink rule", () => {
    const callout = rule(".uipack-callout.uipack-callout");
    expect(callout).toMatch(/background: none;/);
    expect(callout).toMatch(/border: 0;/);
    expect(callout).toMatch(/border-left: 3px solid var\(--ua-accent\);/);
    expect(callout).not.toMatch(/--ua-raised|--ua-edge/);
    expect(rule(".uipack-change.uipack-change")).toMatch(/border-left: 1\.25px solid var\(--ua-edge\);/);
    expect(rule(".uipack-change .uipack-change__body")).toMatch(/font-size: 0\.94em;[\s\S]*85%/);
    // Only the cards, which are links, keep the filled node box.
    expect(css.match(/background: var\(--ua-raised\)/g)).toHaveLength(1);
  });

  it("sets the metric label in sentence case and keeps the zone uppercase", () => {
    const label = rule(".uipack-layerhead .uipack-layerhead__label");
    expect(label).toMatch(/text-transform: none;/);
    expect(label).toMatch(/letter-spacing: 0;/);
    expect(label).toMatch(/13px/);
    const upper = css.slice(css.indexOf("/* Uppercase labels"), css.indexOf("/* 8px square markers"));
    expect(upper).toContain(".uipack-layerhead .uipack-layerhead__zone");
    expect(upper).not.toContain("uipack-layerhead__label");
  });
});

describe("the article entry", () => {
  it("has no hooks or client-only code, so it renders in a server component", () => {
    for (const file of ["NoteCard.tsx", "parts.tsx", "format.ts", "index.ts"]) {
      const source = readFileSync(`src/article/${file}`, "utf8");
      expect(source, file).not.toMatch(/\buse[A-Z]\w*\(|"use client"|react-dom|window\.|document\./);
    }
  });
});
