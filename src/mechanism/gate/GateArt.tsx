// The gate's drawing: every part of the machine as SVG, in paint order, at the display's first frame.
// After that the loop (useGateLoop) moves the parts in place through display.ts's paintDisplay,
// which finds them by the data-part, data-assembly and data-slot attributes set here.
import { Dots, Line, Solid } from "../kit/draw";
import {
  BASE_ART,
  CHUTE_BACK,
  CHUTE_FRONT,
  CONVEYOR_BACK,
  CONVEYOR_FRONT,
  CONVEYOR_MID,
  DIVERTER,
  GAUGE_BACK,
  GAUGE_FRONT,
  HOPPER_BACK,
  HOPPER_FRONT,
  PLUNGER,
  TRAY_BACK,
  TRAY_FRONT,
  armOf,
  armPointerOf,
  dragOf,
  needleOf,
  slatsOf,
  type TokenPaths,
} from "./geometry";
import { SCALE } from "./model";
import { clamp } from "../../math";
import type { Layer } from "./motion";
import { HEIGHT, WIDTH, move } from "./view";
import { fine, readingOf, shareMove, tokenMove, tokenPaths, type Display, type Slot } from "./display";

export function GateArt({ uid, alt, shown }: { uid: string; alt: string; shown: Display }) {
  const reading = readingOf(shown);
  const arm = armOf(shown.arm.at);
  return (
    <svg className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={alt} focusable="false">
      <title id={`${uid}-title`}>Verification gate</title>
      <g data-part="base">
        <path className="iso-halo" d={BASE_ART.halo} />
        {BASE_ART.feet.map((parts, index) => (
          <g key={index}>
            {parts.map((paths, part) => (
              <Solid key={part} paths={paths} tone={part ? "mid" : "lo"} />
            ))}
          </g>
        ))}
        <Solid paths={BASE_ART.slab} tone="mid" />
        <Line d={BASE_ART.groove} tone="lo" />
        <Line d={BASE_ART.screwRings} tone="lo" />
        <Dots points={BASE_ART.screws} size={0.5} tone="mid" />
        <Solid paths={BASE_ART.strip} tone="lo" crease="none" />
        <Line d={BASE_ART.stripMinor} tone="lo" />
        <Line d={BASE_ART.stripMajor} tone="mid" />
        <Dots points={BASE_ART.stripScrews} size={0.45} tone="mid" />
        <Solid paths={BASE_ART.label} tone="lo" crease="none" />
        <Line d={BASE_ART.labelLine} tone="faint" />
        <Line d={BASE_ART.labelRule} tone="lo" free />
        <Dots points={BASE_ART.labelScrews} size={0.45} tone="mid" />
      </g>

      <g data-assembly="conveyor" transform={shareMove("conveyor", shown.shares.conveyor.at) || undefined}>
        {CONVEYOR_BACK.legs.map((leg, index) => (
          <g key={index}>
            <Solid paths={leg.foot} tone="lo" />
            <Dots points={leg.screws} size={0.45} tone="mid" />
            <Solid paths={leg.post} tone="mid" />
          </g>
        ))}
        {CONVEYOR_BACK.stretchers.map((paths, index) => (
          <Solid key={index} paths={paths} tone="mid" />
        ))}
        <Solid paths={CONVEYOR_BACK.backRail} tone="mid" />
        <Solid paths={CONVEYOR_BACK.backLip} tone="mid" />
        <Dots points={CONVEYOR_BACK.backScrews} size={0.45} tone="mid" />
      </g>
      <g data-assembly="gauge" transform={shareMove("gauge", shown.shares.gauge.at) || undefined}>
        <Solid paths={GAUGE_BACK.foot} tone="lo" />
        <Dots points={GAUGE_BACK.screws} size={0.45} tone="mid" />
        <Solid paths={GAUGE_BACK.post} tone="mid" />
      </g>
      <g data-assembly="diverter" transform={shareMove("diverter", shown.shares.diverter.at) || undefined}>
        <Solid paths={DIVERTER.bracket} tone="mid" />
        <Dots points={DIVERTER.bracketScrews} size={0.45} tone="mid" />
        <Solid paths={DIVERTER.post} tone="mid" crease="none" />
        <Solid paths={DIVERTER.hub} tone="mid" />
        <Solid paths={DIVERTER.head} tone="mid" />
        <Line d={DIVERTER.headKnurl} tone="lo" />
        <Dots points={DIVERTER.stops} size={0.45} tone="hi" />
        <path data-part="pointer" className="iso-line" data-tone="hi" d={armPointerOf(shown.arm.at)} />
      </g>
      <g data-assembly="conveyor" transform={shareMove("conveyor", shown.shares.conveyor.at) || undefined}>
        {CONVEYOR_MID.drums.map((paths, index) => (
          <Solid key={index} paths={paths} tone="mid" />
        ))}
        <Solid paths={CONVEYOR_MID.belt} tone="mid" crease="faint" />
        <path data-part="slats" className="iso-line" data-tone="faint" d={slatsOf(shown.phase)} />
      </g>
      <g data-assembly="hopper" transform={shareMove("hopper", shown.shares.hopper.at) || undefined}>
        <Solid paths={HOPPER_BACK.backCheek} tone="mid" />
        <Solid paths={HOPPER_BACK.tube} tone="mid" inner={<Line d={HOPPER_BACK.seams} tone="faint" />} />
        <path className="um-cavity" d={HOPPER_BACK.windowFill} />
        <Line d={HOPPER_BACK.stack} tone="mid" />
        <Line d={HOPPER_BACK.window} tone="lo" />
        <Solid paths={HOPPER_BACK.collar} tone="mid" />
        <path className="um-cavity" d={HOPPER_BACK.mouthFill} />
        <Line d={HOPPER_BACK.mouth} tone="lo" />
        <Dots points={HOPPER_BACK.collarScrews} size={0.45} tone="mid" />
        <Solid paths={HOPPER_BACK.gate} tone="mid" />
        <Dots points={HOPPER_BACK.gateScrews} size={0.45} tone="mid" />
      </g>
      <g data-assembly="diverter" transform={shareMove("diverter", shown.shares.diverter.at) || undefined}>
        <g data-part="arm" className="iso-solid">
          <path className="iso-fill" d={arm.fill} />
          {arm.shades.map((d, shade) => (
            <path key={shade} className="iso-shade" data-shade={shade} d={d} />
          ))}
          <path className="iso-top" d={arm.top} />
          <path className="iso-line iso-crease" data-tone="faint" d={arm.crease} />
          <path className="iso-line iso-bevel" data-tone="faint" d={arm.bevel ?? ""} />
          <path className="iso-line iso-edge" data-tone="mid" d={arm.outline} />
        </g>
        <g data-assembly="conveyor" transform={shareMove("conveyor", shown.shares.conveyor.at) || undefined}>
          <Tokens layer="belt" slots={shown.slots} />
        </g>
        <g data-assembly="conveyor" transform={shareMove("conveyor", shown.shares.conveyor.at) || undefined}>
          <Solid paths={CONVEYOR_FRONT.rail} tone="mid" inner={<Line d={CONVEYOR_FRONT.railSeam} tone="faint" />} />
          <Dots points={CONVEYOR_FRONT.railScrews} size={0.45} tone="mid" />
          {CONVEYOR_FRONT.lips.map((paths, index) => (
            <Solid key={index} paths={paths} tone="mid" />
          ))}
          <Line d={CONVEYOR_FRONT.lipMinor} tone="lo" />
          <Line d={CONVEYOR_FRONT.lipMajor} tone="mid" />
          <Line d={CONVEYOR_FRONT.zero} tone="hi" />
          <Solid paths={CONVEYOR_FRONT.bearing} tone="mid" />
          <Line d={CONVEYOR_FRONT.bearingBore} tone="lo" />
          <Dots points={CONVEYOR_FRONT.bearingScrews} size={0.45} tone="mid" />
          <Solid paths={CONVEYOR_FRONT.motor} tone="mid" inner={<Line d={CONVEYOR_FRONT.motorBands} tone="faint" />} />
          <Line d={CONVEYOR_FRONT.motorCap} tone="lo" />
          <Dots points={CONVEYOR_FRONT.motorBolts} size={0.45} tone="mid" />
          <Dots points={[CONVEYOR_FRONT.motorShaft]} size={0.8} tone="hi" />
          <Solid paths={CONVEYOR_FRONT.box} tone="mid" />
          <Line d={CONVEYOR_FRONT.boxLine} tone="faint" />
          <Dots points={CONVEYOR_FRONT.boxScrews} size={0.4} tone="mid" />
        </g>
        <g data-assembly="hopper" transform={shareMove("hopper", shown.shares.hopper.at) || undefined}>
          <Solid paths={HOPPER_FRONT.cheek} tone="mid" />
          <Dots points={HOPPER_FRONT.cheekScrews} size={0.45} tone="mid" />
        </g>
      </g>
      <g data-assembly="gauge" transform={shareMove("gauge", shown.shares.gauge.at) || undefined}>
        <g data-part="plunger" transform={move([0, 0, shown.tip.at])}>
          <Solid paths={PLUNGER.tip} tone="hi" />
          <Solid paths={PLUNGER.rod} tone="hi" crease="none" inner={<Line d={PLUNGER.rodMarks} tone="lo" />} />
        </g>
        <Solid paths={GAUGE_FRONT.guide} tone="mid" />
        <Solid paths={GAUGE_FRONT.front.foot} tone="lo" />
        <Dots points={GAUGE_FRONT.front.screws} size={0.45} tone="mid" />
        <Solid paths={GAUGE_FRONT.front.post} tone="mid" />
        <Solid paths={GAUGE_FRONT.beam} tone="mid" />
        <Line d={GAUGE_FRONT.beamLine} tone="faint" />
        <Dots points={GAUGE_FRONT.beamScrews} size={0.5} tone="mid" />
        <Solid paths={GAUGE_FRONT.neck} tone="mid" />
        <Solid paths={GAUGE_FRONT.crown} tone="mid" />
        <Solid paths={GAUGE_FRONT.crownCap} tone="mid" inner={<Line d={GAUGE_FRONT.crownKnurl} tone="lo" />} />
        <Solid paths={GAUGE_FRONT.puck} tone="hi" crease="lo" inner={<Line d={GAUGE_FRONT.band} tone="faint" />} />
        <Line d={GAUGE_FRONT.knurl} tone="lo" />
        <Line d={GAUGE_FRONT.bezel} tone="lo" />
        <Line d={GAUGE_FRONT.minor} tone="lo" />
        <Line d={GAUGE_FRONT.major} tone="mid" />
        <Line d={GAUGE_FRONT.band0} tone="mid" />
        <path className="iso-line um-limit" d={GAUGE_FRONT.limit} />
        <path data-part="drag" className="iso-line um-drag" d={dragOf(clamp(shown.drag, 0, SCALE))} />
        <path data-part="needle" className="iso-line um-needle" d={needleOf(reading)} />
        <Line d={GAUGE_FRONT.hub} tone="mid" />
      </g>
      <g data-assembly="chute" transform={shareMove("chute", shown.shares.chute.at) || undefined}>
        {CHUTE_BACK.supports.map((support, index) => (
          <g key={index}>
            <Solid paths={support.foot} tone="lo" />
            <Solid paths={support.post} tone="mid" />
          </g>
        ))}
        <Solid paths={CHUTE_BACK.apronFoot} tone="lo" />
        <Solid paths={CHUTE_BACK.apronPost} tone="mid" />
        <Solid paths={CHUTE_BACK.trayFloor} tone="lo" />
        <Solid paths={CHUTE_BACK.trayBack} tone="mid" />
        <Solid paths={CHUTE_BACK.trayLeft} tone="mid" />
        <Solid paths={CHUTE_BACK.backWall} tone="mid" />
        <Solid paths={CHUTE_BACK.floor} tone="mid" inner={<Line d={CHUTE_BACK.floorLines} tone="lo" />} />
        <Solid paths={CHUTE_BACK.apron} tone="mid" inner={<Line d={CHUTE_BACK.apronLines} tone="lo" />} />
        <Tokens layer="chute" slots={shown.slots} />
        <Solid paths={CHUTE_FRONT.frontWall} tone="mid" />
        <Dots points={CHUTE_FRONT.wallScrews} size={0.45} tone="mid" />
        <Solid paths={CHUTE_FRONT.apronWall} tone="mid" />
        <Solid paths={CHUTE_FRONT.endWall} tone="mid" />
        <Solid paths={CHUTE_FRONT.trayRight} tone="mid" />
        <Solid paths={CHUTE_FRONT.trayFront} tone="mid" />
      </g>
      <g data-assembly="tray" transform={shareMove("tray", shown.shares.tray.at) || undefined}>
        <Solid paths={TRAY_BACK.floor} tone="lo" />
        <Line d={TRAY_BACK.floorGrid} tone="faint" />
        <Solid paths={TRAY_BACK.back} tone="mid" />
        <Solid paths={TRAY_BACK.left} tone="mid" />
        <Tokens layer="tray" slots={shown.slots} />
        <Solid paths={TRAY_FRONT.right} tone="mid" />
        <Solid paths={TRAY_FRONT.front} tone="mid" />
        <Dots points={TRAY_FRONT.screws} size={0.45} tone="mid" />
      </g>
    </svg>
  );
}

