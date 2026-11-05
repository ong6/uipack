import { readFileSync } from "node:fs";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createObject, disposeObject, type ObjectKind } from "../src/objects/scenes";
import {
  ObjectScene,
  objectPalettes,
  objectScenes,
  chooseObjectVariant,
  objectLooks,
  objectVariants,
  normalizeObjectVariant,
  transferObjectVariant,
  type ObjectVariant,
} from "../src/objects";
// Studio tennis loads its model by URL (src/package-assets.ts). jsdom cannot fetch it, so parse the
// packaged file from disk; the test still checks the URL it was asked for.
const modelFile = readFileSync("assets/objects/tennis-return.glb");
const loadedUrls: string[] = [];
beforeEach(() => {
  loadedUrls.length = 0;
  vi.spyOn(GLTFLoader.prototype, "loadAsync").mockImplementation(function (this: GLTFLoader, url: string) {
    loadedUrls.push(url);
    return this.parseAsync(Uint8Array.from(modelFile).buffer, ""); // an ArrayBuffer from this realm, as GLTFLoader checks
  });
});
afterEach(() => vi.restoreAllMocks());
const drawingContext = () =>
  ({
    fillText() {},
    fillRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    save() {},
    restore() {},
    rect() {},
    clip() {},
  }) as unknown as CanvasRenderingContext2D;
