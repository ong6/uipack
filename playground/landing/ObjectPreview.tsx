// The parts bento's 3D tile, once it is on screen: the travel scene in its Studio look
// (uipack/objects), playing, with its own Pause; Three.js loads with it.
import { ObjectScene } from "../../src/objects";
import "../../src/objects/objects.css";

export default function ObjectPreview({ theme }: { theme: "light" | "dark" }) {
  return <ObjectScene kind="travel" label="Travel, Studio look" theme={theme} active controls="playback" variant={0} />;
}