function Tokens({ layer, slots }: { layer: Layer; slots: Slot[] }) {
  return (
    <>
      {slots.map((slot, index) => {
        const on = slot.key !== null && slot.layer === layer && slot.alpha > 0.005;
        return (
          <g
            key={index}
            className="iso-solid um-token"
            data-slot={index}
            data-layer={layer}
            data-lit={on && slot.lit ? "" : undefined}
            display={on ? undefined : "none"}
            transform={tokenMove(slot.pos)}
            opacity={on && slot.alpha < 0.995 ? slot.alpha.toFixed(2) : undefined}
          >
            <TokenArt paths={tokenPaths(slot.value)} />
          </g>
        );
      })}
    </>
  );
}

function TokenArt({ paths }: { paths: TokenPaths }) {
  const { solid } = paths;
  return (
    <>
      <path className="iso-fill" d={solid.fill} />
      {solid.shades.map((d, shade) => (
        <path key={shade} className="iso-shade" data-shade={shade} d={d} />
      ))}
      <path className="iso-top" d={solid.top} />
      <path className="iso-line iso-crease" data-tone="lo" d={solid.crease} />
      <path className="iso-line iso-bevel" data-tone="faint" d={solid.bevel ?? ""} />
      <path className="iso-line um-token-face" data-tone="lo" d={paths.face} />
      <path className="iso-line iso-edge" data-tone="hi" d={solid.outline} />
      <circle className="um-token-mark" cx={fine(paths.mark[0])} cy={fine(paths.mark[1])} r={0.7} />
    </>
  );
}
