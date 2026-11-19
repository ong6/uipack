import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import * as THREE from "three";
import { createObject, disposeObject, type ObjectKind } from "../src/objects/scenes";
import { inkify, inkRoleOf, INK_BUILD_PALETTE, type InkRole } from "../src/objects/ink";
import { paceFrame } from "../src/objects/mount";
import { readFileSync } from "node:fs";
import { ObjectScene, objectScenes, type ObjectSceneSubject } from "../src/objects";
import * as objects from "../src/objects";
import { mugSubject } from "../playground/siteSubject";

afterEach(() => vi.restoreAllMocks());
const drawingContext = () =>
  new Proxy(
    {},
    { get: (_, name) => (name === "createLinearGradient" ? undefined : () => undefined) },
  ) as CanvasRenderingContext2D;
const withCanvas = () => vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext());
const built = ["ai", "contact", "tennis", "trading", "server", "travel", "reading"] as const satisfies readonly ObjectKind[];

describe("the one style", () => {
  it("exports only the player, the scene list and the gallery", () => {
    expect(Object.keys(objects).sort()).toEqual(["AnimationWorkspace", "ObjectGallery", "ObjectScene", "objectScenes"]);
  });

  it("every kind has a subject", () => {
    expect([...built].sort()).toEqual(objects.objectScenes.map((scene) => scene.id).sort());
  });

  for (const kind of built)
    it(`${kind} stays finite, inside the frame, tags its parts and loops seamlessly`, () => {
      withCanvas();
      const object = createObject(kind)!;
      expect(object.userData.style).toBe("ink");
      // Every part carries its ink role (on the mesh or its material), so nothing is guessed.
      object.traverse((item) => {
        const mesh = item as THREE.Mesh;
        if (!mesh.isMesh || item.name === "contact-shadow") return;
        const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        expect(item.userData.inkRole ?? material.userData.inkRole, `${kind} ${mesh.geometry.type}`).toBeDefined();
      });
      const span = object.userData.loopDuration ?? object.userData.playDuration;
      for (let time = 0; time <= span; time += 60) {
        object.userData.animate(time);
        const box = new THREE.Box3().setFromObject(object);
        expect(Math.max(Math.abs(box.min.x), Math.abs(box.max.x)), `${kind} at ${time}`).toBeLessThan(3.25);
        expect(Math.max(Math.abs(box.min.y), Math.abs(box.max.y)), `${kind} at ${time}`).toBeLessThan(2.4);
      }
      const snapshot = (time: number) => {
        object.userData.animate(time);
        object.updateMatrixWorld(true);
        const values: number[] = [];
        object.traverse((item) => values.push(...item.matrixWorld.elements));
        return values;
      };
      if (object.userData.loopDuration) {
        const loop = object.userData.loopDuration as number;
        for (const offset of [0, 1, loop / 3])
          for (const cycle of [1, 2]) {
            const first = snapshot(offset),
              repeated = snapshot(offset + cycle * loop);
            expect(Math.max(...first.map((n, i) => Math.abs(n - repeated[i])))).toBeLessThan(1e-6);
          }
      } else {
        expect(snapshot(5400)).toEqual(snapshot(9000));
        expect(object.userData.phase).toBe("rest");
      }
      disposeObject(object);
    });

  it("one accent part: each subject has an accent, and it stays a small share of its meshes", () => {
    withCanvas();
    for (const kind of built) {
      const object = createObject(kind)!;
      const roles: InkRole[] = [];
      object.traverse((item) => {
        const mesh = item as THREE.Mesh;
        if (!mesh.isMesh || item.name === "contact-shadow") return;
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) roles.push(inkRoleOf(mesh, m));
      });
      const accents = roles.filter((r) => r === "accent").length;
      expect(accents, kind).toBeGreaterThan(0);
      expect(accents / roles.length, kind).toBeLessThan(0.35);
      disposeObject(object);
    }
  });

  it("map folds stay connected throughout opening", () => {
    withCanvas();
    const object = createObject("travel")!;
    for (let t = 0; t <= 1700; t += 40) {
      object.userData.animate(t);
      object.updateMatrixWorld(true);
      const [left, center, right] = object.userData.mapFolds;
      for (const y of [-1.225, 1.225]) {
        expect(
          left.localToWorld(new THREE.Vector3(0, y, 0)).distanceTo(center.localToWorld(new THREE.Vector3(-0.615, y, 0))),
        ).toBeLessThan(1e-5);
        expect(
          right.localToWorld(new THREE.Vector3(0, y, 0)).distanceTo(center.localToWorld(new THREE.Vector3(0.615, y, 0))),
        ).toBeLessThan(1e-5);
      }
    }
    disposeObject(object);
  });

  it("tennis is built in code, and its ball meets the strings at each strike", () => {
    const object = createObject("tennis")!;
    expect(object.userData.source).toBeUndefined();
    for (const time of object.userData.contactTimes as number[]) {
      object.userData.animate(time);
      object.updateMatrixWorld(true);
      const ball = object.userData.ball.getWorldPosition(new THREE.Vector3());
      const racket = object.userData.racket.localToWorld(object.userData.racketContact.clone());
      expect(ball.distanceTo(racket)).toBeLessThan(0.001);
    }
    disposeObject(object);
  });

  it("contact converges three distinct routes into one settled inbox", () => {
    const object = createObject("contact")!;
    const { inboxPoint, routes, packets, receipts } = object.userData.contact;
    expect(routes).toHaveLength(3);
    for (const route of routes) expect(route.getPoint(1).distanceTo(inboxPoint as THREE.Vector3)).toBeLessThan(0.0001);
    expect(receipts.every((receipt: THREE.Object3D) => receipt.scale.x < 0.01 && !receipt.visible)).toBe(true);
    object.userData.animate(5400);
    expect(object.userData.phase).toBe("rest");
    expect(receipts.every((receipt: THREE.Object3D) => receipt.scale.x === 1 && receipt.visible)).toBe(true);
    expect(packets.every((packet: THREE.Object3D) => !packet.visible)).toBe(true);
    disposeObject(object);
  });
});

