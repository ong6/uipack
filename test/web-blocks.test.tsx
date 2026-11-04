import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Connector, Figure } from "../src";
import { sectionOrder } from "../src/style";
import { ClosingCta, FeatureGrid, PricingPlans, Proof, Section, SiteFooter, StarHero, WebPage, WebSurface } from "../src/web";
import { STYLE_FILES, readStyle } from "./style-values";

const figure = (props: Partial<Parameters<typeof Figure>[0]> = {}) => (
  <Figure title="Flow" viewBox="0 0 100 40" alt="A flow" legend={[{ label: "Request", kind: "request" }]} {...props}>
    <Connector
      points={[
        [0, 20],
        [100, 20],
      ]}
    />
  </Figure>
);

describe("a style swap keeps the page's layout", () => {
  it("renders the page's own section order in every style by default", () => {
    const ids = ["hero", "how", "demo", "proof", "pricing", "faq"];
    for (const style of ["technical", "landing", "graphical"] as const) expect(sectionOrder(style, ids)).toEqual(ids);
  });

  it("keeps every section under the opt-in style order, appending ids the style does not name", () => {
    const order = sectionOrder("graphical", ["hero", "how", "demo", "faq", "closing"], "style");
    expect(order.slice(0, 3)).toEqual(["hero", "how", "faq"]);
    expect([...order].sort()).toEqual(["closing", "demo", "faq", "hero", "how"]);
  });

  it("WebPage renders sections in the order given, with the shared defaults, whatever the style", () => {
    for (const style of ["technical", "landing", "graphical"] as const) {
      const seen: string[] = [];
      const { container, unmount } = render(
        <WebPage
          uiStyle={style}
          sections={{
            hero: (page) => {
              seen.push(`${page.defaults.hero}/${page.defaults.align}`);
              return <p>hero</p>;
            },
            faq: <p>faq</p>,
            how: <p>how</p>,
          }}
        />,
      );
      expect([...container.querySelectorAll("p")].map((p) => p.textContent)).toEqual(["hero", "faq", "how"]);
      expect(container.firstElementChild).toHaveAttribute("data-ui-layout", "shared");
      unmount();
      expect(seen).toEqual(["demo/start"]);
    }
  });

  it("StarHero sits on the start edge by default and draws no stray chart behind a proof", () => {
    const { container } = render(
      <StarHero title="Title">
        <div>proof</div>
      </StarHero>,
    );
    const hero = container.querySelector(".uipack-web-hero")!;
    expect(hero).toHaveAttribute("data-align", "start");
    expect(hero.querySelector(".uipack-web-hero__visual")).toBeNull();
    const { container: bare } = render(<StarHero title="Title" />);
    expect(bare.querySelector(".uipack-web-hero__visual svg")).not.toBeNull();
  });
});

