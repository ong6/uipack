import * as react from 'react';
import { a as SlideStarterData, P as PresentationTheme, S as SpeechGuide } from './types-CMN3hTzQ.js';
export { E as ExplanationSlideStarter, O as OpeningSlideStarter, b as SlideFooter, c as SystemSlideStarter } from './types-CMN3hTzQ.js';

interface SlideStarterProps {
    slide: SlideStarterData;
    theme?: PresentationTheme;
    showSpeech?: boolean;
    className?: string;
    onCopySpeech?: (text: string) => void;
}
declare function SlideStarter({ slide, theme, showSpeech, className, onCopySpeech, }: SlideStarterProps): react.JSX.Element;

declare function estimateSpeechSeconds(say: string): number;
declare function formatSpeechGuide(speech: SpeechGuide): string;
interface SpeakerGuideProps {
    speech: SpeechGuide;
    slideTitle?: string;
    onCopy?: (text: string) => void;
    className?: string;
    theme?: PresentationTheme;
}
declare function SpeakerGuide({ speech, slideTitle, onCopy, className, theme, }: SpeakerGuideProps): react.JSX.Element;

interface RenderSlideSvgOptions {
    theme?: PresentationTheme;
    width?: number;
}
declare function escapeSvgText(value: string): string;
declare function renderSlideSvg(slide: SlideStarterData, options?: RenderSlideSvgOptions): string;

export { PresentationTheme, type RenderSlideSvgOptions, SlideStarter, SlideStarterData, type SlideStarterProps, SpeakerGuide, type SpeakerGuideProps, SpeechGuide, SpeechGuide as SpeechGuideData, escapeSvgText, estimateSpeechSeconds, formatSpeechGuide, renderSlideSvg };
