import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { addContactShadow, cameraRotation, fitCamera, framingTimes, measureSubject, resolveLook } from "../src/objects/look";

const box = (w: number, h: number, d = 0.5) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial());

describe("the look a subject declares", () => {
  it("defaults to a fitted perspective lens and no contact shadow", () => {
    const look = resolveLook(undefined);
    expect(look.camera).toEqual({ projection: "perspective", fov: 30, pitch: 0, yaw: 0 });
    expect(look.contactShadow).toBe(false);
    expect(resolveLook({ contactShadow: true }).contactShadow).toEqual({ opacity: 0.42, spread: 1.3 });
    expect(resolveLook({ framing: false }).framing).toBe(false);
  });
});

describe("framing", () => {
  const framing = resolveLook(undefined).framing as Exclude<ReturnType<typeof resolveLook>["framing"], false>;
  for (const [w, h] of [
    [0.5, 0.5],
    [4, 1],
    [1, 6],
  ])
    it(`fits a ${w}×${h} subject to the same share of the frame, orthographic and perspective`, () => {
      const subject = new THREE.Group().add(box(w, h));
      subject.position.set(3, -2, 0);
      for (const projection of ["orthographic", "perspective"] as const) {
        const lens = resolveLook({ camera: { projection, pitch: 15 } }).camera;
        const rotation = cameraRotation(lens);
        const camera = projection === "perspective" ? new THREE.PerspectiveCamera(30) : new THREE.OrthographicCamera();
        const fit = fitCamera(camera, measureSubject(subject, rotation, [0]), 16 / 10, framing, rotation)!;
        // Fills the target height unless the width cap binds first; never more than either.
        expect(fit.fillHeight).toBeLessThanOrEqual(framing.fill + 0.01);
        expect(fit.fillWidth).toBeLessThanOrEqual(framing.maxWidth + 0.01);
        expect(Math.max(fit.fillHeight / framing.fill, fit.fillWidth / framing.maxWidth)).toBeGreaterThan(0.9);
        // The subject's centre projects just above the frame's centre.
        camera.updateMatrixWorld();
        const centre = new THREE.Vector3(3, -2, 0).project(camera);
        expect(Math.abs(centre.x)).toBeLessThan(0.08);
        expect(centre.y).toBeGreaterThan(0);
        expect(centre.y).toBeLessThan(0.12);
      }
    });
  it("samples the whole loop for looping scenes and ignores the contact shadow", () => {
    const subject = new THREE.Group().add(box(1, 1));
    subject.userData.loopDuration = 1000;
    subject.userData.animate = (t: number) => (subject.children[0].position.x = t / 250);
    expect(framingTimes(subject, framing, 500)).toHaveLength(9);
    expect(framingTimes(subject, { ...framing, sample: "rest" }, 500)).toEqual([500]);
    subject.userData.animate(0);
    const shadow = addContactShadow(subject, { opacity: 0.4, spread: 1.3 })!;
    expect(shadow.position.y).toBeCloseTo(-0.5 + 0.003);
    const points = measureSubject(subject, new THREE.Quaternion(), framingTimes(subject, framing, 0));
    let maxX = -Infinity,
      minY = Infinity;
    for (let i = 0; i < points.length; i += 3) {
      maxX = Math.max(maxX, points[i]);
      minY = Math.min(minY, points[i + 1]);
    }
    expect(maxX).toBeCloseTo(0.5 + 3.5);
    expect(minY).toBeCloseTo(-0.5);
  });
});