describe("the ink renderer", () => {
  const part = (role?: InkRole, color?: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: color ?? 0xffffff }));
    if (role) mesh.userData.inkRole = role;
    return mesh;
  };

  it("a part's inkRole decides its tone; only untagged parts are read from their colour", () => {
    expect(inkRoleOf(part("dark", INK_BUILD_PALETTE.accent), part("dark").material as THREE.Material)).toBe("dark");
    const accent = part(undefined, INK_BUILD_PALETTE.accent);
    expect(inkRoleOf(accent, accent.material as THREE.Material)).toBe("accent");
    const graphite = part(undefined, 0x1b1e1e);
    expect(inkRoleOf(graphite, graphite.material as THREE.Material)).toBe("shade");
    const light = part(undefined, 0xc9ccc6);
    expect(inkRoleOf(light, light.material as THREE.Material)).toBe("paper");
    const tagged = new THREE.MeshBasicMaterial();
    tagged.userData.inkRole = "accent";
    expect(inkRoleOf(new THREE.Mesh(new THREE.BoxGeometry(), tagged), tagged)).toBe("accent");
  });

  it("merges static parts per role, restyles moving ones in place, and recolours without new materials", () => {
    const root = new THREE.Group();
    const spinner = part("accent");
    root.add(part("paper"), part("paper").translateX(2), part("shade").translateX(-2), spinner);
    root.userData.loopDuration = 1000;
    root.userData.animate = (t: number) => (spinner.rotation.z = (t / 1000) * Math.PI * 2);
    const scene = inkify(root, { paper: 0xffffff, ink: 0x000000, accent: 0x0000ff });
    const fills = root.children.filter((c) => c.name.startsWith("ink-"));
    expect(fills.map((f) => f.name).sort()).toEqual(["ink-paper", "ink-shade"]);
    // Each merged fill carries a silhouette and its crease lines.
    for (const fill of fills) expect(fill.children.map((c) => c.name).sort()).toEqual(["ink-crease", "ink-silhouette"]);
    expect((spinner.material as unknown as THREE.ShaderMaterial).name).toBe("ink-fill-accent");
    const paper = fills.find((f) => f.name === "ink-paper") as THREE.Mesh;
    const uniform = (paper.material as THREE.ShaderMaterial).uniforms.color.value as THREE.Color;
    expect(uniform.getHex(THREE.SRGBColorSpace)).toBe(0xffffff);
    // Dark page: the paper is darker than the ink, so faces lift a little off the page.
    scene.setColors({ paper: 0x151311, ink: 0xf2ece3, accent: 0x9ab6ff });
    expect((paper.material as THREE.ShaderMaterial).uniforms.color.value).toBe(uniform);
    expect(uniform.getHex(THREE.SRGBColorSpace)).not.toBe(0x151311);
    expect(new THREE.Color(0x151311).getHex()).toBeLessThan(uniform.getHex());
  });

  it("builder lines become fat ink lines that never set the framing", () => {
    const root = new THREE.Group();
    const line = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)]),
      new THREE.LineBasicMaterial(),
    );
    line.userData.inkWidth = 0.75;
    root.add(line);
    inkify(root);
    const fat = root.children[0] as THREE.Mesh;
    expect((fat as unknown as { isLineSegments2: boolean }).isLineSegments2).toBe(true);
    expect(fat.userData.frameIgnore).toBe(true);
    expect((fat.material as unknown as { linewidth: number }).linewidth).toBe(0.75);
  });
});

