export { WebSurface, Grid, GridItem, type WebSurfaceProps, type GridProps, type GridItemProps } from "./Surface";
export { Eyebrow, Heading, Subhead, Body, type HeadingProps, type BodyProps } from "./Text";
export { CtaButton, type CtaButtonProps } from "./CtaButton";
export { GlassNav, type GlassNavProps, type GlassNavLink } from "./GlassNav";
export { Section, FeatureGrid, type SectionProps, type Feature, type FeatureGridProps } from "./Section";
export { SpotlightCard, type SpotlightCardProps } from "./SpotlightCard";
export { RevealText, type RevealTextProps } from "./RevealText";
export { StarHero, type StarHeroProps } from "./StarHero";
export { StarChart, RhymeIcon, NoiseLayer, curvePath, DEFAULT_STAR_VALUES, type StarChartProps, type RhymeIconProps } from "./motif";
export { DemoPlayer, type DemoPlayerProps } from "./DemoPlayer";
export {
  demoFrame,
  demoEnd,
  demoCycle,
  stepStart,
  DEFAULT_TIMING,
  type DemoStep,
  type DemoAction,
  type DemoTiming,
  type DemoFrame,
} from "./timeline";
export { typeScale, typeMetrics, TYPE_BASE_PX, TYPE_RATIO, TYPE_STEPS, EMPHASIS, SPACE, GRID_COLUMNS, type TypeStep } from "./tokens";
export {
  useInView,
  useScrollProgress,
  useFinePointer,
  scrollProgressOf,
  withViewTransition,
  withPaintTransition,
  type InViewOptions,
  type PaintTransitionOptions,
} from "./hooks";
export {
  BackgroundFrame,
  GrainOverlay,
  DotGrid,
  LineGrid,
  Aurora,
  MaskedStar,
  BeamLines,
  DriftingGutters,
  type BackgroundFrameProps,
  type GrainOverlayProps,
  type GridBackgroundProps,
  type AuroraProps,
  type MaskedStarProps,
  type BeamLinesProps,
  type DriftingGuttersProps,
} from "./backgrounds";
export {
  Reveal,
  TextScramble,
  scrambleFrame,
  NumberTicker,
  Marquee,
  TiltCard,
  MagneticButton,
  ScrollTransform,
  type RevealProps,
  type TextScrambleProps,
  type NumberTickerProps,
  type MarqueeProps,
  type TiltCardProps,
  type MagneticButtonProps,
  type ScrollTransformProps,
} from "./motion";
