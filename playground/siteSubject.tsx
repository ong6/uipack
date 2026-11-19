import type { ObjectSceneSubject } from "../src/objects";

/**
 * `object-site-subject` (docs/objects.md, "A site's own subject"): a subject built the way a site
 * builds one, outside uipack. It imports no `three`: the builder is handed the module uipack loaded,
 * so it passes a site's no-local-renderer check (junxiong.dev's check-ui-ownership). A mug of
 * coffee on its saucer, steam rising in a 6 s loop.
 */
export const mugSubject: ObjectSceneSubject = {
  id: "coffee",
  build: ({ THREE }) => {
    const root = new THREE.Group();
    const role = (inkRole: string) => {
      const material = new THREE.MeshBasicMaterial();
      material.userData.inkRole = inkRole;
      return material;
    };
    const [paper, shade, accent] = [role("paper"), role("shade"), role("accent")];
    // Saucer on the shared tabletop (y = -1), the mug on it, the coffee standing just proud of the rim.
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.15, 0.12, 56), shade);
    saucer.position.y = -0.94;
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.64, 1.45, 48), paper);
    mug.position.y = -0.155;
    const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 48), accent);
    coffee.position.y = 0.585;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.085, 12, 32, Math.PI), paper);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.7, -0.12, 0);
    const cup = new THREE.Group();
    cup.add(saucer, mug, coffee, handle);
    root.add(cup);
    // Three wisps of steam: ink lines that rise, swell and fade to nothing, a third of a loop apart.
    const wisp = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 24 }, (_, i) => {
        const u = i / 23;
        return new THREE.Vector3(Math.sin(u * Math.PI * 2) * 0.1, u * 0.55, 0);
      }),
    );
    const wisps = [-0.28, 0, 0.28].map((x) => {
      const line = new THREE.Line(wisp, paper);
      line.userData.inkWidth = 1.4;
      line.position.x = x;
      root.add(line);
      return line;
    });
    const loop = 6000;
    root.userData = {
      look: {
        camera: { projection: "perspective", fov: 32, pitch: 18 },
        // Builder lines never set the framing: lift the frame so the steam clears its top.
        framing: { fill: 0.66, maxWidth: 0.86, lift: -0.08 },
        contactShadow: { spread: 1, opacity: 0.32 },
      },
      loopDuration: loop,
      restTime: 1000,
      animate(time: number) {
        const t = (((time % loop) + loop) % loop) / loop;
        // A slow turntable, seamless over the loop.
        cup.rotation.y = -0.5 + Math.sin(t * Math.PI * 2) * 0.12;
        wisps.forEach((line, i) => {
          const u = (t + i / 3) % 1;
          const swell = Math.sin(u * Math.PI);
          line.position.y = 0.7 + u * 0.4;
          line.scale.setScalar(swell);
        });
        root.userData.phase = "steam";
        root.userData.pose = t;
      },
    };
    return root;
  },
  // The labelled 2D fallback: the same mug, saucer and steam in the 360 × 214 frame.
  drawing: (
    <>
      <path d="M86 176h188" />
      <path d="M128 70h88l-6 98h-76z" />
      <path d="M216 92c34 0 34 52-4 52" />
      <path className="soft" d="M150 52c-8-10 8-18 0-30M172 52c-8-10 8-18 0-30M194 52c-8-10 8-18 0-30" />
    </>
  ),
};