describe("figure chrome on a web page", () => {
  it("is full in an article: Open canvas and the legend", () => {
    render(figure());
    expect(screen.getByRole("button", { name: "Open canvas" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Legend" })).toBeInTheDocument();
  });

  it("is quiet on a web page: no Open canvas, no one-entry legend", () => {
    render(<WebSurface>{figure()}</WebSurface>);
    expect(screen.queryByRole("button", { name: "Open canvas" })).toBeNull();
    expect(screen.queryByRole("list", { name: "Legend" })).toBeNull();
  });

  it("keeps a legend that tells two kinds apart, and a figure can ask for full chrome", () => {
    const two = [
      { label: "Request", kind: "request" as const },
      { label: "Response", kind: "response" as const },
    ];
    const { unmount } = render(<WebSurface>{figure({ legend: two })}</WebSurface>);
    expect(screen.getByRole("list", { name: "Legend" })).toBeInTheDocument();
    unmount();
    render(<WebSurface>{figure({ chrome: "full" })}</WebSurface>);
    expect(screen.getByRole("button", { name: "Open canvas" })).toBeInTheDocument();
  });

  it("takes the page's faces and frame (web.css), not the figure's system stack", () => {
    const css = readFileSync("src/web/web.css", "utf8");
    expect(css).toMatch(
      /\.uipack-web \.uipack \{[^}]*--uipack-sans: var\(--web-font-text\);[^}]*--uipack-mono: var\(--web-font-mono\);/,
    );
  });

  it("Graphical and Landing draw request flows in their own palette, not Technical's blue", () => {
    for (const id of ["graphical", "landing"] as const) {
      const css = readFileSync(STYLE_FILES[id], "utf8");
      expect(css, id).not.toMatch(/--ui-flow-request: light-dark\(#(2348e0|4f6fe6)/i);
    }
  });
});

describe("closing parts", () => {
  it("Proof shows the lead number with its denominator and meter, the stats and a named quote", () => {
    render(
      <Proof
        lead={{ value: "1,240", of: "of 1,263", label: "lines matched", ratio: 1240 / 1263 }}
        stats={[
          { value: "38", label: "freelancers" },
          { value: "23", label: "left for a person" },
        ]}
        quote={{ text: "It paid for itself.", name: "Mara Okafor", role: "Illustrator" }}
      />,
    );
    expect(screen.getByText("1,240")).toBeInTheDocument();
    expect(screen.getByText("of 1,263")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "98.2%" })).toBeInTheDocument();
    expect(screen.getByText("freelancers").closest("dl")).not.toBeNull();
    const quote = screen.getByText("It paid for itself.").closest("figure")!;
    expect(within(quote).getByText("Mara Okafor")).toBeInTheDocument();
    expect(quote.querySelector("blockquote")).not.toBeNull();
  });

  it("PricingPlans gives each plan its features and its own button; the featured plan gets the primary", () => {
    render(
      <PricingPlans
        plans={[
          { name: "Free", price: "$0", features: ["50 lines"], action: { label: "Try free", href: "#a" } },
          {
            name: "Pro",
            price: "$9",
            period: "a month",
            features: ["Unlimited"],
            action: { label: "Go Pro", href: "#b" },
            featured: true,
            badge: "Best",
          },
        ]}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Free", "Pro"]);
    expect(screen.getByRole("link", { name: "Try free" })).toHaveAttribute("data-variant", "secondary");
    expect(screen.getByRole("link", { name: "Go Pro" })).toHaveAttribute("data-variant", "primary");
    expect(screen.getByText("Best")).toBeInTheDocument();
    expect(screen.getByText("Unlimited").closest("li")).not.toBeNull();
  });

  it("ClosingCta is a labelled section with the one action; SiteFooter is a footer with its own nav", () => {
    render(
      <>
        <ClosingCta id="try" title="Try it now." action={{ label: "Try it", href: "#x" }} note="Nothing is stored." />
        <SiteFooter brand="Ledgerline" links={[{ label: "Pricing", href: "#p" }]} note="© 2026" />
      </>,
    );
    expect(screen.getByRole("region", { name: "Try it now." })).toHaveAttribute("id", "try");
    expect(screen.getByRole("link", { name: "Try it" })).toHaveAttribute("href", "#x");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Footer" })).toBeInTheDocument();
  });

  it("FeatureGrid numbered renders an ordered list with decorative numbers", () => {
    const { container } = render(
      <FeatureGrid
        numbered
        features={[
          { title: "Drop", body: "a" },
          { title: "Match", body: "b" },
        ]}
      />,
    );
    expect(container.querySelector("ol.uipack-web-features--numbered")).not.toBeNull();
    const nums = [...container.querySelectorAll(".uipack-web-feature__num")];
    expect(nums.map((n) => n.textContent)).toEqual(["1", "2"]);
    for (const n of nums) expect(n).toHaveAttribute("aria-hidden", "true");
  });

  it("a Section eyebrow carries the style's index slot, hidden from assistive tech", () => {
    const { container } = render(<Section eyebrow="FAQ" title="Questions" />);
    expect(container.querySelector(".uipack-web-eyebrow .uipack-web-section__index")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("every style fills the band, index, corner-mark and narrow-backdrop roles", () => {
    for (const id of ["technical", "landing", "graphical"] as const) {
      const vars = readStyle(id);
      for (const r of [
        "band-fill",
        "band-ink",
        "band-ink-2",
        "band-cta",
        "on-band-cta",
        "band-pattern",
        "backdrop-narrow",
        "section-index",
        "corner-marks",
      ])
        expect(vars, `${id} --ui-${r}`).toHaveProperty(r);
    }
  });
});