describe("frame pacing", () => {
  const paints = (refresh: number, interval: number, ms = 1000) => {
    let last = -Infinity,
      count = 0;
    for (let t = 0; t < ms; t += 1000 / refresh) {
      const next = paceFrame(last, t, interval);
      if (next !== null) {
        last = next;
        count++;
      }
    }
    return count;
  };
  it("caps a desktop at 60 a second on a 120 Hz display, evenly, and leaves 60 Hz alone", () => {
    expect(paints(120, 1000 / 60)).toBeGreaterThanOrEqual(59);
    expect(paints(120, 1000 / 60)).toBeLessThanOrEqual(61);
    expect(paints(60, 1000 / 60)).toBeGreaterThanOrEqual(59);
    expect(paints(120, 1000 / 30)).toBeLessThanOrEqual(31);
    expect(paints(60, 1000 / 30)).toBeGreaterThanOrEqual(29);
  });
});

describe("the player", () => {
  it("exports metadata and a labelled non-WebGL fallback", () => {
    expect(objectScenes.map((s) => s.id)).toEqual(["ai", "contact", "tennis", "trading", "server", "travel", "reading"]);
    render(
      <div style={{ height: 320 }}>
        <ObjectScene kind="contact" label="Contact inbox" active={false} />
      </div>,
    );
    expect(screen.getByRole("img", { name: "Contact inbox illustration" })).toBeInTheDocument();
    expect(document.querySelector("canvas")).toBeNull();
    expect(document.querySelector('.uipack-object[data-art-direction="ink"]')).toBeInTheDocument();
  });

  it("holds a preloaded scene's canvas while inactive, with no playback control", async () => {
    // jsdom has no WebGL: three reports the failed context and the scene keeps its drawing. The
    // build is asynchronous, so the test waits for it and the report lands inside this test.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <div style={{ height: 320 }}>
        <ObjectScene kind="ai" label="Agent session" active={false} preload controls="playback" />
      </div>,
    );
    expect(document.querySelector("canvas")).toBeInTheDocument();
    expect(document.querySelector('[data-active="false"]')).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector("canvas")).toHaveAttribute("data-renderer", "fallback"));
    expect(screen.queryByRole("button", { name: /motion$/ })).toBeNull();
  });

  it("shows no stand-in picture by default, and the drawing when asked", () => {
    const { container, rerender } = render(<ObjectScene kind="tennis" label="Tennis" active={false} />);
    expect(container.querySelector(".uipack-object")).toHaveAttribute("data-placeholder", "none");
    // The drawing stays in the page for screen readers either way.
    expect(screen.getByRole("img", { name: "Tennis illustration" })).toBeInTheDocument();
    rerender(<ObjectScene kind="tennis" label="Tennis" active={false} placeholder="drawing" />);
    expect(container.querySelector(".uipack-object")).toHaveAttribute("data-placeholder", "drawing");
  });

  it("trading glides: no bar-long hold and no jump between frames", () => {
    withCanvas();
    const object = createObject("trading")!;
    const beads: THREE.InstancedMesh[] = [];
    object.traverse((item) => {
      const mesh = item as THREE.InstancedMesh;
      if (mesh.isInstancedMesh && mesh.count === 1) beads.push(mesh);
    });
    // The newest bar's bead: its centre height, sampled every 16 ms over ten bars.
    const matrix = new THREE.Matrix4(),
      at = new THREE.Vector3();
    const heights: number[] = [];
    for (let t = 2000; t <= 2000 + 10 * 480; t += 16) {
      object.userData.animate(t);
      beads[0].getMatrixAt(0, matrix);
      heights.push(at.setFromMatrixPosition(matrix).y);
    }
    const steps = heights.slice(1).map((h, i) => Math.abs(h - heights[i]));
    const travel = Math.max(...heights) - Math.min(...heights);
    expect(travel).toBeGreaterThan(0.02);
    // No frame carries more than a tenth of the travel (a tick would), and it never sits still
    // for a whole bar (a hold would): no run of twenty still frames.
    expect(Math.max(...steps)).toBeLessThan(travel / 10);
    let still = 0,
      longest = 0;
    for (const step of steps) {
      still = step < 1e-6 ? still + 1 : 0;
      longest = Math.max(longest, still);
    }
    expect(longest).toBeLessThan(20);
    disposeObject(object);
  });

  it("offers a playback-only mode for compact consumer embeds", () => {
    render(
      <div style={{ height: 320 }}>
        <ObjectScene kind="ai" label="Agent session" active={false} controls="playback" />
      </div>,
    );
    expect(screen.queryByRole("button", { name: "Open canvas" })).toBeNull();
    expect(document.querySelector('[data-controls="playback"]')).toBeInTheDocument();
  });

  // Each mount listens for context loss once, so the listener count is the number of scenes built.
  // (AI has no subject yet, so jsdom never tries to open a WebGL context.)
  it("a theme change recolours the scene in place instead of rebuilding it", async () => {
    // jsdom has no WebGL: three reports the failed context; the mount count is what is tested.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const listen = vi.spyOn(HTMLCanvasElement.prototype, "addEventListener");
    const mounts = () => listen.mock.calls.filter(([type]) => type === "webglcontextlost").length;
    const scene = (theme: "light" | "dark") => <ObjectScene kind="ai" label="Agent session" theme={theme} />;
    const { rerender } = render(scene("light"));
    expect(mounts()).toBe(1);
    rerender(scene("dark"));
    rerender(scene("light"));
    expect(mounts()).toBe(1);
    await waitFor(() => expect(document.querySelector("canvas")).toHaveAttribute("data-renderer", "fallback"));
  });
});

