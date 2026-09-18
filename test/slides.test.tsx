import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  SlidePlayer,
  SlideScene,
  clampStop,
  harnessDive,
  resolveNodePose,
  slideStories,
  validateSlideStory,
} from "../src/slides";

describe("slide story contract", () => {
  it("ships valid, independently addressable stops", () => {
    for (const story of slideStories) {
      expect(validateSlideStory(story)).toEqual([]);
      for (const stop of story.stops)
        for (const n of story.nodes) {
          const first = resolveNodePose(n, stop);
          first.position[0] += 999;
          expect(resolveNodePose(n, stop).position).not.toEqual(first.position);
        }
    }
  });
  it("rejects dangling routes, bad camera poses, and invalid opacity", () => {
    const story = structuredClone(harnessDive);
    story.connections[0].to = "missing";
    story.stops[0].camera.position = [...story.stops[0].camera.target];
    story.stops[0].nodes = { model: { opacity: 2 } };
    expect(validateSlideStory(story).join(" ")).toMatch(/endpoint/);
    expect(validateSlideStory(story).join(" ")).toMatch(/camera/);
    expect(validateSlideStory(story).join(" ")).toMatch(/opacity/);
  });
  it("rejects unsafe animation timings", () => {
    const story = structuredClone(harnessDive);
    story.stops[0].transition = { duration: NaN, stagger: -1 };
    expect(validateSlideStory(story).join(" ")).toMatch(/duration/);
    expect(validateSlideStory(story).join(" ")).toMatch(/stagger/);
  });
  it("clamps stale, nonfinite and negative indices", () => {
    expect(clampStop(NaN, 4)).toBe(0);
    expect(clampStop(99, 4)).toBe(3);
    expect(clampStop(-1, 4)).toBe(0);
  });
});
describe("slide player", () => {
  it("renders a readable SSR fallback without a browser or WebGL", () => {
    const html = renderToString(<SlidePlayer story={harnessDive} />);
    expect(html).toContain("The model lives inside a system.");
    expect(html).toContain("Diagram view");
    expect(html).not.toContain("<canvas");
  });
  it("supports direct jumps, keyboard boundaries, and back navigation", () => {
    render(<SlidePlayer story={harnessDive} renderMode="diagram" />);
    const player = screen.getByRole("region", { name: /presentation/ });
    expect(
      screen.getByRole("button", { name: "Previous stop" }),
    ).toBeDisabled();
    fireEvent.keyDown(player, { key: "End" });
    expect(
      screen.getByRole("heading", { name: "Evidence decides what leaves." }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Next stop" })).toBeDisabled();
    fireEvent.keyDown(player, { key: "ArrowLeft" });
    expect(
      screen.getByRole("heading", { name: "A proposal becomes a tool call." }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Go to Open the harness." }),
    );
    expect(player).toHaveAttribute("data-stop", "inside");
    fireEvent.keyDown(player, { key: "Home" });
    expect(player).toHaveAttribute("data-stop", "outside");
  });
  it("lets a host deck own navigation without mutating the controlled stop", () => {
    const onStopChange = vi.fn();
    const view = render(
      <SlidePlayer
        story={harnessDive}
        stopId="inside"
        onStopChange={onStopChange}
        renderMode="diagram"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next stop" }));
    expect(onStopChange).toHaveBeenCalledWith("context");
    expect(
      screen.getByRole("heading", { name: "Open the harness." }),
    ).toBeVisible();
    view.rerender(
      <SlidePlayer
        story={harnessDive}
        stopId="context"
        onStopChange={onStopChange}
        renderMode="diagram"
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: "Give the model the right context.",
      }),
    ).toBeVisible();
  });
  it("does not intercept navigation keys from editable controls", () => {
    render(
      <SlidePlayer
        story={harnessDive}
        renderMode="diagram"
        footer={<input aria-label="Presenter input" />}
      />,
    );
    fireEvent.keyDown(screen.getByLabelText("Presenter input"), {
      key: "ArrowRight",
    });
    expect(
      screen.getByRole("heading", { name: "The model lives inside a system." }),
    ).toBeVisible();
  });
  it("respects reduced motion and restores page scroll on presentation cleanup", () => {
    globalThis.__reduced = true;
    const view = render(
      <SlidePlayer story={harnessDive} renderMode="diagram" />,
    );
    expect(screen.getByRole("button", { name: "Pause flow" })).toBeDisabled();
    const before = document.body.style.overflow;
    fireEvent.click(screen.getByRole("button", { name: "Present" }));
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe(before);
    globalThis.__reduced = false;
  });
  it("explains invalid custom data instead of failing inside WebGL", () => {
    render(<SlideScene story={{ ...harnessDive, stops: [] }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("at least one stop");
  });
});
