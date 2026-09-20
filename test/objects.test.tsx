import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Box3, Vector3 } from "three";
import {
  createObject,
  disposeObject,
  type ObjectKind,
} from "../src/objects/scenes";
import { ObjectScene, objectPalettes, objectScenes, chooseObjectVariant } from "../src/objects";
afterEach(() => vi.restoreAllMocks());
const drawingContext = () => ({ fillText() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, save() {}, restore() {}, rect() {}, clip() {} }) as unknown as CanvasRenderingContext2D;
describe("authored object animation envelopes", () => {
  it("can select every curated look with controlled randomness", () => {
    expect([0, 0.34, 0.99].map(value => chooseObjectVariant(() => value))).toEqual([0, 1, 2]);
  });
  for (const kind of [
    "ai",
    "contact",
    "tennis",
    "trading",
    "server",
    "travel",
    "reading",
  ] as ObjectKind[]) {
    for (const variant of [0, 1, 2] as const)
    it(`${kind} variant ${variant} stays finite, fits the camera through the whole motion, and settles`, async () => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext());
      const object = await createObject(kind, objectPalettes.light, variant);
      const halfWidth = kind === "server" ? 3.25 : 2.65;
      for (let time = 0; time <= (object.userData.loopDuration ?? 5400); time += 30) {
        object.userData.animate(time);
        const box = new Box3().setFromObject(object);
        expect(Math.max(Math.abs(box.min.x), Math.abs(box.max.x))).toBeLessThan(
          halfWidth,
        );
        expect(Math.max(Math.abs(box.min.y), Math.abs(box.max.y))).toBeLessThan(
          2.2,
        );
      }
      if (object.userData.loopDuration) {
        object.userData.animate(0);
        const start = new Box3().setFromObject(object);
        object.userData.animate(object.userData.loopDuration);
        expect(new Box3().setFromObject(object).equals(start)).toBe(true);
      } else {
        expect(object.userData.phase).toBe("rest");
        const pose = new Box3().setFromObject(object);
        object.userData.animate(9000);
        expect(new Box3().setFromObject(object).equals(pose)).toBe(true);
      }
      disposeObject(object);
    });
  }

  it("tennis ball meets the racket face at the strike", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillText() {}, fillRect() {} } as unknown as CanvasRenderingContext2D);
    const object = await createObject("tennis", objectPalettes.light);
    for (let i = 0; i < 2; i++) {
      object.userData.animate(object.userData.contactTimes[i]);
      object.updateMatrixWorld(true);
      const ball = object.userData.ball.getWorldPosition(new Vector3());
      const racket = object.userData.rackets[i].localToWorld(object.userData.racketContact.clone());
      expect(ball.distanceTo(racket)).toBeLessThan(0.001);
    }
    object.userData.animate(5999);
    const before = object.userData.ball.getWorldPosition(new Vector3());
    object.userData.animate(6001);
    const after = object.userData.ball.getWorldPosition(new Vector3());
    expect(before.distanceTo(after)).toBeLessThan(0.01);
    disposeObject(object);
  });

  it("contact converges three distinct routes into one settled inbox", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillText() {},
      fillRect() {},
    } as unknown as CanvasRenderingContext2D);
    const object = await createObject("contact", objectPalettes.light);
    const { inboxPoint, routes, packets, receipts } = object.userData.contact;
    expect(routes).toHaveLength(3);
    expect(packets).toHaveLength(3);
    expect(receipts).toHaveLength(3);
    for (const route of routes)
      expect(route.getPoint(1).distanceTo(inboxPoint as Vector3)).toBeLessThan(
        0.0001,
      );
    expect(
      receipts.every((receipt: { scale: Vector3 }) => receipt.scale.x < 0.01),
    ).toBe(true);

    object.userData.animate(5400);
    expect(object.userData.phase).toBe("rest");
    expect(
      receipts.every((receipt: { scale: Vector3 }) => receipt.scale.x === 1),
    ).toBe(true);
    expect(
      packets.every((packet: { scale: Vector3 }) => packet.scale.x < 0.01),
    ).toBe(true);
    disposeObject(object);
  });

  it("exports contact metadata and a labelled non-WebGL fallback", () => {
    expect(objectScenes.find((scene) => scene.id === "contact")).toMatchObject({
      title: "Contact inbox",
    });
    render(
      <div style={{ height: 320 }}>
        <ObjectScene kind="contact" label="Contact inbox" active={false} />
      </div>,
    );
    expect(
      screen.getByRole("img", { name: "Contact inbox illustration" }),
    ).toBeInTheDocument();
    expect(document.querySelector("canvas")).toBeNull();
  });

  it("offers a playback-only mode for compact consumer embeds", () => {
    render(
      <div style={{ height: 320 }}>
        <ObjectScene
          kind="reading"
          label="Reading"
          active={false}
          controls="playback"
        />
      </div>,
    );
    expect(screen.queryByRole("button", { name: "Open canvas" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Another look" })).toBeNull();
    expect(document.querySelector('[data-controls="playback"]')).toBeInTheDocument();
  });
});
