import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { SlideStarter, renderSlideSvg, type SlideStarterData } from "../src/presentations";
import { estimateSpeechSeconds, formatSpeechGuide } from "../src/presentations/SpeakerGuide";
import { renderSlideSvgWithFloor } from "../src/presentations/renderSlideSvg";
import { presentationStarters } from "../playground/presentationExamples";

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
    // The page number ends where the footer rule ends.
    expect(svg).toContain('<path d="M64 592H1136"');
    expect(svg).toMatch(/<text x="1136" y="635" text-anchor="end"[^>]*>01 \/ 03<\/text>/);
  });

  it.each(["opening", "explanation", "system"] as const)("renders the %s layout without putting speech in the SVG", (layout) => {
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
  });

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
    expect(screen.getByRole("status")).toHaveTextContent("Opening talk track copied.");
  });

  it("derives a bounded estimate and can hide author-only speech", () => {
    expect(estimateSpeechSeconds("")).toBe(0);
    expect(estimateSpeechSeconds("one two")).toBe(5);
    render(<SlideStarter slide={opening} showSpeech={false} />);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("raises every text to the floor and leaves the drawing alone below it", () => {
    const sizes = (svg: string) => [...svg.matchAll(/font-size="(\d+)"/g)].map((m) => Number(m[1]));
    for (const slide of presentationStarters) {
      expect(renderSlideSvgWithFloor(slide, {}, 0)).toBe(renderSlideSvg(slide));
      expect(renderSlideSvgWithFloor(slide, {}, 13)).toBe(renderSlideSvg(slide));
      expect(Math.min(...sizes(renderSlideSvgWithFloor(slide, {}, 41)))).toBe(41);
    }
    // A step's mono detail that no longer fits one line wraps, inside a wider box.
    const system = renderSlideSvgWithFloor(presentationStarters[2], {}, 41);
    expect(system).toMatch(/>title and<\/text>/);
    expect(system).toMatch(/<rect x="64" y="295" width="316"/);
  });

  it("wraps long text only under a floor", () => {
    const context = "Shared type, colour and spacing for websites and slides, and for every deck too.";
    const long: SlideStarterData = { ...opening, content: { ...opening.content, context } };
    expect(renderSlideSvgWithFloor(long, {}, 0)).toContain(`>${context}</text>`);
    expect(renderSlideSvgWithFloor(long, {}, 41)).not.toContain(`>${context}</text>`);
  });

  it("server-renders the preview for a desktop column before it is measured", () => {
    const html = renderToString(<SlideStarter slide={opening} />);
    // Unmeasured, so presentations.css's narrow fallback applies until the effect runs.
    expect(html).not.toContain("data-measured");
    // 12px at the 1088px a Figure assumes: 14 units, so the 13-unit footer is drawn at 14.
    expect(html).toMatch(/font-size="14"[^>]*>01 \/ 03</);
  });
});