describe("authored object animation envelopes", () => {
  it("can select every look a kind offers, and only those, with controlled randomness", () => {
    expect([0, 0.34, 0.67, 0.99].map((value) => chooseObjectVariant("ai", () => value))).toEqual([5, 2, 3, 3]);
    expect([0, 0.5, 0.99].map((value) => chooseObjectVariant("server", () => value))).toEqual([4, 0, 0]);
    // Another look steps on through the kind's list and wraps.
    expect([0, 1, 2, 3].map((step) => chooseObjectVariant("travel", () => 0.5, step))).toEqual([1, 2, 0, 1]);
  });
  it("each kind names exactly its looks, two to four of them, and falls back to its default", () => {
    for (const kind of Object.keys(objectLooks) as ObjectKind[]) {
      const looks = objectLooks[kind];
      expect(looks.length).toBeGreaterThanOrEqual(2);
      expect(looks.length).toBeLessThanOrEqual(4);
      expect(Object.keys(objectVariants[kind]).map(Number).sort()).toEqual([...looks].sort());
      for (const variant of [0, 1, 2, 3, 4, 5] as ObjectVariant[])
        expect(normalizeObjectVariant(kind, variant)).toBe(looks.includes(variant) ? variant : looks[0]);
    }
    // The website's older picks: reading Kinetic and server Cartoon are gone, so each shows its default.
    expect(normalizeObjectVariant("reading", 2)).toBe(4);
    expect(normalizeObjectVariant("server", 3)).toBe(4);
    expect(normalizeObjectVariant("contact", 4)).toBe(0);
    // Switching subjects keeps the direction where the next subject has it.
    expect(transferObjectVariant("travel", "trading", 2)).toBe(2);
    expect(transferObjectVariant("travel", "ai", 0)).toBe(5);
    expect(transferObjectVariant("tennis", "contact", 3)).toBe(3);
    expect(transferObjectVariant("trading", "contact", 2)).toBe(0);
    expect(transferObjectVariant("contact", "reading", 3)).toBe(3);
  });
  it("builds a kind's default look for a variant it does not offer", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext());
    const object = await createObject("ai", objectPalettes.light, 0);
    expect(object.userData.variant).toBe(5);
    expect(object.userData.style).toBe("abstract");
    disposeObject(object);
  });
  for (const kind of ["ai", "contact", "tennis", "trading", "server", "travel", "reading"] as ObjectKind[]) {
    for (const variant of objectLooks[kind])
      it(`${kind} variant ${variant} stays finite, fits the camera through the whole motion, and settles`, async () => {
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext());
        const object = await createObject(kind, objectPalettes.light, variant);
        const halfWidth = variant === 4 && kind !== "contact" ? 2.15 : kind === "server" ? 3.25 : 2.65;
        for (let time = 0; time <= (object.userData.loopDuration ?? 5400); time += 30) {
          object.userData.animate(time);
          const box = new Box3().setFromObject(object);
          expect(Math.max(Math.abs(box.min.x), Math.abs(box.max.x))).toBeLessThan(halfWidth);
          expect(
            Math.max(
              Math.abs(box.min.y + (variant === 4 && kind !== "contact" ? 0.15 : 0)),
              Math.abs(box.max.y + (variant === 4 && kind !== "contact" ? 0.15 : 0)),
            ),
          ).toBeLessThan(variant === 4 && kind !== "contact" ? 1.75 : 2.2);
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

  for (const kind of ["ai", "tennis", "trading", "server", "travel", "reading"] as ObjectKind[])
    it(`${kind} directions have different geometry and seamless moving loops`, async () => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext());
      const signatures: string[] = [];
      for (const variant of objectLooks[kind]) {
        const object = await createObject(kind, objectPalettes.light, variant);
        const geometry: number[] = [];
        object.traverse((item) => {
          const mesh = item as import("three").Mesh;
          if (mesh.geometry) geometry.push(mesh.geometry.attributes.position.count);
        });
        signatures.push(geometry.join(","));
        if (variant !== 0) {
          const snapshot = (time: number) => {
            object.userData.animate(time);
            object.updateMatrixWorld(true);
            const matrices: number[] = [];
            object.traverse((item) => matrices.push(...item.matrixWorld.elements));
            return matrices;
          };
          // Position and velocity at the wrap, repeated for three entire cycles.
          for (const offset of [-1, 0, 1, 2100])
            for (const cycle of [1, 2, 3]) {
              const first = snapshot(offset),
                repeated = snapshot(offset + cycle * 12000);
              expect(Math.max(...first.map((n, i) => Math.abs(n - repeated[i])))).toBeLessThan(1e-8);
            }
          const before = snapshot(11999),
            after = snapshot(12001);
          expect(Math.max(...before.map((n, i) => Math.abs(n - after[i])))).toBeLessThan(0.02);
        }
        disposeObject(object);
      }
      expect(new Set(signatures).size).toBe(objectLooks[kind].length);
    });

  it("map folds stay connected throughout opening", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext());
    const object = await createObject("travel", objectPalettes.light, 0);
    for (let t = 0; t <= 1700; t += 40) {
      object.userData.animate(t);
      object.updateMatrixWorld(true);
      const [left, center, right] = object.userData.mapFolds;
      for (const y of [-1.225, 1.225]) {
        expect(left.localToWorld(new Vector3(0, y, 0)).distanceTo(center.localToWorld(new Vector3(-0.615, y, 0)))).toBeLessThan(
          0.00001,
        );
        expect(right.localToWorld(new Vector3(0, y, 0)).distanceTo(center.localToWorld(new Vector3(0.615, y, 0)))).toBeLessThan(
          0.00001,
        );
      }
    }
    disposeObject(object);
  });
  it("tennis ball meets the racket face at the strike", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillText() {},
      fillRect() {},
    } as unknown as CanvasRenderingContext2D);
    const object = await createObject("tennis", objectPalettes.light, 0);
    expect(loadedUrls).toHaveLength(1);
    expect(loadedUrls[0]).toMatch(/\/assets\/objects\/tennis-return\.glb$/);
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

  it("tennis loads the packaged model by default and a modelUrl override instead", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillText() {},
      fillRect() {},
    } as unknown as CanvasRenderingContext2D);
    disposeObject(await createObject("tennis", objectPalettes.light, 0, 1, "https://cdn.example/tennis.glb"));
    // Cartoon and Realistic tennis are procedural and fetch nothing.
    disposeObject(await createObject("tennis", objectPalettes.light, 3, 0, "https://cdn.example/tennis.glb"));
    disposeObject(await createObject("tennis", objectPalettes.light, 4, 0, "https://cdn.example/tennis.glb"));
    expect(loadedUrls).toEqual(["https://cdn.example/tennis.glb"]);
  });

  it("contact converges three distinct routes into one settled inbox", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillText() {},
      fillRect() {},
    } as unknown as CanvasRenderingContext2D);
    const object = await createObject("contact", objectPalettes.light, 0);
    const { inboxPoint, routes, packets, receipts } = object.userData.contact;
    expect(routes).toHaveLength(3);
    expect(packets).toHaveLength(3);
    expect(receipts).toHaveLength(3);
    for (const route of routes) expect(route.getPoint(1).distanceTo(inboxPoint as Vector3)).toBeLessThan(0.0001);
    expect(receipts.every((receipt: { scale: Vector3 }) => receipt.scale.x < 0.01)).toBe(true);

    object.userData.animate(5400);
    expect(object.userData.phase).toBe("rest");
    expect(receipts.every((receipt: { scale: Vector3 }) => receipt.scale.x === 1)).toBe(true);
    expect(packets.every((packet: { scale: Vector3 }) => packet.scale.x < 0.01)).toBe(true);
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
    expect(screen.getByRole("img", { name: "Contact inbox illustration" })).toBeInTheDocument();
    expect(document.querySelector("canvas")).toBeNull();
  });

  it("offers a playback-only mode for compact consumer embeds", () => {
    render(
      <div style={{ height: 320 }}>
        <ObjectScene kind="reading" label="Reading" active={false} controls="playback" />
      </div>,
    );
    expect(screen.queryByRole("button", { name: "Open canvas" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Another look" })).toBeNull();
    expect(document.querySelector('[data-controls="playback"]')).toBeInTheDocument();
  });
});

// Each WebGL mount listens for context loss once, so the listener count is the number of renderers built.
it("keys the WebGL scene on palette values, so an inline palette does not rebuild it on every render", () => {
  const listen = vi.spyOn(HTMLCanvasElement.prototype, "addEventListener");
  const mounts = () => listen.mock.calls.filter(([type]) => type === "webglcontextlost").length;
  const scene = (accent: number) => (
    <ObjectScene kind="server" label="Server" variant={4} palette={{ ...objectPalettes.dark, accent }} />
  );
  const { rerender } = render(scene(0x71bda3));
  expect(mounts()).toBe(1);
  rerender(scene(0x71bda3));
  rerender(scene(0x71bda3));
  expect(mounts()).toBe(1);
  rerender(scene(0x205f49));
  expect(mounts()).toBe(2);
});

it("contact's post office repeats continuously across three cycles", async () => {
  const object = await createObject("contact", objectPalettes.light, 3);
  const snapshot = (time: number) => {
    object.userData.animate(time);
    object.updateMatrixWorld(true);
    const values: number[] = [];
    object.traverse((item) => values.push(...item.matrixWorld.elements));
    return values;
  };
  for (const offset of [-1, 0, 1, 3600])
    for (const cycle of [1, 2, 3]) {
      const first = snapshot(offset),
        repeat = snapshot(offset + cycle * 12000);
      expect(Math.max(...first.map((n, i) => Math.abs(n - repeat[i])))).toBeLessThan(1e-8);
    }
  const before = snapshot(11999),
    after = snapshot(12001);
  expect(Math.max(...before.map((n, i) => Math.abs(n - after[i])))).toBeLessThan(0.02);
  disposeObject(object);
});
