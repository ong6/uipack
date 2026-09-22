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
    expect([0, .17, .34, .51, .68, .99].map(value => chooseObjectVariant(() => value))).toEqual([0, 1, 2, 3, 4, 5]);
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
    for (const variant of (kind === "contact" ? [0, 1, 2, 3, 4] as const : [0, 1, 2, 3, 4, 5] as const))
    it(`${kind} variant ${variant} stays finite, fits the camera through the whole motion, and settles`, async () => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext());
      const object = await createObject(kind, objectPalettes.light, variant);
      const halfWidth = variant === 4 && kind !== "contact" ? 2.15 : kind === "server" ? 3.25 : 2.65;
      for (let time = 0; time <= (object.userData.loopDuration ?? 5400); time += 30) {
        object.userData.animate(time);
        const box = new Box3().setFromObject(object);
        expect(Math.max(Math.abs(box.min.x), Math.abs(box.max.x))).toBeLessThan(
          halfWidth,
        );
        expect(Math.max(Math.abs(box.min.y + (variant === 4 && kind !== "contact" ? .15 : 0)), Math.abs(box.max.y + (variant === 4 && kind !== "contact" ? .15 : 0)))).toBeLessThan(
          variant === 4 && kind !== "contact" ? 1.75 : 2.2,
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

  for (const kind of ["ai", "tennis", "trading", "server", "travel", "reading"] as ObjectKind[])
    it(`${kind} directions have different geometry and seamless moving loops`, async () => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext());
      const signatures: string[] = [];
      for (const variant of [0, 1, 2, 3, 4, 5] as const) {
        const object = await createObject(kind, objectPalettes.light, variant);
        const geometry: number[] = [];
        object.traverse(item => { const mesh = item as import('three').Mesh; if (mesh.geometry) geometry.push(mesh.geometry.attributes.position.count); });
        signatures.push(geometry.join(','));
        if (variant !== 0) {
          const snapshot = (time: number) => {
            object.userData.animate(time); object.updateMatrixWorld(true);
            const matrices: number[] = [];
            object.traverse(item => matrices.push(...item.matrixWorld.elements));
            return matrices;
          };
          // Position and velocity at the wrap, repeated for three entire cycles.
          for (const offset of [-1, 0, 1, 2100]) for (const cycle of [1, 2, 3]) {
            const first = snapshot(offset), repeated = snapshot(offset + cycle * 12000);
            expect(Math.max(...first.map((n, i) => Math.abs(n - repeated[i])))).toBeLessThan(1e-8);
          }
          const before = snapshot(11999), after = snapshot(12001);
          expect(Math.max(...before.map((n, i) => Math.abs(n - after[i])))).toBeLessThan(.02);
        }
        disposeObject(object);
      }
      expect(new Set(signatures).size).toBe(6);
    });

  it("map folds stay connected throughout opening", async () => {
    vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue(drawingContext());
    const object=await createObject("travel",objectPalettes.light);
    for(let t=0;t<=1700;t+=40) {
      object.userData.animate(t);object.updateMatrixWorld(true);
      const [left,center,right]=object.userData.mapFolds;
      for(const y of [-1.225,1.225]) {
        expect(left.localToWorld(new Vector3(0,y,0)).distanceTo(center.localToWorld(new Vector3(-.615,y,0)))).toBeLessThan(.00001);
        expect(right.localToWorld(new Vector3(0,y,0)).distanceTo(center.localToWorld(new Vector3(.615,y,0)))).toBeLessThan(.00001);
      }
    }
    disposeObject(object);
  });
  it("the turning sheet keeps its paper length at intermediate poses", async () => {
    vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue(drawingContext());
    const object=await createObject("reading",objectPalettes.light);
    for(let t=750;t<=4050;t+=100) {
      object.userData.animate(t);
      const points=object.userData.pageGeometry.attributes.position;
      let length=0;
      for(let i=1;i<=40;i++)length+=new Vector3().fromBufferAttribute(points,i).distanceTo(new Vector3().fromBufferAttribute(points,i-1));
      expect(length).toBeCloseTo(1.46,2);
    }
    disposeObject(object);
  });

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

it('kinetic folio completes a full turn without reversing or jumping at the seam', async () => {
  const object=await createObject('reading',objectPalettes.light,2);
  const book=object.getObjectByName('kinetic-folio')!;
  const angles=[0,3000,6000,9000,11999].map(time=>{object.userData.animate(time);return book.rotation.y;});
  expect(angles[4]-angles[0]).toBeCloseTo(Math.PI*2,2);
  for(let i=1;i<angles.length;i++)expect(angles[i]).toBeGreaterThan(angles[i-1]);
  disposeObject(object);
});

for(const variant of [3,4] as const)it(`contact ${variant} repeats continuously across three cycles`,async()=>{
  const object=await createObject('contact',objectPalettes.light,variant);
  const snapshot=(time:number)=>{
    object.userData.animate(time);object.updateMatrixWorld(true);
    const values:number[]=[];object.traverse(item=>values.push(...item.matrixWorld.elements));return values;
  };
  for(const offset of [-1,0,1,3600])for(const cycle of [1,2,3]) {
    const first=snapshot(offset),repeat=snapshot(offset+cycle*12000);
    expect(Math.max(...first.map((n,i)=>Math.abs(n-repeat[i])))).toBeLessThan(1e-8);
  }
  const before=snapshot(11999),after=snapshot(12001);
  expect(Math.max(...before.map((n,i)=>Math.abs(n-after[i])))).toBeLessThan(.02);
  disposeObject(object);
});
