import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  SlideStarter,
  estimateSpeechSeconds,
  formatSpeechGuide,
  renderSlideSvg,
  type SlideStarterData,
} from "../src/presentations";

const opening: SlideStarterData = {
  id: "opening",
  layout: "opening",
  title: "Opening",
  description: "A thesis & context.",
  content: {
    eyebrow: "A < B",
    headline: ["Design the slide.", "Plan what you say."],
    context: "Keep both together.",
  },
  speech: {
    say: "A slide carries the structure. The speaker adds the reasoning.",
    delivery: "Pause between the two claims.",
    next: "Now separate the two jobs.",
  },
  footer: { label: "UIPACK", page: "01 / 03" },
};

describe("presentation starters", () => {
  it("renders accessible, escaped, self-contained SVG", () => {
    const svg = renderSlideSvg(opening, { theme: "dark", width: 800 });
    expect(svg).toContain('width="800" height="450"');
    expect(svg).toContain("<title>Opening: Design the slide. Plan what you say.</title>");
    expect(svg).toContain("<desc>A thesis &amp; context.</desc>");
    expect(svg).toContain("A &lt; B");
    expect(svg).not.toContain(opening.speech.say);
  });

  it.each(["opening", "explanation", "system"] as const)(
    "renders the %s layout without putting speech in the SVG",
    (layout) => {
      const common = {
        id: layout,
        title: layout,
        description: `${layout} description`,
        speech: opening.speech,
      };
      const slide: SlideStarterData =
        layout === "opening"
          ? { ...opening, id: layout }
          : layout === "explanation"
            ? {
                ...common,
                layout,
                content: {
                  eyebrow: "Rule",
                  headline: "One point",
                  foundation: { title: "Base", detail: "Shared" },
                  applications: [
                    { title: "Screen", detail: "Visible" },
                    { title: "Speech", detail: "Spoken" },
                  ],
                },
              }
            : {
                ...common,
                layout,
                content: {
                  eyebrow: "Flow",
                  headline: "Three steps",
                  steps: [
                    { title: "One", detail: "First" },
                    { title: "Two", detail: "Second" },
                    { title: "Three", detail: "Third" },
                  ],
                  caption: "A useful outcome.",
                },
              };
      const svg = renderSlideSvg(slide);
      expect(svg).toContain("<svg");
      expect(svg).not.toContain(slide.speech.say);
    },
  );

  it("renders the visual and a semantic speaker guide during SSR", () => {
    const html = renderToString(<SlideStarter slide={opening} />);
    expect(html).toContain("Speaker guide");
    expect(html).toContain(opening.speech.say);
    expect(html).toContain("<figure");
    expect(html).toContain("<aside");
  });

  it("copies the full talk track and announces success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<SlideStarter slide={opening} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy talk track" }));
    });
    expect(writeText).toHaveBeenCalledWith(formatSpeechGuide(opening.speech));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Opening talk track copied.",
    );
  });

  it("derives a bounded estimate and can hide author-only speech", () => {
    expect(estimateSpeechSeconds("")).toBe(0);
    expect(estimateSpeechSeconds("one two")).toBe(5);
    render(<SlideStarter slide={opening} showSpeech={false} />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
});
