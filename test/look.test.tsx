import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  addContactShadow,
  cameraRotation,
  fitCamera,
  framingTimes,
  lightRigs,
  lookMaterial,
  measureSubject,
  resolveLook,
  themed,
  applyMaterials,
  usesTransmission,
  type MaterialPreset,
} from "../src/objects/look";

const box = (w: number, h: number, d = 0.5) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial());

describe("light rigs", () => {
  it("dark mode changes the lighting, not just the card", () => {
    const light = resolveLook(undefined, "light").rig,
      dark = resolveLook(undefined, "dark").rig;
    expect(light).toEqual(lightRigs.light);
    expect(dark.hemisphere.intensity).toBeLessThan(light.hemisphere.intensity);
    expect(dark.environment.intensity).toBeLessThan(light.environment.intensity);
    expect(dark.rim.intensity).toBeGreaterThanOrEqual(light.rim.intensity * 2);
  });
  it("merges a direction's overrides per theme without touching the defaults", () => {
    const look = { rig: { both: { key: { intensity: 3 } }, dark: { rim: { intensity: 4 } } }, castShadows: true };
    const dark = resolveLook(look, "dark").rig;
    expect(dark.key).toMatchObject({ intensity: 3, shadow: true, color: lightRigs.dark.key.color });
    expect(dark.rim.intensity).toBe(4);
    expect(resolveLook(look, "light").rig.rim.intensity).toBe(lightRigs.light.rim.intensity);
    expect(lightRigs.light.key.intensity).toBe(2.5);
  });
});

describe("material presets", () => {
  const presets: MaterialPreset[] = ["metal", "brushedMetal", "glass", "ceramic", "paper", "plastic", "rubber", "felt"];
  it.each(presets)("%s is physically plausible and carries its reflection strength", (preset) => {
    const material = lookMaterial(preset, 0x808080);
    expect(material.userData.lookReflections).toBeGreaterThan(0);
    expect(material.metalness).toBe(preset === "metal" || preset === "brushedMetal" ? 1 : 0);
    if (preset === "glass") expect((material as THREE.MeshPhysicalMaterial).transmission).toBe(1);
    if (preset === "paper") expect(material.normalMap).toBeInstanceOf(THREE.DataTexture);
  });
  it("takes overrides and per-theme changes", () => {
    const material = themed(lookMaterial("ceramic", 0xffffff, { roughness: 0.2 }), { dark: { color: 0x101010 } });
    expect(material.roughness).toBe(0.2);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
    const env = new THREE.Texture();
    applyMaterials(mesh, env, lightRigs.dark, "dark");
    expect(material.envMap).toBe(env);
    expect(material.envMapIntensity).toBeCloseTo(0.9 * lightRigs.dark.reflections);
    expect(material.color.getHex()).toBe(0x101010);
    expect(usesTransmission(mesh)).toBe(false);
    expect(usesTransmission(new THREE.Mesh(new THREE.BoxGeometry(), lookMaterial("glass", 0xffffff)))).toBe(true);
  });
});

describe("framing", () => {
  const framing = resolveLook(undefined, "light").framing as Exclude<ReturnType<typeof resolveLook>["framing"], false>;
  for (const [w, h] of [
    [0.5, 0.5],
    [4, 1],
    [1, 6],
  ])
    it(`fits a ${w}×${h} subject to the same share of the frame, orthographic and perspective`, () => {
      const subject = new THREE.Group().add(box(w, h));
      subject.position.set(3, -2, 0);
      for (const projection of ["orthographic", "perspective"] as const) {
        const lens = resolveLook({ camera: { projection, pitch: 15 } }, "light").camera;
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
    const shadow = addContactShadow(subject, { opacity: 0.4, spread: 1.3, color: 0 })!;
    expect(shadow.position.y).toBeCloseTo(-0.5 + 0.003);
    const rotation = new THREE.Quaternion();
    const points = measureSubject(subject, rotation, framingTimes(subject, framing, 0));
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