describe("a site's own subject", () => {
  // junxiong.dev's scripts/check-ui-ownership.mjs, copied: a site file may not draw a canvas or import three.
  const ownsRenderer = /<canvas\b|(?:from\s*|import\s*\(|require\s*\()\s*['"]three(?:\/[^'"]*)?['"]/;
  const subjectWith = (build: ObjectSceneSubject["build"], id = "site-thing"): ObjectSceneSubject => ({ id, build });
  const mounts = (listen: { mock: { calls: unknown[][] } }) =>
    listen.mock.calls.filter(([type]) => type === "webglcontextlost").length;

  it("the docs example and the demo's builder pass the no-local-renderer check", () => {
    const doc = readFileSync("docs/objects.md", "utf8");
    const example = /## A site's own subject[\s\S]*?```tsx\n([\s\S]*?)```/.exec(doc)?.[1];
    expect(example).toContain("subject={coffee}");
    expect(example).not.toMatch(ownsRenderer);
    expect(readFileSync("playground/siteSubject.tsx", "utf8")).not.toMatch(ownsRenderer);
    // The check bites: the forms it exists to catch fail it.
    for (const local of [
      'import * as THREE from "three";',
      "import type { Group } from 'three';",
      'await import("three/addons/x.js")',
      "<canvas />",
    ])
      expect(local).toMatch(ownsRenderer);
  });

  it("is built with uipack's Three.js module and set up like a built-in subject", () => {
    withCanvas();
    const build = vi.fn(mugSubject.build);
    const object = createObject(build, THREE)!;
    expect(build).toHaveBeenCalledTimes(1);
    expect(build.mock.calls[0][0].THREE).toBe(THREE);
    expect(object.userData.style).toBe("ink");
    // The demo's subject keeps the contract a built-in one is tested for: every mesh tagged, one accent.
    const roles: (InkRole | undefined)[] = [];
    object.traverse((item) => {
      if ((item as THREE.Mesh).isMesh)
        roles.push(item.userData.inkRole ?? (item as THREE.Mesh<THREE.BufferGeometry, THREE.Material>).material.userData.inkRole);
    });
    expect(roles.every(Boolean)).toBe(true);
    expect(roles.filter((role) => role === "accent")).toHaveLength(1);
    disposeObject(object);
  });

  it("shows its own labelled drawing as the fallback, or the label alone without one", () => {
    const { container, rerender } = render(
      <ObjectScene subject={mugSubject} label="Coffee" active={false} placeholder="drawing" />,
    );
    const stage = container.querySelector(".uipack-object")!;
    expect(stage).toHaveAttribute("data-kind", "coffee");
    expect(screen.getByRole("img", { name: "Coffee illustration" }).querySelector("svg path")).toBeInTheDocument();
    rerender(<ObjectScene subject={{ id: "bare", build: mugSubject.build }} label="Bare" active={false} placeholder="drawing" />);
    expect(screen.getByRole("img", { name: "Bare illustration" }).querySelector("svg")?.childElementCount).toBe(0);
    // A subject wins over a kind: no built-in drawing or caption leaks in.
    rerender(<ObjectScene kind="trading" subject={{ id: "bare", build: mugSubject.build }} label="Bare" active={false} />);
    expect(container.querySelector(".uipack-object__fallback-caption")).toBeNull();
  });

  it("an inline subject rebuilt on every render builds once; a new id builds again", async () => {
    // jsdom has no WebGL: three reports the failed context; the mounts and builds are what is tested.
    withCanvas();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const listen = vi.spyOn(HTMLCanvasElement.prototype, "addEventListener");
    const build = vi.fn(mugSubject.build);
    // A new object and a new arrow function on every render, as an inline prop is.
    const scene = (id: string, theme: "light" | "dark") => (
      <ObjectScene subject={subjectWith((kit) => build(kit), id)} label="Coffee" theme={theme} />
    );
    const { rerender } = render(scene("coffee", "light"));
    rerender(scene("coffee", "dark"));
    rerender(scene("coffee", "light"));
    await waitFor(() => expect(document.querySelector("canvas")).toHaveAttribute("data-renderer", "fallback"));
    expect(mounts(listen)).toBe(1);
    expect(build).toHaveBeenCalledTimes(1);
    expect(document.querySelector("canvas")).toHaveAttribute("data-subject", "site");
    rerender(scene("tea", "light"));
    expect(mounts(listen)).toBe(2);
    await waitFor(() => expect(build).toHaveBeenCalledTimes(2));
  });

  it("a builder that throws keeps the labelled fallback and says which subject failed", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const broken = subjectWith(() => {
      throw new Error("no such part");
    }, "broken");
    render(<ObjectScene subject={broken} label="Broken" />);
    await waitFor(() => expect(document.querySelector("canvas")).toHaveAttribute("data-renderer", "fallback"));
    expect(error).toHaveBeenCalledWith('uipack ObjectScene: the subject "broken" failed to build', expect.any(Error));
    expect(screen.getByRole("img", { name: "Broken illustration" })).toBeInTheDocument();
  });
});
